const Watcher = require("./lib/Watcher");
const Swapper = require("./lib/Swapper");

function main (root) {
  const watcher = new Watcher({ root });
  const swapper = new Swapper({ root });

  swapper.listen();

  function close () {
    watcher.close();
    swapper.close();
  }

  return { watcher, swapper, close };
}

main.Watcher = Watcher;
main.Swapper = Swapper;

module.exports = main;
