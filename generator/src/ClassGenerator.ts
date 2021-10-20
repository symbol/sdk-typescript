import { GeneratorBase } from './GeneratorBase';
import { Helper } from './Helper';
import { Layout } from './interface/layout';
import { Parameter } from './interface/parameter';
import { Schema } from './interface/schema';
import { MethodGenerator } from './MethodGenerator';

export class ClassGenerator extends GeneratorBase {
    private generatedLines: string[];
    private methodGenerator: MethodGenerator;
    private classParameters: Parameter[];
    private importList: string[];
    private flattenedInlineParameters: Parameter[];
    private superClassLayout: Layout | undefined;

    /**
     * Constructor
     * @param classSchema - schema of the class to be generated
     * @param schema - schema list
     */
    constructor(public readonly classSchema: Schema, schema: Schema[]) {
        super(schema);
        this.importList = ['Utils', 'Serializer'];
        this.generatedLines = [];
        this.classParameters = this.parseClassParameters(classSchema);
        this.flattenedInlineParameters = this.flattenedParameters();
        this.superClassLayout = this.getSuperClass();
        this.methodGenerator = new MethodGenerator(classSchema, schema, this.flattenedInlineParameters);
    }

    /**
     * Generate class
     * @returns generated file content
     */
    public generate(): string[] {
        Helper.writeLines(this.generateImports(), this.generatedLines, true);
        this.generateParameterInterface();
        Helper.writeLines(this.getClassHeader(this.classSchema, this.superClassLayout?.type), this.generatedLines);
        this.generatePublicVariables();
        Helper.writeLines(this.methodGenerator.generateConstructor(this.classParameters, this.superClassLayout?.type), this.generatedLines);
        Helper.writeLines(
            this.methodGenerator.generateDeserializer(this.classParameters, this.superClassLayout?.type),
            this.generatedLines,
        );
        Helper.writeLines(this.methodGenerator.generateSizeGetter(this.classParameters, this.superClassLayout?.type), this.generatedLines);
        Helper.writeLines(this.methodGenerator.generateSerializer(this.classParameters, this.superClassLayout?.type), this.generatedLines);
        Helper.writeLines('}', this.generatedLines);
        return this.generatedLines;
    }

    /**
     * Generate a list of public variable declaration statements
     * @returns list of public variables
     */
    private generatePublicVariables(): void {
        this.generateConstant();
        Helper.writeLines(this.generateParamTypePairLine('public readonly '), this.generatedLines, true);
    }

    /**
     * Parse class parameter from class schema
     * @param schema - class schema
     * @returns parsed parameters
     */
    private parseClassParameters(schema: Schema): Parameter[] {
        if (schema.layout) {
            return this.generateLayoutClassParams(schema);
        } else {
            return [this.generateSimpleClassParams(schema)];
        }
    }

    /**
     * Generate simple parameter which does not have layout
     * @param schema - class schema
     * @returns prepared parameter
     */
    private generateSimpleClassParams(schema: Schema): Parameter {
        Helper.addRequiredImport(this.importList, schema.type, schema.name);
        return {
            generatedName: Helper.toCamel(schema.name),
            type: Helper.getGeneratedType(schema.type, schema.size),
            comments: schema.comments ? schema.comments : schema.name,
            actualSize: schema.size,
            declarable: true,
            inlineClass: '',
        };
    }

    /**
     * Generate list of layout parameters
     * @param schema - class schema
     * @returns prepared parameters
     */
    private generateLayoutClassParams(schema: Schema): Parameter[] {
        const params: Parameter[] = [];
        schema.layout.forEach((layout) => {
            const generatedName = Helper.getGeneratedName(layout.name, layout.disposition);
            const actualSize = typeof layout.size === 'string' ? undefined : this.getRealLayoutSize(layout);
            layout.comments = layout.comments ? layout.comments : generatedName;
            if (!layout.disposition) {
                layout.type = Helper.getGeneratedType(layout.type, actualSize, layout.disposition);
                params.push({
                    generatedName,
                    actualSize,
                    declarable: this.shouldDeclareVariable(layout.name ?? '', schema.layout, layout.disposition),
                    inlineClass: '',
                    ...layout,
                });
                Helper.addRequiredImport(this.importList, layout.type, generatedName);
            } else {
                this.parseDispositionParam(schema, layout, params);
            }
        });
        return params;
    }

    /**
     * parse disposition type parameter
     * @param schema - class schema
     * @param layout - schema layout
     * @param params - parameter list
     */
    private parseDispositionParam(schema: Schema, layout: Layout, params: Parameter[]) {
        if (Helper.isInline(layout.disposition) && !Helper.shouldGenerateClass(layout.type)) {
            this.parseInlineLayout(layout, params);
        } else {
            layout.name = layout.name ? layout.name : layout.type;
            const generatedName = Helper.getGeneratedName(layout.name, layout.disposition);
            const actualSize = typeof layout.size === 'string' ? undefined : this.getRealLayoutSize(layout);
            layout.comments = Helper.sanitizeComment(generatedName, layout.comments);
            const param = {
                generatedName,
                actualSize,
                declarable: this.shouldDeclareVariable(layout.name ?? layout.type, schema.layout, layout.disposition),
                inlineClass: '',
                ...layout,
            };
            param.type = Helper.getGeneratedType(layout.type, actualSize, layout.disposition);
            params.push(param);
            Helper.addRequiredImport(this.importList, layout.type, generatedName, layout.disposition);
        }
    }

