/*
 * Copyright 2019 NEM
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

import { Decoded_Block_Size, Encoded_Block_Size } from '@core';
import * as utilities from './Utilities';

export class Base32 {
    /**
     * Base32 encodes a binary buffer.
     *
     * @param data - The binary data to encode.
     * @returns The base32 encoded string corresponding to the input data.
     */
    public static Base32Encode = (data: Uint8Array): string => {
        if (0 !== data.length % Decoded_Block_Size) {
            throw Error(`decoded size must be multiple of ${Decoded_Block_Size}`);
        }
        const output = new Array((data.length / Decoded_Block_Size) * Encoded_Block_Size);
        for (let i = 0; i < data.length / Decoded_Block_Size; ++i) {
            utilities.encodeBlock(data, i * Decoded_Block_Size, output, i * Encoded_Block_Size);
        }
        return output.join('');
    };

    /**
     * Base32 decodes a base32 encoded string.
     *
     * @param encoded - The base32 encoded string to decode.
     * @returns The binary data corresponding to the input string.
     */
    public static Base32Decode = (encoded: string): Uint8Array => {
        if (0 !== encoded.length % Encoded_Block_Size) {
            throw Error(`encoded size must be multiple of ${Encoded_Block_Size}`);
        }

        const output = new Uint8Array((encoded.length / Encoded_Block_Size) * Decoded_Block_Size);
        for (let i = 0; i < encoded.length / Encoded_Block_Size; ++i) {
            utilities.decodeBlock(encoded, i * Encoded_Block_Size, output, i * Decoded_Block_Size);
        }
        return output;
    };
}
