import { YamlModel } from '../interfaces/YamlModel';
import { Node } from '../interfaces/TypeDocModel';
import { AbstractConverter } from './base';
import { typeToString } from '../idResolver';
import { Context } from './context';
import { langs } from '../common/constants';

export class AccessorConverter extends AbstractConverter {
    protected generate(node: Node, context: Context): Array<YamlModel> {
        node.signatures = [].concat(node.getSignature || [], node.setSignature || []);

        if (!node.signatures?.length) {
            return;
        }

        const models = new Array<YamlModel>();
        for (let i = 0; i < node.signatures.length; i++) {
            let uid = context.ParentUid + '.' + node.name;
            if (i > 0) {
                uid += `_${i}`;
            }

            console.log(` - ${node.kindString}: ${uid}`);
            const model: YamlModel = {
                uid: i + 1 !== node.signatures.length ? uid : null,
                name: node.name,
                children: [],
                type: '',
                langs: langs,
                summary: '',
                syntax: {
                    content: ''
                }
            };

            this.extractInformationFromSignature(model, node, i);

            this.setTags(model, node.signatures[i].comment, context);
            delete node.signatures[i].comment;

            models.push(model);
        }

        if (models.length == 2) {
            models[0].syntax.content += `\n${models[1].syntax.content}`;
            models[0].syntax.parameters = models[1].syntax.parameters;
            if(models[0].remarks || models[1].remarks) {
                models[0].remarks = [models[0].remarks, models[1].remarks].filter(Boolean).join('\n');
            }
            if(models[0].deprecated || models[1].deprecated) {
                models[0].deprecated = {
                    content: [models[0].deprecated?.content, models[1].deprecated?.content].filter(Boolean).join('<br/>')
                };
            }
            if(models[0].releaseStage || models[1].releaseStage) {
                models[0].releaseStage = (models[0].releaseStage || []).concat(models[1].releaseStage).reduce((acc, val) => { if (acc.indexOf(val) === -1) acc.push(val); return acc; }, []);
            }
            // models.pop();
        }

        return models;
    }
}
