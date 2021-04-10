"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTOC = exports.generateItems = void 0;
var constants_1 = require("./common/constants");
var flags_1 = require("./common/flags");
function generateItems(element) {
    var result;
    var itemsDetails = [];
    result = {
        uid: element.uid,
        name: element.name.split('(')[0],
        items: itemsDetails
    };
    if (!element.children || element.children.length === 0) {
        if (constants_1.setOfTopLevelItems.has(element.type)) {
            return result;
        }
        return null;
    }
    var children = element.children;
    if (children.length > 1) {
        if (flags_1.flags.enableAlphabetOrder) {
            children = children.sort(sortTOC);
        }
    }
    children.forEach(function (child) {
        var items = generateItems(child);
        if (items) {
            itemsDetails.push(items);
        }
    });
    return result;
}
exports.generateItems = generateItems;
function generateTOC(elements, packageUid) {
    var itemsDetails = [];
    if (elements) {
        if (elements.length > 1) {
            if (flags_1.flags.enableAlphabetOrder) {
                elements = elements.sort(sortTOC);
            }
        }
        elements.forEach(function (element) {
            var items = generateItems(element);
            if (items) {
                itemsDetails.push(items);
            }
        });
    }
    return itemsDetails;
}
exports.generateTOC = generateTOC;
function sortTOC(a, b) {
    var nameA = a.name.toUpperCase();
    var nameB = b.name.toUpperCase();
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}
//# sourceMappingURL=tocGenerator.js.map