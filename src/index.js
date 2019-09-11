/*
Converter for NodeRED to NodeJS.
Uses two utilities:
    - Convert existing to ES6
    - Convert ES6 to NodeJS
*/
const exploreNodeRED = require('./utils/nodered-exploration');
// const toNodeJS = require('./utils/nodered-json-to-nodejs-express'); // TODO: Next!
const _ = require('lodash');
const readline = require('readline');

// Lodash proof confirmed... No transpiling, yet!
//// const result = _.map([1, 2, 3], n => n * 10);
// TODO: Make filename a param to pass into module
const fileName = /*'../../switch.json'; */ '../../in.json';
const existing = exploreNodeRED.getJSONfromNodeRED(fileName);
// File is loaded. Allow user choice at CLI.
// (aerfaeef) faoiehfaoiehf

const operations = [
    { cli: 'Flatten Paths (fp)', name: 'Flatten Paths', shorthand: 'fp', func: exploreNodeRED.getFlattenedJSON },
    { cli: 'Type List (tl)', name: 'Type List', shorthand: 'tl', func: exploreNodeRED.getNodeTypeList },
    { cli: 'Unique Attribute List (ual)', name: 'Unique Attribute List', shorthand: 'ual', func: exploreNodeRED.getAttributeList },
    { cli: 'Wire Map (wm)', name: 'Wire Map', shorthand: 'wm', func: exploreNodeRED.getWireMap },
    { cli: 'Function Map (fm)', name: 'Function Map', shorthand: 'fm', func: exploreNodeRED.getFunctionMapping },
    { cli: 'Instantiated Subflow Map (ism)', name: 'Instantiated Subflow Map', shorthand: 'ism', func: exploreNodeRED.getInstantiatedSubflowMapping },
    { cli: 'Subflow Map (sm)', name: 'Subflow Map', shorthand: 'sm', func: exploreNodeRED.getSubflowMapping },
    { cli: 'Tab Map (tm)', name: 'Tab Map', shorthand: 'tm', func: exploreNodeRED.getTabMapping }
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `Please choose operation: [${operations.map(op => op.cli).join(' | ')}] >>> `
});

rl.prompt();

rl.on('line', (line) => {
    const input = line.trim();
    const operation = operations.find(op => op.name === input) || operations.find(op => op.shorthand === input);
    const feedback = operation ? 'Running operation: ' + operation.name : 'Unrecognized option. Try again. (Control + C = Exit)';
    console.log(feedback);
    if (operation) {
        const result = operation.func(existing);
        console.log(result);
    }
    rl.prompt();
}).on('close', () => {
    console.log('NodeRED Exploration session terminated.');
    process.exit(0);
});