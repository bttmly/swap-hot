const Watcher = require("./lib/Watcher");
const Swapper = require("./lib/Swapper");

function main (root) {
  const watcher = new Watcher({ root }).listen();
  const swapper = new Swapper({ root });
  return { watcher, swapper };
}

main.Watcher = Watcher;
main.Swapper = Swapper;

module.exports = main;
