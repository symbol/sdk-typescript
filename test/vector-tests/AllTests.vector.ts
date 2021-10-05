import { NemKeyPair, NemNetwork, SymbolKeyPair, SymbolNetwork } from '@core';
import {
    AddressMosaicIdTester,
    CipherVectorTester,
    DeriveVectorTester,
    KeyPairVectorTester,
    SignAndVerifyTester,
} from 'test/BasicVectorTest.template';
import path = require('path');

describe('Nem', () => {
    describe('test-keys vector', () => {
        const testKeys = path.join(__dirname, '../test-vector/nem/1.test-keys.json');
        KeyPairVectorTester(NemKeyPair, testKeys);
    });

    describe('test-sign vector', () => {
        const testSign = path.join(__dirname, '../test-vector/nem/2.test-sign.json');
        SignAndVerifyTester(NemKeyPair, testSign);
    });

    describe('test-address vector', () => {
        const vectorFile = path.join(__dirname, '../test-vector/nem/1.test-address.json');
        const networks = NemNetwork.list();
        AddressMosaicIdTester(networks, vectorFile);
    });
});

describe('Symbol', () => {
    describe('test-keys vector', () => {
        const testKeys = path.join(__dirname, '../test-vector/symbol/1.test-keys.json');
        KeyPairVectorTester(SymbolKeyPair, testKeys);
    });

    describe('test-sign vector', () => {
        const testSign = path.join(__dirname, '../test-vector/symbol/2.test-sign.json');
        SignAndVerifyTester(SymbolKeyPair, testSign);
    });

    describe('test-address vector', () => {
        const vectorFile = path.join(__dirname, '../test-vector/symbol/1.test-address.json');
        const networks = SymbolNetwork.list();
        AddressMosaicIdTester(networks, vectorFile);
    });

    describe('test-mosaic-id vector', () => {
        const vectorFile = path.join(__dirname, '../test-vector/symbol/5.test-mosaic-id.json');
        const networks = SymbolNetwork.list();
        AddressMosaicIdTester(networks, vectorFile, true);
    });

    describe('test-derive vector', () => {
        const vectorFile = path.join(__dirname, '../test-vector/symbol/3.test-derive.json');
        DeriveVectorTester(vectorFile);
    });

    describe('test-cipher vector', () => {
        const vectorFile = path.join(__dirname, '../test-vector/symbol/4.test-cipher.json');
        CipherVectorTester(vectorFile);
    });
});
