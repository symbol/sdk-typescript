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
import { keccak256, sha3_256 } from 'js-sha3';
import { BasicNetworkTester } from '../../BasicNetworkTest.template';

describe('NIS1 Network', () => {
    // Arrange:
    const networks = [new Nis1Network('mainnet', 0x68), new Nis1Network('testnet', 0x98)];

    describe('correct networks are registered', () => {
        it('predefined network', () => {
            // Assert:
            expect(['mainnet', 'testnet']).to.be.deep.equal(networks.map((n) => n.name));
            expect(networks.length).to.be.equal(2);
        });

        it('mainnet', () => {
            BasicNetworkTester(networks[0], 'mainnet', 0x68);
        });

        it('testnet', () => {
            BasicNetworkTester(networks[1], 'testnet', 0x98);
        });
    });

    describe('Network finder', () => {
        it('can find well known network by name', () => {
            // Act:
            const mainnet = Nis1Network.findByName(networks, 'mainnet');
            const testnet = Nis1Network.findByName(networks, 'testnet');

            // Assert:
            expect(mainnet).not.to.be.undefined;
            expect(mainnet).to.be.deep.equal(networks[0]);
            expect(testnet).not.to.be.undefined;
            expect(testnet).to.be.deep.equal(networks[1]);
        });

        it('cannot find other network by name', () => {
            // Act:
            const foo = Nis1Network.findByName(networks, 'foo');

            // Assert:
            expect(foo).to.be.undefined;
        });

        it('can find well known network by identifier', () => {
            // Act:
            const mainnet = Nis1Network.findByIdentifier(networks, 0x68);
            const testnet = Nis1Network.findByIdentifier(networks, 0x98);

            // Assert:
            expect(mainnet).not.to.be.undefined;
            expect(mainnet).to.be.deep.equal(networks[0]);
            expect(testnet).not.to.be.undefined;
            expect(testnet).to.be.deep.equal(networks[1]);
        });

        it('cannot find other network by identifier', () => {
            // Act:
            const foo = Nis1Network.findByIdentifier(networks, 0x00);

            // Assert:
            expect(foo).to.be.undefined;
        });
    });

    describe('Address Hasher', () => {
        it('can create correct hasher', () => {
            // Arrange:
            const randomHash = crypto.randomBytes(32);
            const expected = keccak256.arrayBuffer(randomHash);
            const unexpected = sha3_256.arrayBuffer(randomHash);

            // Act:
            const hasher = networks[0].addressHasher();
            const hash = hasher.arrayBuffer(randomHash);

            // Assert:
            expect(hash).to.be.deep.equal(expected);
            expect(hash).not.to.be.deep.equal(unexpected);
        });
    });

    describe('Get Networks', () => {
        it('can get correct network list', () => {
            // Act:
            const list = Nis1Network.list();

            // Assert:
            expect(networks).to.be.deep.equal(list);
            expect(networks.length).to.be.equal(2);
        });
    });
});
