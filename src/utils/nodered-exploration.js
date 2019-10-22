/*
Convert NodeRED function blocks to ES6.
*/
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const flat = require('flat');
const jsonpath = require('jsonpath');

const flowKey = /flow\.[\d]+/;
const unwantedProperties = ['x', 'y', 'swaggerDoc'];
const uniqueNodeTypes = [
  'catch',
  'change',
  'comment',
  'debug',
  'delay',
  'e-mail',
  'function',
  'gzip',
  'http in',
  'http request',
  'http response',
  'inject',
  'json',
  'link in',
  'link out',
  'subflow',
  'switch',
  'tab',
  'xml'
];

const subflowsLastSort = (a, b) => {
  const regex = /-subflow-/;
  const aSubflow = regex.test(a), bSubflow = regex.test(b);
  if (aSubflow && !bSubflow) return -1;
  if (bSubflow && !aSubflow) return 1;
  return (a.toLowerCase() > b.toLowerCase()) ? 1 : (a.toLowerCase() < b.toLowerCase()) ? -1 : 0;
};

const tabNameSort = (a, b) => {
  const regex = /\((-{0,1}[\s\w]+-{0,1})\)/;
  const aTab = a.match(regex)[0].replace(regex, '$1').toLowerCase(), bTab = b.match(regex)[0].replace(regex, '$1').toLowerCase();
  return (aTab > bTab) ? 1 : (aTab < bTab) ? -1 : 0;
};

const jpathNegativeQuery = uniqueNodeTypes.map(nodeType => `@.type != '${nodeType}'`);

const subflowInstanceQuery = `$..[?(${jpathNegativeQuery.join(' && ')})]`;

const getJSONPathQuery = (nodeType, properties = []) => {
  return `$.${nodeType ? `flow[?(@.type == '${nodeType}')]` : 'flow.*'}${properties.length > 0 ? `[${properties.map(p => `'${p}'`)}]` : ''}`;
};
// Product of refactoring.
const getNodeTypeProps = (inJSON, nodeType, properties = []) => {
  const query = getJSONPathQuery(nodeType, properties);
  const queryResult = jsonpath.query(inJSON, query);
  // console.log('getNodeTypeProps: ', queryResult);

  if ((properties.length > 0) && nodeType) console.log(queryResult.length / properties.length, ` ${nodeType} nodes found.`);
  const complete = [];
  for (let i = 0; i < queryResult.length; i += properties.length) {
    const values = queryResult.slice(i, i + properties.length);
    complete.push(_.zipObject(properties, values));
  }

  return complete;
};

