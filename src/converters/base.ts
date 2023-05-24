import { releaseStages } from '../common/constants';
import { YamlModel, YamlParameter, Type } from '../interfaces/YamlModel';
import { Node, Signature, Parameter, Comment, ParameterType } from '../interfaces/TypeDocModel';
import { typeToString } from '../idResolver';
import { getTextAndLink } from '../helpers/linkConvertHelper';
import { Context } from './context';

export abstract class AbstractConverter {
    protected references: Map<string, string[]>;

    public constructor(references: Map<string, string[]>) {
        this.references = references;
    }

    public convert(node: Node, context: Context): Array<YamlModel> {
        var models = this.generate(node, context) || [];
        for (let i = 0, model = models[i]; i < models.length; model = models[++i]) {
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

        return models.filter(el => el.uid);
    }

    protected abstract generate(node: Node, context: Context): Array<YamlModel>;

    protected setTags(model: YamlModel, comment: Comment, context: Context) {
        if (!comment) return;
        this.setCustomModuleName(model, comment);
        this.setDeprecated(model, comment);
        // this.setIsPreview(model, comment);
        this.setRemarks(model, comment);
        this.setInherits(model, comment);
        this.setExamples(model, comment);
        this.setReleaseStage(model, comment);
    }

    protected setSource(model: YamlModel, node: Node, context: Context) {
        if (context.Repo && node.sources && node.sources.length) {
            let basePath = '';

            if (context.Repo.basePath) {
                basePath = context.Repo.basePath + '/';
            }

            model.source = {
                path: node.sources[0].fileName,
                // shift one line up as systematic off for TypeDoc
                startLine: node.sources[0].line,
                remote: {
                    path: `${basePath}${node.sources[0].fileName}`,
                    repo: context.Repo.repo,
                    branch: context.Repo.branch
                }
            };
        }
    }

    protected setDeprecated(model: YamlModel, comment: Comment) {
        const deprecated = this.extractTextFromComment('deprecated', comment);
        if (deprecated != null) {
            model.deprecated = {
                content: deprecated
            };
        }
    }

    protected setIsPreview(model: YamlModel, comment: Comment) {
        const isPreview = this.extractTextFromComment('beta', comment);
        if (isPreview != null) {
            model.isPreview = true;
        }
    }

    protected setRemarks(model: YamlModel, comment: Comment) {
        const remarks = this.extractTextFromComment('remarks', comment);
        if (remarks != null) {
            model.remarks = remarks;
        }
    }

    protected setCustomModuleName(model: YamlModel, comment: Comment) {
        const customModuleName = this.extractTextFromComment('module', comment);
        if (customModuleName) {
            model.module = customModuleName;
        }
    }

    protected setInherits(model: YamlModel, comment: Comment) {
        const inherits = this.extractTextFromComment('inherits', comment);
        if (inherits != null) {
            const tokens = getTextAndLink(inherits);
            if (tokens.length !== 2) return;
            model.inheritance = [{ type: tokens[0] }];
        }
    }

    protected setExamples(model: YamlModel, comment: Comment) {
        const examples = (comment.tags || []).filter(el => el.tag === 'example');
        if (examples.length) {
            model.example = examples.map(el => el.text.trim());
        }
    }

    protected setReleaseStage(model: YamlModel, comment: Comment) {
        if(!comment.tags) return;
        const releaseTags = (comment.tags || []).filter(el => releaseStages.includes(el.tag));
        if(releaseTags.length) {
            model.releaseStage = releaseTags.map(el => el.tag);
        }
    }

    private extractTextFromComment(infoName: string, comment: Comment): string {
        if (comment && comment.tags) {
            for (const tag of comment.tags) {
                if (tag.tag === infoName) {
                    return tag.text.trim();
                }
            }
        }

        return null;
    }

    protected getGenericType(typeParameters: Parameter[] = []): string {
        const els = typeParameters.map(el => {
            let str = el.name;
            if (el.type) {
                str += ' extends ' + typeToString(this.extractType(el.type)[0]);
            }
            return str;
        });
        return els.length ? `<${els.join(', ')}>` : '';
    }

    protected findDescriptionInComment(comment: Comment): string {
        if (!comment) {
            return '';
        }

        if (comment.tags) {
            let text: string = null;
            comment.tags.forEach(tag => {
                if (tag.tag === 'classdesc'
                    || tag.tag === 'description'
                    || tag.tag === 'exemptedapi'
                    || tag.tag === 'property') {
                    text = tag.text.trim();
                    return;
                }
            });
            if (text) {
                return text.trim();
            }
        }

        if (comment.shortText && comment.text) {
            return `${comment.shortText}\n${comment.text}`;
        }

        if (comment.text) {
            return comment.text.trim();
        }

        if (comment.shortText) {
            return comment.shortText.trim();
        }

        return '';
    }

    protected extractType(type: ParameterType): Type[] {
        let result: Type[] = [];
        if (type === undefined) {
            return result;
        }
        if (type.type === 'union' && type.types && type.types.length) {
            if (this.hasCommonPrefix(type.types)) {
                result.push({
                    typeName: type.types[0].name.split('.')[0]
                });
            } else {
                result.push({
                    unionType: {
                        types: type.types.map(t => this.extractType(t)[0])
                    }
                });
            }
        } else if (type.type === 'tuple' && type.elements && type.elements.length) {
            result.push({
                tupleType: {
                    elements: type.elements.map(t => this.extractType(t)[0])
                }
            });
        } else if (type.type === 'array') {
            let newType = this.extractType(type.elementType);
            result.push({
                arrayType: newType[0]
            });
        } else if (type.type === 'intersection' && type.types.length) {
            result.push({
                intersectionType: {
                    types: type.types.map(t => this.extractType(t)[0])
                }
            });
        } else if (type.type === 'reflection' && type.declaration) {
            // TODO: Handle Parameter kind in better way
            if (type.declaration.indexSignature) {
                let signatures = type.declaration.indexSignature;
                signatures.forEach(signature => {
                    result.push({
                        reflectedType: {
                            key: {
                                typeName: `[${signature.parameters[0].name}: ${signature.parameters[0].type.name}]`,
                                typeId: signature.parameters[0].type.id
                            },
                            value: {
                                typeName: signature.type.name,
                                typeId: signature.type.id
                            }
                        }
                    });
                });
            } else if (type.declaration.signatures && type.declaration.signatures.length) {
                result.push({
                    typeName: `${this.generateCallFunction('', this.fillParameters(type.declaration.signatures[0].parameters))} => ${typeToString(this.extractType(type.declaration.signatures[0].type)[0])}`
                });
            } else if (type.declaration.children && type.declaration.children.length) {
                result.push({
                    reflectedType: {
                        key: {
                            typeName: type.declaration.children[0].name,
                            typeId: type.declaration.children[0].id
                        },
                        value: this.extractType(type.declaration.children[0].type)[0]
                    }
                });
            } else {
                result.push({
                    typeName: '{}'
                });
            }
        } else if (type.type === 'typeParameter') {
            result.push({
                typeName: type.name,
                typeParameterType: {
                    name: type.name,
                    constraint: this.extractType(type.constraint)[0]
                }
            });
        } else if (type.type === 'typeOperator') {
            result.push({
                typeName: type.name,
                typeOperatorType: {
                    operator: type.operator,
                    target: this.extractType(type.target)[0]
                }
            });
        } else if (type.type === 'indexedAccess') {
            result.push({
                typeName: type.indexType.name,
                typeId: type.indexType.id,
                indexedAccessType: {
                    indexType: this.extractType(type.indexType)[0],
                    objectType: this.extractType(type.indexType.constraint ? type.indexType.constraint.target : type.objectType)[0]
                }
            });
        } else if (type.type === 'conditional') {
            result.push({
                conditionalType: {
                    checkType: this.extractType(type.checkType)[0],
                    extendsType: this.extractType(type.extendsType)[0],
                    falseType: this.extractType(type.falseType)[0],
                    trueType: this.extractType(type.trueType)[0]
                }
            });
        } else if (type.typeArguments && type.typeArguments.length) {
            result.push({
                genericType: {
                    outter: {
                        typeName: type.name,
                        typeId: type.id
                    },
                    inner: type.typeArguments.map(t => this.extractType(t)[0])
                }
            });
        } else if (type.type === 'inferred') {
            result.push({
                typeName: `infer ${type.name}`,
                typeId: type.id
            });
        } else if (type.type === 'literal') {
            result.push({
                typeName: typeof type.value === 'string' ? `"${type.value}"` : String(type.value),
            });
        } else if (type.name) {
            result.push({
                typeName: type.name,
                typeId: type.id
            });
        } else if (type.value) {
            result.push({
                typeName: `"${type.value}"`
            });
        } else {
            result.push({
                typeName: 'Object'
            });
        }

        return result;
    }

    protected hasCommonPrefix(types: ParameterType[]): boolean {
        if (types && types.length > 1 && types[0].name) {
            if (types[0].name.indexOf('.') < 0) {
                return false;
            }
            let prefix = types[0].name.split('.')[0];
            types.forEach(t => {
                if (!t.name || t.name.split('.')[0] !== prefix) {
                    return false;
                }
            });
            return true;
        }
        return false;
    }

    protected generateCallFunction(prefix: string, parameters: YamlParameter[], typeParameters?: Parameter[]): string {
        if (parameters) {
            return `${prefix}${this.getGenericType(typeParameters)}(${parameters.map(p => `${p.rest ? '...' : ''}${p.id}${p.optional ? '?' : ''}: ${(typeToString(p.type[0]))}`).join(', ')})`;
        }
        return '';
    }

    protected fillParameters(parameters: Parameter[]): YamlParameter[] {
        if (parameters) {
            return parameters.map<YamlParameter>(p => {
                let description = '';
                if (p.comment) {
                    description = (p.comment.shortText && p.comment.shortText !== '') ? p.comment.shortText : p.comment.text;
                }
                return <YamlParameter>{
                    id: p.name,
                    type: this.extractType(p.type),
                    description: description,
                    optional: p.flags && p.flags.isOptional,
                    rest: p.flags && p.flags.isRest
                };
            });
        }
        return [];
    }

    protected extractReturnComment(comment: Comment): string {
        if (comment == null || comment.returns == null) {
            return '';
        }

        return comment.returns.trim();
    }

    protected extractAccessModifier(node: Node): string {
        if (!node.flags || node.kindString === 'Index signature') {
            return '';
        }

        if (node.flags.isPublic) {
            return 'public ';
        } else if (node.flags.isProtected) {
            return 'protected ';
        } else if (node.flags.isPrivate) {
            return 'private ';
        } else {
            return '';
        }
    }

    protected extractInformationFromSignature(method: YamlModel, node: Node, signatureIndex: number) {
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
            const typeParameter = node.signatures[signatureIndex].typeParameter;
            method.name = `${node.name}${this.getGenericType(typeParameter)}`;
            const functionBody = this.generateCallFunction(node.name, method.syntax.parameters, typeParameter);
            let functionReturn = node.signatures[signatureIndex].type.name;
            if (node.signatures[signatureIndex].type) {
                functionReturn = typeToString(this.extractType(node.signatures[signatureIndex].type)[0]);
            }
            const isAccessor = node.kindString === 'Accessor' ? `${node.signatures[signatureIndex].kindString.substring(0, 3).toLowerCase()} ` : '';
            const isStatic = node.flags && node.flags.isStatic ? 'static ' : '';
            const isAbstract = node.flags && node.flags.isAbstract ? 'abstract ' : '';
            const accessModifier = this.extractAccessModifier(node);
            method.syntax.content = `${accessModifier}${isStatic}${isAbstract}${isAccessor}${functionBody}: ${functionReturn}`;
            method.type = node.kindString !== 'Accessor' ? node.kindString.toLowerCase() : 'property';
        } else {
            method.name = method.uid.split('.').reverse()[1];
            const functionBody = this.generateCallFunction(method.name, method.syntax.parameters);
            const accessModifier = this.extractAccessModifier(node);
            method.syntax.content = `${accessModifier}${functionBody}: ${method.name}`;
            method.type = 'constructor';
        }
    }

