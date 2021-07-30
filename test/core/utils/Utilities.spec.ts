import { expect } from 'chai';
import { arrayDeepEqual, Converter } from '../../../src/core/utils';
describe('arrayDeepEqual', () => {
    it('returns true if typed arrays are equal', () => {
        // Arrange:
        const lhs = Converter.hexToUint8('0A12B5675069');
        const rhs = Converter.hexToUint8('0A12B5675069');

        // Act:
        const isEqual = arrayDeepEqual(lhs, rhs);

        // Assert:
        expect(isEqual).to.equal(true);
    });

    it('returns false if typed arrays have different sizes', () => {
        // Arrange:
        const shorter = Converter.hexToUint8('0A12B5675069');
        const longer = Converter.hexToUint8('0A12B567506983');

        // Act:
        const isEqual1 = arrayDeepEqual(shorter, longer);
        const isEqual2 = arrayDeepEqual(longer, shorter);

        // Assert:
        expect(isEqual1).to.equal(false);
        expect(isEqual2).to.equal(false);
    });

    const assertNotEqual = (lhs, unequalOffset) => {
        // Arrange:
        const rhs = new Uint8Array(lhs.length);
        rhs.set(lhs);
        rhs[unequalOffset] ^= 0xff;

        // Act
        const isEqual = arrayDeepEqual(lhs, rhs);

        // Assert:
        expect(isEqual, `unequal offset ${unequalOffset}`).to.equal(false);
    };

    it('returns false if typed arrays are not equal', () => {
        // Arrange:
        const lhs = Converter.hexToUint8('0A12B5675069');

        // Assert:
        assertNotEqual(lhs, 0);
        assertNotEqual(lhs, 3);
        assertNotEqual(lhs, 5);
    });

    it('returns true if subset of typed arrays are equal', () => {
        // Arrange: different at 2
        const lhs = Converter.hexToUint8('0A12B5675069');
        const rhs = Converter.hexToUint8('0A12C5675069');

        // Act:
        const isEqualSubset = arrayDeepEqual(lhs, rhs, 2);
        const isEqualAll = arrayDeepEqual(lhs, rhs);

        // Assert:
        expect(isEqualSubset).to.equal(true);
        expect(isEqualAll).to.equal(false);
    });

    it('returns true if subset of typed arrays of different lengths are equal', () => {
        // Arrange:
        const shorter = Converter.hexToUint8('0A12B5');
        const longer = Converter.hexToUint8('0A12B567506983');

        // Act:
        const isEqual1 = arrayDeepEqual(shorter, longer, 3);
        const isEqual2 = arrayDeepEqual(longer, shorter, 3);

        // Assert:
        expect(isEqual1).to.equal(true);
        expect(isEqual2).to.equal(true);
    });

    it('returns false if either typed array has fewer elements than requested for comparison', () => {
        // Arrange:
        const shorter = Converter.hexToUint8('0A12B5');
        const longer = Converter.hexToUint8('0A12B567506983');

        // Act:
        const isEqual1 = arrayDeepEqual(shorter, longer, 4);
        const isEqual2 = arrayDeepEqual(longer, shorter, 4);

        // Assert:
        expect(isEqual1).to.equal(false);
        expect(isEqual2).to.equal(false);
    });
});
