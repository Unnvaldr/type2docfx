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
exports.EnumConverter = void 0;
var base_1 = require("./base");
var constants_1 = require("../common/constants");
var EnumConverter = /** @class */ (function (_super) {
    __extends(EnumConverter, _super);
    function EnumConverter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EnumConverter.prototype.generate = function (node, context) {
        var uid = context.ParentUid + '.' + node.name;
        var model = {
            uid: uid,
            name: node.name,
            children: [],
            langs: constants_1.langs,
            summary: node.comment ? this.findDescriptionInComment(node.comment) : '',
            type: 'field'
        };
        console.log(" - " + node.kindString + ": " + uid);
        return [model];
    };
    return EnumConverter;
}(base_1.AbstractConverter));
exports.EnumConverter = EnumConverter;
//# sourceMappingURL=enum.js.map