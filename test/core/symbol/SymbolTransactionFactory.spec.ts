/*
 * Copyright 2021 SYMBOL
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Converter, SymbolNetwork } from '@core';
import { expect } from 'chai';

describe('SymbolTransactionFactory', () => {
    const network = SymbolNetwork.findByName(SymbolNetwork.list(), 'testnet');
    if (!network) {
        throw new Error('Network must be found!');
    }
    const factory = network.createTransactionFactory();

    it('fullNameToNamespaceId symbol.xym', () => {
        const id = factory.fullNameToNamespaceId('symbol.xym');
        expect(id.toString()).eq('16666583871264174062');
        expect(id.toString(16).toUpperCase()).eq('E74B99BA41F4AFEE');
    });

    it('fullNameToNamespaceId to toUnresolvedAddress', () => {
        const namespace = factory.fullNameToNamespaceId('i.am.alice');

        expect(Converter.uint8ToHex(factory.toUnresolvedAddress(namespace))).eq('99C1ED94FF2D65C0AF000000000000000000000000000000');
        expect(namespace.toString(16).toUpperCase()).eq('AFC0652DFF94EDC1');
        expect(namespace.toString()).eq('12664233400401718721');
    });
});
