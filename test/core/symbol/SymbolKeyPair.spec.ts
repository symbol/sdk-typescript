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

import { Key } from '../../../src/core/Key';
import { SymbolKeyPair } from '../../../src/core/symbol';
import { BasicKeyPairTester } from '../../BasicKeyPairTest.template';

describe('Symbol key pair', () => {
    const deterministicPrivateKey = Key.createFromHex('575DBB3062267EFF57C970A336EBBC8FBCFE12C5BD3ED7BC11EB0481D7704CED');
    const expectedPublicKey = Key.createFromHex('2E834140FD66CF87B254A693A2C7862C819217B676D3943267156625E816EC6F');

    BasicKeyPairTester(SymbolKeyPair, deterministicPrivateKey, expectedPublicKey);
});
