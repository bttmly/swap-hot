const fs = require("fs");
const makeModule = require("make-module");

Updatable.UPDATE = Symbol("Updatable.UPDATE");
Updatable.FLAG   = Symbol("Updatable.FLAG");

function Updatable (exports, absPath) {

  // NOTE -- must *not* use an arrow function as the proxy target, it seems to
  // fail when proxying a constructor
  const dummy = typeof exports === "function" ? Function() : {};

  dummy[Updatable.UPDATE] = function () {
    ({exports} = makeModule(fs.readFileSync(absPath, "utf8"), absPath));
  };

  Object.defineProperty(dummy, Updatable.FLAG, { value: true, configurable: true });

  return new Proxy(dummy, {
    get (target, prop) {
      if (prop === Updatable.UPDATE || prop === Updatable.FLAG) {
        return Reflect.get(target, prop);
      }
      return Reflect.get(exports, prop);
    },
    set (target, prop, value) {
      return Reflect.set(exports, prop, value);
    },
    has (target, prop) {
      return Reflect.has(exports, prop);
    },
    ownKeys () {
      return Reflect.ownKeys(exports);
    },
    deleteProperty (target, prop) {
      return Reflect.deleteProperty(exports, prop);
    },
    defineProperty (target, prop, descr) {
      return Reflect.defineProperty(exports, prop, descr);
    },
    apply (target, self, args) {
      return Reflect.apply(exports, self, args);
    },
    construct (target, args, newTarget) {
      return Reflect.construct(exports, args, newTarget);
    },
  });
}

module.exports = Updatable;
