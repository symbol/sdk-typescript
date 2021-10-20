import { GeneratorBase } from './GeneratorBase';
import { Helper } from './Helper';
import { Parameter } from './interface/parameter';
import { Schema } from './interface/schema';

export class MethodGenerator extends GeneratorBase {
    /**
     * Constructor
     * @param classSchema - schema of the method to be generated
     * @param schema - schema list
     * @param flattenedInlineParameters - flattened inline parameters
     */
    constructor(public readonly classSchema: Schema, schema: Schema[], public readonly flattenedInlineParameters: Parameter[]) {
        super(schema);
    }

    /**
     * Generate constructor
     * @param params - parameter list
     * @param superClass - super class name
     * @returns generated constructor lines
     */
    public generateConstructor(params: Parameter[], superClass?: string): string[] {
        const generatedLines: string[] = [];
        Helper.writeLines(this.generateComment('Constructor', 1, this.getParamCommentLines(params)), generatedLines);
        // Constructor header
        if (params.length === 1) {
            Helper.writeLines(Helper.indent(`constructor(${params[0].generatedName}: ${params[0].type}) {`, 1), generatedLines);
        } else {
            Helper.writeLines(
                this.wrapLines(
                    Helper.indent('constructor({ ', 1),
                    this.flattenedInlineParameters
                        .filter((param) => param.declarable)
                        .map((param) => param.generatedName)
                        .join(', '),
                    ` }: ${this.classSchema.name}Params) {`,
                    1,
                ),
                generatedLines,
            );
        }
        // Constructor params
        params
            .filter((param) => param.declarable)
            .forEach((param) => {
                if (Helper.isInline(param.disposition)) {
                    const inlineParams = this.flattenedInlineParameters
                        .filter((inlineParam) => inlineParam.declarable && inlineParam.inlineClass === param.type)
                        .map((p) => p.generatedName);
                    const paramLine = inlineParams.length > 1 ? `{ ${inlineParams.join(', ')} }` : inlineParams.join(', ');
                    if (superClass && superClass === param.type) {
                        Helper.writeLines(Helper.indent(`super(${paramLine});`, 2), generatedLines);
                    } else {
                        Helper.writeLines(
                            // Helper.indent(`this.${param.generatedName} = new ${param.type}(${paramLine});`, 2),
                            this.wrapLines(
                                Helper.indent(`this.${param.generatedName} = new ${param.type}(${inlineParams.length > 1 ? '{ ' : ''}`, 2),
                                inlineParams.join(', '),
                                `${inlineParams.length > 1 ? ' }' : ''});`,
                                2,
                            ),
                            generatedLines,
                        );
                    }
                } else {
                    Helper.writeLines(Helper.indent(`this.${param.generatedName} = ${param.generatedName};`, 2), generatedLines);
                }
            });
        Helper.writeLines(Helper.indent(`}`, 1), generatedLines, true);
        return generatedLines;
    }

    /**
     * Generate size getter
     * @param params - parameter list
     * @param superClass - super class name
     * @returns generated size getter lines
     */
    public generateSizeGetter(params: Parameter[], superClass?: string): string[] {
        const generatedLines: string[] = [];
        Helper.writeLines(this.generateComment('Gets the size of the object', 1, [], 'Size in bytes'), generatedLines);
        Helper.writeLines(Helper.indent(`public get size(): number {`, 1), generatedLines);
        Helper.writeLines(this.getGetterLines(params, superClass), generatedLines);
        Helper.writeLines(Helper.indent(`}`, 1), generatedLines, true);
        return generatedLines;
    }

    /**
     * Generate deserializer
     * @param params - parameter list
     * @param superClass - super class name
     * @returns generated deserializer lines
     */
    public generateDeserializer(params: Parameter[], superClass?: string): string[] {
        const generatedLines: string[] = [];
        // Deserializer method comments
        Helper.writeLines(
            this.generateComment(
                `Creates an instance of ${this.classSchema.name} from binary payload`,
                1,
                this.wrapComment(`@param payload - byte payload to use to serialize the object`, 1),
                `Instance of ${this.classSchema.name}`,
            ),
            generatedLines,
        );
        // Deserializer header
        Helper.writeLines(Helper.indent(`public static deserialize(payload: Uint8Array): ${this.classSchema.name} {`, 1), generatedLines);
        // Deserializer body
        Helper.writeLines(this.getParamDeserializeLines(params, superClass), generatedLines);
        // Deserializer footer
        if (params.length == 1) {
            Helper.writeLines(
                Helper.indent(`return new ${this.classSchema.name}(${params.map((p) => Helper.toCamel(p.generatedName)).join(', ')});`, 2),
                generatedLines,
            );
        } else {
            Helper.writeLines(
                this.wrapLines(
                    Helper.indent(`return new ${this.classSchema.name}({ `, 2),
                    this.flattenedInlineParameters
                        .filter((param) => param.declarable)
                        .map((param) => {
                            if (superClass && superClass === param.inlineClass) {
                                return `${param.generatedName}: superObject.${param.generatedName}`;
                            } else {
                                return `${param.generatedName}: ${
                                    param.inlineClass ? `${Helper.toCamel(param.inlineClass)}.${param.generatedName}` : param.generatedName
                                }`;
                            }
                        })
                        .join(', '),
                    ' });',
                    2,
                ),
                generatedLines,
            );
        }
        Helper.writeLines(Helper.indent(`}`, 1), generatedLines, true);
        return generatedLines;
    }

