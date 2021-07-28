import { expect } from 'chai';
import { Key } from '../src/core/Key';
import { Converter } from '../src/core/utils';

describe('Key', () => {
    const testKey = Converter.hexToUint8('2E834140FD66CF87B254A693A2C7862C819217B676D3943267156625E816EC6F');

    it('Can create Key from byte', () => {
        const publicKey = new Key(testKey);
        expect(publicKey).not.to.be.undefined;
        expect(publicKey.key).to.be.equal(testKey);
    });

    it('Can create Key from string', () => {
        const hex = '2E834140FD66CF87B254A693A2C7862C819217B676D3943267156625E816EC6F';
        const publicKey = Key.createFromHex(hex);
        expect(publicKey).not.to.be.undefined;
        expect(publicKey.toString()).to.be.equal(hex);
    });

    it('Can create Key byte', () => {
        const publicKey = new Key(testKey);
        expect(publicKey).not.to.be.undefined;
        expect(publicKey.toBytes()).to.be.deep.equal(testKey);
    });

    it('Can create Key string', () => {
        const publicKey = new Key(testKey);
        expect(publicKey).not.to.be.undefined;
        expect(publicKey.toString()).to.be.equal('2E834140FD66CF87B254A693A2C7862C819217B676D3943267156625E816EC6F');
    });

    it('Can create Key length', () => {
        const publicKey = new Key(testKey);
        expect(publicKey).not.to.be.undefined;
        expect(publicKey.length).to.be.equal(32);
    });
});
