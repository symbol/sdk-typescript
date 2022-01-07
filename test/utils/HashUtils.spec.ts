/*
 * Copyright 2021 SYMBOL
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Converter, Hasher, HashUtils } from '@core';
import { expect } from 'chai';

describe('HashUtils', () => {
    const uint8Array = Uint8Array.of(1, 2, 3, 4);
    const buffer = Buffer.from(uint8Array);
    const string = buffer.toString();

    function assertHasher(hasher: Hasher, expectedHash: string) {
        expect(Converter.uint8ToHex(Uint8Array.from(hasher.reset().update(uint8Array).digest()))).eq(expectedHash);
        expect(Converter.uint8ToHex(Uint8Array.from(hasher.reset().update(buffer).digest()))).eq(expectedHash);
        expect(Converter.uint8ToHex(Uint8Array.from(hasher.reset().update(string).digest()))).eq(expectedHash);
    }

    function assertHash(hash: (data: Uint8Array | string) => Uint8Array, expectedHash: string) {
        expect(Converter.uint8ToHex(Uint8Array.from(hash(uint8Array)))).eq(expectedHash);
        expect(Converter.uint8ToHex(Uint8Array.from(hash(buffer)))).eq(expectedHash);
        expect(Converter.uint8ToHex(Uint8Array.from(hash(string)))).eq(expectedHash);
    }

    it('sha256 hasher', () => {
        assertHasher(HashUtils.sha256Hasher(), '966DBDCBD0E0348FAA1CCBCE5A62B8E73B0D08955D666DB82243B303D9BD9502');
    });

    it('sha256 hash', () => {
        assertHash(HashUtils.sha256Hash, '966DBDCBD0E0348FAA1CCBCE5A62B8E73B0D08955D666DB82243B303D9BD9502');
    });

    it('keccak512 hasher', () => {
        assertHasher(
            HashUtils.keccak512Hasher(),
            'B6EB21E44EA147D237E8E708427DA11EDED32C0B89371B75B35BED1076CD8E2D2F8D7775339AD1D26BFB7DA5658F20C3714A33F62F81C2935180179EC7BB1B2D',
        );
    });

    it('keccak512 hash', () => {
        assertHash(
            HashUtils.keccak512Hash,
            'B6EB21E44EA147D237E8E708427DA11EDED32C0B89371B75B35BED1076CD8E2D2F8D7775339AD1D26BFB7DA5658F20C3714A33F62F81C2935180179EC7BB1B2D',
        );
    });

    it('keccak256 hasher', () => {
        assertHasher(HashUtils.keccak256Hasher(), 'A6885B3731702DA62E8E4A8F584AC46A7F6822F4E2BA50FBA902F67B1588D23B');
    });

    it('keccak256 hash', () => {
        assertHash(HashUtils.keccak256Hash, 'A6885B3731702DA62E8E4A8F584AC46A7F6822F4E2BA50FBA902F67B1588D23B');
    });

    it('keccak256 hasher', () => {
        assertHasher(HashUtils.ripemd160Hasher(), '179BB366E5E224B8BF4CE302CEFC5744961839C5');
    });

    it('ripemd160 hash', () => {
        assertHash(HashUtils.ripemd160Hash, '179BB366E5E224B8BF4CE302CEFC5744961839C5');
    });
});
