import * as assert from 'assert';
import * as fs from 'fs';
import * as YAML from 'js-yaml';
import * as path from 'path';
import * as builders from '../src/symbol';

interface BuilderTestItem {
    filename: string;
    builder: string;
    payload: string;
    comment: string;
}

const fromHexString = (hexString: string) => new Uint8Array((hexString.match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16)));

const toHexString = (bytes: Uint8Array) => bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '').toUpperCase();

const vectorDirectory = path.join(__dirname, 'vector/symbol');
const files = fs.readdirSync(vectorDirectory);

const items: BuilderTestItem[] = files
    .map((filename) => {
        const yamlText = fs.readFileSync(vectorDirectory + '/' + filename, 'utf8');
        const yamlList = YAML.load(yamlText);
        return yamlList.map((a: BuilderTestItem) => {
            const builder = a.builder;
            return {
                ...a,
                builder: builder,
                filename,
            } as BuilderTestItem;
        });
    })
    .reduce((acc, val) => acc.concat(val), []);

describe('serialize', function () {
    items.forEach((item) => {
        const stringPayload = item.payload + '';
        it(item.filename + ' - ' + item.builder + ' - ' + (item.comment || stringPayload), function () {
            const builderClass = (<any>builders)[item.builder];
            const serializer = builderClass.deserialize(fromHexString(stringPayload));
            assert.equal(toHexString(serializer.serialize()), stringPayload.toUpperCase());
            assert.equal(serializer.size, stringPayload.length / 2);
        });
    });
});
