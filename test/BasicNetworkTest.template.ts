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

import { Network } from '@core';
import { expect } from 'chai';

export const assertNetwork = (network: Network | undefined, expectedName: string, expectedIdentifier: number): void => {
    // Assert:
    if (!network) {
        throw new Error(`There is not network with name ${expectedName}`);
    }
    expect(network.name).to.be.equal(expectedName);
    expect(network.identifier).to.be.equal(expectedIdentifier);
};

export const basicNetworkTester = <T extends Network>(networks: readonly T[], name: string, identifier: number): void => {
    it('can find well known network by name', () => {
        // Act:
        const network = Network.findByName(networks, name);

        // Assert:
        assertNetwork(network, name, identifier);
    });

    it('cannot find other network given name not exist', () => {
        // Act:
        const foo = Network.findByName(networks, '0x00');

        // Assert:
        expect(foo).to.be.undefined;
    });

    it('can find well known network by identifier', () => {
        // Act:
        const network = Network.findByIdentifier(networks, identifier);

        // Assert:
        assertNetwork(network, name, identifier);
    });

    it('cannot find other network given identifier not exist', () => {
        // Act:
        const foo = Network.findByIdentifier(networks, 0x00);

        // Assert:
        expect(foo).to.be.undefined;
    });
};
