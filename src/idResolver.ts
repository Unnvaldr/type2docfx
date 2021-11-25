import { YamlModel, Type, Types } from './interfaces/YamlModel';
import { UidMapping } from './interfaces/UidMapping';
import { ReferenceMapping } from './interfaces/ReferenceMapping';
import { uidRegex } from './common/regex';
import { setOfTopLevelItems } from './common/constants';
import { getLinks } from './helpers/linkConvertHelper';

export function resolveIds(element: YamlModel, uidMapping: UidMapping, referenceMapping: ReferenceMapping, rootElement?: YamlModel): void {
    if (element.type === 'module' || element.type === 'namespace') {
        referenceMapping[element.uid] = `@uid:${element.uid}!@`;
    }

    if (element.summary) {
        element.summary = restoreLinks(element.summary, uidMapping, referenceMapping, element);
    }

    if (element.syntax) {
        if (element.syntax.parameters) {
            for (const p of element.syntax.parameters) {
                p.type = restoreReferences(p.type, uidMapping, referenceMapping);
                p.description = restoreLinks(p.description, uidMapping, referenceMapping, element);
            }
        }

        if (element.syntax.typeParameter) {
            for (const p of element.syntax.typeParameter) {
                p.type = restoreReferences(p.type, uidMapping, referenceMapping);
            }
        }

        if (element.syntax.return) {
            element.syntax.return.type = restoreReferences(element.syntax.return.type, uidMapping, referenceMapping);
            element.syntax.return.description = restoreLinks(element.syntax.return.description, uidMapping, referenceMapping, element);
        }
    }

    if (element.deprecated) {
        element.deprecated.content = restoreLinks(element.deprecated.content, uidMapping, referenceMapping, element);
    }
    if (element.remarks) {
        element.remarks = restoreLinks(element.remarks, uidMapping, referenceMapping, element);
    }
    if (element.example) {
        element.example = element.example.map(el => restoreLinks(el, uidMapping, referenceMapping, element));
    }

    for (const child of element.children as YamlModel[]) {
        resolveIds(child, uidMapping, referenceMapping, rootElement);
        if (setOfTopLevelItems.has(child.type)) {
            referenceMapping[child.uid] = `@uid:${child.uid}!@`;
        }
    }
}

export function resolveInheritance(element: YamlModel, uidMapping: UidMapping, referenceMapping: ReferenceMapping, rootElement?: YamlModel) {
    if (element.inheritance) {
        element.inheritance[0].type = restoreReferences([element.inheritance[0].type], uidMapping, referenceMapping)[0];
        for (let child of rootElement.children as YamlModel[]) {
            if (child.uid !== element.inheritance[0].type || !child.inheritance) continue;
            if (child.inheritance[0].type != undefined) {
                element.inheritance[0].inheritance = child.inheritance;
            } else {
                element.inheritance[0].inheritance[0].type = restoreReferences([child.inheritance[0].type], uidMapping, referenceMapping)[0];
            }
        }
    }

    if (element.inheritedMembers) {
        for (const child of element.inheritedMembers as Type[]) {
            const name = child.typeName.split('.').pop();
            findInheritedMember(child, uidMapping, referenceMapping, rootElement);
            referenceMapping[`${element.uid}.${name}`] = restoreType(child, uidMapping);
        }
        element.inheritedMembers = restoreReferences(element.inheritedMembers, uidMapping, referenceMapping);
    }

    if (element.implements) {
        element.implements = restoreReferences(element.implements, uidMapping, referenceMapping);
    }

    for (const child of element.children as YamlModel[]) {
        resolveInheritance(child, uidMapping, referenceMapping, rootElement);
    }
}

function findInheritedMember(node: Type, uidMapping: UidMapping, referenceMapping: ReferenceMapping, parent: YamlModel): void {
    if (uidMapping[node.typeId]) return;

    const name = node.typeName.split('.');

    for (const element of parent.children as YamlModel[]) {
        if(element.name !== name[0]) continue;
        for (const child of element.inheritedMembers as Type[]) {
            const type = typeToString(child);
            if (name[1] !== type.split('.').pop()) continue;
            if (!uidMapping[child.typeId] && !referenceMapping[type]) {
                name[0] = type.split('.')[0];
                break;
            }
            uidMapping[node.typeId] = uidMapping[child.typeId] ?? type;
            return;
        }
    }
}

function restoreLinks(comment: string, uidMapping: UidMapping, referenceMapping: ReferenceMapping, parent: YamlModel): string {
    const links = getLinks(comment);
    if (!links.length) return comment;

    for (const link of links) {
        let parentUid = parent.uid;
        let n = -1;

        while ((n = parentUid.lastIndexOf('.')) !== -1) {
            let childUid = parentUid = parentUid.substring(0, n);
            childUid += '.' + link;
            if (!Object.values(uidMapping).includes(childUid)) continue;
            referenceMapping[childUid] = `@uid:${childUid}!@`;
            break;
        }
    }

    return comment;
}

