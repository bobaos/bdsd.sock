// index.js
const BdsdIpc = require('./ipc/index');
const BdsdSdk = require('./datapointSdk/index');

let busConnected = false;

let BdsdSock = params => {
  // ipc, sdk instances
  let sdk, ipc;

  // process ipc request
  const processRequest = (connectionId, dataStr) => {
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
                    value: data.value,
                    raw: data.raw
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
        case 'get stored value':
          requireField(request, 'payload');
          requireField(request.payload, 'id');
          sdk
            .findDatapoint(request.payload.id)
            .then(datapoint => {
              datapoint
                .getStoredValue()
                .then(data => {
                  response.payload = {
                    id: request.payload.id,
                    value: data.value,
                    raw: data.raw
                  };
                  resolve(response);
                })
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
        case 'read multiple':
          requireField(request, 'payload');
          if (!Array.isArray(request.payload)) {
            rejectResponse(new Error('For "read multiple" request payload should be array of ids.'));
          }
          sdk
            .readMultipleValues(request.payload)
            .then(data => {
              response.payload = request.payload;
              resolve(response);
            })
            .catch(e => {
              rejectResponse(e);
            });
          break;
        case 'set value':
          requireField(request, 'payload');
          requireField(request.payload, 'id');
          requireField(request.payload, 'value');
          let id = request.payload.id;
          sdk
            .findDatapoint(id)
            .then(datapoint => {
              datapoint
                .setValue(request.payload.value)
                .then(data => {
                  // broadcast value except sender
                  datapoint
                    .getValue()
                    .then(data => {
                      let msg = {};
                      msg.method = 'cast value';
                      msg.payload = {id: id, value: data.value, raw: data.raw};
                      ipc.broadcast(JSON.stringify(msg), connectionId);
                    })
                    .catch(err => {
                      console.log('BDSD.SOCK: ', err);
                    });
                  // resolve promise
                  response.payload = {
                    id: id
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
        case 'set multiple':
          requireField(request, 'payload');
          if (!Array.isArray(request.payload)) {
            rejectResponse(new Error('For "set multiple" request payload should be array of values.'));
          }
          sdk
            .setMiltipleValues(request.payload)
            .then(data => {
              response.payload = request.payload;
              resolve(response);
            })
            .catch(e => {
              rejectResponse(e);
            });
          break;

        case 'programming mode':
          requireField(request, 'payload');
          requireField(request.payload, 'value');
          sdk
            .setProgrammingMode(request.payload.value)
            .then(data => {
              resolve(response);
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

  const initIPC = _ => {
    return new Promise((resolve, reject) => {
      // now params for ipc
      // it is only socket file path
      // if it undefined then ipc/index.js will use following:
      // process.env['XDG_RUNTIME_DIR'] + '/bdsd.sock'
      let sockFile;
      if (typeof params.sockFile !== 'undefined') {
        sockFile = params.sockFile;
      }
      ipc = BdsdIpc(sockFile);

      // interprocess communication events
      ipc.on('connected', (id, writeCb) => {
        console.log('BDSD.SOCK: ipc connected: ', id);
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
        resolve(ipc);
      });
      // on request
      ipc.on('request', (data, connectionId, writeCb) => {
        let dataStr = data.toString();
        console.log('BDSD.SOCK: got request', dataStr);
        processRequest(connectionId, dataStr)
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
    });
  };

  const initSdk = _ => {
    // params for sdk
    // serialport parameters
    // serialPortDevice: '/dev/ttyO1' for instance.
    // if undefined, '/dev/ttyAMA0' will be used
    // serialPortParams: '19200,even,8,1'
    let serialPortDevice, serialPortParams;
    if (typeof params.serialPortDevice !== 'undefined') {
      serialPortDevice = params.serialPortDevice;
    }
    if (typeof params.serialPortParams !== 'undefined') {
      serialPortParams = params.serialPortParams;
    }
    sdk = BdsdSdk({
      serialPort:
        {
          device: serialPortDevice,
          params: serialPortParams
        }
    });
    sdk.on('error', err => {
      console.log('BDSD.SOCK: error initializing bobaos sdk: ', err.message);
      console.log('Terminating');
      process.exit(0);
    });
    // bobaos datapoint sdk events
    sdk.once('connected', _ => {
      busConnected = true;
      initIPC()
        .then(_ => {
          // on indication
          sdk.on('DatapointValue.Ind', payload => {
            let message = {};
            message.method = 'cast value';
            message.payload = payload;
            ipc.broadcast(JSON.stringify(message));
            console.log('BDSD.SOCK: broadcasting bus value', payload);
          });

          sdk.on('bus connected', _ => {
            busConnected = true;
            let message = {};
            message.method = 'notify';
            message.payload = 'bus connected';
            ipc.broadcast(JSON.stringify(message));
            console.log('BDSD.SOCK: bus connected');
          });

          sdk.on('bus disconnected', _ => {
            busConnected = false;
            let message = {};
            message.method = 'notify';
            message.payload = 'bus disconnected';
            ipc.broadcast(JSON.stringify(message));
            console.log('BDSD.SOCK: bus disconnected');
          });
        })
        .catch(e => {
          console.log('BDSD.SOCK: IPC init error: ', e);
        })
    });
  };
  initSdk();
};

module.exports = BdsdSock;
