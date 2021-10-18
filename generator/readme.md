# Symbol Typescript Buffer Generator

This project written in Typescript takes the [parsed](https://github.com/symbol/catbuffer-parser) YAML [schemas](https://github.com/symbol/catbuffer-schemas) and generates the serializer and deserializer classes for both Symbol & NEM transactions and state entities.

## language

- Typescript

## Requirements

- Node 12+
- Typescript 3+

## Usage

```typescript
npm i && npm run build
```

The full generator codes are created in `build` folder.

> **NOTE:**
> NEM and Symbol generator codes are placed in separate folders.

## Test the generator

```bash
cd build
```

```typescript
npm i && npm run test
```

The test spec loads predefined YAML test and perform the test on the generators.

---

## Generated class design patten

There are 3 types of generated Typescript files: `Class`, `Enum`, `Helper`. The creation of each file follows the flow of common manual Typescript class generation: `license boilerplate` -> `class header` -> `constructor method` -> `other methods` -> `class footer`

- `Class`: See [ClassGenerator.ts](src/ClassGenerator.ts)

    1. Each class has the same 3 fundamental method structure: `Constructor`, `Deserializer`, `Serializer` and `Size property`
    2. Classes contain `inline` disposition attributes also has a parameter interface declared for passing flattened inline parameters into the constructor.
    3. All classes **implements** a static interface: `Serializer` which defines the none static methods and public properties.

        ```typescript
        export interface Serializer {
            /**
            * Serializes an object to bytes.
            *
            * @returns Serialized bytes.
            */
            serialize(): Uint8Array;

            /**
            * Gets the size of the object.
            *
            * @returns Size in bytes.
            */
            readonly size: number;
        }
        ```

    4. The **First** `creatable` inline class defined in the class schema will be used as the `super class`.

        Most comment ones are transactions:

        ```typescript
        export class AccountKeyLinkTransaction extends Transaction implements Serializer
        ```

        > **NOTE:**
        > None creatable classes includes: `[SizePrefixedEntity, VerifiableEntity, EntityBody, EmbeddedTransactionHeader]`.
        > These exclusion entities only contain calculated fields e.g. `size`, `reserved padding` etc...
        >
- `Enum:` See [EnumGenerator.ts](src/EnumGenerator.ts)

    Standard Typescript key value pairs.

    ``` typescript
    export enum LinkAction {
        /**
         * unlink account
        */
        UNLINK = 0,
        /**
         * link account
        */
        LINK = 1,
    }
    ```

- `Helper classes:` See [TransactionHelperGenerator.ts](src/TransactionHelperGenerator.ts)

    1. `Utils.ts`: which defines all type conversion, buffer operation and array manipulation methods used in Serialize and Deserialize methods.
    2. `EmbeddedTransactionHelper.ts`: which is used in `Aggregate Transaction` deserialization to help deserializing each embedded transaction.

        > **NOTE:**
        > `EmbeddedTransactionHelper.ts` helper class is used in the generated code in `AggregateTransactionBody`.
    3. `TransactionHelper.ts`: similar to the EmbeddedTransactionHelper which is created to help deserializing transactions but is **not** used in the generated codes (to improve the usability in the sdk).

---

## Generated method design patten

- `Constructor:`

  - Parameters are either single field or flattened inline entity parameters.

    ``` typescript
    constructor({
            signature,
            signerPublicKey,
            version,
            network,
            type,
            fee,
            deadline,
            recipientAddress,
            mosaics,
            message,
        }: TransferTransactionParams) {
            super({ signature, signerPublicKey, version, network, type, fee, deadline });
            this.transferTransactionBody = new TransferTransactionBody({ recipientAddress, mosaics, message });
    }
    ```

    When loading the YAML schema file, each class schema gets parsed into the [schema](src/interface/schema) and [layout](src/interface/layout) as the 'raw' input. The parsed schema then get recursively read into the final [parameter](src/interface/parameter) list. The parameters have the sanitized name, type, size and comments depending on their type/disposition/condition values. A declarable flag is added to each parameter to decide whether or not to declare it in the constructor.

    > **NOTE:**
    > `Non declarable` parameters are not included in the constructor. Non declarable includes: `size/count used in array disposition`, `reserved` and `constants`

    Super class is also decided per each class schema.

    > **NOTE:**
    > `super` call is required when super class exists.

- `Deserialize:`

  - Deserialize is `static`.
  - The deserializer splices the whole payload buffer by each parameter's size in the specific order defined by the schema, until all payload bytes are processed. The size of the parameter can be either a static number size or calculated by it's type/disposition value. The basic 'actual size' of each parameter at this stage has been calculated in previous operations. Additional calculations based conditions and disposition values are also performed here.

    > **NOTE:**
    > `Equal conditions` such as `equals/not equals` requires a placeholder crated in Typescript static method so that the buffer array splice can read the correct buffer bytes. The actual condition blocks has to be placed after the `condition_value` parameter(s) deserialized.

  - `Non declarable` parameters are **Required**.
  - Example deserialize method:

    ```typescript
    /**
     * Creates an instance of NamespaceRegistrationTransactionBody from binary payload
     * @param payload - byte payload to use to serialize the object
     * @returns Creates an instance of NamespaceRegistrationTransactionBody from binary payload
     */
    public static deserialize(payload: Uint8Array): NamespaceRegistrationTransactionBody {
        const byteArray = Array.from(payload);
        const registrationTypeBytes = Utils.getBytes(Uint8Array.from(byteArray), 8);
        byteArray.splice(0, 8);
        const id = NamespaceId.deserialize(Uint8Array.from(byteArray));
        byteArray.splice(0, id.size);
        const registrationType = Utils.bufferToUint8(Uint8Array.from(byteArray));
        byteArray.splice(0, 1);
        const nameSize = Utils.bufferToUint8(Uint8Array.from(byteArray));
        byteArray.splice(0, 1);
        const name = Utils.getBytes(Uint8Array.from(byteArray), nameSize);
        byteArray.splice(0, nameSize);
        let duration: BlockDuration | undefined;
        if (registrationType === NamespaceRegistrationType.ROOT) {
            duration = BlockDuration.deserialize(registrationTypeBytes);
        }
        let parentId: NamespaceId | undefined;
        if (registrationType === NamespaceRegistrationType.CHILD) {
            parentId = NamespaceId.deserialize(registrationTypeBytes);
        }
        return new NamespaceRegistrationTransactionBody({
            duration: duration,
            parentId: parentId,
            id: id,
            registrationType: registrationType,
            name: name,
        });
    }
    ```

  - **Special inline parameter: EmbeddedTransaction**
    `EmbeddedTransaction` is treated as a special case here since the deserialize need to parse each embedded transaction as a standalone transaction entity. Thus the generator uses a static helper file `EmbeddedTransactionHelper.ts` to archive this. This case is only applied in `AggregateTransactionBody`.

    Example of the usage:

    ```typescript
    /**
     * Creates an instance of AggregateTransactionBody from binary payload
     * @param payload - byte payload to use to serialize the object
     * @returns Creates an instance of AggregateTransactionBody from binary payload
     */
    public static deserialize(payload: Uint8Array): AggregateTransactionBody {
        const byteArray = Array.from(payload);
        const transactionsHash = Hash256.deserialize(Uint8Array.from(byteArray));
        byteArray.splice(0, transactionsHash.size);
        const payloadSize = Utils.bufferToUint32(Uint8Array.from(byteArray));
        byteArray.splice(0, 4);
        Utils.bufferToUint32(Uint8Array.from(byteArray));
        byteArray.splice(0, 4);
        const transactions: EmbeddedTransaction[] = Utils.deserializeRemaining(
            EmbeddedTransactionHelper.deserialize,
            Uint8Array.from(byteArray),
            payloadSize,
            8,
        );
        byteArray.splice(0, transactions.reduce((sum, c) => sum + Utils.getSizeWithPadding(c.size, 8), 0));
        const cosignatures: Cosignature[] = Utils.deserializeRemaining(
            Cosignature.deserialize,
            Uint8Array.from(byteArray),
            byteArray.length,
            0,
        );
        byteArray.splice(0, cosignatures.reduce((sum, c) => sum + Utils.getSizeWithPadding(c.size, 0), 0));
        return new AggregateTransactionBody({ transactionsHash: transactionsHash, transactions: transactions, cosignatures: cosignatures });
    }
    ```

- `Serialize:`

  - Serialize is similar to Deserialize but it is not a static method. In a reserved manner, it serialize each class parameter in the order defined by the schema.
  - Buffer serialize method also depends on each parameter's type, condition and disposition value.
  - `Non declarable` parameters are **Required**.
  - Example serialize method:

    ```typescript
    /**
     * Serializes an object to bytes
     * @returns Serializes an object to bytes
     */
    public serialize(): Uint8Array {
        let newArray = new Uint8Array();
        if (this.registrationType === NamespaceRegistrationType.ROOT) {
            const durationBytes = this.duration!.serialize();
            newArray = Utils.concatTypedArrays(newArray, durationBytes);
        }
        if (this.registrationType === NamespaceRegistrationType.CHILD) {
            const parentIdBytes = this.parentId!.serialize();
            newArray = Utils.concatTypedArrays(newArray, parentIdBytes);
        }
        const idBytes = this.id.serialize();
        newArray = Utils.concatTypedArrays(newArray, idBytes);
        const registrationTypeBytes = Utils.uint8ToBuffer(this.registrationType);
        newArray = Utils.concatTypedArrays(newArray, registrationTypeBytes);
        const nameSizeBytes = Utils.uint8ToBuffer(this.name.length);
        newArray = Utils.concatTypedArrays(newArray, nameSizeBytes);
        const nameBytes = this.name;
        newArray = Utils.concatTypedArrays(newArray, nameBytes);
        return newArray;
    }
    ```

- `Size getter:`

  - Each class contains a public get property `size` to replace the `SizePrefixedEntity` and also used for serialize/deserialize processes. The getter calculates the `actual size` of each class parameters (either size in number or EntityStruct.size).
  - Similar to the other 2 class methods, conditions, disposition values are also considered when calculating the actual size.
  - `Non declarable` parameters are **Required**.
  - Example size getter:

    ```typescript
    /**
     * Gets the size of the object
     * @returns Gets the size of the object
     */
    public get size(): number {
        let size = 0;
        if (this.registrationType === NamespaceRegistrationType.ROOT) {
            size += this.duration!.size; // duration;
        }
        if (this.registrationType === NamespaceRegistrationType.CHILD) {
            size += this.parentId!.size; // parentId;
        }
        size += this.id.size; // id;
        size += 1; // registrationType;
        size += 1; // nameSize;
        size += this.name.length; // name;
        return size;
    }

    ```

---

## Other miscellaneous design patten

- Required imports are dynamically loaded and created in each class.
- Comments read from the schema are sanitized. `\` is replaced as it is not Typescript friendly in comments.
- Comment line are wrapped to allow max of 140 characters per line.
- NPM project configuration files and other `.ignore` files are copied as static files to the output folder.
- Test vector files are also copied as static files to the output folder for final output file validation purposes.
- License boilerplate are injected to the top of each generated files.