    /**
     * Generate serializer
     * @param params - parameter list
     * @param superClass - super class name
     * @returns generated serializer lines
     */
    public generateSerializer(params: Parameter[], superClass?: string): string[] {
        const generatedLines: string[] = [];
        Helper.writeLines(this.generateComment('Serializes an object to bytes', 1, [], 'Serialized bytes'), generatedLines);
        Helper.writeLines(Helper.indent(`public serialize(): Uint8Array {`, 1), generatedLines);
        Helper.writeLines(this.getParamSerializeLines(params, superClass), generatedLines);
        Helper.writeLines(Helper.indent(`}`, 1), generatedLines);
        return generatedLines;
    }

    //#region Private Methods
    /**
     * Generate parameter comment line
     * @param params - parameter list
     * @returns generated comments
     */
    private getParamCommentLines(params: Parameter[]): string[] {
        const lines: string[] = [];
        params
            .filter((param) => param.declarable)
            .forEach((param) => {
                Helper.writeLines(this.wrapComment(`@param ${param.generatedName} - ${param.comments}`, 1), lines);
            });
        return lines;
    }

    /**
     * Generate size getter lines
     * @param params - parameter list
     * @param superClass - super class name
     * @returns generated size getter lines
     */
    private getGetterLines(params: Parameter[], superClass?: string): string[] {
        const generatedLines: string[] = [];
        if (params.length === 1 && !Helper.isArray(params[0].disposition)) {
            Helper.writeLines(Helper.indent(`return ${params[0].actualSize};`, 2), generatedLines);
        } else {
            Helper.writeLines(Helper.indent(`let size = 0;`, 2), generatedLines);
            let sizeLine = '';
            params
                .filter((param) => !Helper.isConst(param.disposition))
                .forEach((param) => {
                    if (superClass && superClass === param.type) {
                        sizeLine = 'super.size';
                    } else {
                        const parentSchema = this.schema.find((schema) => schema.name === Helper.stripArrayType(param.type));
                        if (!param.actualSize) {
                            if (Helper.shouldGenerateClass(param.type)) {
                                if (parentSchema && Helper.isEnum(parentSchema.type)) {
                                    sizeLine = (parentSchema.size as number).toString();
                                } else {
                                    sizeLine = `this.${param.generatedName}${param.condition ? '!' : ''}.size`;
                                }
                            }
                        } else {
                            sizeLine = param.actualSize.toString();
                        }
                        // Handle arrays
                        if (Helper.isArray(param.disposition)) {
                            let sizeMethod = param.element_disposition
                                ? '.length'
                                : `.reduce((sum, c) => sum + Utils.getSizeWithPadding(c.size, ${
                                      param.type === 'EmbeddedTransaction[]' ? '8' : '0'
                                  }), 0)`;
                            // Check enum array

                            if (parentSchema && Helper.isEnum(parentSchema.type)) {
                                sizeMethod = `.reduce((sum) => sum + ${parentSchema.size}, 0)`;
                            }

                            sizeLine = `this.${param.generatedName}${sizeMethod}`;
                        }
                    }
                    Helper.writeLines(
                        this.applyCondition(param, params, [`size += ${sizeLine}; // ${param.generatedName};`], 2),
                        generatedLines,
                    );
                });
            Helper.writeLines(Helper.indent(`return size;`, 2), generatedLines);
        }
        return generatedLines;
    }

