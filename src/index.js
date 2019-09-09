/*
Converter for NodeRED to NodeJS.
Uses two utilities:
    - Convert existing to ES6
    - Convert ES6 to NodeJS
*/
const workWithExisting = require('./utils/nodered-to-es-6');
const toNodeJS = require('./utils/nodered-json-to-nodejs-express');
const _ = require('lodash');

// Lodash proof confirmed... No transpiling, yet!
//// const result = _.map([1, 2, 3], n => n * 10);
    // TODO: Make filename a param to pass into module
const fileName = /*'../../switch.json'; */ '../../in.json';
const existing = workWithExisting.getJSONfromNodeRED(fileName);
const jPathRead = workWithExisting.getNodeREDTypeList(existing);
console.log('jPRead: ', jPathRead);
// const allExistingAttributes = toNodeJS.getUniqueKeyList(existing, 'keyList'); // FIXME: Fix or remove this option 'keyList'
// const allExistingAttributes = toNodeJS.getUniqueKeyList(existing);
// console.log(JSON.stringify(existing));
// console.log(allExistingAttributes);
// console.log(allExistingAttributes.length);
