/* eslint-disable tsdoc/syntax */
import { Deadline, Key, SymbolKeyPair, SymbolNetwork } from '@core';
import { MultisigAccountModificationTransactionBodyBuilder, UnresolvedAddressDto } from 'catbuffer-typescript';

const multisigKeyPair = new SymbolKeyPair(Key.createFromHex('1C16D0C8804546EFB4B11584AFACB294DFABF0D41E8E345F1F74BB6CAD162066'));
const cosignatoryKeyPairs = [
    new SymbolKeyPair(Key.createFromHex('C73DF84178896A5D63F91467E606A44B06AF3892DB4F55FAF9524DA902E0FF7E')),
    new SymbolKeyPair(Key.createFromHex('FC998941EDC8979252523885E4524598441577A9CEBCF5F766D194A11A1C317E')),
    new SymbolKeyPair(Key.createFromHex('3AD4475F288A90654033EC4A4DE86F44ED3E898A384BE3488A2F02B95CC9C772')),
];

/**
 * Build Symbol transaction using the factory and sign.
 */
const network = SymbolNetwork.findByIdentifier(SymbolNetwork.list(), 0x98);

// Specify network
const factory = network!.createTransactionFactory();

const addressAdditions = cosignatoryKeyPairs.map(
    (keyPair) => new UnresolvedAddressDto(network!.createAddressFromPublicKey(keyPair.publicKey).getAddressBytes()),
);

const bodyBuilder = new MultisigAccountModificationTransactionBodyBuilder({
    minRemovalDelta: 2,
    minApprovalDelta: 2,
    addressAdditions,
    addressDeletions: [],
}); // Build transaction body.

const modifyMultisigTransaction = factory.createAggregateComplete(Deadline.createFromAdjustedValue(100), BigInt(100), [
    factory.toEmbedded(bodyBuilder, multisigKeyPair.publicKey),
]); // Build aggregate transaction using the factory

/**
 * Sign transaction
 */

modifyMultisigTransaction.signWithCosigners(multisigKeyPair, cosignatoryKeyPairs);

/**
 * Option1: to cosign aggregate transaction separately
 *
 * modifyMultisigTransaction.sign(multisigKeyPair);
 * modifyMultisigTransaction.cosign(cosignatoryKeyPairs);
 */

/**
 * Option2: to cosign aggregate transaction separately appending cosignatories to the aggregate
 *
 * modifyMultisigTransaction.sign(multisigKeyPair);
 * const cosignatures = cosignatoryKeyPairs.map((keyPair) => {
 *   return {
 *       signerPublicKey: keyPair.publicKey.key,
 *       signature: keyPair.sign(modifyMultisigTransaction.transactionHash),
 *   };
 * });
 *
 * modifyMultisigTransaction.addCosignatures(cosignatures);
 */

console.log(modifyMultisigTransaction);