    /**
     * Generate deserializer lines
     * @param params - param list
     * @param superClass - super class name
     * @returns generated deserializer lines
     */
    private getParamDeserializeLines(params: Parameter[], superClass?: string): string[] {
        const generatedLines: string[] = [];
        let argument = 'Uint8Array.from(payload)';
        if (params.length === 1 && !params[0].disposition?.endsWith('array')) {
            const method = this.getDeserializeUtilMethodByType(params[0].type, argument, params[0].actualSize);
            Helper.writeLines(Helper.indent(`const ${params[0].generatedName} = ${method}`, 2), generatedLines);
        } else {
            Helper.writeLines(Helper.indent(`const byteArray = Array.from(payload);`, 2), generatedLines);
            const appliedPlaceholder: string[] = [];
            const bottomConditionLines: string[] = []; // Conditions need to be placed at the rear of the deserialize block in TS
            params
                .filter((param) => !Helper.isConst(param.disposition))
                .forEach((param) => {
                    if (superClass && superClass === param.type) {
                        Helper.writeLines(
                            Helper.indent(`const superObject = ${superClass}.deserialize(Uint8Array.from(byteArray));`, 2),
                            generatedLines,
                        );
                        Helper.writeLines(Helper.indent(`byteArray.splice(0, superObject.size);`, 2), generatedLines);
                    } else {
                        const bodyLines: string[] = [];
                        const parentSchema = this.schema.find((schema) => schema.name === param.type);
                        let spliceLines = [
                            `byteArray.splice(0, ${
                                param.actualSize !== undefined || (parentSchema && Helper.isEnum(parentSchema.type))
                                    ? param.actualSize
                                    : `${param.generatedName}.size`
                            });`,
                        ];
                        argument = 'Uint8Array.from(byteArray)';
                        // Handle enum
                        const type = parentSchema && Helper.isEnum(parentSchema.type) ? 'enum' : param.type;
                        const method = this.getDeserializeUtilMethodByType(type, argument, param.actualSize);

                        let bodyLine = [`${param.condition ? '' : 'const '}${param.generatedName} = ${method}`];
                        // Handle Reserved
                        if (Helper.isReserved(param.disposition)) {
                            bodyLine = [method];
                        }
                        //Handle array
                        if (Helper.isArray(param.disposition)) {
                            const isEmbeddedTransaction = Helper.isEmbeddedTransaction(param.type);
                            let reduceLine = `${param.generatedName}.reduce((sum, c) => sum + c.size, 0)`;
                            // Fill Array / Sized Array
                            if (Helper.isFillArray(param.disposition) || Helper.isSizedArray(param.disposition)) {
                                bodyLine = [`const ${param.generatedName}: ${param.type} = Utils.deserializeRemaining(`];
                                bodyLine.push(
                                    Helper.indent(
                                        `${
                                            isEmbeddedTransaction ? 'EmbeddedTransactionHelper' : Helper.stripArrayType(param.type)
                                        }.deserialize,`,
                                        1,
                                    ),
                                );
                                bodyLine.push(Helper.indent('Uint8Array.from(byteArray),', 1));
                                bodyLine.push(
                                    Helper.indent(
                                        `${isEmbeddedTransaction ? Helper.toCamel(param.size as string) : 'byteArray.length'},`,
                                        1,
                                    ),
                                );
                                bodyLine.push(Helper.indent(`${Helper.getArrayDeserializeAlignment(param.type)},`, 1));
                                bodyLine.push(');');
                                reduceLine = `${
                                    param.generatedName
                                }.reduce((sum, c) => sum + Utils.getSizeWithPadding(c.size, ${Helper.getArrayDeserializeAlignment(
                                    param.type,
                                )}), 0)`;
                            } else if (param.size) {
                                if (param.type === 'Uint8Array') {
                                    bodyLine = [
                                        `const ${param.generatedName} = Utils.getBytes(Uint8Array.from(byteArray), ${Helper.toCamel(
                                            param.size?.toString(),
                                        )});`,
                                    ];
                                    reduceLine = `${Helper.toCamel(param.size?.toString())}`;
                                } else {
                                    const parentSchema = this.schema.find((schema) => schema.name === Helper.stripArrayType(param.type));
                                    if (parentSchema && Helper.isEnum(parentSchema.type)) {
                                        bodyLine = this.wrapLines(
                                            `const ${param.generatedName} = Utils.deserializeEnums(`,
                                            [
                                                'Uint8Array.from(byteArray)',
                                                `${Helper.toCamel(param.size?.toString())}`,
                                                `${parentSchema.size}`,
                                            ].join(', '),
                                            ');',
                                            0,
                                        );
                                        reduceLine = `${param.generatedName}.reduce((sum) => sum + ${parentSchema.size}, 0)`;
                                    } else {
                                        if (isEmbeddedTransaction) {
                                            // If embedded transaction, user the helper
                                            bodyLine = this.wrapLines(
                                                `const ${param.generatedName}: ${param.type} = Utils.deserializeRemaining(`,
                                                [
                                                    `EmbeddedTransactionHelper.deserialize`,
                                                    'Uint8Array.from(byteArray)',
                                                    `${Helper.toCamel(param.size?.toString())}`,
                                                    '8',
                                                ].join(', '),
                                                ');',
                                                0,
                                            );
                                            reduceLine = `${param.generatedName}.reduce((sum, c) => sum + Utils.getSizeWithPadding(c.size, 8), 0)`;
                                        } else {
                                            bodyLine = this.wrapLines(
                                                `const ${param.generatedName} = Utils.deserialize(`,
                                                [
                                                    `${Helper.stripArrayType(param.type)}.deserialize`,
                                                    'Uint8Array.from(byteArray)',
                                                    `${Helper.toCamel(param.size?.toString())}`,
                                                ].join(', '),
                                                ');',
                                                0,
                                            );
                                        }
                                    }
                                }
                            }
                            spliceLines = this.wrapLines('byteArray.splice(', ['0', reduceLine].join(', '), ');', 0);
                        }
                        // Condition place holder
                        if (this.checkIfPlaceholderConditionLineNeeded(param, params)) {
                            if (!appliedPlaceholder.find((placeholder) => placeholder === param.condition)) {
                                Helper.writeLines(this.getDeserializeConditionPlaceHolder(param), generatedLines);
                                appliedPlaceholder.push(param.condition ?? '');
                            }
                            bottomConditionLines.push(
                                ...this.getBottomConditionBodyLines(param, params, Helper.toCamel(param.condition ?? '') + 'Bytes'),
                            );
                        } else {
                            Helper.writeLines(bodyLine, bodyLines);
                            Helper.writeLines(spliceLines, bodyLines);
                            Helper.writeLines(this.applyCondition(param, params, bodyLines, 2, true, true), generatedLines);
                        }
                    }
                });
            generatedLines.push(...bottomConditionLines);
        }
        return generatedLines;
    }