function restoreReferences(types: Types, uidMapping: UidMapping, referenceMapping: ReferenceMapping): string[] {
    return restoreTypes(types, uidMapping).map(restoreType => restoreReference(restoreType, uidMapping, referenceMapping));
}

function restoreReference(type: Type | string, uidMapping: UidMapping, referenceMapping: ReferenceMapping): string {
    let _restoreType = restoreType(type, uidMapping);
    if (_restoreType) {
        let hasUid = false;
        let restoreTypeTrim = _restoreType.replace(uidRegex, (match, uid) => {
            if (uid) {
                hasUid = true;
                return uid;
            }
            return match;
        });
        if (hasUid && referenceMapping[restoreTypeTrim] !== null) {
            referenceMapping[restoreTypeTrim] = _restoreType;
        }
        return restoreTypeTrim;
    }
    return _restoreType;
}

function restoreTypes(types: Types, uidMapping: UidMapping): string[] {
    if (types) {
        return (types as any[]).map(t => restoreType(t, uidMapping));
    }
    return null;
}

function restoreType(type: Type | string, uidMapping: UidMapping): string {
    if (typeof (type) === 'string') {
        return type;
    }

    if (type.reflectedType) {
        type.reflectedType.key = restoreType(type.reflectedType.key, uidMapping);
        type.reflectedType.value = restoreType(type.reflectedType.value, uidMapping);
    } else if (type.genericType) {
        type.genericType.inner = (type.genericType.inner as Type[]).map(t => restoreType(t, uidMapping));
        type.genericType.outter = restoreType(type.genericType.outter, uidMapping);
    } else if (type.unionType) {
        type.unionType.types = (type.unionType.types as Type[]).map(t => restoreType(t, uidMapping));
    } else if (type.intersectionType) {
        type.intersectionType.types = (type.intersectionType.types as Type[]).map(t => restoreType(t, uidMapping));
    } else if (type.tupleType) {
        type.tupleType.elements = (type.tupleType.elements as Type[]).map(t => restoreType(t, uidMapping));
    } else if (type.arrayType) {
        type.arrayType = restoreType(type.arrayType, uidMapping);
    } else if (type.typeParameterType && type.typeParameterType.constraint) {
        type.typeParameterType.constraint = restoreType(type.typeParameterType.constraint, uidMapping);
    } else if (type.typeOperatorType) {
        type.typeOperatorType.target = restoreType(type.typeOperatorType.target, uidMapping);
    } else if (type.indexedAccessType) {
        type.indexedAccessType.indexType = restoreType(type.indexedAccessType.indexType, uidMapping);
        type.indexedAccessType.objectType = restoreType(type.indexedAccessType.objectType, uidMapping);
    } else {
        if (type.typeId && uidMapping[type.typeId]) {
            type.typeName = `@uid:${uidMapping[type.typeId]}!@`;
        }
    }

    return typeToString(type);
}

export function typeToString(type: Type | string, kind?: string): string {
    if (!type) {
        return 'function';
    }

    if (typeof (type) === 'string') {
        if (type[0] === '@') {
            return type;
        } else if (kind && kind !== 'Property') {
            let t = type.split('.');
            return t[t.length - 1];
        } else {
            return type;
        }
    }

    if (type.reflectedType) {
        return `{ ${typeToString(type.reflectedType.key)}: ${typeToString(type.reflectedType.value)} }`;
    } else if (type.genericType) {
        return `${typeToString(type.genericType.outter)}<${((type.genericType.inner as Type[]).map(t => typeToString(t)).join(', '))}>`;
    } else if (type.unionType) {
        return (type.unionType.types as Type[]).map(t => typeToString(t)).join(' | ');
    } else if (type.intersectionType) {
        return (type.intersectionType.types as Type[]).map(t => typeToString(t)).join(' & ');
    } else if (type.tupleType) {
        return `[${(type.tupleType.elements as Type[]).map(t => typeToString(t)).join(' | ')}]`;
    } else if (type.arrayType) {
        return `${typeToString(type.arrayType)}[]`;
    } else if (type.typeParameterType) {
        return `${type.typeName}`;
    } else if (type.typeOperatorType) {
        return `${type.typeOperatorType.operator} ${typeToString(type.typeOperatorType.target)}`;
    } else if (type.indexedAccessType) {
        return `${typeToString(type.indexedAccessType.objectType)}[${typeToString(type.indexedAccessType.indexType)}]`;
    } else if (type.conditionalType) {
        return `${typeToString(type.conditionalType.checkType)} extends ${typeToString(type.conditionalType.extendsType)} ? ${typeToString(type.conditionalType.trueType)} : ${typeToString(type.conditionalType.falseType)}`;
    } else {
        return typeToString(type.typeName);
    }
}
