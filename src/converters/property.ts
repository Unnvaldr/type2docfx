import { YamlModel } from '../interfaces/YamlModel';
import { Node } from '../interfaces/TypeDocModel';
import { AbstractConverter } from './base';
import { typeToString } from '../idResolver';
import { Context } from './context';
import { langs } from '../common/constants';

export class PropertyConverter extends AbstractConverter {
    protected generate(node: Node, context: Context): Array<YamlModel> {
        const uid = context.ParentUid + '.' + node.name;
        console.log(` - ${node.kindString}: ${uid}`);
        const accessModifier = this.extractAccessModifier(node);
        const isStatic = node.flags && node.flags.isStatic ? 'static ' : '';
        const isOptional = node.flags && node.flags.isOptional ? '?' : '';
        const isConst = node.flags && node.flags.isConst ? 'const ' : '';
        const isReadonly = node.flags && node.flags.isReadonly ? 'readonly ' : '';
        const defaultValue = node.defaultValue ? ` = ${node.defaultValue.trim()}` : '';
        let name = node.name;
        if (node.kindString === 'Index signature') {
            name = `[${node.parameters[0].name}: ${typeToString(this.extractType(node.parameters[0].type)[0])}]`;
        }
        const model: YamlModel = {
            uid: uid,
            name: name,
            fullName: name,
            children: [],
            langs: langs,
            type: (node.kindString === 'Index signature' ? 'Property' : node.kindString).toLowerCase(),
            summary: node.comment ? this.findDescriptionInComment(node.comment) : '',
            optional: node.flags && node.flags.isOptional,
            syntax: {
                content: `${accessModifier}${isConst}${isReadonly}${isStatic}${name}${isOptional}: ${typeToString(this.extractType(node.type)[0], node.kindString)}${defaultValue}`,
                return: {
                    type: this.extractType(node.type),
                    description: this.extractReturnComment(node.comment)
                }
            }
        };

        return [model];
    }
}
