/*
 * Copyright 2021 SYMBOL
 *
 * Licensed under the Apache License, Version 2.0 (the "License"),
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
 * Enum containing transaction type constants for Nem.
 */
export enum NemTransactionType {
    TRANSFER = 0x0101,
    IMPORTANCE_TRANSFER = 0x0801,
    MULTISIG_MODIFICATION = 0x1001,
    MULTISIG_SIGNATURE = 0x1002,
    MULTISIG_TRANSACTION = 0x1004,
    NAMESPACE = 0x2001,
    MOSAIC_DEFINITION = 0x4001,
    MOSAIC_SUPPLY = 0x4002,
}

/**
 * Enum containing importance transfer transaction mode constants for Nem.
 */
export enum ImportanceTransferMode {
    ACTIVATE = 1,
    DEACTIVATE = 2,
}
