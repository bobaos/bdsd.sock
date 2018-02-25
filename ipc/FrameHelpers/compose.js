const composeFrame = (data) => {
  // data - string
  try {
    const dataBuff = Buffer.from(data);
    const header = Buffer.from('BDSM');
    const length = Buffer.alloc(2, 0x00);
    length.writeUInt16BE(dataBuff.length);
    const checkSum = Buffer.alloc(1, dataBuff.reduce((a, b) => a + b, 0) % 256);
    const frame = Buffer.concat([header, length, dataBuff, checkSum]);
    return frame;
  } catch(e) {
    console.log(e);
  }
};

module.exports = {composeFrame};
