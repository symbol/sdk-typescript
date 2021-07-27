import { expect } from 'chai';
import { SHA3 } from 'sha3';
import { Key } from '../../src/core/Key';
import { SymbolAddress } from '../../src/core/symbol';
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
                const rawAddress = network.createAddressFromPublicKey(Key.createFromHex(a.publicKey));
                //Act
                expect(a[keyName]).to.be.equal(new SymbolAddress(rawAddress).encoded);
            });
        });
    });

    it('can create correct hasher for Symbol', () => {
        const network = new SymbolNetwork('public', 0x68, '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');
        const hasher = network.addressHasher();
        expect(hasher instanceof SHA3).to.be.true;
    });

    it('can find a symbol network by name', () => {
        const network = SymbolNetwork.findByName('public');
        expect(network).not.to.be.undefined;
        expect(network?.name).to.be.equal('public');
        expect(network?.identifier).to.be.equal(0x68);
        expect(network?.generationHash).to.be.equal('57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');
    });

    it('cannot find a symbol network by invalid name', () => {
        const network = SymbolNetwork.findByName('public!!!');
        expect(network).to.be.undefined;
    });

    it('can find a symbol network by identifier', () => {
        const network = SymbolNetwork.findByIdentifier(0x68);
        expect(network).not.to.be.undefined;
        expect(network?.name).to.be.equal('public');
        expect(network?.identifier).to.be.equal(0x68);
        expect(network?.generationHash).to.be.equal('57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');
    });

    it('cannot find a symbol network by invalid name', () => {
        const network = SymbolNetwork.findByIdentifier(0x99);
        expect(network).to.be.undefined;
    });
});