    /**
     * Generate serializer lines
     * @param params - parameter list
     * @param superClass - super class name
     * @returns generated serializer lines
     */
    private getParamSerializeLines(params: Parameter[], superClass?: string): string[] {
        const generatedLines: string[] = [];
        if (params.length === 1 && !Helper.isArray(params[0].disposition)) {
            const method = this.getSerializeUtilMethodByType(params[0].type, 'this.' + params[0].generatedName, params[0].actualSize);
            Helper.writeLines(Helper.indent(`return ${method}`, 2), generatedLines);
        } else {
            Helper.writeLines(Helper.indent(`let newArray = new Uint8Array();`, 2), generatedLines);
            params
                .filter((param) => !Helper.isConst(param.disposition))
                .forEach((param) => {
                    if (superClass && superClass === param.type) {
                        Helper.writeLines(Helper.indent(`const superBytes = super.serialize();`, 2), generatedLines);
                        Helper.writeLines(Helper.indent(`newArray = Utils.concatTypedArrays(newArray, superBytes);`, 2), generatedLines);
                    } else {
                        const bodyLines: string[] = [];
                        let type = param.type;
                        let name = `this.${param.generatedName}${param.condition ? '!' : ''}`;
                        if (name.endsWith('Size')) {
                            name = name.replace('Size', '.length').replace('Count', '.length');
                        }
                        // Handle reserved field
                        if (param.disposition && param.disposition === 'reserved') {
                            name = param.value as string;
                        }
                        // Handle size / count
                        if (param.name?.endsWith('_size') || param.name?.endsWith('_count')) {
                            const parentParam = params.find((parent) => param.name && parent.size === param.name);
                            if (parentParam) {
                                if (parentParam.disposition === 'array sized') {
                                    const sizedArrayMethod = this.getSerializeUtilMethodByType(
                                        'arraySize',
                                        `this.${parentParam.generatedName}`,
                                        parentParam.type === 'EmbeddedTransaction[]' ? 8 : 0,
                                        param.disposition,
                                    );
                                    Helper.writeLines(`const ${param.generatedName} = ${sizedArrayMethod}`, bodyLines);
                                    name = param.generatedName;
                                } else {
                                    name = `this.${parentParam.generatedName}${param.condition ? '!' : ''}.length`;
                                }
                            }
                        } else if (param.name === 'size') {
                            const elementParam = params.find((parent) => parent.size && parent.size === param.name);
                            if (elementParam?.element_disposition) {
                                name = `this.${elementParam?.name}.length`;
                            }
                        }

                        // Handle enum & array
                        const parentSchema = this.schema.find((schema) => schema.name === Helper.stripArrayType(param.type));
                        if (parentSchema && Helper.isEnum(parentSchema.type)) {
                            if (!Helper.stripArrayType(param.type).endsWith('Flags')) {
                                type = 'enum';
                            }
                            if (param.disposition && Helper.isArray(param.disposition)) {
                                type = 'enumArray';
                            }
                        }
                        const method = this.getSerializeUtilMethodByType(type, name, param.actualSize, param.disposition);
                        Helper.writeLines(`const ${param.generatedName}Bytes = ${method}`, bodyLines);
                        Helper.writeLines(`newArray = Utils.concatTypedArrays(newArray, ${param.generatedName}Bytes);`, bodyLines);
                        Helper.writeLines(this.applyCondition(param, params, bodyLines, 2), generatedLines);
                    }
                });
            Helper.writeLines(Helper.indent(`return newArray;`, 2), generatedLines);
        }
        return generatedLines;
    }

