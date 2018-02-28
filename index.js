// IPC
const ipc = require('./ipc/server');
// datapoint sdk
const sdk = require('./datapointSdk/sdk')();

let baosConnected = false;

// interprocess communication events
ipc.on('connected', (id, writeCb) => {
  console.log('ipc connected: ', id);
  if (baosConnected) {
    writeCb(JSON.stringify({
      method: 'notify',
      payload: 'baos connected'
    }))
  } else {
    writeCb(JSON.stringify({
      method: 'notify',
      payload: 'baos disconnected'
    }))
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
          })
          .catch(e => {
            reject(e);
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
                response.payload = {
                  id: request.payload.id,
                  value: data
                };
                resolve(response);
              })
              .catch(e => {
                reject(e);
              });
          })
          .catch(e => {
            reject(e);
          });
        break;
      case 'get value':
        requireField(request, 'payload');
        requireField(request.payload, 'id');
        sdk
          .findDatapoint(request.payload.id)
          .then(datapoint => {
            datapoint
              .getValue()
              .then(data => {
                response.payload = {
                  id: request.payload.id,
                  value: data
                };
                resolve(response);
              })
              .catch(e => {
                reject(e);
              });
          });
        break;
      case 'read value':
        requireField(request, 'payload');
        requireField(request.payload, 'id');
        sdk
          .findDatapoint(request.payload.id)
          .then(datapoint => {
            datapoint
              .readFromBus()
              .then(data => {
                response.payload = {id: request.payload.id};
                resolve(response);
              })
              .catch(e => {
                reject(e);
              });
          });
        break;
      case 'set value':
        requireField(request, 'payload');
        requireField(request.payload, 'id');
        requireField(request.payload, 'value');
        sdk
          .findDatapoint(request.payload.id)
          .then(datapoint => {
            datapoint
              .setValue(request.payload.value)
              .then(data => {
                response.payload = {
                  id: request.payload.id
                };
                resolve(response);
              })
              .catch(e => {
                reject(e);
              });
          });
        break;
      default:
        reject(new Error(`Unknown method ${method}`));
        break;
    }
  });
};

ipc.on('request', (data, writeCb) => {
  let dataStr = data.toString();
  console.log('got request', dataStr);
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
  ipc.broadcast(JSON.stringify({
    method: 'notify',
    payload: 'baos connected'
  }));
});

// on indication
sdk.on('DatapointValue.Ind', payload => {
  let message = {};
  message.method = 'cast value';
  message.payload = payload;
  ipc.broadcast(JSON.stringify(message));
});

