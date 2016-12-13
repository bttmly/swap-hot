const fs = require("fs");
const intercept = require("intercept-require");
const path = require("path");
const EventEmitter = require("events");

const debug = require("debug")("swap-hot:updater");

const Updatable = require("./Updatable");

module.exports = class Updater extends EventEmitter {

  constructor ({ root = process.cwd() } = {}) {
    fs.statSync(root); // sanity check
    this._root = root;
    this._cache = {};
    debug("start swapper", root);
  }

  start () {
    this._restore = intercept((moduleExport, info) => {
      if (info.error) {
        throw info.error;
      }

      const {absPath, absPathResolvedCorrectly} = info;
      if (!absPathResolvedCorrectly) {
        return moduleExport;
      }

      const key = trim(absPath).slice(this._root.length);

      if (this._cache[key]) {
        return this._cache[key];
      }

      if (this._shouldWatchFile(absPath, this._root)) {
        debug("putting in cache:", key);
        const sw = new Updatable(moduleExport, info.absPath);
        this._cache[key] = sw;
        return sw;
      }

      return moduleExport;
    });

    debug("started updater");

    return this;
  }

  update (filename) {
    if (!this._cache[filename]) {
      debug("attempted to update unknown file:", filename);
      return;
    }
    this._cache[filename][Updatable.UPDATE]();
    this.emit("update", filename, this._cache[filename]);
  }

  close (cb) {
    this._restore();
    this._server.close(cb);
  }

  _shouldWatchFile (filename) {
    if (filename == null) return false;
    return filename.startsWith(this._root);
    // return !path.includes("node_modules");
  }
}

function trim (filename) {
  return filename.slice(0, -1 * path.extname(filename).length);
}
