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

/**
 * EPOCH
 */
export const SymbolMainnetEpochTime = Date.UTC(2021, 2, 16, 0, 6, 25);
export const SymbolTestnetEpochTime = Date.UTC(2021, 2, 25, 17, 56, 17);
export const SymbolMainnetEpoch = 1615853185;
export const SymbolTestnetEpoch = 1616694977;
export const Nis1MainnetEpochTime = Date.UTC(2015, 2, 29, 0, 6, 25);
export const Nis1MainnetEpoch = 1425859585;

/**
 * Network types for both Symbol & Nis1
 */
export const SymbolNetworkList = [
    {
        name: 'mainnet',
        identifier: 0x68,
        generationHash: '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6',
        epochAdjustment: SymbolMainnetEpoch,
    },
    {
        name: 'testnet',
        identifier: 0x98,
        generationHash: '3B5E1FA6445653C971A50687E75E6D09FB30481055E3990C84B25E9222DC1155',
        epochAdjustment: SymbolTestnetEpoch,
    },
];

export const Nis1NetworkList = [
    { name: 'mainnet', identifier: 0x68, epochAdjustment: Nis1MainnetEpoch },
    { name: 'testnet', identifier: 0x98, epochAdjustment: Nis1MainnetEpoch },
];

/**
 * Crypto Utilities
 */
export const Nibble_To_Char_Map = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
export const Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const Decoded_Block_Size = 5;
export const Encoded_Block_Size = 8;

/**
 * Namespace
 */
export const NamespaceConst = {
    name_pattern: /^[a-z0-9][a-z0-9-_]*$/,
};
