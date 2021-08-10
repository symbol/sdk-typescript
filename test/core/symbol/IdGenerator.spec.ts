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
import { Converter, SymbolIdGenerator } from '@core';
import { NetworkTypeDto } from 'catbuffer-typescript';
import { expect } from 'chai';

describe('Symbol IdGenerator - TestVector', () => {
    it('Can generate a random nonce', () => {
        const nonce = SymbolIdGenerator.generateRandomMosaicNonce();
        expect(nonce).not.be.be.undefined;
        expect(nonce.length).to.be.equal(4);
    });

    it('Can generate namespaceId', () => {
        const nem = SymbolIdGenerator.generateNamespaceId('nem');
        expect(nem).not.be.be.undefined;
        expect(nem.toString(16).toUpperCase()).to.be.equal('84B3552D375FFA4B');

        const xem = SymbolIdGenerator.generateNamespaceId('xem');
        expect(xem).not.be.be.undefined;
        expect(xem.toString(16).toUpperCase()).to.be.equal('A60FC7C97DB58AFC');
    });

    it('Can generate namespaceId with parents', () => {
        const parentId = SymbolIdGenerator.generateNamespaceId('symbol');
        const childId = SymbolIdGenerator.generateNamespaceId('xym');
        expect(parentId).not.be.be.undefined;
        expect(childId).not.be.be.undefined;
        expect(parentId.toString(16).toUpperCase()).to.be.equal('A95F1F8A96159516');
        expect(childId.toString(16).toUpperCase()).to.be.equal('84CB6A45853E78C4');
        const fullId = SymbolIdGenerator.generateNamespaceId('xym', parentId);
        expect(fullId).not.be.be.undefined;
        expect(fullId.toString(16).toUpperCase()).to.be.equal('E74B99BA41F4AFEE');
    });

    it('Can validate namespace names', () => {
        expect(SymbolIdGenerator.isValidNamespaceName('nem')).to.be.true;
        expect(SymbolIdGenerator.isValidNamespaceName('xym')).to.be.true;
        expect(SymbolIdGenerator.isValidNamespaceName('abc.123')).to.be.false;
        expect(SymbolIdGenerator.isValidNamespaceName('abc=123')).to.be.false;
        expect(SymbolIdGenerator.isValidNamespaceName('~!@')).to.be.false;
        expect(SymbolIdGenerator.isValidNamespaceName('-')).to.be.false;
        expect(SymbolIdGenerator.isValidNamespaceName(' ')).to.be.false;
        expect(SymbolIdGenerator.isValidNamespaceName('')).to.be.false;
    });

    it('can convert bigint to hex', () => {
        const id = SymbolIdGenerator.namespaceId('symbol.xym');
        expect(id.toString()).eq('16666583871264174062');
        expect(id.toString(16).toUpperCase()).eq('E74B99BA41F4AFEE');
    });

    it('NamespaceId to unresolvedAddress', () => {
        const namespace = SymbolIdGenerator.namespaceId('i.am.alice');
        expect(Converter.uint8ToHex(SymbolIdGenerator.encodeUnresolvedAddress(NetworkTypeDto.PUBLIC_TEST, namespace))).eq(
            '99C1ED94FF2D65C0AF000000000000000000000000000000',
        );
        expect(namespace.toString(16).toUpperCase()).eq('AFC0652DFF94EDC1');
        expect(namespace.toString()).eq('12664233400401718721');
    });

    describe('Encode Unresolved Addresses', () => {
        interface EncodedUnresolvedAddressVectorItem {
            networkType: number;
            namespaceHex: string;
            namespaceId: string;
            encoded: string;
        }
        const inputs: EncodedUnresolvedAddressVectorItem[] = [
            {
                networkType: 168,
                namespaceHex: 'E1499A8D01FCD82A',
                namespaceId: '16233676262248077354',
                encoded: 'A92AD8FC018D9A49E1000000000000000000000000000000',
            },
            {
                networkType: 104,
                namespaceHex: 'D401054C1965C26E',
                namespaceId: '15276497235419185774',
                encoded: '696EC265194C0501D4000000000000000000000000000000',
            },
            {
                networkType: 120,
                namespaceHex: 'FEEF99776CED53B0',
                namespaceId: '18370070143275193264',
                encoded: '79B053ED6C7799EFFE000000000000000000000000000000',
            },
            {
                networkType: 144,
                namespaceHex: '9550CA3FC9B41FC5',
                namespaceId: '10759321885103890373',
                encoded: '91C51FB4C93FCA5095000000000000000000000000000000',
            },
            {
                networkType: 152,
                namespaceHex: 'D85742D268617751',
                namespaceId: '15589002106628044625',
                encoded: '9951776168D24257D8000000000000000000000000000000',
            },
            {
                networkType: 168,
                namespaceHex: 'E7CA7E22727DDD88',
                namespaceId: '16702300854471744904',
                encoded: 'A988DD7D72227ECAE7000000000000000000000000000000',
            },
        ];

        inputs.forEach((item: EncodedUnresolvedAddressVectorItem) => {
            it(`Namespace Is ${item.namespaceHex} Network Type ${item.networkType}`, () => {
                const namespaceId = BigInt(item.namespaceId);
                // Act + Assert:
                expect(namespaceId.toString(16).toUpperCase()).equal(item.namespaceHex);
                const encoded = SymbolIdGenerator.encodeUnresolvedAddress(item.networkType, namespaceId);
                expect(Converter.uint8ToHex(encoded)).eq(item.encoded);
            });
        });
    });

    describe('generate namespace paths', () => {
        it('generates correct well known root path', () => {
            // Act:
            const path = SymbolIdGenerator.generateNamespacePath('nem');

            // Assert:
            expect(path.length).to.equal(1);
            expect(path[0]).to.equal(BigInt('0x84B3552D375FFA4B').valueOf());
        });

        it('generates correct well known child path', () => {
            // Act:
            const xempath = SymbolIdGenerator.generateNamespacePath('nem.xem');
            const xympath = SymbolIdGenerator.generateNamespacePath('symbol.xym');

            // Assert:
            expect(xempath.length).to.equal(2);
            expect(xempath[0]).to.equal(BigInt('0x84B3552D375FFA4B').valueOf());
            expect(xempath[1]).to.equal(BigInt('0xD525AD41D95FCF29').valueOf());
            expect(xympath.length).to.equal(2);
            expect(xympath[0]).to.equal(BigInt('0xA95F1F8A96159516').valueOf());
            expect(xympath[1]).to.equal(BigInt('0xE74B99BA41F4AFEE').valueOf()); // The known symbol.xym namespace id
        });

        it('supports multi level namespaces', () => {
            // Arrange:
            const foo = SymbolIdGenerator.generateNamespaceId('foo');
            const bar = SymbolIdGenerator.generateNamespaceId('bar', foo);
            const baz = SymbolIdGenerator.generateNamespaceId('baz', bar);

            // Assert:
            expect(SymbolIdGenerator.generateNamespacePath('foo.bar.baz')).to.deep.equal([foo, bar, baz]);
        });

        it('rejects improper qualified names', () => {
            // Assert:
            ['a:b:c', 'a..b'].forEach((name) => expect(() => SymbolIdGenerator.generateNamespacePath(name), `name ${name}`).to.throw());
        });
    });
});
