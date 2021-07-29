import * as fs from 'fs';
import * as JSONStream from 'JSONStream';
import { join } from 'path';
/**
 * Helper class to run vector tests. Features:
 *
 * - Run test one by one or in stream mode.
 * - Limit the items for quick sanity checks (like in regular pr tests, not in main and dev branches)
 * - Remove duplicated items from vector (for sanitizing vector files in dev).
 * - Integrated with mocha
 */
export class VectorTester {
    /**
     *
     * @param streamMode - if all the tests should run in stream mode (one big test) or individuals
     * @param limit - if you want to limit the amount of items to test. Useful for quick tests like in pull request, not main branches.
     * @param patchFileBeforeRun - should remove duplicated items? (Only for development)
     */
    constructor(private readonly streamMode = true, private readonly limit = -1, private readonly patchFileBeforeRun = false) {}

    /**
     * Runs the test function for all the items in the vector file according to the configuration.
     *
     * @param vectorFile - the vector file
     * @param test - the tests of the operation.
     */
    public run = <T>(vectorFile: string, test: (item: T, index: number) => void): void => {
        if (this.patchFileBeforeRun) {
            this.patchFile(vectorFile);
        }
        if (this.streamMode) this.streamRun(vectorFile, test);
        else this.syncRun(vectorFile, test);
    };
    /**
     * Runs all the vectors tests in one test using streams of data.
     *
     * Good: large data sets.
     * Bad: first item that fails kills the test suite.
     *
     * @param vectorFileName - the vector file
     * @param test - the tests of the operation.
     */
    private streamRun = <T>(vectorFileName: string, test: (item: T, index: number) => void): void => {
        const stream = fs.createReadStream(this.resolveVectorFilePath(vectorFileName), { encoding: 'utf-8' });
        it('all items', (done) => {
            stream.pipe(
                JSONStream.parse([]).on('data', (vector) => {
                    vector.forEach((item: T, index) => {
                        if (this.limit <= 0 || index < this.limit) {
                            this.runTest(test, item, index);
                        }
                    });
                    done();
                }),
            );
        });
    };

    /**
     * Runs all the items by one one
     *
     * Good: easier to identify the failing tests.
     * Bad: large data sets as it puts them all in memory.
     *
     * @param vectorFileName - the vector file
     * @param test - the tests of the operation.
     */
    syncRun = <T>(vectorFileName: string, test: (item: T, index: number) => void): void => {
        const data = fs.readFileSync(this.resolveVectorFilePath(vectorFileName), { encoding: 'utf-8' });
        const vector: T[] = JSON.parse(data);
        (this.limit > 0 ? vector.slice(0, this.limit) : vector).forEach((item: T, index) => {
            it(`item ${index}`, () => this.runTest(test, item, index));
        });
    };

    private resolveVectorFilePath(vectorFileName: string): string {
        return join('test/vector-tests', vectorFileName);
    }

    private patchFile = <T>(vectorFile: string): void => {
        const data = fs.readFileSync(vectorFile, { encoding: 'utf-8' });
        const originalVector: T[] = JSON.parse(data);
        const vector = this.uniqBy(originalVector, JSON.stringify);
        fs.writeFileSync(vectorFile, JSON.stringify(vector, null, 2), { encoding: 'utf-8' });
    };

    private runTest = <T>(test: (item: T, index: number) => void, item: T, index: number) => {
        try {
            test(item, index);
        } catch (e) {
            console.error(`Test ${index} failed! Data is: \n${JSON.stringify(item, null, 2)}`);
            throw e;
        }
    };

    private uniqBy = <T>(a: T[], key: (T) => string) => {
        const seen = {};
        return a.filter(function (item) {
            const k = key(item);
            if (seen.hasOwnProperty(k)) {
                return false;
            }
            seen[k] = true;
            return true;
        });
    };
}
