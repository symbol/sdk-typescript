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
import { toBufferLE } from 'bigint-buffer';
import { expect } from 'chai';
import * as fs from 'fs';
import * as JSONStream from 'JSONStream';
import * as path from 'path';
import { SymbolAddress, SymbolNetwork } from '../../src/core/symbol';
import { SymbolIdGenerator } from '../../src/core/symbol/SymbolIdGenerator';

describe('Symbol IdGenerator - TestVector', () => {
    const testAccount = {
        publicKey: '2E834140FD66CF87B254A693A2C7862C819217B676D3943267156625E816EC6F',
        address: 'NATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA34SQ33Y',
    };

    it('Can generate mosaic id', (done) => {
        const stream = fs.createReadStream(path.join(__dirname, '../test-vector/5.test-mosaic-id.json'), { encoding: 'utf-8' });
        stream.pipe(
            JSONStream.parse([]).on('data', (data) => {
                //Arrange
                const networkList = SymbolNetwork.list();
                networkList.forEach((n) => {
                    const network = new SymbolNetwork(n.name, n.identifier, n.generationHash);
                    //Load test vector addresses
                    data.forEach((a) => {
                        const netwrokName = n.name.charAt(0).toUpperCase() + n.name.slice(1);
                        const addressKeyName = `address_${netwrokName}`.replace('_t', 'T');
                        const mosaicKeyName = `mosaicId_${netwrokName}`.replace('_t', 'T');
                        const address = SymbolAddress.createFromString(a[addressKeyName]);
                        const mosaicId = SymbolIdGenerator.generateMosaicId(
                            address.getAddressBytes(),
                            toBufferLE(BigInt(a['mosaicNonce']), 4),
                        );
                        //Act
                        expect(a[mosaicKeyName]).to.be.equal(mosaicId.toString(16).toLocaleUpperCase().padStart(16, '0'));
                    });
                });
                done();
            }),
        );
    });
});