    /**
     * Generate inline parameters
     * @param layout - schema layout
     * @param params - class parameters
     */
    private parseInlineLayout(layout: Layout, params: Parameter[]) {
        const schema = this.schema.find((schema) => schema.name === layout.type);
        if (schema && schema.layout.length > 0) {
            schema.layout.forEach((param) => {
                if (Helper.isInline(param.disposition)) {
                    this.parseInlineLayout(param, params);
                } else {
                    const actualSize = typeof param.size === 'string' ? undefined : this.getRealLayoutSize(param);
                    const generatedName = Helper.getGeneratedName(param.name, param.disposition);
                    const parsedParam = {
                        generatedName,
                        actualSize,
                        declarable: this.shouldDeclareVariable(param.name ?? '', schema.layout, param.disposition),
                        inlineClass: '',
                        ...param,
                    };
                    parsedParam.type = Helper.getGeneratedType(param.type, actualSize, param.disposition);
                    parsedParam.comments = Helper.sanitizeComment(generatedName, param.comments);
                    params.push(parsedParam);
                    Helper.addRequiredImport(this.importList, parsedParam.type, generatedName, param.disposition);
                }
            });
        }
    }

    /**
     * Get the list of import statements
     * @returns import name list
     */
    private generateImports(): string[] {
        const lines: string[] = [];
        if (this.classSchema.name === 'AggregateTransactionBody') {
            this.importList.push('EmbeddedTransactionHelper');
        }
        this.importList
            .sort((a, b) => a.localeCompare(b))
            .forEach((item) => {
                lines.push(`import { ${item} } from './${item}';`);
            });
        return lines;
    }

    /**
     * Generate parameter interface
     */
    private generateParameterInterface(): void {
        if (this.classParameters.length > 1) {
            Helper.writeLines(this.generateComment(`Interface to create instances of ${this.classSchema.name}`, 0), this.generatedLines);
            Helper.writeLines(`export interface ${this.classSchema.name}Params {`, this.generatedLines);
            this.flattenedInlineParameters.forEach((param) => {
                Helper.writeLines(this.generateComment(param.comments, 1), this.generatedLines);
                Helper.writeLines(
                    Helper.indent(`${param.generatedName}${param.condition ? '?' : ''}: ${param.type};`, 1),
                    this.generatedLines,
                );
            });
            Helper.writeLines('}', this.generatedLines, true);
        }
    }

    /**
     * Get flattened parameter list
     * @returns flattened parameter list if inline disposition exists
     */
    private flattenedParameters(): Parameter[] {
        const parameters: Parameter[] = [];
        this.classParameters.forEach((param) => {
            if (param.disposition && param.disposition === 'inline') {
                const inlineSchema = this.schema.find((schema) => schema.name === param.type);
                if (inlineSchema) {
                    this.recursivelyParseInlineParameters(inlineSchema, param.type, parameters);
                }
            } else {
                if (param.declarable) {
                    parameters.push(param);
                    Helper.addRequiredImport(this.importList, param.type, param.generatedName);
                }
            }
        });
        return parameters;
    }

    private recursivelyParseInlineParameters(classSchema: Schema, inlineClassName = '', params: Parameter[] = []): void {
        this.parseClassParameters(classSchema).forEach((param) => {
            if (param.disposition && param.disposition === 'inline') {
                const inlineSchema = this.schema.find((schema) => schema.name === param.type);
                if (inlineSchema) {
                    this.recursivelyParseInlineParameters(inlineSchema, param.type, params);
                }
            } else {
                param.inlineClass = inlineClassName;
                if (param.declarable) {
                    params.push(param);
                    Helper.addRequiredImport(this.importList, param.type, param.generatedName);
                }
            }
        });
    }

    /**
     * Generate param - type pair declaration
     * @param prefix - prefix of the declaration
     * @returns lines of the declaration
     */
    private generateParamTypePairLine(prefix: string): string[] {
        const generatedLines: string[] = [];
        this.classParameters
            .filter((param) => param.declarable && param.type !== this.superClassLayout?.type)
            .forEach((param) => {
                Helper.writeLines(this.generateComment(param.comments, 1), generatedLines);
                Helper.writeLines(
                    Helper.indent(`${prefix}${param.generatedName}${param.condition ? '?' : ''}: ${param.type};`, 1),
                    generatedLines,
                );
            });
        return generatedLines;
    }

    /**
     * Generate constant parameter declaration line
     */
    private generateConstant(): void {
        this.classParameters
            .filter((param) => Helper.isConst(param.disposition))
            .forEach((param) => {
                const parentSchema = this.schema.find((schema) => schema.name === Helper.stripArrayType(param.type));
                if (parentSchema && Helper.isEnum(parentSchema.type)) {
                    param.value = parentSchema.values.find((value) => value.name === param.value)?.value;
                }
                Helper.writeLines(this.generateComment(param.comments, 1), this.generatedLines);
                Helper.writeLines(Helper.indent(`public readonly ${param.generatedName} = ${param.value};`, 1), this.generatedLines);
            });
    }

    /**
     * Get super class
     */
    private getSuperClass(): Layout | undefined {
        if (this.classSchema.layout) {
            return this.classSchema.layout.find((layout) => Helper.isInline(layout.disposition) && Helper.shouldGenerateClass(layout.type));
        }
        return undefined;
    }
}