module.exports = {
  getJSONfromNodeRED: (fileName) => {
    const filePath = path.join(__dirname, fileName);

    if (fs.existsSync(filePath)) {
      try {
        console.log(`\nReading JSON from: ${filePath}`);
        const nodeRedJSON = JSON.parse(fs.readFileSync(filePath));
        console.log((nodeRedJSON.flow && Array.isArray(nodeRedJSON.flow)) ? 'Input looks valid.' : 'Invalid input shape. Expect errors.');
        return nodeRedJSON;
      } catch (e) {
        console.log('Error during found file read.', e);
      }

    } else {
      console.log(`File ${filePath} not found`);
      process.exit(1);
    }
  },
  getFlattenedJSON: (inJSON) => {
    // Flattened path representation of the Cloudent-stored representation of a full NodeRED flow
    // e.g. 'flow.1506.z': '5dbd57cc.fc9bb8'
    const flattened = flat(inJSON);

    return flattened;
  },
  getAttributeList: (inJSON) => {
    // uniqueKeyList: Remove unwanted (display/NodeRED-specific) properties and return unique key list
    // illustrating core props (to consider for translation)
    // e.g. ['headers', 'id', 'in-wires-id', 'info', 'inputLabels', 'label', 'links', 'method', ...]
    const flattened = flat(inJSON);
    let uniqueKeyList = [];
    const keys = Object.keys(flattened);

    keys.forEach(key => {
      // remove: flow.[n], .wires[n], and anything where a number makes a keys differ.
      // e.g. In unique overview we want: flow.1.wire.0 and flow.1.wire.1 and flow.2.wire.123 to return a unique key 'wire'.
      const cleanedKey = key.replace(flowKey, '')
        .replace(/^\./, '')
        .replace(/(rules){1}\.\d+\.(p|pt|tot|t|v|vt)+/, '$1-$2')
        .replace(/(in|out)+\.\d+\.(wires){1}\.\d+\.(id|port)/, '$1-$2-$3')
        .replace(/(in|out){1}\.\d+\.(x|y){1}/, '')
        .replace(/(\.\d+)+$/, '');
      if (!_.isEmpty(cleanedKey) && !uniqueKeyList.includes(cleanedKey) && unwantedProperties.indexOf(cleanedKey) === -1) {
        uniqueKeyList.push(cleanedKey);
      }
    });

    return uniqueKeyList.sort();
  },
  // 
  getNodeTypeList: (inJSON) => {
    // Returns a unique list of NodeRED types. Use for discussion...
    // [ 'catch','change','comment','debug','delay','e-mail','function','gzip','http in','http request',
    // 'http response','inject','json','link in','link out','subflow','switch','tab','xml' ]
    const query = '$..type';
    const queryResult = jsonpath.query(inJSON, query);
    const uniqueTypes = _.uniq(queryResult.map(x => x.split(/:/)[0])).sort();

    return uniqueTypes;

  },
  getIdMap: (inJSON) => {
    // TODO: Make me worketh
    // z prop points to module node lives in.
    // $.flow.*.['z', 'id','type']
    const queryResult = jsonpath.query(inJSON, getJSONPathQuery(null, ['z']));
    const idMap = {};

    console.log('Found z/n of: ', queryResult.length);
    // queryResult.forEach(z => {
    //   console.log("I AM NODE: z", JSON.stringify(z));
    //   idMap[z]
    // });

    return idMap;
    // const properties = ['z', 'id', 'type', 'name', 'label'];

    // return getNodeTypeProps(inJSON, null, properties);
  },
  getByNodeType: (inJSON, type) => {
    const query = `$..[?(@.type == '${type}')]`;
    const queryResult = jsonpath.query(inJSON, query);

    queryResult.forEach(qr => unwantedProperties.forEach(up => delete qr[up]));
    return queryResult;
  },
  // TODO: Add list with pointers to next flow. ? is that on wires[n].id ?
  getWireMap: () => { },
  getTabMapping: (inJSON) => {
    // $..[?(@.type == 'function')][id,name,func]  << Shows as string array. Wanting objects.
    const properties = ['id', 'label'];

    return getNodeTypeProps(inJSON, 'tab', properties);
  },
  getSubflowMapping: (inJSON) => {
    // NOTE: These are the sidebar Subflows - See Instantiated Subflows to view in-use subflows.
    // $..[?(@.type == 'subflow')]['id', 'name', 'in', 'out']  << Shows as string array. Wanting objects.
    const properties = ['id', 'name', 'in', 'out'];

    return getNodeTypeProps(inJSON, 'subflow', properties);
  },
  getFunctionMapping: (inJSON) => {
    const properties = ['id', 'name', 'func', 'wires', 'z'];

    return getNodeTypeProps(inJSON, 'function', properties);
  },
  getHttpInMapping: (inJSON) => {
    const properties = ['id', 'name', 'url', 'upload', 'method', 'type', 'z', 'wires'];

    return getNodeTypeProps(inJSON, 'http in', properties);
  },
  getHttpRequestMapping: (inJSON) => {
    const properties = ['id', 'name', 'url', 'ret', 'method', 'type', 'z', 'wires'];

    return getNodeTypeProps(inJSON, 'http request', properties);
  },
  getHttpResponseMapping: (inJSON) => {
    const properties = ['id', 'name', 'type', 'z', 'wires'];  // There is a prop "headers", but it is always an empty {}

    return getNodeTypeProps(inJSON, 'http response', properties);
  },
  getSubflowInstanceMapping: (inJSON) => {
    // $..[?(@.type =~ /subflow:.*/)]['id','name','wires','z'] // Unfortunately, this_ works perfect with Jayway's Java implementatio, but not NodeJS's...
    // Get list of all possible node types and filter against them should result in all the /^(subflow:)(.*)/ matches where $2 points to a sidebar subflow.
    // There are leftovers! Checking inJSON with ("type": ")(.*:) sees 495 of any ':' separated type key... asi quien son otras?
    const query = subflowInstanceQuery;
    const queryResult = jsonpath.query(inJSON, query);
    const unwanted = ['name'].concat(unwantedProperties); // Name is always blank. It should be built.
    const nodesComplete = [];
    queryResult.forEach(node => {
      // if (node.type) console.log(node);
      if (node.type && /^subflow:.*/.test(node.type)) {
        const keys = Object.keys(node).filter(key => unwanted.indexOf(key) === -1);
        nodesComplete.push(_.pick(node, keys)); // in reality if_there is a node.type it is subflow:<class_id>
      }
    });
    console.log(nodesComplete.length, ' subflow instance nodes found.');

    return nodesComplete;
  },
  findByName: (inJSON, searchString) => {
    // let functionBodySearch;
    // if (searchString instanceof Array) [searchString, functionBodySearch] = searchString;
    // TODO: Consolidate the "findBy"s, atleast Route and Function Name...
    const tabs = module.exports.getTabMapping(inJSON);
    const nodes = module.exports.getFunctionMapping(inJSON);
    const regex = (searchString) ? new RegExp(searchString.trim(), 'gi') : new RegExp();
    const nodeNames = nodes.filter(node => {
      const nodeName = node.name || undefined;
      return regex.test(nodeName);
    }).map(x => {
      const tab = tabs.find(tab => tab.id === x.z);
      // const matches = (functionBodySearch) ? x.func.match(new RegExp(functionBodySearch.trim(), 'gi')) : null; 
      return `${x.name} (${(tab ? tab.label : '-subflow-')})\n`;
    });
    console.log(nodeNames.length, ' matches found.');
    console.log(nodeNames.sort(subflowsLastSort).sort(tabNameSort).join(''));
  },
  grepFunctionBody: (inJSON, searchString) => {
    const tabs = module.exports.getByNodeType(inJSON, 'tab');
    const functionNodes = module.exports.getByNodeType(inJSON, 'function');
    const regex = (searchString) ? new RegExp(searchString.trim(), 'gi') : new RegExp();
    const nodeNames = functionNodes.filter(node => regex.test(node.func || undefined))
    .map(x => {
      const tab = tabs.find(tab => tab.id === x.z);
      // const matches = (functionBodySearch) ? x.func.match(new RegExp(functionBodySearch.trim(), 'gi')) : null; 
      return `\x1b[38;5;160m${x.name} (${(tab ? tab.label : '-subflow-')})\x1b[m\n${x.func}\n\n`;
    });
    console.log(nodeNames.length, ' matches found.');
    console.log(nodeNames.sort(subflowsLastSort).sort(tabNameSort).join(''));
  },
  findByRoute: (inJSON, searchString) => {
    // TODO: Consolidate the "findBy"s, atleast Route and Function Name...
    const tabs = module.exports.getTabMapping(inJSON);
    const nodes = module.exports.getByNodeType(inJSON, 'http in');
    const regex = (searchString) ? new RegExp(searchString.trim(), 'gi') : new RegExp();
    const nodeRoutes = nodes.filter(node => {  // TODO. Routes and Node Names are interchangable when handling more than one type (http in and functions)
      const nodeURL = node.url || undefined;
      return regex.test(nodeURL);
    }).map(x => {
      const tab = tabs.find(tab => tab.id === x.z);
      return `${x.url} (${(tab ? tab.label : '-subflow-')})\n`;
    });
    console.log(nodeRoutes.length, ' matches found.');
    console.log(nodeRoutes.sort(subflowsLastSort).sort(tabNameSort).join(''));
  },
  findBySubflowName: (inJSON, searchString) => {
    // TODO: Consolidate the "findBy"s, atleast Route and Function Name...
    const regex = (searchString) ? new RegExp(searchString.trim(), 'gi') : new RegExp();
    const tabs = module.exports.getTabMapping(inJSON);
    const subflowClasses = module.exports.getByNodeType(inJSON, 'subflow');
    const subflow = subflowClasses.find(s => regex.test(s.name));
    const instances = module.exports.getSubflowInstanceMapping(inJSON);
    const subflowInstances = instances.filter(si => {
      const subflowType = 'subflow:' + subflow.id;
      return si.type === subflowType;
    }).map(x => {
      let tab, subflowTab;
      tab = tabs.find(tab => tab.id === x.z);
      if (!tab) subflowTab = subflowClasses.find(sc => sc.id === x.z);
      return `${(x.name) ? x.name : 'Instance of: ' + subflow.name} (${(tab ? tab.label : (subflowTab && subflowTab.name) + ' -subflow tab-')})\n`;
    });
    console.log(subflowInstances.length, ' matches found.');
    console.log(subflowInstances.sort().join(''));
  }
};