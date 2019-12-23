const fs = require('fs');
const exploreNodeRED = require('./utils/nodered-exploration');
const { excludes } = require('../setup');
//
const writeFlowFunctionFile = (flowFunctions, flowFunctionsFile) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(flowFunctionsFile, JSON.stringify(flowFunctions, null, 4), err => {
            if (err) reject(err);
            console.log('File added: ', flowFunctionsFile);
            resolve(flowFunctionsFile);
        });
    });
};

module.exports = {
    go: async (files) => {
        console.log('Build Flow Function Files', files);
        const unwantedTabsAndSubflows = excludes || [];
        console.log('Discarding these tabs and subflows: ', unwantedTabsAndSubflows.join());
        return Promise.all(files.map(flowFileName => {
            const sourceJSON = exploreNodeRED.getJSONfromNodeRED(flowFileName);
            const zMap = {};
            const unwanteds = {};
            // Populate zMap - tabs
            exploreNodeRED.getByNodeType(sourceJSON, 'tab').filter(tab => { // !unwantedTabsNames.includes(tab.label)
                if (unwantedTabsAndSubflows.includes(tab.label)) {
                    unwanteds[tab.id] = { name: tab.label, id: tab.id, type: 'tab' };
                    return false;
                }
                return true;
            }).forEach(tab => zMap[tab.id] = { name: tab.label, type: 'tab' });
            // Populate zMap - subflows
            exploreNodeRED.getByNodeType(sourceJSON, 'subflow').filter(subflow => { // !unwantedTabsNames.includes(subflow.name);
                if (unwantedTabsAndSubflows.includes(subflow.name)) {
                    unwanteds[subflow.id] = { name: subflow.name, id: subflow.id, type: 'subflow' };
                    return false;
                }
                return true;
            }).forEach(subflow => zMap[subflow.id] = { name: subflow.name, type: 'subflow' });
            // Get and filter flow functions.
            const flowFunctions = exploreNodeRED.getFunctionMapping(sourceJSON).filter(func => {
                if (!zMap[func.z]) {
                    console.log(`(- ignoring -): ${unwanteds[func.z].name} (${unwanteds[func.z].type}) - ${func.name || '-Not Named- '}`);
                    return false;
                }
                // id,name,func,wires,z
                console.log(`(+  adding  +): ${func.name}`);
                return zMap[func.z];
            }).map(func => {
                // if (!zMap[func.z]) console.log('-------------- z map undefined position'); // should never see this_
                func.location = zMap[func.z];
                ['wires', 'id', 'z'].forEach(delProp => delete func[delProp]);
                return func;
            });
            console.log('Flow functions after filter: ', flowFunctions.length);
            // TODO: Check for uniqueness across Tab/Function names (because we want to use it as index)
            const flowFunctionsFile = flowFileName.split('/').pop().split('.')[0] + '_functions.json';
            return writeFlowFunctionFile(flowFunctions, flowFunctionsFile);
        }));
    }
};