"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Converter = void 0;
var module_1 = require("./module");
var enum_1 = require("./enum");
var property_1 = require("./property");
var accessor_1 = require("./accessor");
var method_1 = require("./method");
var type_1 = require("./type");
var empty_1 = require("./empty");
var Converter = /** @class */ (function () {
    function Converter() {
    }
    Converter.prototype.convert = function (node, context) {
        var converter = this.createConverter(node, context.References);
        return converter.convert(node, context);
    };
    Converter.prototype.createConverter = function (node, references) {
        switch (node.kindString) {
            case 'Namespace':
            case 'Module':
                return new module_1.ModuleConverter(references);
            case 'Enumeration member':
                return new enum_1.EnumConverter(references);
            case 'Property':
            case 'Variable':
            case 'Index signature':
                return new property_1.PropertyConverter(references);
            case 'Accessor':
                return new accessor_1.AccessorConverter(references);
            case 'Method':
            case 'Function':
            case 'Constructor':
                return new method_1.MethodConverter(references);
            case 'Class':
            case 'Interface':
            case 'Enumeration':
            case 'Type alias':
                return new type_1.TypeConverter(references);
            default:
                return new empty_1.EmptyConverter(references);
        }
    };
    return Converter;
}());
exports.Converter = Converter;
//# sourceMappingURL=converter.js.map