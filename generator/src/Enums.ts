export enum BuildInType {
    Byte = 'byte',
    Struct = 'struct',
    Enum = 'enum',
}

export enum DispositionType {
    Inline = 'inline',
    Const = 'const',
    Array = 'array',
    ArrayFill = 'array fill',
    ArraySized = 'array sized',
    Reserved = 'reserved',
}

export enum GeneratedBuildInType {
    Uint8Array = 'Uint8Array',
    Number = 'number',
    BigInt = 'bigint',
}

export enum ConditionType {
    Equals = 'equals',
    In = 'in',
    NotEquals = 'not equals',
}
