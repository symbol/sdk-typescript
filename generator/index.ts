import * as fs from 'fs-extra';
import * as YAML from 'js-yaml';
import * as path from 'path';
import { FileGenerator } from './src/FileGenerator';
import { Helper } from './src/Helper';
import { Schema } from './src/interface/schema';

const destinationPath = path.join(__dirname, '/build');
const srcPath = destinationPath + '/src';
const symbolDestination = srcPath + '/symbol';
const nemDestination = srcPath + '/nem';

fs.ensureDirSync(destinationPath);
fs.ensureDirSync(symbolDestination);
fs.ensureDirSync(nemDestination);

const symbolPath = path.join(__dirname, '/src/schema/symbol.yaml');
const symbolSchema = YAML.load(fs.readFileSync(symbolPath, 'utf8')) as Schema[];

const symbolGenerator = new FileGenerator(symbolSchema, symbolDestination);
symbolGenerator.generate();

const nemPath = path.join(__dirname, '/src/schema/nem.yaml');
const nemSchema = YAML.load(fs.readFileSync(nemPath, 'utf8')) as Schema[];

const nemGenerator = new FileGenerator(nemSchema, nemDestination);
nemGenerator.generate();

// Create the index.ts file
const indexContent = [`export * as Nem from './nem';`, `export * as Symbol from './symbol';`];
Helper.writeToFile('index.ts', destinationPath, indexContent, Helper.getLicense());

// Copy project files
fs.copySync(path.join(__dirname, 'src/static/project'), destinationPath);

// Copy test folder
fs.copySync(path.join(__dirname, 'src/static/test'), destinationPath + '/test');
