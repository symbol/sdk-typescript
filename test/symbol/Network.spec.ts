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
import { keccak256, sha3_256 } from 'js-sha3';
import { SymbolNetwork } from '../../src/core/symbol/SymbolNetwork';

describe('Symbol Network', () => {
    it('can list all symbol netwroks', () => {
        const list = SymbolNetwork.list();
        expect(list.length).to.equal(2);
        expect(list.find((l) => l.name === 'public')).not.to.be.undefined;
        expect(list.find((l) => l.name === 'public_test')).not.to.be.undefined;
    });

    it('can create correct hasher for Symbol', () => {
        // Arrange:
        const network = new SymbolNetwork('public', 0x68, '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');
        const expected = sha3_256.arrayBuffer(network.generationHash);
        const unexpected = keccak256.arrayBuffer(network.generationHash);

        // Act:
        const hasher = network.addressHasher();
        const hash = hasher.arrayBuffer(network.generationHash);

        // Assert:
        expect(hash).to.be.deep.equal(expected);
        expect(hash).not.to.be.deep.equal(unexpected);
    });

    it('can find a symbol network by name', () => {
        const network = SymbolNetwork.findByName('public');
        expect(network).not.to.be.undefined;
        expect(network?.name).to.be.equal('public');
        expect(network?.identifier).to.be.equal(0x68);
        expect(network?.generationHash).to.be.equal('57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');
    });

    it('cannot find a symbol network by invalid name', () => {
        const network = SymbolNetwork.findByName('public!!!');
        expect(network).to.be.undefined;
    });

    it('can find a symbol network by identifier', () => {
        const network = SymbolNetwork.findByIdentifier(0x68);
        expect(network).not.to.be.undefined;
        expect(network?.name).to.be.equal('public');
        expect(network?.identifier).to.be.equal(0x68);
        expect(network?.generationHash).to.be.equal('57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');
    });

    it('cannot find a symbol network by invalid name', () => {
        const network = SymbolNetwork.findByIdentifier(0x99);
        expect(network).to.be.undefined;
    });
});
