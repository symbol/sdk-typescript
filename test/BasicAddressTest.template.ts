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

import { Address } from '@core';
import { expect } from 'chai';

export const BasicAddressTester = (address: Address, encodedAddress: string, decodedAddress: string): void => {
    it('can return encoded address', () => {
        // Act + Assert:
        expect(address.encoded).to.be.equal(encodedAddress);
    });

    it('can return decoded address', () => {
        // Act + Assert:
        expect(address.decode).to.be.equal(decodedAddress);
    });

    it('can compare with other address', () => {
        // Act + Assert:
        expect(address.equals(encodedAddress)).to.be.true;
        expect(address.equals(decodedAddress)).to.be.false;
    });

    it('can return encoded address by calling toString', () => {
        // Act + Assert:
        expect(address.toString()).to.be.equal(address.encoded);
    });
};

export const AssertNetworkAddress = (address: Address, expectedAddress: string): void => {
    it('can create network address from public key', () => {
        // Assert:
        expect(address.encoded).to.be.deep.equal(expectedAddress);
    });
};
