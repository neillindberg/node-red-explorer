const fs = require('fs');
const path = require('path');

// Take in two flow files - second could be partial. It just needs to maintain the shape of a tab.
// Use readline to ask for tabs.

const files = process.argv.slice(2);
const [tabsFileName1, tabsFileName2] = files;
if (!tabsFileName1 || !tabsFileName2) throw ('File names are not defined. Two flow JSON files are required.');
//
const tabstions1 = JSON.parse(fs.readFileSync(tabsFileName1));
const tabstions2 = JSON.parse(fs.readFileSync(tabsFileName2));
console.log(`Processing ${tabstions1.length} tabstions from: ${tabsFileName1},`);
console.log(`   against ${tabstions2.length} tabstions from: ${tabsFileName2}`);

// TODO: Now actually take one tab and overwrite the other, identifying new subflows and following them???