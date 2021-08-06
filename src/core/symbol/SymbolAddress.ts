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
import { Base32, Converter } from '@utils';

/**
 * The address structure describes an address with its network
 */
export class SymbolAddress extends Address {
    /**
     * Constructor
     *
     * @param rawAddress - Raw address bytes
     */
    constructor(rawAddress: RawAddress) {
        super(rawAddress);
    }

    /**
     * Get the raw address byte with checksum bytes for Symbol Address
     *
     * @returns Address bytes
     */
    public getAddressBytes(): Uint8Array {
        const address = new Uint8Array(this.rawAddress.addressWithoutChecksum.length + 3);
        address.set(this.rawAddress.addressWithoutChecksum, 0);
        address.set(this.rawAddress.checksum.subarray(0, 3), this.rawAddress.addressWithoutChecksum.length);
        return address;
    }

    /**
     * Create SymbolAddress object from encoded address string
     *
     * @param encodedAddress - Encoded address
     * @returns SymbolAddress object
     */
    public static createFromString(encodedAddress: string): SymbolAddress {
        const decoded = Base32.Base32Decode(`${encodedAddress}A`).subarray(0, 24);
        return new SymbolAddress({
            addressWithoutChecksum: decoded.subarray(0, 21),
            checksum: decoded.subarray(21, 24),
        });
    }

    /**
     * Create SymbolAddress object from encoded address bytes
     *
     * @param addressBytes - address bytes
     * @returns SymbolAddress object
     */
    public static createFromBytes(addressBytes: Uint8Array): SymbolAddress {
        const padded = new Uint8Array(25);
        padded.set(addressBytes);
        return new SymbolAddress({
            addressWithoutChecksum: padded.subarray(0, 21),
            checksum: padded.subarray(21, 24),
        });
    }

    /**
     * Create SymbolAddress object from decoded
     *
     * @param addressHex - address hex string
     * @returns SymbolAddress object
     */
    public static createFromHex(addressHex: string): SymbolAddress {
        const bytes = Converter.hexToUint8(addressHex);
        return SymbolAddress.createFromBytes(bytes);
    }
}
