/*
Convert NodeRED function blocks to ES6.
*/
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const flat = require('flat');
const jsonpath = require('jsonpath');

const flowKey = /flow\.[\d]+/;
const unwantedProperties = ['x', 'y'];
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

const jpathNegativeQuery = uniqueNodeTypes.map(nodeType => {
  return `@.type != '${nodeType}'`;
});

const subflowInstanceQuery = `$..[?(${jpathNegativeQuery.join(' && ')})]`;

const getJSONPathQuery = (nodeType, properties = []) => {
  return `$.${nodeType ? `flow[?(@.type == '${nodeType}')]` : 'flow.*'}${properties.length > 0 ? `[${properties.map(p => `'${p}'`)}]` : ''}`;
};
// Product of refactoring.
const getNodeTypeProps = (inJSON, nodeType, properties = []) => {
  const query = getJSONPathQuery(nodeType, properties);
  console.log('Running jsonpath query: ', query);
  const queryResult = jsonpath.query(inJSON, query);
  
  if (properties.length > 0 && nodeType) console.log(queryResult.length / properties.length, ` ${nodeType} nodes found.`);
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
        console.log(`\n______IN: ${fileName} :@: ${filePath}______\n`);
        const nodeRedJSON = JSON.parse(fs.readFileSync(filePath));

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
    // $..[?(@.type == 'function')][id,name,func]  << Shows as string array. Wanting objects.
    const properties = ['id', 'name', 'func', 'wires', 'z'];

    return getNodeTypeProps(inJSON, 'function', properties);
  },
  getHttpInMapping: (inJSON) => {
    // $..[?(@.type == 'function')][id,name,func]  << Shows as string array. Wanting objects.
    const properties = ['id', 'name', 'url', 'upload', 'method', 'type', 'z', 'wires'];

    return getNodeTypeProps(inJSON, 'http in', properties);
  },
  getHttpRequestMapping: (inJSON) => {
    // $..[?(@.type == 'function')][id,name,func]  << Shows as string array. Wanting objects.
    const properties = ['id', 'name', 'url', 'ret', 'method', 'type', 'z', 'wires'];

    return getNodeTypeProps(inJSON, 'http request', properties);
  },
  getHttpResponseMapping: (inJSON) => {
    // $..[?(@.type == 'function')][id,name,func]  << Shows as string array. Wanting objects.
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
    // Supports node type: Function (only). TODO: Extend to all node types and support name|label prop (tabs have label instead of name)
    const subflowsLast = (a, b) => {
      const regex = /-subflow-/;
      const aSubflow = regex.test(a), bSubflow = regex.test(b);
      if (aSubflow && !bSubflow) return -1;
      if (bSubflow && !aSubflow) return 1;        
      return (a.toLowerCase() > b.toLowerCase()) ? 1 : (a.toLowerCase() < b.toLowerCase()) ? -1 : 0;
    };
    const tabName = (a, b) => {
      const regex = /\((-{0,1}[\s\w]+-{0,1})\)/;
      const aTab = a.match(regex)[0].replace(regex, '$1').toLowerCase(), bTab = b.match(regex)[0].replace(regex, '$1').toLowerCase();   
      return (aTab > bTab) ? 1 : (aTab < bTab) ? -1 : 0;
    };
    const tabs = module.exports.getTabMapping(inJSON);
    const nodes = module.exports.getFunctionMapping(inJSON);
    const regex = (searchString) ? new RegExp(searchString.trim(), 'gi') : new RegExp();
    // console.log('Search regex: ', regex);
    const nodeNames = nodes.filter(node => {
      // Using RegExp we will >> filter << results, eventually :?
      const nodeName = node.name || undefined;
      return regex.test(nodeName);
    }).map(x => {
      const tab = tabs.find(tab => tab.id === x.z);
      return `${x.name} (${(tab ? tab.label : '-subflow-')})`;
    });
    console.log(nodeNames.length, ' matches found.');
    console.log(nodeNames.sort(subflowsLast).sort(tabName).join(', '));
  }
};