const glob = require('glob');
const micromatch = require('micromatch');
const Path = require('path');
const template = require('babel-template');

const requireTemplate = template('INTEROP(require(FILE)).default');

module.exports = function ({types: t}) {
  function set(obj, path, value) {
    for (let i = 0; i < path.length - 1; i++) {
      let part = path[i];

      if (obj[part] == null) {
        obj[part] = {};
      }

      obj = obj[part];
    }

    obj[path[path.length - 1]] = value;
  }

  function toRequire(name, file) {
    return requireTemplate({
      INTEROP: file.addHelper('interopRequireDefault'),
      FILE: t.stringLiteral(name)
    }).expression;
  }

  function toObject(obj, file) {
    if (typeof obj !== 'object') {
      return toRequire(obj, file);
    }

    let properties = Object.keys(obj).map(key =>
      t.objectProperty(t.stringLiteral(key), toObject(obj[key], file))
    );

    return t.objectExpression(properties);
  }

  return {
    visitor: {
      ImportDeclaration(path, state) {
        let pattern = path.node.source.value;
        if (!glob.hasMagic(pattern)) {
          return;
        }

        // Find files
        let dirname = Path.dirname(state.file.opts.filename);
        pattern = Path.resolve(dirname, pattern);
        if (process.platform === 'win32') {
          pattern = pattern.replace(/\\/g, '/');
        }

        let files = glob.sync(pattern, {strict: true, nodir: true});
        if (files.length === 0) {
          pattern = 'node_modules/' + path.node.source.value;
          files = glob.sync(pattern, {strict: true, nodir: true});
        }

        // Capture matches
        let re = micromatch.makeRe(pattern, {capture: true});
        let matches = {};

        for (let file of files) {
          let match = file.match(re);
          let parts = match.slice(1).filter(Boolean).reduce((a, p) => a.concat(p.split('/')), []);
          let relative = './' + Path.relative(dirname, file);
          set(matches, parts, relative);
        }

        // Find import names
        let specifiers = path.node.specifiers;
        let defaultName = null;
        let destructured = [];
        for (let specifier of path.node.specifiers) {
          if (specifier.type === 'ImportDefaultSpecifier' || specifier.type === 'ImportNamespaceSpecifier') {
            defaultName = specifier.local.name;
          } else if (specifier.type === 'ImportSpecifier') {
            destructured.push({local: specifier.local.name, imported: specifier.imported.name});
          }
        }

        // Generate replacements
        let replacements = [];
        if (defaultName) {
          let decl = t.variableDeclaration('const', [
            t.variableDeclarator(t.identifier(defaultName), toObject(matches, state.file))
          ]);

          replacements.push(decl);
        }

        if (destructured) {
          for (let item of destructured) {
            replacements.push(t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier(item.local), toRequire(matches[item.imported], state.file))
            ]));
          }
        }

        path.replaceWithMultiple(replacements);
      }
    }
  };
};
