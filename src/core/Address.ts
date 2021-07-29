import { sha3_256 } from 'js-sha3';
import { SymbolAddress } from './symbol/SymbolAddress';
import { Converter } from './utils';
import { Base32 } from './utils/Base32';

export interface RawAddress {
    addressWithoutChecksum: Uint8Array;
    checksum: Uint8Array;
}

export abstract class Address {
    constructor(public readonly rawAddress: RawAddress) {}

    /**
     * Ge address bytes
     * @returns {Uint8Array}
     */
    public abstract getAddressBytes(): Uint8Array;

    /**
     * Get address in the encoded format ex: NAR3W7B4BCOZSZMFIZRYB3N5YGOUSWIYJCJ6HDFH.
     * @returns {string}
     */
    public get encoded(): string {
        const padded = new Uint8Array(25);
        const bytes = this.getAddressBytes();
        padded.set(bytes);
        return bytes.length === 25 ? Base32.Base32Encode(padded) : Base32.Base32Encode(padded).slice(0, -1);
    }

    /**
     * Get address in plain format ex: SB3KUBHATFCPV7UZQLWAQ2EUR6SIHBSBEOEDDDF3.
     * @returns {string}
     */
    public get decode(): string {
        return Converter.uint8ToHex(this.getAddressBytes());
    }

    /**
     * Get address in pretty format ex: SB3KUB-HATFCP-V7UZQL-WAQ2EU-R6SIHB-SBEOED-DDF3.
     * @returns {string}
     */
    public pretty(): string {
        return this.encoded.match(/.{1,6}/g)!.join('-');
    }

    /**
     * Compares addresses for equality
     * @param address - Address to compare
     * @returns {boolean}
     */
    public equals(address: string): boolean {
        return this.encoded.toUpperCase() === address.toUpperCase();
    }

    /**
     * Retun encoded address string.
     * @returns {string} Encoded address string
     */
    public toString(): string {
        return this.encoded;
    }

    /**
     * Determines the validity of an raw address string.
     * @param {string} rawAddress The raw address string. Expected format VATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA35C4KNQ
     * @returns {boolean} true if the raw address string is valid, false otherwise.
     */
    public static isValid(encodedAddress: string): boolean {
        const isSymbol = encodedAddress.length === 39;
        if (isSymbol) {
            if (!['A', 'I', 'Q', 'Y'].includes(encodedAddress.slice(-1).toUpperCase())) {
                return false;
            }
            try {
                const address = SymbolAddress.createFromString(encodedAddress);
                const hasher = sha3_256.create();
                const hash = hasher.update(Buffer.from(address.rawAddress.addressWithoutChecksum)).digest();
                return Converter.uint8ToHex(new Uint8Array(hash).subarray(0, 3)) === Converter.uint8ToHex(address.rawAddress.checksum);
            } catch {
                return false;
            }
        }
        // TODO: Implement NIS1 Logic here
        return false;
    }
}
