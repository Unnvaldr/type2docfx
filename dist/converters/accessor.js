"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessorConverter = void 0;
var base_1 = require("./base");
var constants_1 = require("../common/constants");
var AccessorConverter = /** @class */ (function (_super) {
    __extends(AccessorConverter, _super);
    function AccessorConverter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AccessorConverter.prototype.generate = function (node, context) {
        var _a, _b, _c;
        node.signatures = [].concat(node.getSignature || [], node.setSignature || []);
        if (!((_a = node.signatures) === null || _a === void 0 ? void 0 : _a.length)) {
            return;
        }
        var models = new Array();
        for (var i = 0; i < node.signatures.length; i++) {
            var uid = context.ParentUid + '.' + node.name;
            if (i > 0) {
                uid += "_" + i;
            }
            console.log(" - " + node.kindString + ": " + uid);
            var model = {
                uid: i + 1 !== node.signatures.length ? uid : null,
                name: node.name,
                children: [],
                type: '',
                langs: constants_1.langs,
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
            models[0].syntax.content += "\n" + models[1].syntax.content;
            models[0].syntax.parameters = models[1].syntax.parameters;
            if (models[0].remarks || models[1].remarks) {
                models[0].remarks = [models[0].remarks, models[1].remarks].filter(Boolean).join('\n');
            }
            if (models[0].deprecated || models[1].deprecated) {
                models[0].deprecated = {
                    content: [(_b = models[0].deprecated) === null || _b === void 0 ? void 0 : _b.content, (_c = models[1].deprecated) === null || _c === void 0 ? void 0 : _c.content].filter(Boolean).join('<br/>')
                };
            }
            if (models[0].releaseStage || models[1].releaseStage) {
                models[0].releaseStage = (models[0].releaseStage || []).concat(models[1].releaseStage).reduce(function (acc, val) { if (acc.indexOf(val) === -1)
                    acc.push(val); return acc; }, []);
            }
            // models.pop();
        }
        return models;
    };
    return AccessorConverter;
}(base_1.AbstractConverter));
exports.AccessorConverter = AccessorConverter;
//# sourceMappingURL=accessor.js.map