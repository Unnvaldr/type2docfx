"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MethodConverter = void 0;
var base_1 = require("./base");
var constants_1 = require("../common/constants");
var MethodConverter = /** @class */ (function (_super) {
    __extends(MethodConverter, _super);
    function MethodConverter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MethodConverter.prototype.generate = function (node, context) {
        if (!node.signatures) {
            return;
        }
        var models = new Array();
        for (var index = 0; index < node.signatures.length; index++) {
            var uid = context.ParentUid + '.' + node.name;
            if (index > 0) {
                uid += "_" + index;
            }
            console.log(" - " + node.kindString + ": " + uid);
            var model = {
                uid: uid,
                name: node.name,
                children: [],
                type: '',
                langs: constants_1.langs,
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
    };
    return MethodConverter;
}(base_1.AbstractConverter));
exports.MethodConverter = MethodConverter;
//# sourceMappingURL=method.js.map