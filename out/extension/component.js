"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const vscode_1 = require("vscode");
const utils_1 = require("../utils");
let vcPath = '';
let vcPathMap = {};
let vcMap = {};
/**
* 创建vcMap的键值对
* @param {*} vcPath
*/
const createCompontEntries = (component) => __awaiter(this, void 0, void 0, function* () {
    if (!vcMap[component]) {
        // TODO 如果vcMap内已经有值，就不解析readme.md
        let readmePath = path.resolve(vcPathMap[component]);
        let stream = fs.createReadStream(readmePath);
        vcMap[component] = yield utils_1.readMarkDown(stream);
    }
});
class VcCompletionItemProvider {
    provideCompletionItems(document, position, token) {
        return __awaiter(this, void 0, void 0, function* () {
            let inputText = utils_1.getInputText(position);
            if (!vcPath) {
                vcPath = utils_1.getVCPackagePath(path.dirname(document.fileName));
                vcPathMap = utils_1.getVCComponentPath(vcPath);
            }
            if (!vcPath || !fs.existsSync(vcPath)) {
                vscode_1.window.showInformationMessage('目前没有安装VC组件库');
                return [];
            }
            let component = utils_1.getComponentName(position);
            yield (component && createCompontEntries(component));
            // @ 符号提供的可选值
            if (inputText === '@') {
                let events = (vcMap[component] || {}).events;
                let keys = Object.keys(events);
                let values = Object.values(events);
                return keys.map((key, index) => {
                    let { md = '' } = values[index] || {};
                    let emun = new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Function);
                    emun.preselect = true;
                    emun.detail = 'vc-' + component; // 详情
                    // 选中item时展示，markdown格式;可以展示readme中属性
                    emun.documentation = new vscode_1.MarkdownString(md);
                    // 选中item后插入的代码片段
                    emun.insertText = new vscode_1.SnippetString(key + '="handle${1}"');
                    return emun;
                });
            }
            // : 符号提供的可选值
            let props = (vcMap[component] || {}).props;
            let keys = Object.keys(props);
            let values = Object.values(props);
            return keys.map((key, index) => {
                let { md = '', choosable = '', type = '' } = values[index] || {};
                let emun = new vscode_1.CompletionItem(key, vscode_1.CompletionItemKind.Enum);
                emun.preselect = true;
                emun.detail = 'vc-' + component; // 详情
                // 选中item时展示，markdown格式;可以展示readme中属性
                emun.documentation = new vscode_1.MarkdownString(md);
                // 选中item后插入的代码片段，可以将可选参数放入
                if (choosable !== '-') {
                    emun.insertText = new vscode_1.SnippetString(key + '="${1|' + choosable + '|}"');
                }
                else {
                    emun.insertText = new vscode_1.SnippetString(key + '="${1}"');
                }
                return emun;
            });
        });
    }
}
exports.default = VcCompletionItemProvider;
//# sourceMappingURL=component.js.map