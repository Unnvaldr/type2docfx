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
exports.PropertyConverter = void 0;
var base_1 = require("./base");
var idResolver_1 = require("../idResolver");
var constants_1 = require("../common/constants");
var PropertyConverter = /** @class */ (function (_super) {
    __extends(PropertyConverter, _super);
    function PropertyConverter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PropertyConverter.prototype.generate = function (node, context) {
        var uid = context.ParentUid + '.' + node.name;
        console.log(" - " + node.kindString + ": " + uid);
        var isPublic = node.flags && (node.flags.isPublic || !(node.flags.isProtected || node.flags.isPrivate)) ? 'public ' : '';
        var isProtected = node.flags && node.flags.isProtected ? 'protected ' : '';
        var isPrivate = node.flags && node.flags.isPrivate ? 'private ' : '';
        var isStatic = node.flags && node.flags.isStatic ? 'static ' : '';
        var isOptional = node.flags && node.flags.isOptional ? '?' : '';
        var isConst = node.flags && node.flags.isConst ? 'const ' : '';
        var isReadonly = node.flags && node.flags.isReadonly ? 'readonly ' : '';
        var defaultValue = node.defaultValue ? " = " + node.defaultValue.trim() : '';
        var name = node.name;
        if (node.kindString === 'Index signature') {
            name = "[" + node.parameters[0].name + ": " + idResolver_1.typeToString(this.extractType(node.parameters[0].type)[0]) + "]";
            isPublic = '';
        }
        var model = {
            uid: uid,
            name: name,
            fullName: name,
            children: [],
            langs: constants_1.langs,
            type: (node.kindString === 'Index signature' ? 'Property' : node.kindString).toLowerCase(),
            summary: node.comment ? this.findDescriptionInComment(node.comment) : '',
            optional: node.flags && node.flags.isOptional,
            syntax: {
                content: "" + isPublic + isProtected + isPrivate + isConst + isReadonly + isStatic + name + isOptional + ": " + idResolver_1.typeToString(this.extractType(node.type)[0], node.kindString) + defaultValue,
                return: {
                    type: this.extractType(node.type),
                    description: this.extractReturnComment(node.comment)
                }
            }
        };
        return [model];
    };
    return PropertyConverter;
}(base_1.AbstractConverter));
exports.PropertyConverter = PropertyConverter;
//# sourceMappingURL=property.js.map