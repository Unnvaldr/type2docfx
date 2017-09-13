#!/usr/bin/env node

import * as fs from 'fs-extra';
import * as serializer from 'js-yaml';
import * as program from 'commander';
import { traverse } from './jsonTraverse';
import { postTransform } from './postTransformer';
import { generateToc } from './tocGenerator';
import { generatePackage } from './packageGenerator';
import { resolveIds } from './idResolver';
import { YamlModel, Syntax, YamlParameter } from './interfaces/YamlModel';
import { TocItem } from './interfaces/TocItem';
import { UidMapping } from './interfaces/UidMapping';
import { RepoConfig } from './interfaces/RepoConfig';
import { yamlHeader } from './common/constants';
import { flags } from './common/flags';

let pjson = require('../package.json');

let path: string;
let outputPath: string;
let repoConfigPath: string;
program
.version(`v${pjson.version}`)
.description('A tool to convert the json format api file generated by TypeDoc to yaml format output files for docfx.')
.option('--hasModule', 'Add the option if the source repository contains module')
.option('--disableAlphabetOrder', 'Add the option if you want to disable the alphabet order in output yaml')
.option('--basePath [value]', 'Current base path to the repository')
.arguments('<inputFile> <outputFolder> [repoConfigureFile]')
.action(function (input: string, output: string, repoConfig: string) {
    path = input;
    outputPath = output;
    repoConfigPath = repoConfig;
 })
.parse(process.argv);

if (!path || !outputPath) {
    console.log('Error: The input file path and output folder path is not specified!');
    program.help();
}

let repoConfig: RepoConfig;
if (repoConfigPath && program.basePath) {
    if (fs.existsSync(repoConfigPath)) {
        let temp = JSON.parse(fs.readFileSync(repoConfigPath).toString());
        repoConfig = {
            repo: temp.repo,
            branch: temp.branch,
            basePath: program.basePath
        };
    }
}

if (program.hasModule) {
    flags.hasModule = true;
}

if (program.disableAlphabetOrder) {
    flags.enableAlphabetOrder = false;
}

let json = null;
if (fs.existsSync(path)) {
    let dataStr = fs.readFileSync(path).toString();
    json = JSON.parse(dataStr);
} else {
    console.error('Api doc file ' + path + ' doesn\'t exist.');
    process.exit(1);
}

let rootElements: YamlModel[] = [];
let uidMapping: UidMapping = {};
if (json) {
    traverse(json, '', rootElements, null, uidMapping, repoConfig);
}

if (rootElements && rootElements.length) {
    resolveIds(rootElements, uidMapping);
    let index = generatePackage(rootElements);
    index = JSON.parse(JSON.stringify(index));
    fs.writeFileSync(`${outputPath}/index.yml`, `${yamlHeader}\n${serializer.safeDump(index)}`);
    console.log('index genrated.');

    let toc = generateToc(rootElements, index.items[0].uid);
    toc = JSON.parse(JSON.stringify(toc));
    fs.writeFileSync(`${outputPath}/toc.yml`, serializer.safeDump(toc));
    console.log('toc genrated.');

    console.log('Yaml dump start.');
    rootElements.forEach(rootElement => {
        if (rootElement.uid.indexOf('constructor') >= 0) {
            return;
        }

        let transfomredClass = postTransform(rootElement);
        // silly workaround to avoid issue in js-yaml dumper
        transfomredClass = JSON.parse(JSON.stringify(transfomredClass));
        let filename = null;
        if (rootElement.module) {
            filename = `${rootElement.module.replace(/\//g, '.')}.${rootElement.name}`;
        } else {
            filename = rootElement.name;
        }
        filename = filename.split('(')[0];
        console.log(`Dump ${outputPath}/${filename}.yml`);
        fs.writeFileSync(`${outputPath}/${filename}.yml`, `${yamlHeader}\n${serializer.safeDump(transfomredClass)}`);
    });
    console.log('Yaml dump end.');
}
