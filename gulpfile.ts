/**
 * Gulp build pipeline
 */

/** Imports */

import * as fs from "fs";
import * as path from "path";

import del from "del";
import { dest, parallel, series, src, task as gulpTask, TaskFunction } from "gulp";
import debug from "gulp-debug";
// import flatten from "gulp-flatten";
// tslint:disable-next-line:no-var-requires
// const flattenRequires = require("gulp-flatten-requires");
import gulpif from "gulp-if";
import rename from "gulp-rename";
import sourcemaps from "gulp-sourcemaps";
import ts from "gulp-typescript";
import prettier from "prettier";
import vinyl from "vinyl";

/** Configuration variables */

/** Shared config for TypeScript */

// Read the TypeScript compiler options from tsconfig.json
const TS_SHARED_CONFIG = JSON.parse(
  fs
    .readFileSync("./tsconfig.json")
    .toString()
    .split("\n")
    // Filter out all lines that either contain comments or that are empty
    .filter((line) => !line.includes("//") && line.length > 0)
    .join("\n"),
).compilerOptions;

const TS_CJS_CONFIG = {
  ...TS_SHARED_CONFIG,
  module: "commonjs",
  target: "es3",
};

const TS_MJS_CONFIG = {
  ...TS_SHARED_CONFIG,
  module: "esnext",
  target: "esnext",
};

const SRC_PATH = "./src";
// prettier-ignore
const TS_SRC_FILES = [
  path.join(SRC_PATH, "**/*.ts"),
  path.join(SRC_PATH, "**/*.tsx"),
];
const OUTPUT_PATH = "./dist";

/** Helpers */

/** Generates a function that checks if file ends in the extension provided */
const fileEndsIn = (ext: string) => {
  return (file: vinyl) => file.extname === ext;
};

/** Helper function to create tasks with better names that are not valid JS identifiers */
const task = (taskName: string, fn: TaskFunction) => {
  gulpTask(taskName, fn);
  return gulpTask(taskName);
};

/** Gulp tasks */

/** Compile TypeScript to CJS modules */
const compileTypeScriptToCJS = task("tsc:cjs", () =>
  src(TS_SRC_FILES)
    // Initialize source maps
    .pipe(sourcemaps.init())
    // Compile TypeScript with target = es3 and module = commonjs
    .pipe(ts(TS_CJS_CONFIG))
    // Flatten output
    // .pipe(flatten())
    // .pipe(gulpif(fileEndsIn(".js"), flattenRequires()))
    // Generate source maps
    .pipe(sourcemaps.write("."))
    // Write to disk
    .pipe(dest(OUTPUT_PATH)),
);

/** Compile TypeScript to ES modules */
const compileTypeScriptToES = task("tsc:es", () =>
  src(TS_SRC_FILES)
    // Initialize source maps
    .pipe(sourcemaps.init())
    // Compile TypeScript with target = esnext and module = esnext
    .pipe(ts(TS_MJS_CONFIG))
    // Rename .js files to .mjs
    .pipe(gulpif(fileEndsIn(".js"), rename({ extname: ".mjs" })))
    // Flatten output
    // .pipe(flatten())
    // .pipe(gulpif(fileEndsIn(".mjs"), flattenRequires()))
    // Generate source maps
    .pipe(sourcemaps.write("."))
    // Write to disk
    .pipe(dest(OUTPUT_PATH)),
);

/** Compile TypeScript to CJS and ES modules in parallel */
const compileTypeScript = task("tsc", parallel(compileTypeScriptToCJS, compileTypeScriptToES));

/** Copy static files */
const copyStaticFiles = task("copy:static-files", () => src(["README.md", "LICENSE"]).pipe(dest(OUTPUT_PATH)));

/** Clean output path */
const cleanOutputPath = task("clean:output", () => del([OUTPUT_PATH]));

/** Clean node_mdoules */
const cleanNodeModules = task("clean:node_modules", () => del(["./node_modules"]));

/** Clean all */
const clean = task("clean", parallel(cleanOutputPath, cleanNodeModules));

/** Create a new package.json */

/** Configuration for the processing step */
interface PackageJsonProcessorProps {
  inputPath?: string;
  processField: (key: string, value: any) => object | false;
  outputPath: string;
}

/** Task factory */
const packageJsonProcessorFactory = ({
  inputPath = "package.json",
  processField,
  outputPath,
}: PackageJsonProcessorProps) => (cb: (err?: any) => void) => {
  // Read the package.json
  const packageJsonContent = JSON.parse(fs.readFileSync(inputPath).toString());
  // Process the entries in the package.json
  const fields = Object.keys(packageJsonContent).map((key) => processField(key, packageJsonContent[key]));
  // Generate the new package.json object representation
  const processedPackageJsonContent = Object.assign({}, ...fields);
  // Create the prettier-formatted string representation
  const outputContent = prettier.format(JSON.stringify(processedPackageJsonContent), {
    parser: "json",
    tabWidth: 2,
    useTabs: false,
  });
  // Write the new file to disk
  fs.writeFileSync(outputPath, outputContent);
  // Call the callback to signal task completion
  cb();
};

/** Creates an object with the supplied key and value */
const objectWithKeyAndValue = <K extends string, T>(key: K, value: T): { [k in K]: T } => {
  const o: any = {};
  o[key] = value;
  return o;
};

/** Create a new package.json */
const packageJson = task(
  "package.json",
  packageJsonProcessorFactory({
    outputPath: path.join(OUTPUT_PATH, "package.json"),
    processField: (key, value) => {
      switch (key) {
        // Ignore all scipts and devDependencies
        case "scripts":
        case "devDependencies":
          return false;
        // Include name, version, description, author and license as is
        case "name":
        case "version":
        case "description":
        case "author":
        case "license":
        // Also include NPM metatdata fields like keywords, homepage, repository and bugs
        case "keywords":
        case "homepage":
        case "repository":
        case "bugs":
          return objectWithKeyAndValue(key, value);
        // Include private, if set to true
        case "private":
          return value ? objectWithKeyAndValue(key, true) : false;
        // Modify the entries of main, module, browser and types to replace the change in directory structure
        case "main":
        case "module":
        case "browser":
        case "types":
          return objectWithKeyAndValue(key, path.relative(OUTPUT_PATH, value as string));
        // Ignore and remove all other fields
        default:
          return false;
      }
    },
  }),
);

/**
 * Default task
 *
 * Clean the output path, run the TypeScript compiler, copy static files, and create the new package.json.
 */
const defaultTask = series(cleanOutputPath, compileTypeScript, copyStaticFiles, packageJson);
export default defaultTask;
