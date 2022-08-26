"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLinkToGfm = exports.getLinks = exports.getTextAndLink = void 0;
var dfmRegex = [
    /\[(?:([^\]]+))\]{(@link|@link|@linkcode|@linkplain) +(?:module:)?([^}| ]+)}/g,
    /\{(@link|@linkcode|@linkplain) +(?:module:)?([^}| ]+)(?:(?:\|| +)([^}]+))?\}/g
];
function getTextAndLink(text) {
    var matches = dfmRegex[0].exec(text);
    if (matches && matches[1] && matches[3]) {
        return [matches[1], matches[3]];
    }
    matches = dfmRegex[1].exec(text);
    if (matches && matches[3] && matches[2]) {
        return [matches[3], matches[2]];
    }
    return [];
}
exports.getTextAndLink = getTextAndLink;
function getLinks(text) {
    var results = [];
    var matches;
    while (matches = dfmRegex[0].exec(text)) {
        if (!matches[3]) {
            continue;
        }
        results.push(matches[3].replace(/~|-|#/g, '.'));
    }
    while (matches = dfmRegex[1].exec(text)) {
        if (!matches[2]) {
            continue;
        }
        results.push(matches[2].replace(/~|-|#/g, '.'));
    }
    return results;
}
exports.getLinks = getLinks;
function convertLinkToGfm(text, parentUid, refs) {
    if (!text)
        return '';
    var dfmLinkRules = [
        {
            // [link text]{@link namepathOrURL}
            regexp: dfmRegex[0],
            callback: function (match, p1, p2, p3) {
                return generateDfmLink(p2, p3, p1);
            }
        },
        {
            // {@link namepathOrURL}
            // {@link namepathOrURL|link text}
            // {@link namepathOrURL link text (after the first space)}
            regexp: dfmRegex[1],
            callback: function (match, p1, p2, p3) {
                return generateDfmLink(p1, p2, p3);
            }
        }
    ];
    var result = text;
    dfmLinkRules.forEach(function (r) {
        result = result.replace(r.regexp, r.callback);
    });
    return result;
    function generateDfmLink(tag, target, text) {
        var result = '';
        if (!text) {
            // if link text is undefined, it must link to namepath(uid)
            result = '<xref:' + convertNamepathToUid(target) + '>';
            if (tag === '@linkcode') {
                return '<code>' + result + '</code>';
            }
        }
        else {
            result = text;
            if (tag === '@linkcode') {
                result = '<code>' + result + '</code>';
            }
            result = '[' + result + '](';
            // http://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url#answer-3809435
            if (!/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(target)) {
                // if target isn't a url, it must be a namepath(uid)
                result += 'xref:';
                target = convertNamepathToUid(target);
            }
            result += target + ')';
        }
        return result;
        function convertNamepathToUid(namepath) {
            var uid = namepath;
            var criteria = namepath.replace(/~|#/g, '.');
            var elUid = parentUid;
            var n = -1;
            var _loop_1 = function () {
                var childUid = elUid = elUid.substring(0, n);
                childUid += '.' + criteria;
                var ref = refs.find(function (el) { return el.uid.endsWith(childUid); });
                if (!ref)
                    return "continue";
                uid = ref['spec.typeScript'] ? ref['spec.typeScript'][0].uid : ref.uid;
                return "break";
            };
            while ((n = elUid.lastIndexOf('.')) !== -1) {
                var state_1 = _loop_1();
                if (state_1 === "break")
                    break;
            }
            return encodeURIComponent(uid);
        }
    }
}
exports.convertLinkToGfm = convertLinkToGfm;
//# sourceMappingURL=linkConvertHelper.js.map