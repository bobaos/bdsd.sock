// TODO: require server.js
// TODO: import ipc object
// TODO: register cb for 'connected' event with
// TODO: register cb for 'request' event. send data on response

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

ipc.on('request', (data, writeCb) => {
  let dataStr = data.toString();
  // TODO: process message by BDSM PROTOCOL
  let response = {};
  try {
    let request = JSON.parse(dataStr);
    console.log(request);
    if (!Object.prototype.hasOwnProperty.call(request, 'request_id')) {
      throw new Error('Bad request. No "request_id" field.');
    }
    response.response_id = request.request_id;
    if (!Object.prototype.hasOwnProperty.call(request, 'method')) {
      throw new Error('Bad request. NO "method" field.');
    }
    response.method = request.method;

  } catch (e) {
    response.success = false;
    response.error = e.message;
    //writeCb(JSON.stringify({sucess: false, payload: {id: dataStr, message: 'Wrong JSON'}}))
  } finally {
    writeCb(JSON.stringify(response));
  }
});

// bobaos datapoint sdk events
sdk.on('connected', _ => {
  baosConnected = true;
  // TODO: ipc broadcast
});

