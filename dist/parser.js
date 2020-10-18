"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
var converter_1 = require("./converters/converter");
var context_1 = require("./converters/context");
var Parser = /** @class */ (function () {
    function Parser() {
    }
    Parser.prototype.traverse = function (node, uidMapping, context) {
        var collection = new Array();
        if (this.needIgnore(node)) {
            return collection;
        }
        var models = new converter_1.Converter().convert(node, context);
        for (var _i = 0, models_1 = models; _i < models_1.length; _i++) {
            var model = models_1[_i];
            uidMapping[node.id] = model.uid;
            collection.push(model);
        }
        if (!node.children || node.children === []) {
            return collection;
        }
        var children = node.children;
        if (node.indexSignature) {
            children = children.concat(node.indexSignature);
        }
        for (var _a = 0, children_1 = children; _a < children_1.length; _a++) {
            var child = children_1[_a];
            var uid = models.length > 0 ? models[0].uid : context.PackageName;
            var newContext = new context_1.Context(context.Repo, uid, node.kindString, context.PackageName, node.kindString === 'Namespace' ? uid : context.NamespaceName, node.kindString === 'Module' ? uid : context.ModuleName, context.References);
            var newChild = this.traverse(child, uidMapping, newContext);
            if (models.length > 0) {
                for (var _b = 0, newChild_1 = newChild; _b < newChild_1.length; _b++) {
                    var el = newChild_1[_b];
                    if (!models[0].releaseStage)
                        break;
                    if (el.releaseStage && el.releaseStage.length)
                        continue;
                    el.releaseStage = models[0].releaseStage;
                }
                models[0].children = [].concat(models[0].children, newChild);
            }
            else {
                collection = [].concat(collection, newChild);
            }
        }
        return collection;
    };
    Parser.prototype.needIgnore = function (node) {
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
    };
    Parser.prototype.isInternal = function (node) {
        if (node && node.comment && node.comment.tags) {
            node.comment.tags.forEach(function (tag) {
                if (tag.tag === 'internal') {
                    return true;
                }
            });
        }
        return false;
    };
    return Parser;
}());
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map