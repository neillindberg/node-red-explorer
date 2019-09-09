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
  getUniqueKeyList: (inJSON, returnAs = 'uniqueKeyList') => {
    // Flattened path representation of the Cloudent-stored representation of a full NodeRED flow
    // e.g. 'flow.1506.z': '5dbd57cc.fc9bb8'
    if (returnAs === 'keyList') {
      const flattened = flat(inJSON);

      return flattened;
    }
    // uniqueKeyList: Remove unwanted (display/NodeRED-specific) properties and return unique key list
    // illustrating core props (to consider for translation)
    // e.g. ['headers', 'id', 'in-wires-id', 'info', 'inputLabels', 'label', 'links', 'method', ...]
    if (returnAs === 'uniqueKeyList') {
      const flattened = flat(inJSON);
      let uniqueKeyList = [];
      const keys = Object.keys(flattened);

      keys.forEach(key => {
        // remove 'flow.Number'
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
    }
  },
  // 
  getNodeREDTypeList: (inJSON) => {
    // Returns a unique list of NodeRED types. Use for discussion...
    // [ 'catch','change','comment','debug','delay','e-mail','function','gzip','http in','http request',
    // 'http response','inject','json','link in','link out','subflow','switch','tab','xml' ]
    const path = '$..[\'type\',\'name\']';
    const queryResult = jsonpath.query(inJSON, path);
    const uniqueTypes = _.uniq(queryResult.map(x => x.split(/:/)[0])).sort();

    return uniqueTypes;

  },
  // Return a list of all of a attribute/value pairs by JSON path.
  getAttributeByPath: (inJSON, path = '$.flow.*[\'type\']') => {
//     const path = '$.flow[?(@.type != \'tab\')][\'type\']';
  },
  // TODO: Add list with pointers to next flow. ? is that on wires[n].id ?
  getWireMap: () => {

  }
};