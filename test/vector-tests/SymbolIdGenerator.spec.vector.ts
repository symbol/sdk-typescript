/*
 * Copyright 2021 SYMBOL
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { SymbolAddress, SymbolIdGenerator, SymbolNetwork } from '@core';
import { toBufferLE } from 'bigint-buffer';
import { expect } from 'chai';
import * as fs from 'fs';
import * as JSONStream from 'JSONStream';
import * as path from 'path';

describe('Symbol IdGenerator - TestVector', () => {
    it('Can generate mosaic id', (done) => {
        const stream = fs.createReadStream(path.join(__dirname, '../test-vector/5.test-mosaic-id.json'), { encoding: 'utf-8' });
        stream.pipe(
            JSONStream.parse([]).on('data', (vector) => {
                // Arrange:
                const networkList = SymbolNetwork.list();
                networkList.forEach((network) => {
                    //Load test vector addresses
                    vector.forEach((item: { [x: string]: any }) => {
                        const networkName = network.name.charAt(0).toUpperCase() + network.name.slice(1);
                        const addressKeyName = `address_${networkName}`.replace('_t', 'T');
                        const mosaicKeyName = `mosaicId_${networkName}`.replace('_t', 'T');
                        const address = SymbolAddress.createFromString(item[addressKeyName]);

                        // Act:
                        const mosaicId = SymbolIdGenerator.generateMosaicId(address, toBufferLE(BigInt(item['mosaicNonce']), 4));

                        // Assert:
                        expect(item[mosaicKeyName]).to.be.equal(mosaicId.toString(16).toLocaleUpperCase().padStart(16, '0'));
                    });
                });
                done();
            }),
        );
    });
});
