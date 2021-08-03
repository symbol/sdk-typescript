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

import * as path from 'path';
import { Nis1KeyPair } from '../../src/core/nis1';
import { KeyPairVectorTester, SignAndVerifyTester } from '../BasicVectorTest.template';

describe('NIS 1', () => {
    describe('test-keys vector', () => {
        const testKeys = path.join(__dirname, '../test-vector/nis1/1.test-keys.json');
        KeyPairVectorTester(Nis1KeyPair, testKeys);
    });

    describe('test-sign vector', () => {
        const testsign = path.join(__dirname, '../test-vector/nis1/2.test-sign.json');
        SignAndVerifyTester(Nis1KeyPair, testsign);
    });
});