    protected composeMethodNameFromSignature(method: YamlModel): string {
        const parameterType = method.syntax.parameters.map(p => {
            return typeToString(p.type[0]);
        }).join(', ');
        return method.name + '(' + parameterType + ')';
    }

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

    protected parseTypeDeclarationForTypeAlias(typeInfo: ParameterType): string {
        return typeToString(this.extractType(typeInfo)[0]);
    }

    // protected parseUnionType(typeInfo: ParameterType): string {
    //     let content = '';
    //     if (typeInfo.types && typeInfo.types.length) {
    //         content = this.parseCommonTypeInfo(typeInfo, 'union', ' | ');
    //     }
    //     return content;
    // }

    // protected parseTupleType(typeInfo: ParameterType): string {
    //     let content = '';
    //     if (typeInfo.elements && typeInfo.elements.length) {
    //         content = this.parseCommonTypeInfo(typeInfo, 'tuple', ', ');
    //     }
    //     content = '[ ' + content + ' ]';
    //     return content;
    // }

    // protected parseIntersection(typeInfo: ParameterType): string {
    //     if (typeInfo.types && typeInfo.types.length) {
    //         return this.parseCommonTypeInfo(typeInfo, 'intersection', ' & ');
    //     }
    //     return '';
    // }

    // protected parseCommonTypeInfo(typeInfo: ParameterType, type: string, seperator: string): string {
    //     let typeDeclaration;
    //     if (type === 'tuple') {
    //         typeDeclaration = typeInfo.elements;
    //     } else {
    //         typeDeclaration = typeInfo.types;
    //     }
    //     let content = typeDeclaration.map(item => {
    //         if (item.name) {
    //             // for generic
    //             if (item.typeArguments && item.typeArguments.length) {
    //                 return item.name + '<' + item.typeArguments[0].name + '>';
    //             } else {
    //                 return item.name;
    //             }
    //         } else if (item.value) {
    //             return `"${item.value}"`;
    //         } else if (item.type === 'array' && item.elementType) {
    //             return `${item.elementType.name}[]`;
    //         }
    //         else {
    //             return this.parseUserDefinedType(item);
    //         }
    //     }).join(seperator);
    //     return content;
    // }

