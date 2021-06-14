"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertInnerClassReference = exports.insertClassReferenceForModule = exports.insertLink = exports.postTransform = exports.insertFunctionToIndex = exports.groupOrphanFunctions = void 0;
var constants_1 = require("./common/constants");
var regex_1 = require("./common/regex");
var flags_1 = require("./common/flags");
var linkConvertHelper_1 = require("./helpers/linkConvertHelper");
function groupOrphanFunctions(elements) {
    if (elements && elements.length) {
        var mapping = {};
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].type === 'function') {
                var key = elements[i].module ? elements[i].module : 'ParentToPackage';
                if (!mapping[key]) {
                    mapping[key] = [];
                }
                mapping[key].push(elements[i]);
                elements.splice(i, 1);
                i--;
            }
        }
        return mapping;
    }
}
exports.groupOrphanFunctions = groupOrphanFunctions;
function insertFunctionToIndex(index, functions) {
    if (index && functions) {
        index.items[0].children = index.items[0].children.concat(functions.map(function (f) { return f.uid; }));
        index.items = index.items.concat(functions);
    }
}
exports.insertFunctionToIndex = insertFunctionToIndex;
function postTransform(element, references) {
    var roots = flattening(element);
    for (var _i = 0, roots_1 = roots; _i < roots_1.length; _i++) {
        var root = roots_1[_i];
        insertReferences(root, references);
    }
    return roots;
}
exports.postTransform = postTransform;
function insertReferences(root, references) {
    if (!references || Object.keys(references).length === 0) {
        return;
    }
    root.references = [];
    for (var key in references) {
        var names = key.split('.');
        var reference = {
            uid: key,
            name: names[names.length - 1],
            'spec.typeScript': []
        };
        var match = void 0;
        var lastIndex = 0;
        while ((match = regex_1.uidRegex.exec(references[key])) !== null) {
            if (lastIndex < match.index) {
                reference['spec.typeScript'].push(getReference(references[key].substring(lastIndex, match.index)));
            }
            lastIndex = match.index + match[0].length;
            reference['spec.typeScript'].push(getReference(getItemName(match[1]), match[1]));
        }
        if (lastIndex < references[key].length) {
            reference['spec.typeScript'].push(getReference(references[key].substring(lastIndex)));
        }
        root.references.push(reference);
    }
}
function insertLink(flattenElements) {
    var refs = flattenElements.map(function (el) { return el.references; }).reduce(function (a, b) { return a.concat(b); }, []);
    for (var _i = 0, flattenElements_1 = flattenElements; _i < flattenElements_1.length; _i++) {
        var transformedClass = flattenElements_1[_i];
        var _loop_1 = function (child) {
            child.summary = linkConvertHelper_1.convertLinkToGfm(child.summary, child.uid, refs);
            if (child.syntax) {
                if (child.syntax.parameters) {
                    for (var _c = 0, _d = child.syntax.parameters; _c < _d.length; _c++) {
                        var el = _d[_c];
                        el.description = linkConvertHelper_1.convertLinkToGfm(el.description, child.uid, refs);
                    }
                }
                if (child.syntax.return) {
                    child.syntax.return.description = linkConvertHelper_1.convertLinkToGfm(child.syntax.return.description, child.uid, refs);
                }
            }
            if (child.deprecated) {
                child.deprecated.content = linkConvertHelper_1.convertLinkToGfm(child.deprecated.content, child.uid, refs);
            }
            if (child.remarks) {
                child.remarks = linkConvertHelper_1.convertLinkToGfm(child.remarks, child.uid, refs);
            }
            if (child.example) {
                child.example = child.example.map(function (el) { return linkConvertHelper_1.convertLinkToGfm(el, child.uid, refs); });
            }
        };
        for (var _a = 0, _b = transformedClass.items; _a < _b.length; _a++) {
            var child = _b[_a];
            _loop_1(child);
        }
    }
}
exports.insertLink = insertLink;
// to add this function due to classes under modules need to be cross reference
function insertClassReferenceForModule(flattenElements) {
    for (var _i = 0, flattenElements_2 = flattenElements; _i < flattenElements_2.length; _i++) {
        var element = flattenElements_2[_i];
        if (element.items[0].type !== 'module') {
            continue;
        }
        if (!element.references) {
            element.references = [];
            continue;
        }
        var children = element.items[0].children;
        for (var _a = 0, children_1 = children; _a < children_1.length; _a++) {
            var child = children_1[_a];
            var find = false;
            for (var _b = 0, _c = element.references; _b < _c.length; _b++) {
                var ref = _c[_b];
                if (ref.uid === child) {
                    find = true;
                    break;
                }
            }
            if (!find) {
                var names = child.split('.');
                var reference = {
                    uid: child,
                    name: names[names.length - 1]
                };
                element.references.push(reference);
            }
        }
    }
}
exports.insertClassReferenceForModule = insertClassReferenceForModule;
function insertInnerClassReference(innerClassReferenceMapping, transformedClass) {
    if ((transformedClass.items[0].type === 'class' || transformedClass.items[0].type === 'interface') && innerClassReferenceMapping.has(transformedClass.items[0].uid)) {
        var reference_1 = transformedClass.references || [];
        var referencedClass = innerClassReferenceMapping.get(transformedClass.items[0].uid);
        referencedClass.forEach(function (item) {
            var names = item.split('.');
            var ref = {
                uid: item,
                name: names[names.length - 1]
            };
            reference_1.push(ref);
        });
    }
}
exports.insertInnerClassReference = insertInnerClassReference;
function getReference(name, uid) {
    var reference = {
        name: name,
        fullName: name
    };
    if (uid) {
        reference.uid = uid;
    }
    return reference;
}
function getItemName(uid) {
    var tmp = uid.split('.');
    return tmp[tmp.length - 1];
}
function flattening(element) {
    if (!element) {
        return [];
    }
    var result = [];
    result.push({
        items: [element]
    });
    if (element.children) {
        var childrenUid = [];
        var children = element.children;
        if (flags_1.flags.enableAlphabetOrder) {
            children = children.sort(sortYamlModel);
        }
        for (var _i = 0, children_2 = children; _i < children_2.length; _i++) {
            var child = children_2[_i];
            if (child.children && child.children.length > 0) {
                result = result.concat(flattening(child));
            }
            else if (constants_1.setOfTopLevelItems.has(child.type)) {
                var resultWithoutChild = [];
                resultWithoutChild.push({
                    items: [child]
                });
                result = result.concat(resultWithoutChild);
            }
            else {
                result[0].items.push(child);
            }
            if (child.type !== 'module') {
                childrenUid.push(child.uid);
            }
        }
        element.children = childrenUid;
        return result;
    }
}
function sortYamlModel(a, b) {
    // sort classes alphabetically, contructor first
    if (b.name === constants_1.constructorName) {
        return 1;
    }
    if (a.name === constants_1.constructorName) {
        return -1;
    }
    var nameA = a.name.toUpperCase();
    var nameB = b.name.toUpperCase();
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}
//# sourceMappingURL=postTransformer.js.map