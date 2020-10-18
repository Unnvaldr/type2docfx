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
exports.AccessorConverter = void 0;
var base_1 = require("./base");
var idResolver_1 = require("../idResolver");
var constants_1 = require("../common/constants");
var AccessorConverter = /** @class */ (function (_super) {
    __extends(AccessorConverter, _super);
    function AccessorConverter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AccessorConverter.prototype.generate = function (node, context) {
        var uid = context.ParentUid + '.' + node.name;
        console.log(" - " + node.kindString + ": " + uid);
        var signatureTypeGet;
        var signatureTypeGetBody;
        var signatureTypeSet;
        var signatureTypeSetBody;
        if (node.getSignature) {
            if (Array.isArray(node.getSignature)) {
                signatureTypeGet = node.getSignature[0].type;
            }
            else {
                signatureTypeGet = node.getSignature.type;
            }
            var signatureTypeGetParams = this.fillParameters((Array.isArray(node.getSignature) ? node.getSignature[0] : node.getSignature).parameters);
            signatureTypeGetBody = this.generateCallFunction("get " + node.name, signatureTypeGetParams, []);
        }
        if (node.setSignature) {
            if (Array.isArray(node.setSignature)) {
                signatureTypeSet = node.setSignature[0].type;
            }
            else {
                signatureTypeSet = node.setSignature.type;
            }
            var signatureTypeSetParams = this.fillParameters((Array.isArray(node.setSignature) ? node.setSignature[0] : node.setSignature).parameters);
            signatureTypeSetBody = this.generateCallFunction("set " + node.name, signatureTypeSetParams, []);
        }
        var model = {
            uid: uid,
            name: node.name,
            fullName: node.name,
            children: [],
            langs: constants_1.langs,
            type: 'property',
            summary: node.comment ? this.findDescriptionInComment(node.comment) : '',
            syntax: {
                content: '',
                return: {
                    type: signatureTypeGet ? this.extractType(signatureTypeGet) : this.extractType(signatureTypeSet),
                    description: this.extractReturnComment(node.comment)
                }
            }
        };
        if (signatureTypeGet) {
            model.syntax.content += "" + (node.flags && node.flags.isStatic ? 'static ' : '') + signatureTypeGetBody + ": " + idResolver_1.typeToString(this.extractType(signatureTypeGet)[0]);
        }
        if (signatureTypeGet && signatureTypeSet) {
            model.syntax.content += '\n';
        }
        if (signatureTypeSet) {
            model.syntax.content += "" + (node.flags && node.flags.isStatic ? 'static ' : '') + signatureTypeSetBody + ": " + idResolver_1.typeToString(this.extractType(signatureTypeSet)[0]);
        }
        return [model];
    };
    return AccessorConverter;
}(base_1.AbstractConverter));
exports.AccessorConverter = AccessorConverter;
//# sourceMappingURL=accessor.js.map