import { Helper } from './Helper';
import { Schema } from './interface/schema';

/**
 * The helper class is used in typescript sdk to deserialize the embedded transactions
 */
export class TransactionHelperGenerator {
    /**
     * Constructor
     * @param helperType - helper class type
     * @param schemas - schemas
     * @param destination - file generation location
     */
    constructor(public readonly helperType: string, public readonly schemas: Schema[], public readonly destination: string) {}

    /**
     * Generate helper classes
     */
    public generate(): void {
        const generatedLines: string[] = [];
        const importLines: string[] = [this.helperType, 'TransactionType'];
        const bodyLines = this.generateHelperClassBody(importLines);

        Helper.writeLines(Helper.getLicense(), generatedLines, true);
        importLines
            .sort((a, b) => a.localeCompare(b))
            .forEach((item) => {
                Helper.writeLines(`import { ${item} } from './${item}';`, generatedLines);
            });
        Helper.writeLines('', generatedLines);
        Helper.writeLines(this.generateHelperClassHeader(), generatedLines);
        Helper.writeLines(bodyLines, generatedLines);
        Helper.writeLines(this.generateHelperClassFooter(), generatedLines);

        Helper.writeToFile(`${this.helperType}Helper.ts`, this.destination, generatedLines, []);
    }

    /**
     * Generate helper class header lines
     * @returns Generated class header lines
     */
    private generateHelperClassHeader(): string[] {
        const generatedLines: string[] = [];
        Helper.writeLines(`export class ${this.helperType}Helper {`, generatedLines);
        Helper.writeLines(Helper.indent(`public static deserialize(payload: Uint8Array): ${this.helperType} {`, 1), generatedLines);
        Helper.writeLines(Helper.indent(`const header = ${this.helperType}.deserialize(payload);`, 2), generatedLines);
        return generatedLines;
    }

    /**
     * Generate helper class body
     * @param importLines - Required import lines
     * @returns Generated helper class body
     */
    private generateHelperClassBody(importLines: string[]): string[] {
        const generatedLines: string[] = [];
        this.schemas
            .filter((schema) => {
                return (
                    schema.name !== this.helperType &&
                    schema.name.endsWith('Transaction') &&
                    (this.helperType === 'Transaction' ? !schema.name.startsWith('Embedded') : schema.name.startsWith('Embedded'))
                );
            })
            .forEach((schema) => {
                const transactionName = schema.name;
                const transactionType = schema.layout.find((layout) => layout.name === 'TRANSACTION_TYPE')?.value as string;
                const transactionVersion = schema.layout.find((layout) => layout.name === 'TRANSACTION_VERSION')?.value as number;
                generatedLines.push(...this.generateDeserializeLines(transactionName, transactionType, transactionVersion));
                importLines.push(schema.name);
            });
        return generatedLines;
    }

    /**
     * Generate helper function lines per transaction
     * @param transactionName - Transaction class name
     * @param transactionType - Transaction type constant
     * @param transactionVersion - Transaction version constant
     * @returns helper class method lines
     */
    private generateDeserializeLines(transactionName: string, transactionType: string, transactionVersion: number): string[] {
        const generatedLines: string[] = [];
        Helper.writeLines(
            Helper.indent(`if (header.type === TransactionType.${transactionType} && header.version === ${transactionVersion}) {`, 2),
            generatedLines,
        );
        Helper.writeLines(Helper.indent(`return ${transactionName}.deserialize(payload);`, 3), generatedLines);
        Helper.writeLines(Helper.indent(`}`, 2), generatedLines);
        return generatedLines;
    }

    private generateHelperClassFooter(): string[] {
        const generatedLines: string[] = [];
        Helper.writeLines(Helper.indent(`return header;`, 2), generatedLines);
        Helper.writeLines(Helper.indent(`}`, 1), generatedLines);
        Helper.writeLines(`}`, generatedLines);
        return generatedLines;
    }
}
