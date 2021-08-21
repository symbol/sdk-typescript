import { Converter, Deadline, Key, SymbolAddress, SymbolKeyPair, SymbolNetwork } from '@core';
import {
    AmountDto,
    TransferTransactionBodyBuilder,
    UnresolvedAddressDto,
    UnresolvedMosaicBuilder,
    UnresolvedMosaicIdDto,
} from 'catbuffer-typescript';

const testnetMosaicId = '091F837E059AE13C';
const privateKey = '1C16D0C8804546EFB4B11584AFACB294DFABF0D41E8E345F1F74BB6CAD162066';

/**
 * Build mosaic
 */

const mosaicId = new UnresolvedMosaicIdDto(BigInt(`0x${testnetMosaicId}`));
const amount = new AmountDto(BigInt(1));
const mosaic = new UnresolvedMosaicBuilder({ mosaicId, amount });

/**
 * Build recipient address
 */

const address = SymbolAddress.createFromString('TC2MMJ4TY6QKPEH2WUWXTZ4EJLC7OSF5CHO56DQ'); // Get address from the SDK
const recipientAddress = new UnresolvedAddressDto(address.getAddressBytes()); // Build Catbuffer UnresolvedAddress data transfer object

/**
 * Build Symbol transaction using the factory and sign.
 */
const network = new SymbolNetwork('testnet', 0x98, '3B5E1FA6445653C971A50687E75E6D09FB30481055E3990C84B25E9222DC1155'); // Specify network

const bodyBuilder = new TransferTransactionBodyBuilder({
    recipientAddress,
    mosaics: [mosaic],
    message: Converter.concat(Uint8Array.of(0x00), Converter.utf8ToUint8('Test message.')), //0x00 is the message type for plain utf-8 encoded texts.
}); // Build TransferTransaction body.

const transferTransaction = network.createTransactionFactory().create(Deadline.createFromAdjustedValue(100), BigInt(100), bodyBuilder); // Build transaction using the factory

/**
 * Sign transaction
 */

const signerKeyPair = new SymbolKeyPair(Key.createFromHex(privateKey));

transferTransaction.sign(signerKeyPair);

console.log(transferTransaction);
