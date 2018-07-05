import { YamlModel } from './interfaces/YamlModel';
import { TocItem } from './interfaces/TocItem';
import { flags } from './common/flags';

export function generateItems(element: YamlModel): TocItem {
    if (!element.children || element.children.length === 0) {
        return null;
    }
    let result: TocItem;
    let itemsDetails: TocItem[] = [];
    if (element.children && element.children.length > 0) {
        let children = element.children as YamlModel[];
        if (children.length > 1) {
            if (flags.enableAlphabetOrder) {
                children = children.sort(sortTOC);
            }
        }
        children.forEach(child => {
            let items = generateItems(child);
            if (items !== null) {
                itemsDetails.push(items);
            }
        });

    }
    result = {
        uid: element.uid,
        name: element.name.split('(')[0],
        items: itemsDetails
    };

    return result;

}

export function generateTOC(elements: YamlModel[], packageUid: string): TocItem[] {
    let itemsDetails: TocItem[] = [];
    if (elements) {
        if (elements.length > 1) {
            if (flags.enableAlphabetOrder) {
                elements = elements.sort(sortTOC);
            }
        }
        elements.forEach(element => {
            let items = generateItems(element);
            if (items !== null) {
                itemsDetails.push(items);
            }
        });

    }
    return [{
        uid: packageUid,
        name: packageUid,
        items: itemsDetails
    }];
}

function sortTOC(a: YamlModel, b: YamlModel) {
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
