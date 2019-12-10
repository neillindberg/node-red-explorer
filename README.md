# node-red-explorer
CLI to make finding nodes by type and running grep against function bodies, merging changes, and the like, more easy.

Expects "in.json" (static route) that is the export of a NodeRED flow { _id, _rev, flows[] }

Merging:
Edit array in ./src/get-flows to point to any Stellaris flow jsons. For example:
// TODO: Parameterize to pass-in the "branch" names here (and not need to edit file for setup).

`const flows = ['Stellaris-Flow-r/flow', 'Stellaris-Flow-x/flow'];`

From project root run: 

`npm run get-flows`

This (with example values) will pull the latest r and x, and put them in the ./flows/ directory.

```
lindben@STLLINDBENW101 MINGW64 ~/Documents/workspace/node-red-explorer (master)
$ npm run get-flows

> red-to-nodejs-express@0.0.1 get-flows C:\Users\lindben\Documents\workspace\node-red-explorer
> node ./src/get-flows.js

File added:  C:\Users\lindben\Documents\workspace\node-red-explorer\flows\stellaris-flow-r_flow.json
File added:  C:\Users\lindben\Documents\workspace\node-red-explorer\flows\stellaris-flow-x_flow.json
```
These files represent the app in entirety.

Both way diffs are built-out into named-by-function(.js) files into respective ./flows/<flow_name> groups, by tab and submodule.

To explore diffs there are tools such as Meld (https://meldmerge.org/). Fire up Meld or the like and compare files. With the graphical diffing tool you can usually see all the differences highlighted in green/red/blue for different states.

