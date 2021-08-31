import { Hasher } from '@utils';

interface INacl {
    crypto_sign_keypair_hash(publicKey: Uint8Array, reversedPrivateKey: number[], keccakHash: (data: Uint8Array) => number[]);
    crypto_sign_hash(
        signature: Uint8Array,
        keypair: {
            privateKey: number[];
            publicKey: Uint8Array;
        },
        data: Uint8Array,
        hasher: Hasher,
    );
    crypto_verify_hash(signature: Uint8Array, publicKey: Uint8Array, data: Uint8Array, hasher: Hasher);
    crypto_modL(r: Uint8Array, x: Float64Array): Uint8Array;
    crypto_sign_PUBLICKEYBYTES: number;
    crypto_sign_SECRETKEYBYTES: number;
}

/* eslint @typescript-eslint/no-var-requires: "off" */
const Ed25519: INacl = require('./nacl-fast.js').lowlevel;

export default Ed25519;
