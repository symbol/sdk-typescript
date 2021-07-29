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
import { expect } from 'chai';
import * as fs from 'fs';
import * as JSONStream from 'JSONStream';
import * as path from 'path';
import { Key } from '../../src/core/Key';
import { SymbolAddress, SymbolNetwork } from '../../src/core/symbol';

describe('Address - TestVector', () => {
    it('can create address from publickey', (done) => {
        const stream = fs.createReadStream(path.join(__dirname, '../test-vector/1.test-address.json'), { encoding: 'utf-8' });
        stream.pipe(
            JSONStream.parse([]).on('data', (data) => {
                //Arrange
                const networkList = SymbolNetwork.list();
                networkList.forEach((n) => {
                    const network = new SymbolNetwork(n.name, n.identifier, n.generationHash);
                    //Load test vector addresses
                    data.forEach((a) => {
                        const netwrokName = n.name.charAt(0).toUpperCase() + n.name.slice(1);
                        const keyName = `address_${netwrokName}`.replace('_t', 'T');
                        const rawAddress = network.createAddressFromPublicKey(Key.createFromHex(a.publicKey));
                        //Act
                        expect(a[keyName]).to.be.equal(new SymbolAddress(rawAddress).encoded);
                    });
                });
                done();
            }),
        );
    });
});
