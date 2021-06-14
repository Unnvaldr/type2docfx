export interface Node {
    id: number;
    name: string;
    kind: number;
    kindString: string;
    children: Node[];
    flags: Flags;
    comment: Comment;
    signatures: Signature[];
    type: ParameterType;
    defaultValue: string;
    parameters: Parameter[];
    indexSignature: Node[];
    extendedTypes: ParameterType[];
    implementedTypes: ParameterType[];
    inheritedFrom: ParameterType;
    sources: Source[];
    typeParameter: Parameter[];
    getSignature?: Node[];
    setSignature?: Node[];
}

interface Source {
    fileName: string;
    line: number;
}

interface Flags {
    isExported: boolean;
    isPrivate: boolean;
    isProtected: boolean;
    isStatic: boolean;
    isAbstract: boolean;
    isOptional: boolean;
    isPublic: boolean;
    isConst: boolean;
    isReadonly: boolean;
}

export interface Comment {
    text?: string;
    shortText?: string;
    returns?: string;
    tags?: Tag[];
}

export interface Tag {
    tag: string;
    text: string;
    param: string;
}

export interface Signature {
    id: number;
    name: string;
    kind: number;
    kindString: string;
    flags: Flags;
    comment: Comment;
    parameters: Parameter[];
    type?: ParameterType;
    inheritedFrom: ParameterType;
    typeParameter: Parameter[];
}

export interface Parameter {
    name: string;
    type: ParameterType;
    comment: Comment;
    flags: ParameterFlag;
}

export interface ParameterType {
    type: string;
    types: ParameterType[];
    name: string;
    value: string;
    id: number;
    typeArguments: ParameterType[];
    declaration: Node;
    elementType: ParameterType;
    elements: ParameterType[];
    constraint: ParameterType;
    operator: string;
    target: ParameterType;
    indexType: ParameterType;
    objectType: ParameterType;
    checkType: ParameterType;
    extendsType: ParameterType;
    falseType: ParameterType;
    trueType: ParameterType;
}

interface ParameterFlag {
    isOptional: boolean;
    isRest: boolean;
}
