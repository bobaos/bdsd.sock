const composeFrame = (data) => {
  // data - string
  const dataBuff = Buffer.from(data);
  const header = Buffer.from('BDSM');
  const length = Buffer.alloc(1, dataBuff.length);
  const checkSum = Buffer.alloc(1, dataBuff.reduce((a, b) => a + b, 0) % 256);
  const frame = Buffer.concat([header, length, dataBuff, checkSum]);
  return frame;
};

module.exports = {composeFrame};
