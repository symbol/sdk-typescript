import { Nis1KeyPair, SymbolKeyPair } from '@core';
import { AddressMosaicIdTester, KeyPairVectorTester, SignAndVerifyTester } from 'test/BasicVectorTest.template';
import path = require('path');

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

describe('Symbol', () => {
    describe('test-keys vector', () => {
        const testKeys = path.join(__dirname, '../test-vector/1.test-keys.json');
        KeyPairVectorTester(SymbolKeyPair, testKeys);
    });

    describe('test-sign vector', () => {
        const testsign = path.join(__dirname, '../test-vector/2.test-sign.json');
        SignAndVerifyTester(SymbolKeyPair, testsign);
    });

    describe('test-address vector', () => {
        const vectorFile = path.join(__dirname, '../test-vector/1.test-address.json');
        AddressMosaicIdTester(vectorFile);
    });

    describe('test-mosaic-id vector', () => {
        const vectorFile = path.join(__dirname, '../test-vector/5.test-mosaic-id.json');
        AddressMosaicIdTester(vectorFile, true);
    });
});
