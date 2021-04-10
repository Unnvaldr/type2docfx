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
exports.ModuleConverter = void 0;
var base_1 = require("./base");
var constants_1 = require("../common/constants");
var ModuleConverter = /** @class */ (function (_super) {
    __extends(ModuleConverter, _super);
    function ModuleConverter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ModuleConverter.prototype.generate = function (node, context) {
        node.name = node.name.replace(/"/g, '');
        node.name = node.name.replace(/\//g, '.');
        var uid = context.ParentUid + ("." + node.name);
        var model = {
            uid: uid,
            name: node.name,
            langs: constants_1.langs,
            fullName: node.name + this.getGenericType(node.typeParameter),
            children: [],
            type: node.kindString.toLowerCase(),
            summary: node.comment ? this.findDescriptionInComment(node.comment) : ''
        };
        console.log(node.kindString + ": " + uid);
        return [model];
    };
    return ModuleConverter;
}(base_1.AbstractConverter));
exports.ModuleConverter = ModuleConverter;
//# sourceMappingURL=module.js.map