    // protected parseFunctionType(typeInfo: ParameterType): string {
    //     let typeResult = this.extractType(typeInfo);
    //     let content = '';
    //     if (typeResult.length) {
    //         content = typeResult[0].typeName;
    //     }
    //     return content;
    // }

    // protected parseUserDefinedType(typeInfo: ParameterType): string {
    //     if (!typeInfo.declaration || !typeInfo.declaration.children) {
    //         return '';
    //     }
    //     let content = typeInfo.declaration.children.map(child => {
    //         let type = '';
    //         if (child.kindString === 'Variable') {
    //             if (child.type.name) {
    //                 let typeName = '';
    //                 if (child.type.typeArguments && child.type.typeArguments.length) {
    //                     typeName = child.type.name + '<' + child.type.typeArguments[0].name + '>';
    //                 } else {
    //                     typeName = child.type.name;
    //                 }
    //                 type = `${child.name}: ${typeName}`;
    //             } else if (child.type.value) {
    //                 type = `${child.name}: ${child.type.value}`;
    //             } else if (child.type.elementType) {
    //                 type = `${child.name}: ${typeToString(this.extractType(child.type)[0])}`
    //             } else if (child.type.indexType) {
    //                 type = `${child.name}: ${child.type.objectType.name}[${child.type.indexType.name}]}`
    //             } else if (child.type.constraint) {
    //                 type = this.parseTypeDeclarationForTypeAlias(child.type.constraint);
    //             } else if (child.type.target) {
    //                 type = this.parseTypeDeclarationForTypeAlias(child.type.target);
    //             } else if (child.type.type === 'reference') {
    //                 type = this.parseTypeDeclarationForTypeAlias(child.type);
    //             } else {
    //                 type = `${child.name}: Object`;
    //             }
    //         } else if (child.kindString === 'Function') {
    //             type = `${this.generateCallFunction(child.name, this.fillParameters(child.signatures[0].parameters))} => ${typeToString(this.extractType(child.signatures[0].type)[0])}`;
    //         }
    //         return type;

    //     }).join(', ');
    //     content = '{ ' + content + ' }';
    //     return content;
    // }
}