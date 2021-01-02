export interface YamlModel {
    uid: string;
    name: string;
    children: Array<YamlModel | string>;
    langs: Array<string>;
    type: string;
    summary?: string;
    syntax?: Syntax;
    fullName?: string;
    exceptions?: Array<Exception>;
    package?: string;
    namespace?: string;
    module?: string;
    source?: Source;
    inheritance?: Inheritance[];
    inheritedMembers?: Types;
    implements?: Types;
    deprecated?: Deprecated;
    isPreview?: boolean;
    remarks?: string;
    optional?: boolean;
    example?: Array<string>;
    releaseStage?: Array<string>;
}

interface Inheritance {
    type: Type | string;
    inheritance?: Inheritance[];
}

interface Deprecated {
    content: string;
}

interface Source {
    path: string;
    startLine: number;
    remote: Remote;
}

interface Remote {
    path: string;
    branch: string;
    repo: string;
}

export interface Reference {
    uid?: string;
    name?: string;
    fullName?: string;
    'spec.typeScript'?: Reference[];
}

export interface Syntax {
    parameters?: Array<YamlParameter>;
    typeParameter?: Array<YamlParameter>;
    content?: string;
    return?: Return;
}

interface Return {
    type: Types;
    description: string;
}

export interface YamlParameter {
    id: string;
    type: Types;
    description: string;
    optional?: boolean;
    rest?: boolean;
}

export interface Root {
    items: Array<YamlModel>;
    references?: Array<Reference>;
}

export interface Type {
    typeName?: string;
    typeId?: number;
    reflectedType?: ReflectedType;
    genericType?: GenericType;
    intersectionType?: IntersectionType;
    unionType?: UnionType;
    tupleType?: TupleType;
    arrayType?: Type | string;
    typeParameterType?: TypeParameterType;
    typeOperatorType?: TypeOperatorType;
    indexedAccessType?: IndexedAccessType;
    conditionalType?: ConditionalType;
}

export type Types = (Type | string)[];

export interface UnionType {
    types: Types;
}

export interface IntersectionType {
    types: Types;
}

export interface TupleType {
    elements: Types;
}

export interface GenericType {
    outter: Type | string;
    inner: Types;
}

export interface ReflectedType {
    key: Type | string;
    value: Type | string;
}

export interface TypeParameterType {
    name: string;
    constraint?: Type | string;
}

export interface TypeOperatorType {
    operator: string;
    target: Type | string;
}

export interface IndexedAccessType {
    indexType: Type | string;
    objectType: Type | string;
}

export interface ConditionalType {
    checkType: Type | string;
    extendsType: Type | string;
    falseType: Type | string;
    trueType: Type | string;
}

export interface Exception {
    type: string;
    description: string;
}
