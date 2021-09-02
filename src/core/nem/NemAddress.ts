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

import { Address, RawAddress } from '@core';
import { arrayDeepEqual, Base32, Converter } from '@utils';
import { keccak256 } from 'js-sha3';

/**
 * The address structure describes an address with its network
 */
export class NemAddress extends Address {
    /**
     * Constructor
     *
     * @param rawAddress - Raw address bytes
     */
    constructor(rawAddress: RawAddress) {
        super(rawAddress);
    }

    /**
     * Get the raw address byte with checksum bytes for Nem Address
     *
     * @returns Address bytes
     */
    public getAddressBytes(): Uint8Array {
        const { addressWithoutChecksum, checksum } = this.rawAddress;
        const address = new Uint8Array(addressWithoutChecksum.length + 4);
        address.set(addressWithoutChecksum, 0);
        address.set(checksum.subarray(0, 4), addressWithoutChecksum.length);
        return address;
    }

    /**
     * Create Nem Address object from encoded address string
     *
     * @param encodedAddress - Encoded address
     * @returns NemAddress object
     */
    public static createFromString(encodedAddress: string): NemAddress {
        const decoded = Base32.Base32Decode(encodedAddress);
        return new NemAddress({
            addressWithoutChecksum: decoded.subarray(0, 21),
            checksum: decoded.subarray(21, 25),
        });
    }

    /**
     * Create Nem Address object from encoded address bytes
     *
     * @param addressBytes - address bytes
     * @returns NemAddress object
     */
    public static createFromBytes(addressBytes: Uint8Array): NemAddress {
        const padded = new Uint8Array(25);
        padded.set(addressBytes);
        return new NemAddress({
            addressWithoutChecksum: padded.subarray(0, 21),
            checksum: padded.subarray(21, 25),
        });
    }

    /**
     * Create Nem Address object from decoded
     *
     * @param addressHex - address hex string
     * @returns NemAddress object
     */
    public static createFromHex(addressHex: string): NemAddress {
        const bytes = Converter.hexToUint8(addressHex);
        return NemAddress.createFromBytes(bytes);
    }

    /**
     * Determines the validity of an raw address string.
     *
     * @param encodedAddress - The raw address string. Expected format TAZJ3KEPYAQ4G4Y6Q2IRZTQPU7RAKGYZULZURKTO
     * @returns true if the raw address string is valid, false otherwise.
     */
    public static isValid(encodedAddress: string): boolean {
        const formatAddress = encodedAddress.toUpperCase().replace(/-/g, '');

        if (formatAddress.length !== 40) {
            return false;
        }

        try {
            const { rawAddress } = NemAddress.createFromString(formatAddress);
            const hasher = keccak256.create();
            const hash = hasher.update(rawAddress.addressWithoutChecksum).arrayBuffer();
            return arrayDeepEqual(new Uint8Array(hash).subarray(0, 4), rawAddress.checksum);
        } catch (e) {
            return false;
        }
    }
}
