# Overview

This is a proof of concept for automating the process of swapping out fonts in GraFx Publisher documents within a specified directory. This tool takes a user defined list of key value pairs of Pulisher font names,
and iterates over that to replace references to an old font to references to a matching new font. Afterwards, the new modified XML is saved over the original.  

This is not intended for use as a production ready tool. There are many aspects of this that could be more rigourously tested and optimized. The goal of this is just to demonstrate the feasibility of such a tool, and to 
act as a learning resource for anybody who wants to build their own production ready tool.  

This is a Node JS application, which means that you need to have Node installed to run this.

# How to use

To use this tool, all you need to do is fill out the `config.json` file, then run the `node index.js` in the command line while in the code install directory.  

`config.json` can be broken down into 2 broad categories:
### Authentication and Connection
These properties are all used to establish a connection to the correct GraFx environment.
1. `user`: This should hold the username for a previously configured GraFx Publisher API User (if `apikey` has a value, then this can be left blank)
2. `pass`: This should hold the password for a previously configured GraFx Publisher API User (if `apikey` has a value, then this can be left blank)
3. `apikey`: This should hold a live, valid CHILI API key (if `user` and `pass` have values, then this can be left blank)
4. `environment`: This should hold the name of your GraFx environment, i.e. "cp-abc-123"
5. `isSandbox`: If pointing to a sandbox environment, this should be set to `True`. Otherwise, leave it as `False`.  

On the first three properties: `user`/`pass` are used to generate an API key for the rest of the tool to function. `apikey` does the same thing, but is there if you want to just directly provide an API key and skip the 
login step. If there is _any_ value in `apikey`, then the tool will attempt to use that and will ignore `user`/`pass`.  

### Tool Specific Properties
These properties are all used to fine tune the actual functionality of the tool.
1. `startingDirectory`: This should hold the folder path to the top-most directory you want to run this on, i.e. "Templates\\Brochures". Do note, the tool will search for _every_ document within this directory, including those within subfolders.
2. `fonts`: This should hold 2 lists of data related to the fonts being swapped in/out.

`fonts` is a large category to hold two different properties inside of it:
1. `swaps`: This should hold a list of objects formatted like `{"oldFont": "old font name...", "newFont": "new font name..."}`. `oldFont` will hold the name of the font you are replacing, `newFont` will hold the name of the font that is doing the replacing.
2. `ids`: This should hold a alist of objects formatted like `{"font": "new font name...", "id": "CHILI font ID"}`. `font` will hold a font name that matches one of the `newFont` names in the above list, `id` will hold the unique CHILI ID of that font

When setting font names, it's important that the name matches the name of the font as it exists within your Publisher environment. On top of that, you should name them according to the format "family_style". For example, the 
font "Open Sans Condensed Regular" should be named in this list as "Open Sans Condensed_Regular". Basically, just replace the space before the last word with an underscore. _This is because I developed this with CHILI document XML
structures in mind, where references to a font are always written as above. However, if you look at the code this isn't really necessary, you could easily refactor this to take the direct name in these lists without the underscore._  

For every unique `newFont` value in the `swaps` list, there needs to be a corresponding entry in the `ids` list.
