// CJS shim for uuid v14 (ESM-only) so Jest can load it in CommonJS mode
const { randomUUID } = require('crypto');

function v4() {
  return randomUUID();
}

module.exports = { v4 };
module.exports.v4 = v4;
