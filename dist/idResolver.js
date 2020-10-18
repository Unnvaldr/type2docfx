"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeToString = exports.resolveIds = void 0;
var regex_1 = require("./common/regex");
var constants_1 = require("./common/constants");
var linkConvertHelper_1 = require("./helpers/linkConvertHelper");
function resolveIds(element, uidMapping, referenceMapping, rootElement) {
    if (element.type === 'module' || element.type === 'namespace') {
        referenceMapping[element.uid] = "@uid:" + element.uid + "!@";
    }
    if (element.summary) {
        restoreLinks(element.summary, uidMapping, referenceMapping, element);
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
    if (element.inheritance) {
        element.inheritance[0].type = restoreReferences([element.inheritance[0].type], uidMapping, referenceMapping)[0];
        for (var _d = 0, _e = rootElement.children; _d < _e.length; _d++) {
            var child = _e[_d];
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
        for (var _f = 0, _g = element.inheritedMembers; _f < _g.length; _f++) {
            var mbr = _g[_f];
            var name = mbr.typeName.split('.').pop();
            referenceMapping[element.uid + "." + name] = restoreType(mbr, uidMapping);
        }
        element.inheritedMembers = restoreReferences(element.inheritedMembers, uidMapping, referenceMapping);
    }
    if (element.implements) {
        element.implements = restoreReferences(element.implements, uidMapping, referenceMapping);
    }
    for (var _h = 0, _j = element.children; _h < _j.length; _h++) {
        var child = _j[_h];
        resolveIds(child, uidMapping, referenceMapping, rootElement);
        if (constants_1.setOfTopLevelItems.has(child.type)) {
            referenceMapping[child.uid] = "@uid:" + child.uid + "!@";
        }
    }
}
exports.resolveIds = resolveIds;
function restoreLinks(comment, uidMapping, referenceMapping, parent) {
    var link = linkConvertHelper_1.getLink(comment);
    if (!link.length)
        return comment;
    var parentUid = parent.uid;
    var n = -1;
    while ((n = parentUid.lastIndexOf('.')) !== -1) {
        var childUid = parentUid = parentUid.substring(0, n);
        childUid += '.' + link[0];
        if (!Object.values(uidMapping).includes(childUid))
            continue;
        referenceMapping[childUid] = "@uid:" + childUid + "!@";
        break;
    }
    return comment;
}
function restoreReferences(types, uidMapping, referenceMapping) {
    var restoredTypes = restoreTypes(types, uidMapping);
    return restoredTypes.map(function (restoreType) {
        if (restoreType) {
            var hasUid_1 = false;
            var restoreTypeTrim = restoreType.replace(regex_1.uidRegex, function (match, uid) {
                if (uid) {
                    hasUid_1 = true;
                    return uid;
                }
                return match;
            });
            if (hasUid_1 && referenceMapping[restoreTypeTrim] !== null) {
                referenceMapping[restoreTypeTrim] = restoreType;
            }
            return restoreTypeTrim;
        }
        return restoreType;
    });
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
    if (type.unionType) {
        type.unionType.types = type.unionType.types.map(function (t) { return restoreType(t, uidMapping); });
    }
    else if (type.intersectionType) {
        type.intersectionType.types = type.intersectionType.types.map(function (t) { return restoreType(t, uidMapping); });
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