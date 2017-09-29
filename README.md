# babel-plugin-transform-glob-import

Import multiple files at once with globs

## Example

Importing both `dir/a.js` and `dir/b.js` at once:

```javascript
import vars from './dir/*.js';

console.log(vars.a, vars.b);
```

You can also import deeply nested globs. The result is a nested object for each directory:

```javascript
// import dir/a.js and dir/b/c.js
import vars from './dir/**/*.js';

console.log(vars.a, vars.b.c);
```

Importing only some files with destructuring also works:

```javascript
// imports only dir/a.js, and dir/b.js
import {a, b} from './dir/*.js';
```

## License

MIT
