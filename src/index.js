/*
Converter for NodeRED to NodeJS.
Uses two utilities:
    - Convert existing to ES6
    - TODO: Convert ES6 to NodeJS
*/
const exploreNodeRED = require('./utils/nodered-exploration');
const convertFunctionJSON = require('./utils/convert-function-json');
// const toNodeJS = require('./utils/nodered-json-to-nodejs-express'); // TODO: Next!
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// TODO: Make filename a param to pass into module allowing switching between NodeRED Flows.
// file is expected to be the output of a NodeRED Flow en total { _id, _rev, flow: [] }
const fileName = '../../in.json'; 
const sourceJSON = exploreNodeRED.getJSONfromNodeRED(fileName);

const mapAll = () => {
    operations.forEach(operation => {
        if (operation && operation.nodeType) {
            console.log('Running operation: ', operation.cli);
            const result = operation.func(sourceJSON, operation.nodeType);
            fs.writeFileSync(path.join(__dirname, '../', 'tmp', operation.defaultFile), JSON.stringify(result, null, 4));
        }
    });
    return 'DONE';
};

const sortWithNodeType = (a, b) => {
    if (a.nodeType && !b.nodeType) return -1;
    if (b.nodeType && !a.nodeType) return 1;
    return (a.shorthand > b.shorthand) ? 1 : (a.shorthand < b.shorthand) ? -1 : 0;
};
// File is loaded. Allow user choice at CLI.
// Use NodeRED Exploration to auto-render CLI options for reading/writing each nodeType.
const operations = [
    { cli: 'Flatten Paths (fp)', shorthand: 'fp', func: exploreNodeRED.getFlattenedJSON },
    { cli: 'Type List (tl)', shorthand: 'tl', func: exploreNodeRED.getNodeTypeList },
    { cli: 'Unique Attribute List (ual)', shorthand: 'ual', func: exploreNodeRED.getAttributeList },
    { cli: 'Id(s) (ids)', shorthand: 'ids', func: exploreNodeRED.getIdMap },
    { cli: 'Tab Map (tm)', shorthand: 'tm', func: exploreNodeRED.getByNodeType, defaultFile: 'tabs.json', nodeType: 'tab' },
    { cli: 'Function Map (fm)', shorthand: 'fm', func: exploreNodeRED.getFunctionMapping, defaultFile: 'functions.json', nodeType: 'function' },
    { cli: 'Http In Map (httpin)', shorthand: 'httpin', func: exploreNodeRED.getByNodeType, defaultFile: 'http_in_by_node_type.json', nodeType: 'http in' },
    { cli: 'Http Request Map (httpreq)', shorthand: 'httpreq', func: exploreNodeRED.getHttpRequestMapping, defaultFile: 'http_requests.json' },
    { cli: 'Http Response Map (httpres)', shorthand: 'httpres', func: exploreNodeRED.getHttpResponseMapping, defaultFile: 'http_responses.json' },
    { cli: 'Subflow Instance Map (sim)', shorthand: 'sim', func: exploreNodeRED.getSubflowInstanceMapping, defaultFile: 'subflow_instances.json' },
    { cli: 'Subflow Map (sm)', shorthand: 'sm', func: exploreNodeRED.getByNodeType, defaultFile: 'subflows_classes.json', nodeType: 'subflow' },
    { cli: 'Catch Map (catch)', shorthand: 'catch', func: exploreNodeRED.getByNodeType, defaultFile: 'catches.json', nodeType: 'catch' },
    { cli: 'Change Map (change)', shorthand: 'change', func: exploreNodeRED.getByNodeType, defaultFile: 'changes.json', nodeType: 'change' },
    { cli: 'Comment Map (comm)', shorthand: 'comm', func: exploreNodeRED.getByNodeType, defaultFile: 'comments.json', nodeType: 'comment' },
    { cli: 'Debug Map (debug)', shorthand: 'debug', func: exploreNodeRED.getByNodeType, defaultFile: 'debugs.json', nodeType: 'debug' },
    { cli: 'Delay Map (delay)', shorthand: 'delay', func: exploreNodeRED.getByNodeType, defaultFile: 'delays.json', nodeType: 'delay' },
    { cli: 'Email Map (email)', shorthand: 'email', func: exploreNodeRED.getByNodeType, defaultFile: 'emails.json', nodeType: 'e-mail' },
    { cli: 'Inject Map (inject)', shorthand: 'inject', func: exploreNodeRED.getByNodeType, defaultFile: 'injects.json', nodeType: 'inject' },
    { cli: 'JSON Map (json)', shorthand: 'json', func: exploreNodeRED.getByNodeType, defaultFile: 'jsons.json', nodeType: 'json' },
    { cli: 'Link In Map (linkin)', shorthand: 'linkin', func: exploreNodeRED.getByNodeType, defaultFile: 'link_in.json', nodeType: 'link in' },
    { cli: 'Link Out Map (linkout)', shorthand: 'linkout', func: exploreNodeRED.getByNodeType, defaultFile: 'link_out.json', nodeType: 'link out' },
    { cli: 'Switch Map (switch)', shorthand: 'switch', func: exploreNodeRED.getByNodeType, defaultFile: 'switches.json', nodeType: 'switch' },
    { cli: 'XML Map (xml)', shorthand: 'xml', func: exploreNodeRED.getByNodeType, defaultFile: 'xmls.json', nodeType: 'xml' },
    { cli: 'Function-to-File (ftf <function_name>)', shorthand: 'ftf', func: convertFunctionJSON.writeFunctionByName },
    { cli: 'Find-by-Name (fbn)', shorthand: 'fbn', func: exploreNodeRED.findByName },
    { cli: 'Find-by-Subflow-Name (fbsn)', shorthand: 'fbsn', func: exploreNodeRED.findBySubflowName },
    { cli: 'Grep-func-Body (grepf)', shorthand: 'grepf', func: exploreNodeRED.grepFunctionBody },
    { cli: 'Find-by-Route (fbr)', shorthand: 'fbr', func: exploreNodeRED.findByRoute },
    { cli: 'Map All (mapall)', shorthand: 'mapall', func: mapAll }
].sort(sortWithNodeType);

