import { YamlModel, Root, Reference } from './interfaces/YamlModel';
import { constructorName, setOfTopLevelItems } from './common/constants';
import { uidRegex } from './common/regex';
import { flags } from './common/flags';
import { ReferenceMapping } from './interfaces/ReferenceMapping';
import { convertLinkToGfm, getTextAndLink } from './helpers/linkConvertHelper';

export function groupOrphanFunctions(elements: YamlModel[]): { [key: string]: YamlModel[] } {
  if (elements && elements.length) {
    let mapping: { [key: string]: YamlModel[] } = {};
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].type === 'function') {
        let key = elements[i].module ? elements[i].module : 'ParentToPackage';
        if (!mapping[key]) {
          mapping[key] = [];
        }
        mapping[key].push(elements[i]);
        elements.splice(i, 1);
        i--;
      }
    }
    return mapping;
  }
}

export function insertFunctionToIndex(index: Root, functions: YamlModel[]) {
  if (index && functions) {
    index.items[0].children = (index.items[0].children as string[]).concat(functions.map(f => f.uid));
    index.items = index.items.concat(functions);
  }
}

export function postTransform(element: YamlModel, references: ReferenceMapping): Root[] {
  let roots = flattening(element);
  for (const root of roots) {
    insertReferences(root, references);
  }

  return roots;
}

function insertReferences(root: Root, references: ReferenceMapping): void {
  if (!references || Object.keys(references).length === 0) {
    return;
  }

  root.references = [];
  for (let key in references) {
    let names = key.split('.');
    let reference: Reference = {
      uid: key,
      name: names[names.length - 1],
      'spec.typeScript': []
    };

    let match;
    let lastIndex = 0;
    while ((match = uidRegex.exec(references[key])) !== null) {
      if (lastIndex < match.index) {
        reference['spec.typeScript'].push(getReference(references[key].substring(lastIndex, match.index)));
      }
      lastIndex = match.index + match[0].length;
      reference['spec.typeScript'].push(getReference(getItemName(match[1]), match[1]));
    }

    if (lastIndex < references[key].length) {
      reference['spec.typeScript'].push(getReference(references[key].substring(lastIndex)));
    }

    root.references.push(reference);
  }
}

export function insertLink(flattenElements: Root[]): void {
  const refs = flattenElements.map(el => el.references).reduce((a, b) => a.concat(b), []);

  for (let transformedClass of flattenElements) {
      for (let child of transformedClass.items) {
          child.summary = convertLinkToGfm(child.summary, child.uid, refs);

          if (child.syntax) {
            if (child.syntax.parameters) {
              for (let el of child.syntax.parameters) {
                el.description = convertLinkToGfm(el.description, child.uid, refs)
              }
            }

            if (child.syntax.return) {
              child.syntax.return.description = convertLinkToGfm(child.syntax.return.description, child.uid, refs);
            }
          }

          if (child.deprecated) {
            child.deprecated.content = convertLinkToGfm(child.deprecated.content, child.uid, refs);
          }

          if (child.remarks) {
            child.remarks = convertLinkToGfm(child.remarks, child.uid, refs);
          }

          if (child.example) {
            child.example = child.example.map(el => convertLinkToGfm(el, child.uid, refs));
          }
      }
  }
}

// to add this function due to classes under modules need to be cross reference
export function insertClassReferenceForModule(flattenElements: Root[]) {
  for (const element of flattenElements) {
    if (element.items[0].type !== 'module') {
      continue;
    }

    if (!element.references) {
      element.references = []
      continue;
    }

    let children = element.items[0].children as string[];
    for (const child of children) {
      let find = false;
      for (const ref of element.references) {
        if (ref.uid === child) {
          find = true;
          break;
        }
      }

      if (!find) {
        const names = child.split('.');
        const reference: Reference = {
          uid: child,
          name: names[names.length - 1]
        };
        element.references.push(reference);
      }
    }
  }
}

export function insertInnerClassReference(innerClassReferenceMapping: Map<string, string[]>, transformedClass: Root) {
  if ((transformedClass.items[0].type === 'class' || transformedClass.items[0].type === 'interface') && innerClassReferenceMapping.has(transformedClass.items[0].uid)) {
    const reference = transformedClass.references || [];
    const referencedClass = innerClassReferenceMapping.get(transformedClass.items[0].uid);
    referencedClass.forEach(function (item) {
      const names = item.split('.');
      const ref: Reference = {
        uid: item,
        name: names[names.length - 1]
      };
      reference.push(ref);
    });
  }
}

function getReference(name: string, uid?: string): Reference {
  let reference: Reference = {
    name: name,
    fullName: name
  };

  if (uid) {
    reference.uid = uid;
  }

  return reference;
}

function getItemName(uid: string): string {
  let tmp = uid.split('.');
  return tmp[tmp.length - 1];
}

function flattening(element: YamlModel): Root[] {
  if (!element) {
    return [];
  }

  let result: Root[] = [];
  result.push({
    items: [element]
  });

  if (element.children) {
    const childrenUid: string[] = [];
    let children = element.children as YamlModel[];
    if (flags.enableAlphabetOrder && !flags.tocAlphabetOrderOnly) {
      children = children.sort(sortYamlModel);
    }

    for (const child of children) {
      if (child.children && child.children.length > 0) {
        result = result.concat(flattening(child));
      } else if (setOfTopLevelItems.has(child.type)) {
        let resultWithoutChild: Root[] = [];
        resultWithoutChild.push({
          items: [child]
        });
        result = result.concat(resultWithoutChild);
      } else {
        result[0].items.push(child);
      }
      if (child.type !== 'module') {
        childrenUid.push(child.uid);
      }
    }

    element.children = childrenUid;
    return result;
  }
}

function sortYamlModel(a: YamlModel, b: YamlModel): number {
  // sort classes alphabetically, contructor first
  if (b.name === constructorName) {
    return 1;
  }
  if (a.name === constructorName) {
    return -1;
  }

  let nameA = a.name.toUpperCase();
  let nameB = b.name.toUpperCase();
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  return 0;
}
