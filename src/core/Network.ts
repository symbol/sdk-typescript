import ripemd160 = require('ripemd160');
import { Keccak, SHA3 } from 'sha3';
import { Address, RawAddress } from './Address';
import { Converter } from './utils/Converter';

export abstract class Network {
    /**
     * Constructor
     * @param {string} name Network name
     * @param {number} identifier Network identifier
     */
    constructor(public readonly name: string, public readonly identifier: number) {}

    /**
     * Generate raw address bytes and chechsum from public key.
     * @param {string} publicKey Public key
     * @returns {RawAddress}
     */
    public generateFromPublicKey(publicKey: string): RawAddress {
        const publicKeyBytes = Converter.hexToUint8(publicKey);
        // step 1: sha3 hash of the public key
        const publicKeyHash = this.addressHasher().update(Buffer.from(publicKeyBytes));

        // step 2: ripemd160 hash of (1)
        const ripemd160Hash = new ripemd160().update(publicKeyHash.digest()).digest();

        // step 3: add network identifier byte in front of (2)
        const addressWithoutChecksum = new Uint8Array(ripemd160Hash.length + 1);
        addressWithoutChecksum.set(Uint8Array.of(this.identifier), 0);
        addressWithoutChecksum.set(ripemd160Hash, 1);

        // step 4: concatenate (3) and the checksum of (3)
        const hash = this.addressHasher().update(Buffer.from(addressWithoutChecksum)).digest();
        const checksum = hash.subarray(0, 4);

        return { addressWithoutChecksum, checksum };
    }

    /**
     * Abstract method to create Address object
     * @param {RawAddress} rawAddress Address buffer
     * @returns {Address}
     */
    public abstract createAddress(rawAddress: RawAddress): Address;

    /**
     * Abstract method to create address object from encoded address
     * @param {string} encodedAddress Encoded address
     * @returns {Address}
     */
    public abstract createAddressFromEncoded(encodedAddress: string): Address;

    /**
     * Abstract method to gets the primary hasher to use in the public key to address conversion.
     * @returns {SHA3 | Keccak}
     */
    public abstract addressHasher(): SHA3 | Keccak;

    /**
     * Abstract method to get network by its name
     * @param {string} name Network name
     * @returns {Network}
     */
    public abstract findByName(name: string): Network | undefined;

    /**
     * Abstract method to get network by its identifier
     * @param {number} identifier Network identifier
     * @returns {Network}
     */
    public abstract findByIdentifier(identifier: number): Network | undefined;
}
