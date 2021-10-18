import { ConditionType, GeneratedBuildInType } from './Enums';
import { Helper } from './Helper';
import { Layout } from './interface/layout';
import { Parameter } from './interface/parameter';
import { Schema } from './interface/schema';
export class GeneratorBase {
    constructor(public readonly schema: Schema[]) {}

    /**
     * Should declare variable or not
     * @param name - name
     * @param disposition - parameter disposition
     * @returns should declare variable or not
     */
    public shouldDeclareVariable(name: string, layouts: Layout[], disposition?: string): boolean {
        // ignore constant, reserved and size
        if (Helper.isConst(disposition) || Helper.isReserved(disposition) || name === 'size') {
            return false;
        }
        if (name.endsWith('_count') || name.endsWith('_size')) {
            if (layouts.find((layout) => layout.size && layout.size === name)) {
                return false;
            }
            return true;
        }
        return true;
    }

    /**
     * Generate comment block
     * @param comment - comment line
     * @param indentCount - indentation count
     * @param paramLines - optional parameter lines
     * @param returns - optional return line
     * @returns prepared comment block
     */
    protected generateComment(comment: string, indentCount = 0, paramLines: string[] = [], returns?: string): string[] {
        const commentLines = [Helper.indent('/**', indentCount)];
        Helper.writeLines(this.wrapComment(comment, indentCount), commentLines);
        if (paramLines.length > 0) {
            Helper.writeLines(paramLines, commentLines);
        }
        if (returns) {
            Helper.writeLines(this.wrapComment(`@returns ${comment}`, indentCount), commentLines);
        }
        commentLines.push(Helper.indent(' */', indentCount));
        return commentLines;
    }

    /**
     * Generate class header
     * @param schema - schema definition
     * @param superClass - super class name
     * @returns generated class header definition
     */
    protected getClassHeader(schema: Schema, superClass?: string): string[] {
        const generatedLines: string[] = [];
        const classType = Helper.isEnum(schema.type) ? 'enum' : 'class';
        Helper.writeLines(this.generateComment(schema.comments ? schema.comments : schema.name), generatedLines);
        Helper.writeLines(
            `export ${classType} ${schema.name}${
                Helper.isEnum(classType) ? '' : ` ${superClass ? `extends ${superClass} ` : ''}implements Serializer`
            } {`,
            generatedLines,
        );
        return generatedLines;
    }

    /**
     * Try wrap comment if it exceeds max line length (140)
     * @param comment - Comment line
     * @param indentCount - Line indentation count
     * @returns Wrapped comment lines
     */
    public wrapComment(comment: string, indentCount = 0): string[] {
        // sensitize comment string to replace the '\' with '*'
        comment = comment.replace('\\', '*');
        const chunkSize = 137;
        const chunks: string[] = [];
        while (comment.length > 0) {
            //Keep the whole word when wrapping
            const chopIndex = comment.length > chunkSize ? comment.lastIndexOf(' ') : chunkSize;
            chunks.push(Helper.indent(' * ' + comment.substring(0, chopIndex), indentCount));
            comment = comment.substring(chopIndex + 1);
        }
        return chunks;
    }

    /**
     * Get the actual size of a type
     * @param layout - schema layout
     * @returns actual size of a type
     */
    public getRealLayoutSize(layout: Layout): number | undefined {
        if (typeof layout.size === 'string') {
            return undefined;
        } else if (layout.size && typeof layout.size === 'number') {
            return layout.size;
        } else {
            const parentSchema = this.schema.find((schema) => schema.name === layout.type);
            if (parentSchema) {
                return Helper.isEnum(parentSchema.type) ? parentSchema.size : undefined;
            }
            return undefined;
        }
    }

    /**
     * Wrap declaration line if it is too long
     * @param prefix - prefix
     * @param body - body
     * @param suffix - suffix
     * @param baseIndentCount - parent indentation count
     * @returns wrapped declaration lines
     */
    public wrapLines(prefix: string, body: string, suffix: string, baseIndentCount: number): string[] {
        const generatedLines: string[] = [];
        const singleLine = prefix + body + suffix;
        if (singleLine.length > 140) {
            Helper.writeLines(prefix.trimEnd(), generatedLines);
            Helper.writeLines(
                body.split(', ').map((line) => Helper.indent(line + ',', baseIndentCount + 1)),
                generatedLines,
            );
            Helper.writeLines(Helper.indent(suffix.trim(), baseIndentCount), generatedLines);
        } else {
            generatedLines.push(singleLine);
        }
        return generatedLines;
    }

