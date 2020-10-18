"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
var Context = /** @class */ (function () {
    function Context(repo, parentUid, parentKind, packageName, namespaceName, moduleName, references) {
        this.repo = repo;
        this.packageName = packageName;
        this.namespaceName = namespaceName;
        this.moduleName = moduleName;
        this.parentUid = parentUid;
        this.parentKind = parentKind;
        this.references = references;
    }
    Object.defineProperty(Context.prototype, "PackageName", {
        get: function () {
            return this.packageName;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "NamespaceName", {
        get: function () {
            return this.namespaceName;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "ModuleName", {
        get: function () {
            return this.moduleName;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "NamepathRoot", {
        get: function () {
            return this.moduleName === '' ? this.namespaceName : this.moduleName;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "References", {
        get: function () {
            return this.references;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "Repo", {
        get: function () {
            return this.repo;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "ParentUid", {
        get: function () {
            if (this.parentUid === '') {
                return this.PackageName;
            }
            return this.parentUid;
        },
        set: function (uid) {
            this.parentUid = uid;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "ParentKind", {
        get: function () {
            return this.parentKind;
        },
        enumerable: false,
        configurable: true
    });
    return Context;
}());
exports.Context = Context;
//# sourceMappingURL=context.js.map