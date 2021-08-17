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
import { Key, SymbolAddress, SymbolNetwork } from '@core';
import { expect } from 'chai';
import { AssertNetworkAddress, BasicAddressTester } from '../../BasicAddressTest.template';

describe('Symbol Address', () => {
    // Arrange:
    const testKeyAddressPair = {
        publicKey: '2E834140FD66CF87B254A693A2C7862C819217B676D3943267156625E816EC6F',
        mainnet_address: 'NATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA34SQ33Y',
        testnet_address: 'TATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA37JGO5Q',
        decoded_testnet_address: '9826D27E1D0A26CA4E316F901E23E55C8711DB20DFD26776',
    };

    const deterministicPublicKey = Key.createFromHex(testKeyAddressPair.publicKey);
    const mainnetGenerationHash = '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6';
    const testnetGenerationHash = '3B5E1FA6445653C971A50687E75E6D09FB30481055E3990C84B25E9222DC1155';

    const testnetNetwork = new SymbolNetwork('testnet', 0x98, testnetGenerationHash);
    const mainnetNetwork = new SymbolNetwork('mainnet', 0x68, mainnetGenerationHash);

    const testnetAddress = testnetNetwork.createAddressFromPublicKey(deterministicPublicKey);

    it('correct address size', () => {
        // Act + Assert:
        expect(testnetAddress.getAddressBytes().length).to.be.equal(24);
    });

    describe('Address can create', () => {
        it('from encoded string', () => {
            // Act:
            const address = SymbolAddress.createFromString(testKeyAddressPair.testnet_address);
            // Assert:
            expect(testnetAddress).to.be.deep.equal(address);
        });

        it('from decoded string', () => {
            // Act:
            const address = SymbolAddress.createFromHex(testKeyAddressPair.decoded_testnet_address);
            // Assert:
            expect(testnetAddress).to.be.deep.equal(address);
        });

        it('from Bytes', () => {
            // Arrange:
            const addressBytes = SymbolAddress.createFromString(testKeyAddressPair.testnet_address).getAddressBytes();
            // Act:
            const symbolAddress = SymbolAddress.createFromBytes(addressBytes);
            // Assert:
            expect(testnetAddress).to.be.deep.equal(symbolAddress);
        });
    });

    describe('Address can verify', () => {
        it('valid address', () => {
            // Act + Assert:
            expect(SymbolAddress.isValid(testKeyAddressPair.testnet_address)).to.be.true;
        });

        it('invalid address', () => {
            // Arrange:
            const invalidAddress = 'NATNE9Q5BITMUTRRN6IB4I7FLSDRDWZA34SQ33Y';
            // Act + Assert:
            expect(SymbolAddress.isValid(invalidAddress)).to.be.false;
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
