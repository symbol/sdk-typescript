import { expect } from 'chai';
import { Key } from '../../src/core/Key';
import { SymbolAddress } from '../../src/core/symbol';
import { SymbolNetwork } from '../../src/core/symbol/SymbolNetwork';
import { Converter } from '../../src/core/utils/Converter';

describe('Symbol Address', () => {
    const testKeyAddressPair = {
        publicKey: '2E834140FD66CF87B254A693A2C7862C819217B676D3943267156625E816EC6F',
        address_Public: 'NATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA34SQ33Y',
        address_PublicTest: 'TATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA37JGO5Q',
        address_Private: 'PATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA35OETNI',
        address_PrivateTest: 'VATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA35C4KNQ',
    };

    it('Can generate address bytes', () => {
        //Arrange
        const network = new SymbolNetwork('public', 0x68, '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');
        const address = new SymbolAddress(network.createAddressFromPublicKey(Key.createFromHex(testKeyAddressPair.publicKey)));
        expect(address.getAddressBytes()).not.to.be.undefined;
        expect(address.getAddressBytes().length).to.be.equal(24);
    });

    it('Can create address from encoded', () => {
        //Arrange
        const address = SymbolAddress.createFromString(testKeyAddressPair.address_Public);
        expect(address.getAddressBytes()).not.to.be.undefined;
        expect(address.getAddressBytes().length).to.be.equal(24);
    });

    it('Can create address from bytes', () => {
        //Arrange
        const addressBytes = SymbolAddress.createFromString(testKeyAddressPair.address_Public).getAddressBytes();
        const address = SymbolAddress.createFromBytes(addressBytes);
        expect(address).not.to.be.undefined;
        expect(address.getAddressBytes()).to.be.deep.equal(addressBytes);
    });

    it('Can create address from hex', () => {
        //Arrange
        const addressBytes = SymbolAddress.createFromString(testKeyAddressPair.address_Public).getAddressBytes();
        const address = SymbolAddress.createFromHex(Converter.uint8ToHex(addressBytes));
        expect(address).not.to.be.undefined;
        expect(address.getAddressBytes()).to.be.deep.equal(addressBytes);
    });

    it('Can return encoded address', () => {
        //Arrange
        const network = new SymbolNetwork('public', 0x68, '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');
        const address = new SymbolAddress(network.createAddressFromPublicKey(Key.createFromHex(testKeyAddressPair.publicKey)));
        expect(address.encoded).not.to.be.undefined;
        expect(address.encoded).to.be.equal(testKeyAddressPair.address_Public);
    });

    it('Can return decoded address', () => {
        //Arrange
        const network = new SymbolNetwork('public', 0x68, '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');
        const address = new SymbolAddress(network.createAddressFromPublicKey(Key.createFromHex(testKeyAddressPair.publicKey)));
        expect(address.decode).not.to.be.undefined;
        expect(address.decode).to.be.equal('6826D27E1D0A26CA4E316F901E23E55C8711DB20DF250DEF');
    });

    it('Can return pretty address presentation', () => {
        //Arrange
        const network = new SymbolNetwork('public', 0x68, '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');
        const address = new SymbolAddress(network.createAddressFromPublicKey(Key.createFromHex(testKeyAddressPair.publicKey)));
        expect(address.pretty()).not.to.be.undefined;
        expect(address.pretty()).to.be.equal('NATNE7-Q5BITM-UTRRN6-IB4I7F-LSDRDW-ZA34SQ-33Y');
    });

    it('Can compare with other address', () => {
        //Arrange
        const network = new SymbolNetwork('public', 0x68, '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');
        const address = new SymbolAddress(network.createAddressFromPublicKey(Key.createFromHex(testKeyAddressPair.publicKey)));
        expect(address.equals(testKeyAddressPair.address_Public)).to.be.true;
        expect(address.equals(testKeyAddressPair.address_Private)).to.be.false;
    });

    it('Can return encoded address by calling toString', () => {
        //Arrange
        const network = new SymbolNetwork('public', 0x68, '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6');
        const address = new SymbolAddress(network.createAddressFromPublicKey(Key.createFromHex(testKeyAddressPair.publicKey)));
        expect(address.toString()).not.to.be.undefined;
        expect(address.toString()).to.be.equal(address.encoded);
    });

    it('Can verify address', () => {
        expect(SymbolAddress.isValid(testKeyAddressPair.address_Public)).to.be.true;

        const invalidAddress = 'NATNE9Q5BITMUTRRN6IB4I7FLSDRDWZA34SQ33Y';
        expect(SymbolAddress.isValid(invalidAddress)).to.be.false;
    });
});
