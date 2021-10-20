import { GeneratorBase } from './GeneratorBase';
import { Helper } from './Helper';
import { Schema } from './interface/schema';

export class EnumGenerator extends GeneratorBase {
    private generatedLines: string[];

    /**
     * Constructor
     * @param classSchema - schema of the class to be generated
     * @param schema - schema list
     */
    constructor(public readonly classSchema: Schema, schema: Schema[]) {
        super(schema);
        this.generatedLines = this.getClassHeader(this.classSchema);
    }

    /**
     * Generate enum
     * @returns generated file content
     */
    public generate(): string[] {
        this.writeKeyValuePair();
        Helper.writeLines('}', this.generatedLines);
        return this.generatedLines;
    }

    /**
     * Write key value pair to the generated file
     */
    private writeKeyValuePair(): void {
        this.classSchema.values.forEach((value) => {
            Helper.writeLines(this.generateComment(value.comments, 1), this.generatedLines);
            Helper.writeLines(Helper.indent(`${value.name} = ${value.value},`, 1), this.generatedLines);
        });
    }
}
