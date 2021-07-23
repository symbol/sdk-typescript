import { expect } from 'chai';
import { SymbolNetwork } from '../../src/core/symbol/SymbolNetwork';
import { Symbol_Address_Vector } from '../resource/vector/1.test-address';

describe('Symbol Network', () => {
    it('can list all symbol netwroks', () => {
        const list = SymbolNetwork.list();
        expect(list.length).to.equal(4);
        expect(list.find((l) => l.name === 'public')).not.to.be.undefined;
        expect(list.find((l) => l.name === 'private')).not.to.be.undefined;
        expect(list.find((l) => l.name === 'public_test')).not.to.be.undefined;
        expect(list.find((l) => l.name === 'private_test')).not.to.be.undefined;
    });

    it('can create address from publickey', () => {
        //Arrange
        const networkList = SymbolNetwork.list();
        networkList.forEach((n) => {
            const network = new SymbolNetwork(n.name, n.identifier, n.generationHash);
            //Load test vector addresses
            Symbol_Address_Vector.forEach((a) => {
                const netwrokName = n.name.charAt(0).toUpperCase() + n.name.slice(1);
                const keyName = `address_${netwrokName}`.replace('_t', 'T');
                const rawAddress = network.generateFromPublicKey(a.publicKey);
                //Act
                expect(a[keyName]).to.be.equal(n.createAddress(rawAddress).encoded);
            });
        });
    });

    // TODO: More testings
});
