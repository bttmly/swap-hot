const path = require("path");

module.exports = {
  FLAG: "__SWAPPABLE__",
  UPDATE: Symbol("update"),
  SERVER_PORT: 12012,
  trim (filename) {
    return filename.slice(0, -1 * path.extname(filename).length);
  },
};
