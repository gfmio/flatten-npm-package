# How to produce a flattened NPM package with TypeScript and Gulp

This is a minimal example to show how to produce flattened NPM modules using
TypeScript and Gulp.

The key insight to achieve this is that the source code directory structure need
not mimic the structure of the generated package.

The TypeScript compiler is called from Gulp, but the output is not written to
disk directly. Instead, it first gets processed by by Gulp to return a flattened
file hierarchy.

In fact, this process occurs twice in parallel, once for outputting CommonJS
modules targeting `es3`, and once for ECMAScript modules targeting `esnext`. The
ES modules furthermore get renamed to `.mjs` to be usable directly from within
node.js.

This process also produces the correct source maps for all files, all in the
correct flattened locations.

After the compilation is complete, some static files (`README.md`, `LICENSE`)
get copied over directly to the output directory.

Finally, the package.json is parsed, development-related fields are removed, and
file paths in the `main`, `module`, `browser` and `types` fields get updated to
reflect the new module organisation. The resulting configuration is written to
the [`package.json`](./dist/package.json) in the output directory.

With this, the build process is complete and the flattened module is contained
in the output directory `./dist`. This could now be published to NPM with all
submodules being accessible directly from the package root.

I've left included the output of this process in the Git repo, so you can
compare the [`./src`](./src "Source code directory") and the
[`./dist`](./dist "./dist") directories.

## License

MIT License

Copyright 2018 Frédérique Mittelstaedt

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
