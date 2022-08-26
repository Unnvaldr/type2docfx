"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractConverter = void 0;
var constants_1 = require("../common/constants");
var idResolver_1 = require("../idResolver");
var linkConvertHelper_1 = require("../helpers/linkConvertHelper");
var AbstractConverter = /** @class */ (function () {
    function AbstractConverter(references) {
        this.references = references;
    }
    AbstractConverter.prototype.convert = function (node, context) {
        var models = this.generate(node, context) || [];
        for (var i = 0, model = models[i]; i < models.length; model = models[++i]) {
            model.package = context.PackageName;
            if (context.NamespaceName) {
                model.namespace = context.NamespaceName;
            }
            if (context.ModuleName) {
                model.module = context.ModuleName;
            }
            this.setSource(model, node, context);
            this.setTags(model, (node.signatures && node.signatures.length ? node.signatures[i] : node).comment, context);
        }
        return models.filter(function (el) { return el.uid; });
    };
    AbstractConverter.prototype.setTags = function (model, comment, context) {
        if (!comment)
            return;
        this.setCustomModuleName(model, comment);
        this.setDeprecated(model, comment);
        // this.setIsPreview(model, comment);
        this.setRemarks(model, comment);
        this.setInherits(model, comment);
        this.setExamples(model, comment);
        this.setReleaseStage(model, comment);
    };
    AbstractConverter.prototype.setSource = function (model, node, context) {
        if (context.Repo && node.sources && node.sources.length) {
            var basePath = '';
            if (context.Repo.basePath) {
                basePath = context.Repo.basePath + '/';
            }
            model.source = {
                path: node.sources[0].fileName,
                // shift one line up as systematic off for TypeDoc
                startLine: node.sources[0].line,
                remote: {
                    path: "" + basePath + node.sources[0].fileName,
                    repo: context.Repo.repo,
                    branch: context.Repo.branch
                }
            };
        }
    };
    AbstractConverter.prototype.setDeprecated = function (model, comment) {
        var deprecated = this.extractTextFromComment('deprecated', comment);
        if (deprecated != null) {
            model.deprecated = {
                content: deprecated
            };
        }
    };
    AbstractConverter.prototype.setIsPreview = function (model, comment) {
        var isPreview = this.extractTextFromComment('beta', comment);
        if (isPreview != null) {
            model.isPreview = true;
        }
    };
    AbstractConverter.prototype.setRemarks = function (model, comment) {
        var remarks = this.extractTextFromComment('remarks', comment);
        if (remarks != null) {
            model.remarks = remarks;
        }
    };
    AbstractConverter.prototype.setCustomModuleName = function (model, comment) {
        var customModuleName = this.extractTextFromComment('module', comment);
        if (customModuleName) {
            model.module = customModuleName;
        }
    };
    AbstractConverter.prototype.setInherits = function (model, comment) {
        var inherits = this.extractTextFromComment('inherits', comment);
        if (inherits != null) {
            var tokens = linkConvertHelper_1.getTextAndLink(inherits);
            if (tokens.length !== 2)
                return;
            model.inheritance = [{ type: tokens[0] }];
        }
    };
    AbstractConverter.prototype.setExamples = function (model, comment) {
        var examples = (comment.tags || []).filter(function (el) { return el.tag === 'example'; });
        if (examples.length) {
            model.example = examples.map(function (el) { return el.text.trim(); });
        }
    };
    AbstractConverter.prototype.setReleaseStage = function (model, comment) {
        if (!comment.tags)
            return;
        var releaseTags = (comment.tags || []).filter(function (el) { return constants_1.releaseStages.includes(el.tag); });
        if (releaseTags.length) {
            model.releaseStage = releaseTags.map(function (el) { return el.tag; });
        }
    };
    AbstractConverter.prototype.extractTextFromComment = function (infoName, comment) {
        if (comment && comment.tags) {
            for (var _i = 0, _a = comment.tags; _i < _a.length; _i++) {
                var tag = _a[_i];
                if (tag.tag === infoName) {
                    return tag.text.trim();
                }
            }
        }
        return null;
    };
    AbstractConverter.prototype.getGenericType = function (typeParameters) {
        var _this = this;
        if (typeParameters === void 0) { typeParameters = []; }
        var els = typeParameters.map(function (el) {
            var str = el.name;
            if (el.type) {
                str += ' extends ' + idResolver_1.typeToString(_this.extractType(el.type)[0]);
            }
            return str;
        });
        return els.length ? "<" + els.join(', ') + ">" : '';
    };
    AbstractConverter.prototype.findDescriptionInComment = function (comment) {
        if (!comment) {
            return '';
        }
        if (comment.tags) {
            var text_1 = null;
            comment.tags.forEach(function (tag) {
                if (tag.tag === 'classdesc'
                    || tag.tag === 'description'
                    || tag.tag === 'exemptedapi'
                    || tag.tag === 'property') {
                    text_1 = tag.text.trim();
                    return;
                }
            });
            if (text_1) {
                return text_1.trim();
            }
        }
        if (comment.shortText && comment.text) {
            return comment.shortText + "\n" + comment.text;
        }
        if (comment.text) {
            return comment.text.trim();
        }
        if (comment.shortText) {
            return comment.shortText.trim();
        }
        return '';
    };
    AbstractConverter.prototype.extractType = function (type) {
        var _this = this;
        var result = [];
        if (type === undefined) {
            return result;
        }
        if (type.type === 'union' && type.types && type.types.length) {
            if (this.hasCommonPrefix(type.types)) {
                result.push({
                    typeName: type.types[0].name.split('.')[0]
                });
            }
            else {
                result.push({
                    unionType: {
                        types: type.types.map(function (t) { return _this.extractType(t)[0]; })
                    }
                });
            }
        }
        else if (type.type === 'tuple' && type.elements && type.elements.length) {
            result.push({
                tupleType: {
                    elements: type.elements.map(function (t) { return _this.extractType(t)[0]; })
                }
            });
        }
        else if (type.type === 'array') {
            var newType = this.extractType(type.elementType);
            result.push({
                arrayType: newType[0]
            });
        }
        else if (type.type === 'intersection' && type.types.length) {
            result.push({
                intersectionType: {
                    types: type.types.map(function (t) { return _this.extractType(t)[0]; })
                }
            });
        }
        else if (type.type === 'reflection' && type.declaration) {
            // TODO: Handle Parameter kind in better way
            if (type.declaration.indexSignature) {
                var signatures = type.declaration.indexSignature;
                signatures.forEach(function (signature) {
                    result.push({
                        reflectedType: {
                            key: {
                                typeName: "[" + signature.parameters[0].name + ": " + signature.parameters[0].type.name + "]",
                                typeId: signature.parameters[0].type.id
                            },
                            value: {
                                typeName: signature.type.name,
                                typeId: signature.type.id
                            }
                        }
                    });
                });
            }
            else if (type.declaration.signatures && type.declaration.signatures.length) {
                result.push({
                    typeName: this.generateCallFunction('', this.fillParameters(type.declaration.signatures[0].parameters)) + " => " + idResolver_1.typeToString(this.extractType(type.declaration.signatures[0].type)[0])
                });
            }
            else if (type.declaration.children && type.declaration.children.length) {
                result.push({
                    reflectedType: {
                        key: {
                            typeName: type.declaration.children[0].name,
                            typeId: type.declaration.children[0].id
                        },
                        value: this.extractType(type.declaration.children[0].type)[0]
                    }
                });
            }
            else {
                result.push({
                    typeName: '{}'
                });
            }
        }
        else if (type.type === 'typeParameter') {
            result.push({
                typeName: type.name,
                typeParameterType: {
                    name: type.name,
                    constraint: this.extractType(type.constraint)[0]
                }
            });
        }
        else if (type.type === 'typeOperator') {
            result.push({
                typeName: type.name,
                typeOperatorType: {
                    operator: type.operator,
                    target: this.extractType(type.target)[0]
                }
            });
        }
        else if (type.type === 'indexedAccess') {
            result.push({
                typeName: type.indexType.name,
                typeId: type.indexType.id,
                indexedAccessType: {
                    indexType: this.extractType(type.indexType)[0],
                    objectType: this.extractType(type.indexType.constraint ? type.indexType.constraint.target : type.objectType)[0]
                }
            });
        }
        else if (type.type === 'conditional') {
            result.push({
                conditionalType: {
                    checkType: this.extractType(type.checkType)[0],
                    extendsType: this.extractType(type.extendsType)[0],
                    falseType: this.extractType(type.falseType)[0],
                    trueType: this.extractType(type.trueType)[0]
                }
            });
        }
        else if (type.typeArguments && type.typeArguments.length) {
            result.push({
                genericType: {
                    outter: {
                        typeName: type.name,
                        typeId: type.id
                    },
                    inner: type.typeArguments.map(function (t) { return _this.extractType(t)[0]; })
                }
            });
        }
        else if (type.type === 'inferred') {
            result.push({
                typeName: "infer " + type.name,
                typeId: type.id
            });
        }
        else if (type.type === 'literal') {
            result.push({
                typeName: type.value ? "\"" + type.value + "\"" : String(type.value),
            });
        }
        else if (type.name) {
            result.push({
                typeName: type.name,
                typeId: type.id
            });
        }
        else if (type.value) {
            result.push({
                typeName: "\"" + type.value + "\""
            });
        }
        else {
            result.push({
                typeName: 'Object'
            });
        }
        return result;
    };
    AbstractConverter.prototype.hasCommonPrefix = function (types) {
        if (types && types.length > 1 && types[0].name) {
            if (types[0].name.indexOf('.') < 0) {
                return false;
            }
            var prefix_1 = types[0].name.split('.')[0];
            types.forEach(function (t) {
                if (!t.name || t.name.split('.')[0] !== prefix_1) {
                    return false;
                }
            });
            return true;
        }
        return false;
    };
    AbstractConverter.prototype.generateCallFunction = function (prefix, parameters, typeParameters) {
        if (parameters) {
            return "" + prefix + this.getGenericType(typeParameters) + "(" + parameters.map(function (p) { return "" + (p.rest ? '...' : '') + p.id + (p.optional ? '?' : '') + ": " + (idResolver_1.typeToString(p.type[0])); }).join(', ') + ")";
        }
        return '';
    };
    AbstractConverter.prototype.fillParameters = function (parameters) {
        var _this = this;
        if (parameters) {
            return parameters.map(function (p) {
                var description = '';
                if (p.comment) {
                    description = (p.comment.shortText && p.comment.shortText !== '') ? p.comment.shortText : p.comment.text;
                }
                return {
                    id: p.name,
                    type: _this.extractType(p.type),
                    description: description,
                    optional: p.flags && p.flags.isOptional,
                    rest: p.flags && p.flags.isRest
                };
            });
        }
        return [];
    };
    AbstractConverter.prototype.extractReturnComment = function (comment) {
        if (comment == null || comment.returns == null) {
            return '';
        }
        return comment.returns.trim();
    };
    AbstractConverter.prototype.extractAccessModifier = function (node) {
        if (!node.flags || node.kindString === 'Index signature') {
            return '';
        }
        if (node.flags.isPublic) {
            return 'public ';
        }
        else if (node.flags.isProtected) {
            return 'protected ';
        }
        else if (node.flags.isPrivate) {
            return 'private ';
        }
        else {
            return '';
        }
    };
    AbstractConverter.prototype.extractInformationFromSignature = function (method, node, signatureIndex) {
        if (node.signatures[signatureIndex].comment) {
            method.summary = this.findDescriptionInComment(node.signatures[signatureIndex].comment);
        }
        method.syntax.parameters = this.fillParameters(node.signatures[signatureIndex].parameters);
        method.syntax.typeParameter = this.fillParameters(node.signatures[signatureIndex].typeParameter);
        if (node.signatures[signatureIndex].type && node.kindString !== 'Constructor' && node.signatures[signatureIndex].type.name !== 'void') {
            method.syntax.return = {
                type: this.extractType(node.signatures[signatureIndex].type),
                description: this.extractReturnComment(node.signatures[signatureIndex].comment)
            };
        }
        // comment the exception handling for now as template doesn't support it, so CI will not be blocked.
        /*
        let exceptions;
        if (node.signatures[signatureIndex].comment && node.signatures[signatureIndex].comment.tags) {
            exceptions = node.signatures[signatureIndex].comment.tags.filter(tag => tag.tag === 'throws');
        }
    
        if (exceptions && exceptions.length) {
            method.exceptions = exceptions.map(e => extractException(e));
        }
        */
        if (['Method', 'Function', 'Accessor'].includes(node.kindString)) {
            var typeParameter = node.signatures[signatureIndex].typeParameter;
            method.name = "" + node.name + this.getGenericType(typeParameter);
            var functionBody = this.generateCallFunction(node.name, method.syntax.parameters, typeParameter);
            var functionReturn = node.signatures[signatureIndex].type.name;
            if (node.signatures[signatureIndex].type) {
                functionReturn = idResolver_1.typeToString(this.extractType(node.signatures[signatureIndex].type)[0]);
            }
            var isAccessor = node.kindString === 'Accessor' ? node.signatures[signatureIndex].kindString.substring(0, 3).toLowerCase() + " " : '';
            var isStatic = node.flags && node.flags.isStatic ? 'static ' : '';
            var isAbstract = node.flags && node.flags.isAbstract ? 'abstract ' : '';
            var accessModifier = this.extractAccessModifier(node);
            method.syntax.content = "" + accessModifier + isStatic + isAbstract + isAccessor + functionBody + ": " + functionReturn;
            method.type = node.kindString !== 'Accessor' ? node.kindString.toLowerCase() : 'property';
        }
        else {
            method.name = method.uid.split('.').reverse()[1];
            var functionBody = this.generateCallFunction(method.name, method.syntax.parameters);
            var accessModifier = this.extractAccessModifier(node);
            method.syntax.content = "" + accessModifier + functionBody + ": " + method.name;
            method.type = 'constructor';
        }
    };
    AbstractConverter.prototype.composeMethodNameFromSignature = function (method) {
        var parameterType = method.syntax.parameters.map(function (p) {
            return idResolver_1.typeToString(p.type[0]);
        }).join(', ');
        return method.name + '(' + parameterType + ')';
    };
    // protected parseTypeArgumentsForTypeAlias(node: Node | Parameter | ParameterType): string {
    //     let typeParameter;
    //     if ((<Node>node).typeParameter) {
    //         typeParameter = (<Node>node).typeParameter.map(el => el.type);
    //     } else if ((<Parameter>node).type.typeArguments) {
    //         typeParameter = (<Parameter>node).type.typeArguments;
    //     } else if ((<ParameterType>node).typeArguments) {
    //         typeParameter = (<ParameterType>node).typeArguments;
    //     }
    //     if (typeParameter && typeParameter.length) {
    //         let typeArgumentsList = typeParameter.map(item => {
    //             return typeToString(this.extractType(item)[0]);
    //         }).join(', ');
    //         typeArgumentsList = '<' + typeArgumentsList + '>';
    //         return typeArgumentsList;
    //     }
    //     return '';
    // }
    // protected parseTypeDeclarationForTypeAlias(typeInfo: ParameterType): string {
    //     switch (typeInfo.type) {
    //         case 'union':
    //             return this.parseUnionType(typeInfo);
    //         case 'tuple':
    //             return this.parseTupleType(typeInfo);
    //         case 'reflection':
    //             if (typeInfo.declaration) {
    //                 if (typeInfo.declaration.signatures && typeInfo.declaration.signatures.length) {
    //                     return this.parseFunctionType(typeInfo);
    //                 }
    //                 if (typeInfo.declaration.children) {
    //                     return this.parseUserDefinedType(typeInfo);
    //                 }
    //                 return 'Object';
    //             }
    //             break;
    //         case 'intersection':
    //             return this.parseIntersection(typeInfo);
    //         default:
    //             let content = 'Object';
    //             if (typeInfo.name) {
    //                 content = typeInfo.name;
    //             } else if (typeInfo.value) {
    //                 content = typeInfo.value;
    //             }
    //             if (typeInfo.typeArguments && typeInfo.typeArguments.length) {
    //                 content += this.parseTypeArgumentsForTypeAlias(typeInfo);
    //             }
    //             return content;
    //     }
    // }
    AbstractConverter.prototype.parseTypeDeclarationForTypeAlias = function (typeInfo) {
        return idResolver_1.typeToString(this.extractType(typeInfo)[0]);
    };
    return AbstractConverter;
}());
exports.AbstractConverter = AbstractConverter;
//# sourceMappingURL=base.js.map