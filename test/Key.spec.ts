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
import { Key } from '@core';
import { Converter } from '@utils';
import { expect } from 'chai';

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
