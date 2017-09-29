const pluginPath = require.resolve('../');
const {spawnSync} = require('child_process');
const assert = require('assert');

describe('babel-plugin-transform-glob-import', function () {
  before(function () {
    var res = spawnSync(__dirname + '/../node_modules/.bin/babel', [
      __dirname + '/fixtures',
      '-d',
      __dirname + '/compiled',
      '--plugins=' + pluginPath + ',babel-plugin-transform-es2015-modules-commonjs'
    ]);

    let stderr = res.stderr.toString();
    if (stderr) {
      throw new Error(stderr);
    }
  });

  it('should import a glob', function () {
    var res = require('./compiled/glob/index');
    assert.equal(res.default, 3);
  });

  it('should import a deep glob', function () {
    var res = require('./compiled/glob-deep/index');
    assert.equal(res.default, 13);
  });

  it('should import a glob with destructuring', function () {
    var res = require('./compiled/destructured/index');
    assert.equal(res.default, 3);
  });
});
