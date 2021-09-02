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

import { Key, NemAddress, NemNetwork } from '@core';
import { expect } from 'chai';
import { AssertNetworkAddress, BasicAddressTester } from '../../BasicAddressTest.template';

describe('Nem Address', () => {
    // Arrange:
    const testKeyAddressPair = {
        publicKey: 'C5F54BA980FCBB657DBAAA42700539B207873E134D2375EFEAB5F1AB52F87844',
        mainnet_address: 'NDD2CT6LQLIYQ56KIXI3ENTM6EK3D44P5JFXJ4R4',
        testnet_address: 'TDD2CT6LQLIYQ56KIXI3ENTM6EK3D44P5KZPFMK2',
        decoded_testnet_address: '98C7A14FCB82D18877CA45D1B2366CF115B1F38FEAB2F2B15A',
    };

    const deterministicPublicKey = Key.createFromHex(testKeyAddressPair.publicKey);

    const testnetNetwork = new NemNetwork('testnet', 0x98);
    const mainnetNetwork = new NemNetwork('mainnet', 0x68);

    const testnetAddress = testnetNetwork.createAddressFromPublicKey(deterministicPublicKey);

    it('correct address size', () => {
        // Act + Assert:
        expect(testnetAddress.getAddressBytes().length).to.be.equal(25);
    });

    describe('Address can create', () => {
        it('from encoded string', () => {
            // Act:
            const address = NemAddress.createFromString(testKeyAddressPair.testnet_address);
            // Assert:
            expect(testnetAddress).to.be.deep.equal(address);
        });

        it('from decoded string', () => {
            // Act:
            const address = NemAddress.createFromHex(testKeyAddressPair.decoded_testnet_address);
            // Assert:
            expect(testnetAddress).to.be.deep.equal(address);
        });

        it('from Bytes', () => {
            // Arrange:
            const addressBytes = NemAddress.createFromString(testKeyAddressPair.testnet_address).getAddressBytes();
            // Act:
            const nemAddress = NemAddress.createFromBytes(addressBytes);
            // Assert:
            expect(testnetAddress).to.be.deep.equal(nemAddress);
        });
    });

    describe('Address can verify', () => {
        it('valid address', () => {
            // Act + Assert:
            expect(NemAddress.isValid(testKeyAddressPair.testnet_address)).to.be.true;
        });

        it('invalid address', () => {
            // Arrange:
            const invalidAddress = 'NATNE9Q5BITMUTRRN6IB4I7FLSDRDWZA34SQ33Y';
            // Act + Assert:
            expect(NemAddress.isValid(invalidAddress)).to.be.false;
        });
    });

    describe('Basic Address', () => {
        BasicAddressTester(testnetAddress, testKeyAddressPair.testnet_address, testKeyAddressPair.decoded_testnet_address);
    });

    describe('Convert Public Key to network address', () => {
        describe('mainnet', () => {
            // Act:
            const address = mainnetNetwork.createAddressFromPublicKey(deterministicPublicKey);
            // Assert:
            AssertNetworkAddress(address, testKeyAddressPair.mainnet_address);
        });
        describe('testnet', () => {
            // Assert:
            AssertNetworkAddress(testnetAddress, testKeyAddressPair.testnet_address);
        });
    });
});
