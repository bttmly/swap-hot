const fs = require("fs");
const net = require("net");
const path = require("path");

const { SERVER_PORT, trim } = require("./common");

const debug = require("debug")("hotswap-watcher");

// TODO -- add `limit` option to limit how many directories to watch
// helps as a sanity check like event listener limits

// TODO -- add `host` option

class Watcher {
  constructor (opts = {}) {
    const { root = process.cwd(), port = SERVER_PORT } = opts;
    fs.statSync(root);
    this._root = root;
    this._port = port;
    debug("start watcher", root);

    this._watchers = watchDir(root, (eventType, filename) => {
      debug("saw file event:", eventType, filename);

      // we need to trim off the root and just provide the path from root -> file
      // this way the updater can follow the same path from *it's own root* and find
      // the file, even if the two parts are operating on different file systems
      // (this is the case when the watcher is on the bare filesystem and the updater
      // is inside e.g vagrant)
      const trimmed = trim(filename.slice(root.length));
      debug("file event:", eventType, trimmed);
      this._connect().end(`${eventType}:${trimmed}\n`);
    });
  }

  _connect () {
    const conn = net.createConnection({ host: "localhost", port: this._port });
    conn.on("error", err => {
      debug("conn error on", this._port, err.message);
      conn.end();
    });
    return conn;
  }

  close () {
    this._watchers.forEach((w) => w.close());
  }
}

// according to the Node.js docs, fs.watch({recursive: true}) doesn't work on Linux systems
// so instead we'll manually recurse down the root directory and add a directory watcher on
// every directory we find, returning all the watchers to the caller can close them when
// desired. `fn` will be invoked with the absolute path of the file that was changed
function watchDir (root, fn) {
  const watchers = [];
  const currentPath = [];

  function recurse (dir) {
    const files = fs.readdirSync(dir).map((f) => path.join(dir, f));
    files.forEach(function(file) {
      const stat = fs.statSync(file);
      if (stat.isDirectory()) {
        currentPath.push(file);
        const saved = currentPath.slice().join("/");
        watchers.push(fs.watch(file, function(evt, filePath) {
          return fn(evt, path.join(saved, filePath));
        }));
        recurse(file);
        currentPath.pop();
      }
    });
  }

  watchers.push(fs.watch(root, function(evt, filePath) {
    return fn(evt, path.join(root, filePath));
  }));

  recurse(root);
  return watchers;
}

module.exports = Watcher;
