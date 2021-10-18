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

/** Objects of this interface knows how to serialize a catbuffer object. */
export interface Serializer {
    /**
     * Serializes an object to bytes.
     *
     * @returns Serialized bytes.
     */
    serialize(): Uint8Array;

    /**
     * Gets the size of the object.
     *
     * @returns Size in bytes.
     */
    readonly size: number;
}
