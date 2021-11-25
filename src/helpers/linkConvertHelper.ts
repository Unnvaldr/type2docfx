import { Reference } from '../interfaces/YamlModel';

var dfmRegex = [
  /\[(?:([^\]]+))\]{(@link|@link|@linkcode|@linkplain) +(?:module:)?([^}| ]+)}/g,
  /\{(@link|@linkcode|@linkplain) +(?:module:)?([^}| ]+)(?:(?:\|| +)([^}]+))?\}/g
];

export function getTextAndLink(text: string) {
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

export function getLinks(text: string) {
  const results = [];
  let matches;
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

export function convertLinkToGfm(text: string, parentUid: string, refs: Reference[]) {
  if (!text) return '';
  var dfmLinkRules = [
    {
      // [link text]{@link namepathOrURL}
      regexp: dfmRegex[0],
      callback: function (match: any, p1: any, p2: any, p3: any) {
        return generateDfmLink(p2, p3, p1);
      }
    },
    {
      // {@link namepathOrURL}
      // {@link namepathOrURL|link text}
      // {@link namepathOrURL link text (after the first space)}
      regexp: dfmRegex[1],
      callback: function (match: any, p1: any, p2: any, p3: any) {
        return generateDfmLink(p1, p2, p3);
      }
    }
  ];

  var result = text;
  dfmLinkRules.forEach(function (r) {
    result = result.replace(r.regexp, r.callback);
  });
  return result;

  function generateDfmLink(tag: string, target: string, text: string) {
    var result = '';
    if (!text) {
      // if link text is undefined, it must link to namepath(uid)
      result = '<xref:' + convertNamepathToUid(target) + '>';
      if (tag === '@linkcode') {
        return '<code>' + result + '</code>';
      }
    } else {
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

    function convertNamepathToUid(namepath: string) {
      var uid = namepath;
      const criteria = namepath.replace(/~|#/g, '.');
      let elUid = parentUid;
      let n = -1;
      while ((n = elUid.lastIndexOf('.')) !== -1) {
          let childUid = elUid = elUid.substring(0, n);
          childUid += '.' + criteria;
          const ref = refs.find(el => el.uid.endsWith(childUid));
          if (!ref) continue;
          uid = ref['spec.typeScript'] ? ref['spec.typeScript'][0].uid : ref.uid;
          break;
      }
      return encodeURIComponent(uid);
    }
  }
}
