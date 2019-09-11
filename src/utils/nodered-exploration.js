/*
Convert NodeRED function blocks to ES6.
*/
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const flat = require('flat');
const jsonpath = require('jsonpath');

const flowKey = /flow\.[\d]+/;
const unwantedProperties = ['x', 'y', 'z'];

module.exports = {
  getJSONfromNodeRED: (fileName) => {
    const filePath = path.join(__dirname, fileName);

    if (fs.existsSync(filePath)) {
      try {
        console.log(`______IN: ${fileName} :@: ${filePath}______`);
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
    const path = '$..type';
    const queryResult = jsonpath.query(inJSON, path);
    const uniqueTypes = _.uniq(queryResult.map(x => x.split(/:/)[0])).sort();

    return uniqueTypes;

  },
  getIdMap: (inJSON) => {
    // TODO: Make me worketh
    // z prop points to module node lives in.
  },
  getTabMapping: (inJSON) => {
    // $..[?(@.type == 'function')][id,name,func]  << Shows as string array. Wanting objects.
    const properties = ['id', 'label'];
    const path = `$..[?(@.type == 'tab')][${properties.map(p => `'${p}'`)}]`;
    const queryResult = jsonpath.query(inJSON, path);

    console.log(queryResult.length / properties.length, ' subflow nodes found.');
    const functionsComplete = [];
    for (let i = 0; i < queryResult.length; i += properties.length) {
      const values = queryResult.slice(i, i + properties.length);
      functionsComplete.push(_.zipObject(properties, values));
    }
    return functionsComplete;
  },
  getSubflowMapping: (inJSON) => {
    // NOTE: These are the sidebar Subflows - See Instantiated Subflows to view in-use subflows.
    // $..[?(@.type == 'subflow')]['id', 'name', 'in', 'out']  << Shows as string array. Wanting objects.
    const properties = ['id', 'name', 'in', 'out'];
    const path = `$..[?(@.type == 'subflow')][${properties.map(p => `'${p}'`)}]`;
    const queryResult = jsonpath.query(inJSON, path);

    console.log(queryResult.length / properties.length, ' subflow nodes found.');
    const functionsComplete = [];
    for (let i = 0; i < queryResult.length; i += properties.length) {
      const values = queryResult.slice(i, i + properties.length);
      functionsComplete.push(_.zipObject(properties, values));
    }
    return functionsComplete;
  },
  getInstantiatedSubflowMapping: (inJSON) => {
    // $..[?(@.type =~ /subflow:.*/)]['id','name','wires','z']
    const properties = ['id','name','wires','z'];
    const path = `$..[?(@.type =~ /subflow:.*/)][${properties.map(p => `'${p}'`)}]`;
    const queryResult = jsonpath.query(inJSON, path);

    console.log(queryResult.length / properties.length, ' instantiated subflow nodes found.');
    const functionsComplete = [];
    for (let i = 0; i < queryResult.length; i += properties.length) {
      console.log(queryResult.slice(i, i + properties.length));
      const values = queryResult.slice(i, i + properties.length);
      functionsComplete.push(_.zipObject(properties, values));
    }
    return functionsComplete;
  },
  getFunctionMapping: (inJSON) => {
    // $..[?(@.type == 'function')][id,name,func]  << Shows as string array. Wanting objects.
    const properties = ['id', 'name', 'func', 'wires'];
    const path = `$..[?(@.type == 'function')][${properties.map(p => `'${p}'`)}]`;
    const queryResult = jsonpath.query(inJSON, path);

    console.log(queryResult.length / properties.length, ' function nodes found.');
    const functionsComplete = [];
    for (let i = 0; i < queryResult.length; i += properties.length) {
      const values = queryResult.slice(i, i + properties.length);
      functionsComplete.push(_.zipObject(properties, values));
    }
    return functionsComplete;
  },
  // Return a list of all of a attribute/value pairs by JSON path.
  getAttributeByPath: (inJSON, path = '$.flow.*[\'type\']') => {
    //     const path = '$.flow[?(@.type != \'tab\')][\'type\']';
  },
  // TODO: Add list with pointers to next flow. ? is that on wires[n].id ?
  getWireMap: () => {
    // TODO: We need an ID map to do this_ operaiton. LOL ^ I said that yesterday.
    /*
    ////
    For example: $..['wires'].*.[?(@.id == '4b326353.484a3c')]
    Returns:
    [
      {
          "id" : "4b326353.484a3c"
      },
      {
          "id" : "4b326353.484a3c",
          "port" : 0
      }
    ]
    ////
    Which, in turn, points to: $..[?(@.id == '4b326353.484a3c')]
    [
      {
          "id" : "4b326353.484a3c"
      },
      {
          "id" : "4b326353.484a3c",
          "port" : 0
      },
      {
          "wires" : [
            [
                "495056ad.f6a658"
            ],
            [
                "3d594598.444a5a"
            ]
          ],
          "name" : "For Each Model",
          "outputs" : 2,
          "noerr" : 0,
          "func" : "if(msg.hasOwnProperty(\"records\") && msg.records.hasOwnProperty(\"models\") && Array.isArray(msg.records.models) && msg.records.models.length > 0){\n    msg.records.model_type = msg.records.models.pop();\n    return [null, msg];\n}\nelse {\n    // ignore models\n    return [msg, null];\n}\n\n",
          "y" : 120,
          "x" : 220,
          "z" : "df6d98dd.00d378",
          "type" : "function",
          "id" : "4b326353.484a3c"
      }
    ]
    */

  }
};