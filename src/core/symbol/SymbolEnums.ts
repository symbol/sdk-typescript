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
 * Enum containing transaction type constants.
 */
export enum TransactionType {
    TRANSFER = 16724,
    NAMESPACE_REGISTRATION = 16718,
    ADDRESS_ALIAS = 16974,
    MOSAIC_ALIAS = 17230,
    MOSAIC_DEFINITION = 16717,
    MOSAIC_SUPPLY_CHANGE = 16973,
    MULTISIG_ACCOUNT_MODIFICATION = 16725,
    AGGREGATE_COMPLETE = 16705,
    AGGREGATE_BONDED = 16961,
    HASH_LOCK = 16712,
    SECRET_LOCK = 16722,
    SECRET_PROOF = 16978,
    ACCOUNT_ADDRESS_RESTRICTION = 16720,
    ACCOUNT_MOSAIC_RESTRICTION = 16976,
    ACCOUNT_OPERATION_RESTRICTION = 17232,
    ACCOUNT_KEY_LINK = 16716,
    MOSAIC_ADDRESS_RESTRICTION = 16977,
    MOSAIC_GLOBAL_RESTRICTION = 16721,
    ACCOUNT_METADATA = 16708,
    MOSAIC_METADATA = 16964,
    NAMESPACE_METADATA = 17220,
    VRF_KEY_LINK = 16963,
    VOTING_KEY_LINK = 16707,
    NODE_KEY_LINK = 16972,
}

export enum Version {
    TRANSFER = 1,
    NAMESPACE_REGISTRATION = 1,
    MOSAIC_DEFINITION = 1,
    MOSAIC_SUPPLY_CHANGE = 1,
    MULTISIG_ACCOUNT_MODIFICATION = 1,
    AGGREGATE_COMPLETE = 1,
    AGGREGATE_BONDED = 1,
    HASH_LOCK = 1,
    SECRET_LOCK = 1,
    SECRET_PROOF = 1,
    ADDRESS_ALIAS = 1,
    MOSAIC_ALIAS = 1,
    MOSAIC_GLOBAL_RESTRICTION = 1,
    MOSAIC_ADDRESS_RESTRICTION = 1,
    ACCOUNT_ADDRESS_RESTRICTION = 1,
    ACCOUNT_MOSAIC_RESTRICTION = 1,
    MODIFY_ACCOUNT_RESTRICTION_ENTITY_TYPE = 1,
    ACCOUNT_KEY_LINK = 1,
    ACCOUNT_METADATA = 1,
    MOSAIC_METADATA = 1,
    NAMESPACE_METADATA = 1,
    VRF_KEY_LINK = 1,
    VOTING_KEY_LINK = 1,
    NODE_KEY_LINK = 1,
}
