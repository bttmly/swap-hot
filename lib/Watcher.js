const fs = require("fs");
const EventEmitter = require("events");
const path = require("path");
const debug = require("debug")("swap-hot:watcher");

module.exports = class Watcher extends EventEmitter {
  constructor ({ root = process.cwd() } = {}) {
    fs.statSync(root);
    super();
    this._root = root;
  }

  start () {
    this._watchers = watchDir(this._root, (eventType, filename) => {
      if (eventType !== "changed") return;
      const trimmed = trim(filename.slice(this._root.length));
      debug("emit change", trimmed);
      this.emit("changed", trimmed);
    });
    debug("started watcher", this._root);
    return this;
  }

  close () {
    this._watchers && this._watchers.forEach((w) => w.close());
    debug("closed watcher", this._root);
  }
}

// according to the Node.js docs, fs.watch({recursive: true}) doesn't work on Linux systems
// so instead we'll manually recurse down the root directory and add a directory watcher on
// every directory we find, returning all the watchers to the caller can close them when
// desired. `fn` will be invoked with the absolute path of the file that was changed
function watchDir (dir, fn) {
  const watchers = [];
  const currentPath = [];

  function recurse (dir) {
    const files = fs.readdirSync(dir).map((f) => path.join(dir, f));
    files.forEach(function(file) {
      const stat = fs.statSync(file);
      if (stat.isDirectory()) {
        currentPath.push(file);
        const saved = currentPath.slice().join("/");
        watchers.push(fs.watch(file, function(evt, file) {
          return fn(evt, path.join(saved, file));
        }));
        recurse(file);
        currentPath.pop();
      }
    });
  }

  recurse(dir);
  return watchers;
}

function trim (filename) {
  return filename.slice(0, -1 * path.extname(filename).length);
}
