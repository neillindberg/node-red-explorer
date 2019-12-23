# node-red-explorer
CLI to make finding nodes by type and running grep against function bodies, merging changes, and the like, more easy.

To explore a NodeRED project the the export of a NodeRED flow JSON (which, exports in the form: { _id, _rev, flows[] })  should be copied to the file "in.json" (static route from project base directory).

*NOTE:* This project came about to pull flows from Cloudant (IBM's CouchDB) and compare them to assist in merging development "branches" of a CloudFoundry NodeRED app.


## Making a Connection
Add a file to the root directory of this project: `setup.js`

Edit file to add your Cloudant connection string under property `connString`.

If desired, add a file name formatter function under property `flowNameFormatter` (optional).

Add a list of tabs and subflows to ignore in diffing operations under `excludes` (optional).

```
module.exports = {
    connString: 'https://conn-string-with-credentials',
    flowNameFormatter: (branchName) => `${branchName}/flow`,
    excludes: ['My Testing Tab', 'Some Subflow']
}
```


## Running Explorer CLI

`npm run start`

Then, choose from the options:
```
Reading JSON from: ...path-to/in.json
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

From project root run with the required two branch identifiers (used in building flow name if formatter is provided in setup): 

`npm run get-flows -- r n`

This (with example values) will pull the latest r and n, and put them in the ./flows/ directory.

Both way diffs are built-out into named-by-function(.js) files into respective ./flows/branch-<branch_id> groups, by tab and submodule.

To explore diffs there are tools such as Meld (https://meldmerge.org/). Fire up Meld or the like and compare files. With the graphical diffing tool you can usually see all the differences highlighted in green/red/blue for different states.

