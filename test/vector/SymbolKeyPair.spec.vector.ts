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
import { SymbolKeyPair } from '../../src/core/symbol';
import { Converter } from '../../src/core/utils';

describe('key pair - TestVector', () => {
    describe('construction', () => {
        it('can extract from private key test vectors', (done) => {
            const stream = fs.createReadStream(path.join(__dirname, '../test-vector/1.test-keys.json'), { encoding: 'utf-8' });
            stream.pipe(
                JSONStream.parse([]).on('data', (data) => {
                    data.forEach((kp) => {
                        // Act:
                        const keyPair = new SymbolKeyPair(Key.createFromHex(kp.privateKey));
                        // Assert:
                        const message = ` from ${kp.privateKey}`;
                        expect(keyPair.PublicKey.toString(), `public ${message}`).equal(kp.publicKey);
                        expect(keyPair.PrivateKey.toString(), `private ${message}`).equal(kp.privateKey);
                    });
                    done();
                }),
            );
        });
    });

    describe('sign & verify- Test Vector', () => {
        it('sign', (done) => {
            const stream = fs.createReadStream(path.join(__dirname, '../test-vector/2.test-sign.json'), { encoding: 'utf-8' });
            stream.pipe(
                JSONStream.parse([]).on('data', (data) => {
                    data.forEach((s) => {
                        // Arrange:
                        const keyPair = new SymbolKeyPair(Key.createFromHex(s.privateKey));
                        const payload = Converter.hexToUint8(s.data);

                        // Act:
                        const signature = keyPair.sign(payload);

                        // Assert:
                        const message = ` from ${s.privateKey}`;
                        expect(Converter.uint8ToHex(signature).toUpperCase(), `private ${message}`).to.deep.equal(s.signature);
                        const isVerified = keyPair.verify(payload, signature);
                        expect(isVerified, `private ${message}`).to.equal(true);
                    });
                    done();
                }),
            );
        });
    });
});
