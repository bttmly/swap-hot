const fs = require("fs");
const makeModule = require("make-module");

const { UPDATE, FLAG } = require("./common");

// NOTE -- proxies don't play well with Object.keys()
// this might be possible to spoof effectively, not sure best
// implementation strategy though

function Swappable (exports, absPath) {

  // NOTE -- must *not* use an arrow function as the proxy target, it fails
  // when proxying a constructor
  const dummy = typeof exports === "function" ? function() {} : {};

  dummy[UPDATE] = function() {
    ({exports} = makeModule(fs.readFileSync(absPath, "utf8"), absPath));
  };

  Object.defineProperty(dummy, FLAG, { value: true, configurable: true });

  return new Proxy(dummy, {
    get (target, prop) {
      if (prop === UPDATE || prop === FLAG) {
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

module.exports = Swappable;
