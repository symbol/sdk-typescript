import { Hasher } from '@utils';

/**
 * Custom nacl-fast library, it use for NEM.
 */
interface INacl {
    /**
     * Derive public key from private key based on the hash function.
     * @param publicKey - The public key.
     * @param privateKey - The private key.
     * @param hashFunc - Hash function use to hash the private key.
     */
    crypto_sign_keypair(publicKey: Uint8Array, privateKey: number[], hashFunc: (data: Uint8Array) => Uint8Array): void;
    /**
     * Signs a data buffer with a key pair based on the hasher.
     * @param signature - The new signature bytes.
     * @param keypair - A keypair.
     * @param data - The data to sign.
     * @param hasher - Hasher function example KeccakHasher.
     */
    crypto_sign_hash(
        signature: Uint8Array,
        keypair: {
            privateKey: number[];
            publicKey: Uint8Array;
        },
        data: Uint8Array,
        hasher: Hasher,
    );
    /**
     * Verifies a signature.
     * @param signature - The signature to verify.
     * @param publicKey - The public key.
     * @param data - The data to verify.
     * @param hasher - Hasher function example KeccakHasher.
     */
    crypto_verify_hash(signature: Uint8Array, publicKey: Uint8Array, data: Uint8Array, hasher: Hasher): boolean;
    /**
     * Derive a shared key from private key based on the hash function.
     * @param shared - shared secret.
     * @param publicKey - The public key.
     * @param privateKey - The private key.
     * @param hashFunc - Hash function use to hash the private key.
     */
    crypto_shared_key(shared: Uint8Array, publicKey: Uint8Array, privateKey: number[], hashFunc: (data: Uint8Array) => Uint8Array): void;
    crypto_modL(r: Uint8Array, x: Float64Array): Uint8Array;
    /* number of public key bytes */
    crypto_sign_PUBLICKEYBYTES: number;
}

/* eslint @typescript-eslint/no-var-requires: "off" */
const Ed25519: INacl = require('./nacl-fast.js').lowlevel;

export default Ed25519;
