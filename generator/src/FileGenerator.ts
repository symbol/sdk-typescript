import * as fs from 'fs-extra';
import { ClassGenerator } from './ClassGenerator';
import { EnumGenerator } from './EnumGenerator';
import { GeneratorBase } from './GeneratorBase';
import { Helper } from './Helper';
import { Schema } from './interface/schema';
import { TransactionHelperGenerator } from './TransactionHelperGenerator';
import path = require('path');

export class FileGenerator extends GeneratorBase {
    private licenseHeader: string[];
    private indexList: string[];
    /**
     * Constructor
     * @param schema - Schema list from catbuffer
     * @param destination - destination folder
     */
    constructor(schema: Schema[], public readonly destination: string) {
        super(schema);
        this.licenseHeader = Helper.getLicense();
        this.indexList = [];
    }

    /**
     * Generate files
     */
    public generate(): void {
        this.writeClassFiles();
        this.writeTransactionHelper();
        this.writeIndexFile();
        this.copyStaticFiles();
    }

    /**
     * Write class files from schema
     */
    private writeClassFiles(): void {
        this.schema.forEach((item) => {
            if (Helper.shouldGenerateClass(item.name)) {
                const filename = `${item.name}.ts`;
                if (Helper.isEnum(item.type)) {
                    Helper.writeToFile(filename, this.destination, new EnumGenerator(item, this.schema).generate(), this.licenseHeader);
                } else {
                    Helper.writeToFile(filename, this.destination, new ClassGenerator(item, this.schema).generate(), this.licenseHeader);
                }
                this.indexList.push(`export * from './${item.name}';`);
            }
        });
    }

    /**
     * Write transaction helper classes
     */
    private writeTransactionHelper(): void {
        ['Transaction', 'EmbeddedTransaction'].forEach((helperType) => {
            new TransactionHelperGenerator(helperType, this.schema, this.destination).generate();
            this.indexList.push(`export * from './${helperType}Helper';`);
        });
    }

    /**
     * Write index.ts file
     */
    private writeIndexFile(): void {
        Helper.writeToFile(
            'index.ts',
            this.destination,
            this.indexList.sort((a, b) => a.localeCompare(b)),
            this.licenseHeader,
        );
    }

    /**
     * Copy static files to destination directory
     */
    private copyStaticFiles(): void {
        fs.copyFileSync(path.join(__dirname, '/static/utils/Serializer.ts'), this.destination + '/Serializer.ts');
        fs.copyFileSync(path.join(__dirname, '/static/utils/Utils.ts'), this.destination + '/Utils.ts');
    }
}
