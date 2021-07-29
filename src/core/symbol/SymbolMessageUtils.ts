/**
 * The Message type. Supported supply types are:
 * -1: RawMessage (no type appended)
 * 0: PlainMessage
 * 1: EncryptedMessage.
 * 254: Persistent harvesting delegation.
 */

import { Converter } from '@utils';

export enum MessageType {
    PlainMessage = 0x00,
    EncryptedMessage = 0x01,
    PersistentHarvestingDelegationMessage = 0xfe,
}

// TODO add more methods to serialize and deserialize messages for each Message type.
export class SymbolMessageUtils {
    public static plain(plainText: string): Uint8Array {
        return Converter.concat(Uint8Array.of(MessageType.PlainMessage), Converter.utf8ToUint8(plainText));
    }

    // public static encrypted(keyPair:KeyPair, plainText: string): Uint8Array {
    //     return Converter.concat(Uint8Array.of(MessageType.EncryptedMessage), key);
    // }
}
