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
exports.TypeConverter = void 0;
var base_1 = require("./base");
var constants_1 = require("../common/constants");
var TypeConverter = /** @class */ (function (_super) {
    __extends(TypeConverter, _super);
    function TypeConverter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TypeConverter.prototype.generate = function (node, context) {
        var _this = this;
        // to add this to handle duplicate class and module under the same hierarchy
        if (node.kindString === 'Class' || node.kindString === 'Interface' || node.kindString === 'Type alias') {
            if (context.ParentKind === 'Class' || context.ParentKind === 'Interface') {
                var currentUid = context.ParentUid + ("." + node.name);
                var mapping = [];
                if (this.references.has(context.ParentUid)) {
                    mapping = this.references.get(context.ParentUid);
                }
                mapping.push(currentUid);
                this.references.set(context.ParentUid, mapping);
            }
        }
        var uid = context.ParentUid + ("." + node.name);
        console.log(node.kindString + ": " + uid);
        var model = {
            uid: uid,
            name: node.name,
            fullName: node.name + this.getGenericType(node.typeParameter),
            children: [],
            langs: constants_1.langs,
            type: node.kindString.replace(/\s/g, '').toLowerCase(),
            summary: node.comment ? this.findDescriptionInComment(node.comment) : ''
        };
        if (model.type === 'enumeration') {
            model.type = 'enum';
        }
        if (model.type === 'typealias') {
            var typeArgumentsContent = this.getGenericType(node.typeParameter);
            var typeDeclarationContent = this.parseTypeDeclarationForTypeAlias(node.type);
            model.syntax = {
                content: "type " + model.name + typeArgumentsContent + " = " + typeDeclarationContent
            };
        }
        if (node.extendedTypes && node.extendedTypes.length) {
            model.inheritance = [];
            for (var _i = 0, _a = node.extendedTypes; _i < _a.length; _i++) {
                var t = _a[_i];
                model.inheritance.push({ type: this.extractType(t)[0] });
            }
            model.inheritedMembers = [];
            for (var _b = 0, _c = node.children; _b < _c.length; _b++) {
                var child = _c[_b];
                if (!child.inheritedFrom)
                    continue;
                model.inheritedMembers.push(this.extractType(child.inheritedFrom)[0]);
            }
            model.inheritedMembers = model.inheritedMembers.length ? model.inheritedMembers : null;
        }
        if (node.implementedTypes && node.implementedTypes.length) {
            model.implements = node.implementedTypes.map(function (type) { return _this.extractType(type)[0]; });
        }
        if (model.type === 'class' || model.type === 'interface' || model.type === "enum") {
            model.syntax = { content: model.type + " " + model.name };
            if (model.inheritance) {
                model.syntax.content += ' extends ' + model.inheritance.map(function (t) { return t.type.typeName; }).join(', ');
            }
            if (model.implements) {
                model.syntax.content += ' implements ' + model.implements.map(function (t) { return t.typeName; }).join(', ');
            }
        }
        return [model];
    };
    return TypeConverter;
}(base_1.AbstractConverter));
exports.TypeConverter = TypeConverter;
//# sourceMappingURL=type.js.map