// IPC
const ipc = require('./ipc/server');
// datapoint sdk
const sdk = require('./datapointSdk/sdk')();

let busConnected = false;

// interprocess communication events
ipc.on('connected', (id, writeCb) => {
  console.log('ipc connected: ', id);
  if (busConnected) {
    writeCb(JSON.stringify({
      method: 'notify',
      payload: 'bus connected'
    }))
  } else {
    writeCb(JSON.stringify({
      method: 'notify',
      payload: 'bus disconnected'
    }))
  }
});

const processRequest = (dataStr) => {
  return new Promise((resolve, reject) => {
    let response = {};
    const rejectResponse = e => {
      response.error = e.message;
      reject(response);
    };
    // check if connected first
    if (!busConnected) {
      rejectResponse(new Error('No baos module connected.'));
    }
    // then proceed to request
    let request = JSON.parse(dataStr);

    const requireField = (object, field) => {
      if (!Object.prototype.hasOwnProperty.call(object, field)) {
        rejectResponse(new Error(`Bad request. No <${field}> field`));
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
            rejectResponse(e);
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
                rejectResponse(e);
              });
          })
          .catch(e => {
            rejectResponse(e);
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
                rejectResponse(e);
              });
          })
          .catch(e => {
            rejectResponse(e);
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
                rejectResponse(e);
              });
          })
          .catch(e => {
            rejectResponse(e);
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
                rejectResponse(e);
              });
          })
          .catch(e => {
            rejectResponse(e);
          });
        break;
      default:
        rejectResponse(new Error(`Unknown method ${method}`));
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
      if (Object.prototype.hasOwnProperty.call(e, 'response_id')) {
        response.response_id = e.response_id;
      }
      if (Object.prototype.hasOwnProperty.call(e, 'method')) {
        response.method = e.method;
      }
      response.success = false;
      response.error = e.error;
      writeCb(JSON.stringify(response));
    });
});

// bobaos datapoint sdk events
sdk.on('connected', _ => {
  busConnected = true;
  ipc.broadcast(JSON.stringify({
    method: 'notify',
    payload: 'bus connected'
  }));
});

// on indication
sdk.on('DatapointValue.Ind', payload => {
  let message = {};
  message.method = 'cast value';
  message.payload = payload;
  ipc.broadcast(JSON.stringify(message));
});

sdk.on('bus connected', _ => {
  busConnected = true;
  let message = {};
  message.method = 'notify';
  message.payload = 'bus connected';
  ipc.broadcast(JSON.stringify(message));
});

sdk.on('bus disconnected', _ => {
  busConnected = false;
  let message = {};
  message.method = 'notify';
  message.payload = 'bus disconnected';
  ipc.broadcast(JSON.stringify(message));
});

