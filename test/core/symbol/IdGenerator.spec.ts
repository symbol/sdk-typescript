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
import { SymbolIdGenerator } from '@core';
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
