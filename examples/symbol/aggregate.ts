import { Converter, Deadline, Key, SymbolKeyPair, SymbolNetwork } from '@core';
import { ChronoUnit } from '@js-joda/core';
import {
    AmountDto,
    BlockDurationDto,
    Hash256Dto,
    HashLockTransactionBodyBuilder,
    TransferTransactionBodyBuilder,
    UnresolvedAddressDto,
    UnresolvedMosaicBuilder,
    UnresolvedMosaicIdDto,
} from 'catbuffer-typescript';

const mosaicId = BigInt('0x091F837E059AE13C'); // Testnet mosaic id

const aliceKeyPair = new SymbolKeyPair(Key.createFromHex('1C16D0C8804546EFB4B11584AFACB294DFABF0D41E8E345F1F74BB6CAD162066'));
const bobKeyPair = new SymbolKeyPair(Key.createFromHex('C73DF84178896A5D63F91467E606A44B06AF3892DB4F55FAF9524DA902E0FF7E'));
const bobAddressAlias = 'bob.address'; // Bob's address alias namespace name

/**
 * Build Symbol transaction using the factory and sign.
 */
const network = new SymbolNetwork('testnet', 0x98, '3B5E1FA6445653C971A50687E75E6D09FB30481055E3990C84B25E9222DC1155'); // Specify network
const factory = network.createTransactionFactory();

const aliceAddress = network.createAddressFromPublicKey(aliceKeyPair.publicKey);
const bobAddress = factory.fullNameToNamespaceId(bobAddressAlias); // Bob's unresolved address

const aliceTransaction = new TransferTransactionBodyBuilder({
    recipientAddress: new UnresolvedAddressDto(factory.toUnresolvedAddress(bobAddress)),
    mosaics: [
        new UnresolvedMosaicBuilder({
            mosaicId: new UnresolvedMosaicIdDto(mosaicId),
            amount: new AmountDto(BigInt(2000000)),
        }),
    ],
    message: Converter.concat(Uint8Array.of(0x00), Converter.utf8ToUint8('This is Alice')),
});

const bobTransaction = new TransferTransactionBodyBuilder({
    recipientAddress: new UnresolvedAddressDto(aliceAddress.getAddressBytes()),
    mosaics: [
        new UnresolvedMosaicBuilder({
            mosaicId: new UnresolvedMosaicIdDto(mosaicId),
            amount: new AmountDto(BigInt(2000000)),
        }),
    ],
    message: Converter.concat(Uint8Array.of(0x00), Converter.utf8ToUint8('This is Bob')),
});

// Create deadline. 1616694977 is Symbol testnet epoch adjustment.
const deadline = Deadline.create(1616694977, 2, ChronoUnit.HOURS);

const bondedTransaction = factory.createAggregateBonded(deadline, BigInt(100), [
    factory.toEmbedded(aliceTransaction, aliceKeyPair.publicKey),
    factory.toEmbedded(bobTransaction, bobKeyPair.publicKey),
]); // Build bonded transaction using the factory

/**
 * Sign transaction
 */
bondedTransaction.sign(aliceKeyPair);

// Assuming Alice is the aggregate transaction's initiator. A fund lock transaction is required prior announcing the bonded transaction.
const lockTransactionBuilder = new HashLockTransactionBodyBuilder({
    mosaic: new UnresolvedMosaicBuilder({
        mosaicId: new UnresolvedMosaicIdDto(mosaicId),
        amount: new AmountDto(BigInt(2000000)),
    }),
    duration: new BlockDurationDto(BigInt(100)),
    hash: new Hash256Dto(bondedTransaction.transactionHash),
});
const lock = factory.create(Deadline.createFromAdjustedValue(100), BigInt(100), lockTransactionBuilder);
lock.sign(aliceKeyPair);

/**
 * ....
 * AggregateBonded transaction requires On-Chain cosigning, Alice needs to announce the HashLockTransaction and AggregateBondedTransaction first
 */

/**
 * Cosign
 */

const bobSignature = bobKeyPair.sign(bondedTransaction.transactionHash); // Bob gets the transaction hash (On-Chain)

// Bob announce signed partial transaction

console.log(bondedTransaction);
console.log(lock);
console.log(bobSignature);
