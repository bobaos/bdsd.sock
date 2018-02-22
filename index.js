// IPC
const ipc = require('./ipc/server');
// datapoint sdk
const sdk = require('./datapointSdk/sdk')();

let baosConnected = false;

// interprocess communication events
ipc.on('connected', (id, writeCb) => {
  console.log('index.js connected from ipc: ', id);
  writeCb('connection response');
  if (baosConnected) {
    writeCb('baos connected')
  }
});

const processRequest = (dataStr) => {
  return new Promise((resolve, reject) => {
    let response = {};
    // check if connected first
    if (!baosConnected) {
      reject(new Error('No baos module connected.'));
    }
    // then proceed to request
    let request = JSON.parse(dataStr);
    console.log(request);

    const requireField = (object, field) => {
      if (!Object.prototype.hasOwnProperty.call(object, field)) {
        reject(new Error(`Bad request. No <${field}> field`));
      }
    };
    requireField(request, 'request_id');
    response.response_id = request.request_id;
    requireField(request, 'method');
    response.method = request.method;
    switch (request.method) {
      case 'get datapoints':
        sdk
          .getAllDatapointDescriptions()
          .then(data => {
            response.payload = data;
            resolve(response);
          });
        break;
      case 'get description':
        requireField(request, 'payload');
        requireField(request.payload, 'id');
        sdk
          .findDatapoint(request.payload.id)
          .then(datapoint => {
            datapoint
              .getDescription()
              .then(data => {
                response.payload = data;
                resolve(response);
              });
          })
          .catch(e => {
            reject(e);
          });
        break;
      case 'get value':
        break;
      case 'read value':
        break;
      case 'set value':
        break;
    }
  });
};

ipc.on('request', (data, writeCb) => {
  let dataStr = data.toString();
  // TODO: process message by BDSM PROTOCOL
  processRequest(dataStr)
    .then(response => {
      response.success = true;
      writeCb(JSON.stringify(response));
    })
    .catch(e => {
      let response = {};
      response.success = false;
      response.error = e.message;
      writeCb(JSON.stringify(response));
    });
});

// bobaos datapoint sdk events
sdk.on('connected', _ => {
  baosConnected = true;
  // TODO: ipc broadcast
});

