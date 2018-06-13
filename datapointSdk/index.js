// Bobaos Datapoint Sdk
// collects datapoints information, provide methods to set, get, read values.
const DPTs = require('knx-dpts-baos');
const Baos = require('bobaos');
const EE = require('events').EventEmitter;

const Sdk = (params) => {
  let self = new EE();
  // simple storage for datapoint objects and descriptions
  self.store = {
    datapoints: [],
    descriptions: []
  };

  // default serialport params
  let serialPortDevice = '/dev/ttyAMA0';
  let defaultSerialPortParams = {
    baudRate: 19200,
    parity: "even",
    dataBits: 8,
    stopBits: 1
  };
  let serialPortParams = Object.assign({}, defaultSerialPortParams);
  if (typeof params !== 'undefined') {
    if (params.serialPort !== null && typeof params.serialPort === 'object') {
      if (params.serialPort.device !== null && typeof params.serialPort.device === 'string') {
        serialPortDevice = params.serialPort.device;
      }
      if (params.serialPort.params !== null && typeof params.serialPort.params === 'object') {
        serialPortParams = params.serialPort.params;
      }
      // now if params is a string '19200,even,8,1' we parse it
      if (params.serialPort.params !== null && typeof params.serialPort.params === 'string') {
        try {
          let _params = {};
          let _args = params.serialPort.params.split(',');
          _params.baudRate = parseInt(_args[0]);
          _params.parity = _args[1];
          _params.dataBits = parseInt(_args[2]);
          _params.stopBits = parseInt(_args[3]);
          serialPortParams = _params;
        } catch (e) {
          console.log(`BAOS: error parsing serialport params: ${params.serialPort.params}: ${e.message}`);
          console.log('BAOS: using default serialport parameters');
          serialPortParams = Object.assign({}, defaultSerialPortParams);
        }
      }
    }
  }
  // init bobaos
  const bobaos = new Baos({serialPort: {device: serialPortDevice, params: serialPortParams}, debug: false});
  bobaos.on('error', err => {
    self.emit('error', err);
  })

  // Datapoint class
  const Datapoint = function (props) {
    this.id = props.id;
    this.dpt = props.dpt;
    this.flags = props.flags;
    this.length = props.length;
    this.value = null;
    this.raw = null;
  };
  Datapoint.prototype.getDescription = function () {
    return new Promise((resolve, reject) => {
      resolve({
        id: this.id,
        dpt: this.dpt,
        flags: this.flags,
        length: this.length
      });
    });
  };
  Datapoint.prototype.setValue = function (value) {
    return new Promise((resolve, reject) => {
      let id = this.id;
      let dpt = this.dpt;
      try {
        let encodedValue = DPTs[dpt].fromJS(value);
        bobaos.setDatapointValue(id, encodedValue)
          .then(payload => {
            resolve(payload);
          })
          .catch(e => {
            reject(e);
          });
      } catch (e) {
        reject(e);
      }

    });
  };
  Datapoint.prototype.getValue = function () {
    const processValuePayload = t => {
      return new Promise((resolve, reject) => {
        let id = t.id;
        let encodedValue = t.value;
        self.findDatapoint(id)
          .then(datapoint => {
            return datapoint
              ._applyValue(encodedValue);
          })
          .then(payload => {
            resolve(payload);
          })
          .catch(e => {
            reject(e)
          });
      });
    };

    let id = this.id;
    return bobaos
      .getDatapointValue(id, 1)
      .then(payload => {
        return processValuePayload(payload[0]);
      })
  };
  Datapoint.prototype.getStoredValue = function () {
    return new Promise((resolve, reject) => {
      let id = this.id;
      let value = this.value;
      if (value === null) {
        console.log(`SDK: no stored value for datapoint ${id} yet, getting`);
        this
          .getValue()
          .then(payload => {
            resolve(payload);
          })
          .catch(e => {
            reject(e);
          });
      } else {
        let raw = this.raw;
        resolve({id: id, value: value, raw: raw});
      }
    })
  };
  Datapoint.prototype.readFromBus = function () {
    return new Promise((resolve, reject) => {
      let id = this.id;
      let length = this.length;
      bobaos
        .readDatapointFromBus(id, length)
        .then(payload => {
          resolve(payload);
        })
        .catch(e => {
          reject(e);
        });
    });
  };
  // to internal use. used to convert value from bus
  Datapoint.prototype._applyValue = function (value) {
    return new Promise((resolve, reject) => {
      let id = this.id;
      let dpt = this.dpt;
      try {
        this.value = DPTs[dpt].toJS(value);
        this.raw = value;
        resolve({value: this.value, raw: value});
      } catch (e) {
        reject(e);
      }
    });
  };
  // function to get all datapoints descriptions
  self.getAllDatapointDescriptions = _ => {
    return new Promise((resolve, reject) => {
      try {
        resolve(self.store.descriptions.slice());
      } catch (e) {
        reject(e);
      }
    });
  };

  // function to get datapoint object. Example: .datapoint(1).getValue();
  self.findDatapoint = id => {
    return new Promise((resolve, reject) => {
      const findDatapointById = t => t.id === id;
      let datapointIndex = self.store.datapoints.findIndex(findDatapointById);
      if (datapointIndex >= 0) {
        resolve(self.store.datapoints[datapointIndex]);
      } else {
        // cannot find datapoint with this id
        reject(new Error('cannot find datapoint with id:' + id));
      }
    });
  };

  // programming mode
  self.setProgrammingMode = value => {
    return new Promise((resolve, reject) => {
      const valueBuff = Buffer.alloc(1, value & 0x01);
      bobaos
        .setServerItem(15, valueBuff)
        .then(payload => {
          resolve(payload);
        })
        .catch(e => {
          reject(e);
        })
    });
  };

  self.setMiltipleValues = (payload) => {
    return new Promise((resolve, reject) => {
      //  TODO: setMultipleValues
      try {
        // objects we want to send to bobaos
        let values = payload.map(t => {
          let id = t.id;
          let value = t.value;
          let dpt = self.store.descriptions.find(d => d.id === id)['dpt'];
          let encodedValue = DPTs[dpt].fromJS(value);
          return {id: id, value: encodedValue}
        });
        bobaos
          .setMultipleValues(values)
          .then(payload => {
            resolve(payload);
          })
          .catch(e => {
            reject(e);
          });
      } catch (e) {
        reject(e);
      }
    });
  };

  self.readMultipleValues = payload => {
    return new Promise((resolve, reject) => {
      //  TODO: readMultipleValues
      try {
        // objects we want to send to bobaos
        // [{id: 1, length: 2}]
        let values = payload.map(t => {
          let length = self.store.descriptions.find(i => i.id === t)['length'];
          return {id: t, length: length};
        });
        bobaos
          .readMultipleDatapoints(values)
          .then(payload => {
            resolve(payload);
          })
          .catch(e => {
            reject(e);
          });
      } catch (e) {
        reject(e);
      }
    });
  };
  // 1. set server item for indication to false at beginning
  // 2. get description for all datapoints [1-1000].
  // 3. send GetServerItem request for "bus connected state" item.
  // 4. enable indications
  // enable/disable indications steps are done to be
  // sure that we have all datapoint descr when got ind event
  const setIndications = function (state) {
    let value = state ? 1 : 0;
    bobaos.setServerItem(17, Buffer.alloc(1, value))
      .then(_ => {
        console.log('BAOS: success on setting indications to:', value);
      })
      .catch(e => {
        console.log('BAOS: error while setting indications to:', value, e);
      })
  };
  const getAllDatapointDescription = _ => {
    const processDatapointDescription = payload => {
      if (Array.isArray(payload)) {
        payload.forEach(t => {
          let datapoint = new Datapoint(t);
          console.log('BAOS: success on get datapoint description: { id:', datapoint.id, ', dpt: ', datapoint.dpt, '}');
          self.store.datapoints.push(datapoint);
          self.store.descriptions.push(t);
        });
      }
    };
    const processError = e => {
      //console.log('error while getting datapoint description', e);
    };
    // clear store
    self.store.datapoints = [];
    self.store.descriptions = [];
    // how much datapoints at one request
    const number = 30;
    for (let i = 0, imax = 1000; i < imax; i += number) {
      if ((imax - i) > number) {
        bobaos.getDatapointDescription(i + 1, number)
          .then(processDatapointDescription)
          .catch(processError);
      } else {
        bobaos.getDatapointDescription(i + 1, imax - i)
          .then(processDatapointDescription)
          .catch(processError);
      }
    }
  };
  const getBusState = _ => {
    bobaos.getServerItem(10)
      .then(payload => {
        if (Array.isArray(payload)) {
          payload.forEach(t => {
            if (t.id === 10 && t.value.readUInt8(0) === 1) {
              console.log('BAOS: got bus state: connected');
              self.emit('connected');
            }
          })
        }
      })
      .catch(e => {
        console.log('BAOS: error while getting bus state', e);
      });
  };
  bobaos.on('open', _ => {
    console.log('BAOS: connected to baos');
    // get all descriptions and after that get bus state
    setIndications(false);
    getAllDatapointDescription();
    setIndications(true);
    getBusState();
  });
  bobaos.on('reset', function () {
    console.log('BAOS: got reset ind');
    // on reset indication. e.g. when you downloaded new config from ETS
    // get all descriptions and after that get bus state
    setIndications(false);
    getAllDatapointDescription();
    setIndications(true);
    getBusState();
  });
  // now process value indications
  bobaos.on('DatapointValue.Ind', payload => {
    const processValuePayload = function (t) {
      let id = t.id;
      let encodedValue = t.value;
      self.findDatapoint(id)
        .then(datapoint => {
          return datapoint
            ._applyValue(encodedValue);
        })
        .then(payload => {
          self.emit('DatapointValue.Ind', {id: id, value: payload.value, raw: payload.raw});
        })
        .catch(e => {
          // should never be executed but anyway
          console.log('BAOS: error on DatapointValue.Ind', e);
        });
    };
    if (Array.isArray(payload)) {
      payload.forEach(t => {
        processValuePayload(t);
      })
    }
  });
  // handle bus indication events
  bobaos.on('ServerItem.Ind', payload => {
    if (Array.isArray(payload)) {
      payload.forEach(t => {
        if (t.id === 10) {
          if (t.value.readUInt8(0) === 1) {
            self.emit('bus connected');
          } else {
            self.emit('bus disconnected');
          }
        }
      })
    }
  });
  return self;
};

module.exports = Sdk;