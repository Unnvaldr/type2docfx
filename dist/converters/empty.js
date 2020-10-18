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
exports.EmptyConverter = void 0;
var base_1 = require("./base");
var EmptyConverter = /** @class */ (function (_super) {
    __extends(EmptyConverter, _super);
    function EmptyConverter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EmptyConverter.prototype.generate = function (node, context) {
        return [];
    };
    return EmptyConverter;
}(base_1.AbstractConverter));
exports.EmptyConverter = EmptyConverter;
//# sourceMappingURL=empty.js.map