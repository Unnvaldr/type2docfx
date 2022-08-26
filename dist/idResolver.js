"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeToString = exports.resolveInheritance = exports.resolveIds = void 0;
var regex_1 = require("./common/regex");
var constants_1 = require("./common/constants");
var linkConvertHelper_1 = require("./helpers/linkConvertHelper");
function resolveIds(element, uidMapping, referenceMapping, rootElement) {
    if (element.type === 'module' || element.type === 'namespace') {
        referenceMapping[element.uid] = "@uid:" + element.uid + "!@";
    }
    if (element.summary) {
        element.summary = restoreLinks(element.summary, uidMapping, referenceMapping, element);
    }
    if (element.syntax) {
        if (element.syntax.parameters) {
            for (var _i = 0, _a = element.syntax.parameters; _i < _a.length; _i++) {
                var p = _a[_i];
                p.type = restoreReferences(p.type, uidMapping, referenceMapping);
                p.description = restoreLinks(p.description, uidMapping, referenceMapping, element);
            }
        }
        if (element.syntax.typeParameter) {
            for (var _b = 0, _c = element.syntax.typeParameter; _b < _c.length; _b++) {
                var p = _c[_b];
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
        element.example = element.example.map(function (el) { return restoreLinks(el, uidMapping, referenceMapping, element); });
    }
    for (var _d = 0, _e = element.children; _d < _e.length; _d++) {
        var child = _e[_d];
        resolveIds(child, uidMapping, referenceMapping, rootElement);
        if (constants_1.setOfTopLevelItems.has(child.type)) {
            referenceMapping[child.uid] = "@uid:" + child.uid + "!@";
        }
    }
}
exports.resolveIds = resolveIds;
function resolveInheritance(element, uidMapping, referenceMapping, rootElement) {
    if (element.inheritance) {
        element.inheritance[0].type = restoreReferences([element.inheritance[0].type], uidMapping, referenceMapping)[0];
        for (var _i = 0, _a = rootElement.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (child.uid !== element.inheritance[0].type || !child.inheritance)
                continue;
            if (child.inheritance[0].type != undefined) {
                element.inheritance[0].inheritance = child.inheritance;
            }
            else {
                element.inheritance[0].inheritance[0].type = restoreReferences([child.inheritance[0].type], uidMapping, referenceMapping)[0];
            }
        }
    }
    if (element.inheritedMembers) {
        for (var _b = 0, _c = element.inheritedMembers; _b < _c.length; _b++) {
            var child = _c[_b];
            var name = child.typeName.split('.').pop();
            findInheritedMember(child, uidMapping, referenceMapping, rootElement);
            referenceMapping[element.uid + "." + name] = restoreType(child, uidMapping);
        }
        element.inheritedMembers = restoreReferences(element.inheritedMembers, uidMapping, referenceMapping);
    }
    if (element.implements) {
        element.implements = restoreReferences(element.implements, uidMapping, referenceMapping);
    }
    for (var _d = 0, _e = element.children; _d < _e.length; _d++) {
        var child = _e[_d];
        resolveInheritance(child, uidMapping, referenceMapping, rootElement);
    }
}
exports.resolveInheritance = resolveInheritance;
function findInheritedMember(node, uidMapping, referenceMapping, parent) {
    var _a;
    if (uidMapping[node.typeId])
        return;
    var name = node.typeName.split('.');
    for (var _i = 0, _b = parent.children; _i < _b.length; _i++) {
        var element = _b[_i];
        if (element.name !== name[0])
            continue;
        for (var _c = 0, _d = element.inheritedMembers; _c < _d.length; _c++) {
            var child = _d[_c];
            var type = typeToString(child);
            if (name[1] !== type.split('.').pop())
                continue;
            if (!uidMapping[child.typeId] && !referenceMapping[type]) {
                name[0] = type.split('.')[0];
                break;
            }
            uidMapping[node.typeId] = (_a = uidMapping[child.typeId]) !== null && _a !== void 0 ? _a : type;
            return;
        }
    }
}
function restoreLinks(comment, uidMapping, referenceMapping, parent) {
    var links = linkConvertHelper_1.getLinks(comment);
    if (!links.length)
        return comment;
    for (var _i = 0, links_1 = links; _i < links_1.length; _i++) {
        var link = links_1[_i];
        var parentUid = parent.uid;
        var n = -1;
        while ((n = parentUid.lastIndexOf('.')) !== -1) {
            var childUid = parentUid = parentUid.substring(0, n);
            childUid += '.' + link;
            if (!Object.values(uidMapping).includes(childUid))
                continue;
            referenceMapping[childUid] = "@uid:" + childUid + "!@";
            break;
        }
    }
    return comment;
}
function restoreReferences(types, uidMapping, referenceMapping) {
    return restoreTypes(types, uidMapping).map(function (restoreType) { return restoreReference(restoreType, uidMapping, referenceMapping); });
}
function restoreReference(type, uidMapping, referenceMapping) {
    var _restoreType = restoreType(type, uidMapping);
    if (_restoreType) {
        var hasUid_1 = false;
        var restoreTypeTrim = _restoreType.replace(regex_1.uidRegex, function (match, uid) {
            if (uid) {
                hasUid_1 = true;
                return uid;
            }
            return match;
        });
        if (hasUid_1 && referenceMapping[restoreTypeTrim] !== null) {
            referenceMapping[restoreTypeTrim] = _restoreType;
        }
        return restoreTypeTrim;
    }
    return _restoreType;
}
function restoreTypes(types, uidMapping) {
    if (types) {
        return types.map(function (t) { return restoreType(t, uidMapping); });
    }
    return null;
}
function restoreType(type, uidMapping) {
    if (typeof (type) === 'string') {
        return type;
    }
    if (type.reflectedType) {
        type.reflectedType.key = restoreType(type.reflectedType.key, uidMapping);
        type.reflectedType.value = restoreType(type.reflectedType.value, uidMapping);
    }
    else if (type.genericType) {
        type.genericType.inner = type.genericType.inner.map(function (t) { return restoreType(t, uidMapping); });
        type.genericType.outter = restoreType(type.genericType.outter, uidMapping);
    }
    else if (type.unionType) {
        type.unionType.types = type.unionType.types.map(function (t) { return restoreType(t, uidMapping); });
    }
    else if (type.intersectionType) {
        type.intersectionType.types = type.intersectionType.types.map(function (t) { return restoreType(t, uidMapping); });
    }
    else if (type.tupleType) {
        type.tupleType.elements = type.tupleType.elements.map(function (t) { return restoreType(t, uidMapping); });
    }
    else if (type.arrayType) {
        type.arrayType = restoreType(type.arrayType, uidMapping);
    }
    else if (type.typeParameterType && type.typeParameterType.constraint) {
        type.typeParameterType.constraint = restoreType(type.typeParameterType.constraint, uidMapping);
    }
    else if (type.typeOperatorType) {
        type.typeOperatorType.target = restoreType(type.typeOperatorType.target, uidMapping);
    }
    else if (type.indexedAccessType) {
        type.indexedAccessType.indexType = restoreType(type.indexedAccessType.indexType, uidMapping);
        type.indexedAccessType.objectType = restoreType(type.indexedAccessType.objectType, uidMapping);
    }
    else {
        if (type.typeId && uidMapping[type.typeId]) {
            type.typeName = "@uid:" + uidMapping[type.typeId] + "!@";
        }
    }
    return typeToString(type);
}
function typeToString(type, kind) {
    if (!type) {
        return 'function';
    }
    if (typeof (type) === 'string') {
        if (type[0] === '@') {
            return type;
        }
        else if (kind && kind !== 'Property') {
            var t = type.split('.');
            return t[t.length - 1];
        }
        else {
            return type;
        }
    }
    if (type.reflectedType) {
        return "{ " + typeToString(type.reflectedType.key) + ": " + typeToString(type.reflectedType.value) + " }";
    }
    else if (type.genericType) {
        return typeToString(type.genericType.outter) + "<" + (type.genericType.inner.map(function (t) { return typeToString(t); }).join(', ')) + ">";
    }
    else if (type.unionType) {
        return type.unionType.types.map(function (t) { return typeToString(t); }).join(' | ');
    }
    else if (type.intersectionType) {
        return type.intersectionType.types.map(function (t) { return typeToString(t); }).join(' & ');
    }
    else if (type.tupleType) {
        return "[" + type.tupleType.elements.map(function (t) { return typeToString(t); }).join(' | ') + "]";
    }
    else if (type.arrayType) {
        return typeToString(type.arrayType) + "[]";
    }
    else if (type.typeParameterType) {
        return "" + type.typeName;
    }
    else if (type.typeOperatorType) {
        return type.typeOperatorType.operator + " " + typeToString(type.typeOperatorType.target);
    }
    else if (type.indexedAccessType) {
        return typeToString(type.indexedAccessType.objectType) + "[" + typeToString(type.indexedAccessType.indexType) + "]";
    }
    else if (type.conditionalType) {
        return typeToString(type.conditionalType.checkType) + " extends " + typeToString(type.conditionalType.extendsType) + " ? " + typeToString(type.conditionalType.trueType) + " : " + typeToString(type.conditionalType.falseType);
    }
    else {
        return typeToString(type.typeName);
    }
}
exports.typeToString = typeToString;
//# sourceMappingURL=idResolver.js.map