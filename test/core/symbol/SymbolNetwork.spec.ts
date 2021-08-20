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
import { sha3_256 } from 'js-sha3';
import { assertNetwork, basicNetworkTester } from '../../BasicNetworkTest.template';

describe('Symbol Network', () => {
    const mainnetGenerationHash = '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6';
    const testnetGenerationHash = '3B5E1FA6445653C971A50687E75E6D09FB30481055E3990C84B25E9222DC1155';

    describe('Network Constructor', () => {
        // Arrange:
        const network = new SymbolNetwork('mainnet', 0x68, mainnetGenerationHash);

        // Assert:
        expect(network.generationHash).to.be.equal(mainnetGenerationHash);
        assertNetwork(network, 'mainnet', 0x68);
    });

    describe('Correct networks are registered', () => {
        it('predefined network', () => {
            // Act:
            const networks = SymbolNetwork.list();

            // Assert:
            expect(['mainnet', 'testnet']).to.be.deep.equal(networks.map((n) => n.name));
            assertNetwork(networks[0], 'mainnet', 0x68);
            expect(networks[0].generationHash).to.be.equal(mainnetGenerationHash);
            assertNetwork(networks[1], 'testnet', 0x98);
            expect(networks[1].generationHash).to.be.equal(testnetGenerationHash);
        });
    });

    describe('Address Hasher', () => {
        it('can create correct hasher', () => {
            // Arrange:
            const network = new SymbolNetwork('mainnet', 0x68, mainnetGenerationHash);
            const expected = sha3_256.arrayBuffer(network.generationHash);

            // Act:
            const hasher = network.addressHasher();
            const hash = hasher.arrayBuffer(network.generationHash);

            // Assert:
            expect(hash).to.be.deep.equal(expected);
        });
    });

    describe('Network finder', () => {
        // Arrange:
        const networks = SymbolNetwork.list();

        describe('Assert first network', () => {
            basicNetworkTester(networks, 'mainnet', 0x68);
        });

        describe('Assert second network', () => {
            basicNetworkTester(networks, 'testnet', 0x98);
        });
    });
});
