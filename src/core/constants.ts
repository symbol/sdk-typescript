/**
 * Network types for both Symbol & NIS1
 */
export const SymbolNetworkList = [
    { name: 'public', identifier: 0x68, generationHash: '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6' },
    { name: 'private', identifier: 0x78, generationHash: '' },
    { name: 'public_test', identifier: 0x98, generationHash: '3B5E1FA6445653C971A50687E75E6D09FB30481055E3990C84B25E9222DC1155' },
    { name: 'private_test', identifier: 0xa8, generationHash: '' },
];

export const NIS1NetworkList = [
    { name: 'mainnet', identifier: 0x68 },
    { name: 'testnet', identifier: 0x98 },
];

/**
 * Crypto Utilities
 */
export const Nibble_To_Char_Map = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
export const Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const Decoded_Block_Size = 5;
export const Encoded_Block_Size = 8;

/**
 * EPOCH
 */
export const SymbolPulblicNetworkEpochTime = Date.UTC(2021, 3, 16, 0, 6, 25);
export const SymbolPublicNetworkEpoch = 1615853185;
export const Nis1MainnetEpochTime = Date.UTC(2015, 3, 29, 0, 6, 25);
