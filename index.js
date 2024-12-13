import { resourceGetItem, resourceItemSave, resourceGetTreeLevel, generateAPIKey } from "./chili.js";
import { buildURL, getResourceInfo, jsonifyChiliResponse, buildFontXML} from "./utils.js";
import { readFileSync } from "fs";
const config = JSON.parse(readFileSync("./config.json").toString());

// Get API key
let apikey;
let baseurl = buildURL(config.environment, config.sandbox);
console.log(baseurl);
// Check if credentials were supplied, otherwise use direct API key
if (!config.user === "") {
    const apikeyResult = await generateAPIKey(config.user, config.pass, config.environment, baseurl);
    if (!apikeyResult.isOK) {
        throw apikeyResult.error;
    }
    apikey = apikeyResult.response;
} else {
    apikey = config.apikey;
}

// Grab all document IDs in a given directory
const initTreeFetch = await resourceGetTreeLevel('documents', encodeURIComponent(config.startingDirectory), apikey, baseurl);
const initTree = initTreeFetch.isOK ? initTreeFetch.response : "FAILED";
if (initTree == "FAILED") {
    throw new Error(initTreeFetch.error);
}
const resources = await getResourceInfo(initTree, 'documents', [], apikey, baseurl);

// Cycle through each document, find/replace fonts
for(let i = 0; i < resources.length; i++){
    let docFetch = await resourceGetItem("documents", resources[i], apikey, baseurl);
    if (!docFetch.isOK) {
        throw docFetch.error;
    }
    let docXML = docFetch.response;

    // Grab the <fonts> element out of the string
    const fontStart = docXML.indexOf("<fonts>") + 7;
    let fontEnd = docXML.indexOf("</fonts>");
    // parse that as a JSON (could probably just parse the whole thing as a JSON honestly
    let fontsJSON = jsonifyChiliResponse(docXML.substring(fontStart, fontEnd));
    let newFonts = []; //This will be a raw XML string containing new fonts
    let removals = []; //This will be an array of raw XML string to very easily remove items from the existing <fonts> element

    // For each font in the base document:
    //  - Check if the font is in the swap list
    //  - If it is, add that XML string to the removals list and add XML string for new font to additions list
    fontsJSON.forEach(font => {
        // Check if the font is in the replace list
        let search = config.fonts.swaps.find(({oldFont}) => oldFont == `${font.family}_${font.style}`);
        if(search){
            removals.push(buildFontXML(font.id, font.name, font.family, font.style));
            // find the ID of the new font
            let newID = config.fonts.ids.find(({font}) => font == search.newFont).id;
            //config lists font names as "family_style" to be inline with how the doc XML references them
            let fontName = search.newFont.split("_");
            newFonts.push(buildFontXML(newID, `${fontName[0]} ${fontName[1]}`, fontName[0], fontName[1]));
        }
    });

    // Run through font lists (they should always have the same length so it doesn't matter which we iterate through)
    for(let a = 0; a < removals.length; a++) {
        // check if new font already added
        //  -If new font already added, just remove the old one, replace the string with the new one
        if (docXML.includes(newFonts[a])){
            docXML = docXML.replace(removals[a], '');
        } else {
            docXML = docXML.replace(removals[a], newFonts[a]);
        }

        // Find references to the font name in the rest of the document and replace it
        //  - need to pull the name out again
        //    - test if I can just parse this as a JSON ezpz?
        let oldFontJSON = jsonifyChiliResponse(removals[a]);
        let newFontJSON = jsonifyChiliResponse(newFonts[a]);
        const oldName = `${oldFontJSON.family}_${oldFontJSON.style}`
        const newName = `${newFontJSON.family}_${newFontJSON.style}`
        docXML = docXML.replaceAll(`fontFamily="${oldName}"`, `fontFamily="${newName}"`);
    };

    // Save modified doc XML back
    let saveFetch = await resourceItemSave(docXML, resources[i], apikey, baseurl);
    if(!saveFetch.isOK){
        throw saveFetch.error;
    }
    let save = saveFetch.response; //not doing anything with this, doesn't really need to be here
}