const Watcher = require("./lib/Watcher");
const Updater = require("./lib/Updater");

function main (root) {
  const watcher = new Watcher({ root }).start();
  const updater = new Updater({ root }).start();
  watcher.on("change", filename => updater.update(filename));
  return { watcher, updater };
}

main.Watcher = Watcher;
main.Updater = Updater;

module.exports = main;
