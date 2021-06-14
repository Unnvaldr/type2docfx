import { YamlModel } from '../interfaces/YamlModel';
import { Node } from '../interfaces/TypeDocModel';
import { AbstractConverter } from './base';
import { Context } from './context';
import { langs } from '../common/constants';

export class MethodConverter extends AbstractConverter {
    protected generate(node: Node, context: Context): Array<YamlModel> {
        if (!node.signatures) {
            return;
        }

        const models = new Array<YamlModel>();
        for (let index = 0; index < node.signatures.length; index++) {
            let uid = context.ParentUid + '.' + node.name;
            if (index > 0) {
                uid += `_${index}`;
            }

            console.log(` - ${node.kindString}: ${uid}`);
            const model: YamlModel = {
                uid: uid,
                name: node.name,
                children: [],
                type: '',
                langs: langs,
                summary: '',
                syntax: {
                    content: ''
                }
            };

            this.extractInformationFromSignature(model, node, index);
            model.name = this.composeMethodNameFromSignature(model);
            if (model.syntax.return) {
                model.syntax.return.description = model.syntax.return.description;
            }
            
            models.push(model);
        }


        return models;
    }
}