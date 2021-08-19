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

import { Nis1Network } from '@core';
import { expect } from 'chai';
import * as crypto from 'crypto';
import { keccak256 } from 'js-sha3';
import { assertNetwork, basicNetworkTester } from '../../BasicNetworkTest.template';

describe('Nis1 Network', () => {
    describe('Network Constructor', () => {
        // Act:
        const network = new Nis1Network('testnet', 0x98);

        // Assert:
        assertNetwork(network, 'testnet', 0x98);
    });

    describe('Correct networks are registered', () => {
        it('predefined network', () => {
            // Act:
            const networks = Nis1Network.list();

            // Assert:
            expect(['mainnet', 'testnet']).to.be.deep.equal(networks.map((n) => n.name));
            assertNetwork(networks[0], 'mainnet', 0x68);
            assertNetwork(networks[1], 'testnet', 0x98);
        });
    });

    describe('Address Hasher', () => {
        it('can create correct hasher', () => {
            // Arrange:
            const network = new Nis1Network('testnet', 0x98);
            const randomHash = crypto.randomBytes(32);
            const expected = keccak256.arrayBuffer(randomHash);

            // Act:
            const hasher = network.addressHasher();
            const hash = hasher.arrayBuffer(randomHash);

            // Assert:
            expect(hash).to.be.deep.equal(expected);
        });
    });

    describe('Network finder', () => {
        // Arrange:
        const networks = Nis1Network.list();

        describe('Assert first network', () => {
            basicNetworkTester(networks, 'mainnet', 0x68);
        });

        describe('Assert second network', () => {
            basicNetworkTester(networks, 'testnet', 0x98);
        });
    });
});
