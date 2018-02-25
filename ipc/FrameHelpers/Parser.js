'use strict';
const Transform = require('stream').Transform;

const DATA_FRAME_START = Buffer.from('BDSM');

// |B|D|S|M|<L>|<DATA>|<CR>
// <L> = <DATA>.length (~)
// <CR> = sum(<DATA>) % 256
class FrameParser extends Transform {
  constructor(options) {
    super(options);
    this.buffer = Buffer.alloc(0);
  }

  _transform(chunk, encoding, cb) {
    let data = Buffer.concat([this.buffer, Buffer.from(chunk)]);
    let processed = false;
    // console.log('transform: data = ', data);
    while (!processed) {
      if (data.length > DATA_FRAME_START.length) {
        if (data.slice(0, 4).compare(DATA_FRAME_START) === 0) {
          let DATA_L_BYTE = data.readUInt16BE(4);
          // console.log('transform: length = ', DATA_L_BYTE);
          let expectedLength = DATA_FRAME_START.length + 2 + DATA_L_BYTE + 1;
          if (data.length >= expectedLength) {
            let dataFrame = data.slice(6, expectedLength - 1);
            // console.log('transform: data string: ', dataFrame.toString());
            let expectedCheckSum = dataFrame.reduce((a, b) => a + b, 0) % 256;
            let checkSum = data.readUInt8(expectedLength - 1);
            if (checkSum === expectedCheckSum) {
              // console.log('transform: checksum is good!');
              // console.log('transform: new data: ', data);
              this.buffer = data;
              this.push(dataFrame);
            } else {
              // console.log('transform: expected', expectedCheckSum, 'received', checkSum);
            }
            data = data.slice(expectedLength);
          } else {
            // data length < expectedLength
            // close loop, wait for next chunk
            // BDSM<L><DATA PART..
            processed = true;
          }
        } else {
          // console.log('transform: move on');
          data = data.slice(1);
        }
       } else {
        processed = true;
      }

      this.buffer = data;
    }
    cb();
  }

  _flush(cb)
  {
    this.buffer = Buffer.alloc(0);
    cb();
  }
}

module.exports = FrameParser;