    /**
     * Apply conditions
     * @param param - condition param
     * @param params - parameter list
     * @param bodyLines - condition body lines
     * @param indentCount - indentation count
     * @param useLocal - is using local var
     * @param declareUndefined - declare undefined var
     * @returns generate condition lines
     */
    private applyCondition(
        param: Parameter,
        params: Parameter[],
        bodyLines: string[],
        indentCount: number,
        localVar = false,
        declareUndefined = false,
    ): string[] {
        const lines: string[] = [];
        if (param.condition) {
            const conditionParamType = Helper.stripArrayType(
                params.find((condition) => condition.name && condition.name === param.condition)?.type ?? '',
            );
            const conditionLine = this.getConditionLine(param, conditionParamType, localVar);

            if (declareUndefined) {
                Helper.writeLines(Helper.indent(`let ${param.generatedName}: ${param.type} | undefined;`, indentCount), lines);
            }
            Helper.writeLines(Helper.indent(conditionLine, indentCount), lines);
            bodyLines.forEach((line) => {
                Helper.writeLines(Helper.indent(line, indentCount + 1), lines);
            });
            Helper.writeLines(Helper.indent('}', indentCount), lines);
        } else {
            bodyLines.forEach((line) => {
                Helper.writeLines(Helper.indent(line, indentCount), lines);
            });
        }
        return lines;
    }

    /**
     * Check is a place holder line is needed for condition params
     * @param param - parameter
     * @param params - parameter list
     * @returns True or False if a placeholder line is needed
     */
    private checkIfPlaceholderConditionLineNeeded(param: Parameter, params: Parameter[]): boolean {
        if (param.condition && param.condition_operation && param.condition_operation.endsWith('equals')) {
            const paramIndex = params.findIndex((p) => p.name === param.name);
            const conditionVarIndex = params.findIndex((p) => p.name === param.condition);
            return paramIndex < conditionVarIndex;
        }
        return false;
    }

    /**
     * Get the placeholder for conditional lines
     * @param param - parameter
     * @returns place holder lines
     */
    private getDeserializeConditionPlaceHolder(param: Parameter): string[] {
        if (Helper.isEqualKindCondition(param.condition, param.condition_operation)) {
            const generatedName = Helper.toCamel(param.condition) + 'Bytes';
            const parentParam = this.schema.find((schema) => schema.name === param.type);
            if (parentParam) {
                return [
                    Helper.indent(
                        `const ${generatedName} = ${this.getDeserializeUtilMethodByType(
                            'Uint8Array',
                            'Uint8Array.from(byteArray)',
                            parentParam.size,
                        )}`,
                        2,
                    ),
                    Helper.indent(`byteArray.splice(0, ${parentParam.size});`, 2),
                ];
            }
        }
        return [];
    }

    /**
     * Get the condition lines which will be placed at the bottom of the method body
     * @param param - parameter
     * @param params - parameter list
     * @param placeHolderName - place holder name string
     * @returns condition lines block
     */
    private getBottomConditionBodyLines(param: Parameter, params: Parameter[], placeHolderName: string): string[] {
        const bodyLines = [`${param.generatedName} = ${param.type}.deserialize(${placeHolderName});`];
        return this.applyCondition(param, params, bodyLines, 2, true, true);
    }
    //#endregion Private Methods
}