const joinAndStrip = input => input.join(' ').replace(/["']/g, '');

const bashColors = [10, 12, 13, 14, 1];
// Setup CLI
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `\x1b[38;5;11mPlease choose operation (for human readable: help): \n[ ${operations.map((op, index) => `\x1b[38;5;${bashColors[(index >= bashColors.length) ? index % bashColors.length : index]}m${op.shorthand}\x1b[m`).join(' | ')}\x1b[38;5;11m ] \n>\x1b[m `
});

rl.on('line', (line) => {
    const input = line.trim().split(/\s/);
    const inputOp = input.shift();
    if (inputOp === 'help') {
        const helpOut = [], space = ' ', newline = '\n', cellLength = 40;
        for (let i = 0; i < operations.length; i += 3) {
            operations.slice(i, i + 3).forEach(op => helpOut.push(op.cli + space.repeat(cellLength - op.cli.length)));
            helpOut.push(newline);
        }
        console.log(helpOut.join(''));
    } else {
        const operation = operations.find(op => op.shorthand === inputOp);
        const feedback = operation ? 'Running operation: ' + operation.cli : 'Unrecognized option. Try again. (Control + C = Exit)';
        console.log(feedback);
        if (operation) {
            const flag = input.shift();
            const result = operation.func(sourceJSON, (operation.nodeType ? operation.nodeType :
                (flag && flag === '-n') ? joinAndStrip(input) : null));
            if (input.length > 0 && flag !== '-n') {
                // TODO: Refactor. When we started adding more flags this became spaghetti.
                if (flag === '-o') {
                    // write to file
                    const tmpPath = path.join(__dirname, '../', 'tmp');
                    if (!fs.existsSync) fs.mkdirSync(tmpPath);
                    fs.writeFileSync(path.join(tmpPath, input || operation.defaultFile), JSON.stringify(result, null, 4));
                }
            } else {
                // Just log to stdout.
                console.log(((result && typeof result === 'object') ? JSON.stringify(result, null, 2) : result || '') + '\n');
            }
        }
    }
    setTimeout(() => {
        console.log('\n---- operation completed ----\n');
        rl.prompt();
    }, 500);
}).on('close', () => {
    console.log('NodeRED Exploration session terminated.');
    process.exit(0);
});

rl.prompt();