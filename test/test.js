const fs = require("fs");
const assert = require("assert");

const swap = require("../");

const sampleFile = require("path").join(__dirname, "sample.js");

describe("hotswapping", function () {

  const orig = fs.readFileSync(sampleFile).toString();
  after(() => fs.writeFileSync(sampleFile, orig));

  it("works", function (done) {
    const xs = swap(__dirname);

    const sample = require("./sample");

    assert.equal(sample.a, 1);
    assert.equal(sample.b, undefined);

    fs.appendFile(sampleFile, "exports.b = 2;", function (err) {
      if (err) throw err;

      xs.swapper.on("update", function (path, updated) {
        assert.equal(path, "/sample");
        assert.equal(updated.a, 1);
        assert.equal(updated.b, 2);
        assert.equal(updated, sample);
        xs.close();
        done();
      });
    });
  });

});
