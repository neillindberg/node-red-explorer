# node-red-explorer
CLI to make finding nodes by type and running grep against function bodies, merging changes, and the like, more easy.

To explore a NodeRED project the the export of a NodeRED flow JSON (which, exports in the form: { _id, _rev, flows[] })  should be copied to the file "in.json" (static route from project base directory).

## Running Explorer CLI

`npm run start`

Then, choose from the options:
```
Reading JSON from: C:\Users\lindben\Documents\workspace\node-red-explorer\in.json
Input looks valid.
Please choose operation (for human readable: help): 
[ catch | change | comm | debug | delay | email | fm | httpin | inject | json | linkin | linkout | sm | switch | tm | xml | fbn | fbr | fbsn | fp | ftf
| grepf | httpreq | httpres | ids | mapall | sim | tl | ual ]
// SAMPLES:
// Find all places where the code string exists:
> grepf -n "some code to find within project"
// Or, find a function by a known name:
> fbn -n "My Node Name" // Would write to ./functions/my-node-name.js
// Write a normalized file to the ./functions/ directory:
> ftf -n "My Node Name" // Would write to ./functions/my-node-name.js
// List all routes matching: /user/stuff/route/*
> fbr -n "/usrs/stuff/route/" 
// List all the nodes of all types, with ID relationships mapped.
> mapall
// Node type functions will return all of a type of node by Tab and/or Subflow:
> catch, changes, email, xml, etc. // Additionally, add the -o flag and file name to output to file
```

## Merging

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

