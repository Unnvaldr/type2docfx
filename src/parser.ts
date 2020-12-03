import { YamlModel } from './interfaces/YamlModel';
import { Node } from './interfaces/TypeDocModel';
import { UidMapping } from './interfaces/UidMapping';
import { Converter } from './converters/converter';
import { Context } from './converters/context';

export class Parser {
    public traverse(node: Node, uidMapping: UidMapping, context: Context): YamlModel[] {
        let collection = new Array<YamlModel>();

        if (this.needIgnore(node)) {
            return collection;
        }

        let models = new Converter().convert(node, context);
        for (const model of models) {
            model.uid = this.checkForDuplicate(model, uidMapping);
            uidMapping[node.id] = model.uid;
            collection.push(model);
        }

        if (!node.children || node.children === []) {
            return collection;
        }

        let children = node.children;

        if (node.indexSignature) {
            children = children.concat(node.indexSignature);
        }

        for (const child of children) {
            const uid = models.length > 0 ? models[0].uid : context.PackageName;
            const newContext = new Context(
                context.Repo,
                uid,
                node.kindString,
                context.PackageName,
                node.kindString === 'Namespace' ? uid : context.NamespaceName,
                node.kindString === 'Module' ? uid : context.ModuleName,
                context.References);
            const newChild = this.traverse(child, uidMapping, newContext);
            if (models.length > 0) {
                for (let el of newChild) {
                    if(!models[0].releaseStage) break;
                    if(el.releaseStage && el.releaseStage.length) continue;
                    el.releaseStage = models[0].releaseStage;
                }
                models[0].children = [].concat(models[0].children, newChild);
            } else {
                collection = [].concat(collection, newChild);
            }
        }

        return collection;
    }

    private checkForDuplicate(model: YamlModel, uidMapping: UidMapping): string {
        const arr = Object.values(uidMapping).filter(val => model.uid === val);
        const arr2 = Object.values(uidMapping).filter(val => val.startsWith(model.uid) && val.match(/.*_\d+$/));
        if(arr.length > 0) {
            const newUid = model.uid.split('_');
            newUid.splice(Math.min(1, newUid.length), 0, `${newUid.length > 1 ? arr2.length : arr2.length + 1}`);
            model.uid = newUid.join('_');
        }
        return model.uid;
    }

    private needIgnore(node: Node): boolean {
        if (node.kindString != 'Index signature' && node.name && node.name[0] === '_') {
            return true;
        }

        if (node.flags.isPrivate || node.flags.isProtected) {
            return true;
        }

        if (node.inheritedFrom) {
            return true;
        }

        if (this.isInternal(node)) {
            return true;
        }

        if (!node.flags.isExported
            && node.sources
            && !node.sources[0].fileName.toLowerCase().endsWith('.d.ts')) {
            return true;
        }

        return false;
    }

    private isInternal(node: Node): boolean {
        if (node && node.comment && node.comment.tags) {
            node.comment.tags.forEach(tag => {
                if (tag.tag === 'internal') {
                    return true;
                }
            });
        }

        return false;
    }
}