    /**
     * Get deserializer method name by type
     * @param type - parameter type
     * @param argName - argument name
     * @param size - parameter size
     * @returns deserializer method name
     */
    public getDeserializeUtilMethodByType(type: string, argName: string, size?: number): string {
        type = Helper.stripArrayType(type);
        switch (type) {
            case 'Uint8Array':
                return `Utils.getBytes(${argName}, ${size});`;
            case 'number':
            case 'enum':
                if (size === 1) {
                    return `Utils.bufferToUint8(${argName});`;
                } else if (size === 2) {
                    return `Utils.bufferToUint16(${argName});`;
                } else {
                    return `Utils.bufferToUint32(${argName});`;
                }
            case 'bigint':
                return `Utils.bufferToBigInt(${argName});`;
            default:
                if (type.endsWith('Flags')) {
                    if (size === 1) {
                        return `Utils.toFlags(${type}, Utils.bufferToUint8(${argName}));`;
                    } else if (size === 2) {
                        return `Utils.toFlags(${type}, Utils.bufferToUint16(${argName}));`;
                    }
                    return `Utils.toFlags(${type}, Utils.bufferToUint8(${argName}));`;
                }
                return `${type}.deserialize(${argName});`;
        }
    }

    /**
     * Get serializer method by type
     * @param type - param type
     * @param name - param name
     * @param size - param name
     * @param disposition - param disposition
     * @returns serializer method text
     */
    public getSerializeUtilMethodByType(type: string, name: string, size?: number, disposition?: string): string {
        type = Helper.stripArrayType(type);
        switch (type) {
            case 'Uint8Array':
                return `${name};`;
            case 'number':
            case 'enum':
                if (size === 1) {
                    return `Utils.uint8ToBuffer(${name});`;
                } else if (size === 2) {
                    return `Utils.uint16ToBuffer(${name});`;
                } else {
                    return `Utils.uint32ToBuffer(${name});`;
                }
            case 'bigint':
                return `Utils.bigIntToBuffer(${name});`;
            case 'enumArray':
                return `Utils.writeListEnum(${name}, 0);`;
            case 'arraySize':
                return `${name}.reduce((sum, c) => sum + Utils.getSizeWithPadding(c.size, ${size}), 0);`;
            default:
                if (Helper.isArray(disposition)) {
                    return `Utils.writeList(${name}, ${type === 'EmbeddedTransaction' ? '8' : '0'});`;
                }
                if (type.endsWith('Flags')) {
                    if (size === 1) {
                        return `Utils.uint8ToBuffer(Utils.fromFlags(${type}, ${name}));`;
                    } else if (size === 2) {
                        return `Utils.uint16ToBuffer(Utils.fromFlags(${type}, ${name}));`;
                    }
                    return `Utils.uint32ToBuffer(Utils.fromFlags(${type}, ${name}));`;
                }
                return `${name}.serialize();`;
        }
    }

    /**
     * Get condition lines based on condition operation type
     * @param param - current parameter
     * @param conditionParamType - condition parameter
     * @param localVar - is declaring local var or not
     * @returns typescript condition lines
     */
    public getConditionLine(param: Parameter, conditionParamType: string, localVar = false): string {
        const varPrefix = localVar ? '' : 'this.';
        const value =
            conditionParamType === GeneratedBuildInType.Number ? param.condition_value : `${conditionParamType}.${param.condition_value}`;
        let varName = `${varPrefix}${Helper.toCamel(param.condition)}`;
        if (Helper.isSizeCondition(param.condition) && !param.actualSize) {
            if (Helper.shouldGenerateClass(param.type)) {
                varName = `${varPrefix}${param.generatedName}.size`;
            }
        }
        switch (param.condition_operation) {
            case ConditionType.In.valueOf():
                return `if (${varName}.indexOf(${value}) > -1) {`;
            case ConditionType.Equals.valueOf():
                return `if (${varName} === ${value}) {`;
            case ConditionType.NotEquals.valueOf():
                return `if (${varName} !== ${value}) {`;
            default:
                return '';
        }
    }
}
