const fs = require("fs");
const net = require("net");
const EventEmitter = require("events");

const interceptRequire = require("intercept-require");
const debug = require("debug")("hotswap-swapper");

const Swappable = require("./Swappable");
const { UPDATE, SERVER_PORT, trim } = require("./common");

class Swapper extends EventEmitter {

  constructor ({ root = process.cwd(), port = SERVER_PORT } = {}) {
    fs.statSync(root); // sanity check
    super();
    this._root = root;
    this._port = port;
    debug("start swapper", root);
  }

  listen () {
    this._cache = {};

    this._restore = interceptRequire((moduleExport, info) => {
      if (info.error) {
        throw info.error;
      }

      const {absPath, absPathResolvedCorrectly} = info;
      if (!absPathResolvedCorrectly) {
        return moduleExport;
      }

      let key = trim(absPath);
      key = key.slice(this._root.length);

      if (this._cache[key]) {
        return this._cache[key];
      }

      if (this._shouldWatchFile(absPath, this._root)) {
        debug("putting in cache:", key);
        const sw = new Swappable(moduleExport, info.absPath);
        this._cache[key] = sw;
        return sw;
      }

      return moduleExport;
    });

    this._server = net.createServer((socket) => {
      socket.on("data", (buf) => {

        const filename = buf.toString().split(":")[1].trim();

        if (!this._cache[filename]) return;

        debug("updating", filename);

        this._cache[filename][UPDATE]();
        this.emit("update", filename, this._cache[filename]);
      });
    });

    this._server.listen(this._port);
    return this;
  }

  close (cb) {
    this._restore();
    this._server.close(cb);
  }

  _shouldWatchFile (path) {
    if (path == null) return false;
    return path.startsWith(this._root);
  }
}

module.exports = Swapper;
