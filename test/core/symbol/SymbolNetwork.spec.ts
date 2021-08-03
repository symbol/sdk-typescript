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

import { SymbolNetwork } from '@core';
import { expect } from 'chai';
import { keccak256, sha3_256 } from 'js-sha3';
import { BasicNetworkTester } from '../../BasicNetworkTest.template';

describe('Symbol Network', () => {
    // Arrange:
    const networks = [
        new SymbolNetwork('public', 0x68, '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6'),
        new SymbolNetwork('public_test', 0x98, '3B5E1FA6445653C971A50687E75E6D09FB30481055E3990C84B25E9222DC1155'),
    ];

    describe('correct networks are registered', () => {
        it('predefined network', () => {
            // Assert:
            expect(['public', 'public_test']).to.be.deep.equal(networks.map((n) => n.name));
            expect(networks.length).to.be.equal(2);
        });

        it('mainnet', () => {
            BasicNetworkTester(networks[0], 'public', 0x68);

            // Assert:
            expect(networks[0].generationHash).to.be.equal('57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');
        });

        it('testnet', () => {
            BasicNetworkTester(networks[1], 'public_test', 0x98);

            // Assert:
            expect(networks[1].generationHash).to.be.equal('3B5E1FA6445653C971A50687E75E6D09FB30481055E3990C84B25E9222DC1155');
        });
    });

    describe('Network finder', () => {
        it('can find well known network by name', () => {
            // Act:
            const mainnet = SymbolNetwork.findByName(networks, 'public');
            const testnet = SymbolNetwork.findByName(networks, 'public_test');

            // Assert:
            expect(mainnet).not.to.be.undefined;
            expect(mainnet).to.be.deep.equal(networks[0]);
            expect(testnet).not.to.be.undefined;
            expect(testnet).to.be.deep.equal(networks[1]);
        });

        it('cannot find other network by name', () => {
            // Act:
            const foo = SymbolNetwork.findByName(networks, 'foo');

            // Assert:
            expect(foo).to.be.undefined;
        });

        it('can find well known network by identifier', () => {
            // Act:
            const mainnet = SymbolNetwork.findByIdentifier(networks, 0x68);
            const testnet = SymbolNetwork.findByIdentifier(networks, 0x98);

            // Assert:
            expect(mainnet).not.to.be.undefined;
            expect(mainnet).to.be.deep.equal(networks[0]);
            expect(testnet).not.to.be.undefined;
            expect(testnet).to.be.deep.equal(networks[1]);
        });

        it('cannot find other network by identifier', () => {
            // Act:
            const foo = SymbolNetwork.findByIdentifier(networks, 0x00);

            // Assert:
            expect(foo).to.be.undefined;
        });
    });

    describe('Address Hasher', () => {
        it('can create correct hasher', () => {
            // Arrange:
            const expected = sha3_256.arrayBuffer(networks[0].generationHash);
            const unexpected = keccak256.arrayBuffer(networks[0].generationHash);

            // Act:
            const hasher = networks[0].addressHasher();
            const hash = hasher.arrayBuffer(networks[0].generationHash);

            // Assert:
            expect(hash).to.be.deep.equal(expected);
            expect(hash).not.to.be.deep.equal(unexpected);
        });
    });

    describe('Get Networks', () => {
        it('can get correct network list', () => {
            // Act:
            const list = SymbolNetwork.list();

            // Assert:
            expect(networks).to.be.deep.equal(list);
            expect(networks.length).to.be.equal(2);
        });
    });
});
