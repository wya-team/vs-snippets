import * as path from 'path';
import * as fs from 'fs';
import { 
	languages, window, workspace, MarkdownString, SnippetString,
	ExtensionContext, CompletionItemProvider, TextDocument, Range,
	Position, CancellationToken, CompletionItem, CompletionItemKind
} from 'vscode';
import { readMarkDown, getVCPackagePath, getVCComponentPath, getComponentName, getInputText } from '../utils'
let vcPath = '';
let vcPathMap = {};
let vcMap = {};

/**
* 创建vcMap的键值对
* @param {*} vcPath 
*/
const createCompontEntries = async (component) => {
	if (!vcMap[component]) {
		// TODO 如果vcMap内已经有值，就不解析readme.md
		let readmePath = path.resolve(vcPathMap[component]);
		let stream = fs.createReadStream(readmePath);
		vcMap[component] = await readMarkDown(stream);
	}
}
export default class VcCompletionItemProvider implements CompletionItemProvider {
    public async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken) {
		let inputText = getInputText(position);
		if (!vcPath) {
			vcPath = getVCPackagePath(path.dirname(document.fileName))
			vcPathMap = getVCComponentPath(vcPath)
		}
		if (!vcPath || !fs.existsSync(vcPath)) {
			window.showInformationMessage('目前没有安装VC组件库');
			return [];
		}

		let component = getComponentName(position);
		await (component && createCompontEntries(component));

		// @ 符号提供的可选值
		if (inputText === '@') {
			let events = (vcMap[component] || {}).events;
			let keys: Array<string> = Object.keys(events);
			let values: Array<any> = Object.values(events);
			return keys.map((key, index) => {
				let {md = ''} = values[index] || {};
				let emun = new CompletionItem(key, CompletionItemKind.Function);
				emun.preselect = true;
				emun.detail = 'vc-' + component; // 详情
				// 选中item时展示，markdown格式;可以展示readme中属性
				emun.documentation = new MarkdownString(md); 
				// 选中item后插入的代码片段
				emun.insertText = new SnippetString(key + '="handle${1}"'); 
				
				return emun;
			})
		}

		// : 符号提供的可选值
		let props = (vcMap[component] || {}).props;
		let keys: Array<string> = Object.keys(props);
		let values: Array<any> = Object.values(props);
		return keys.map((key, index) => {
			let {md = '', choosable = '', type = ''} = values[index] || {};
			let emun = new CompletionItem(key, CompletionItemKind.Enum);
			emun.preselect = true;
			emun.detail = 'vc-' + component; // 详情
			// 选中item时展示，markdown格式;可以展示readme中属性
			emun.documentation = new MarkdownString(md); 
			// 选中item后插入的代码片段，可以将可选参数放入
			if (choosable !== '-') {
				emun.insertText = new SnippetString(key + '="${1|' + choosable + '|}"'); 
			} else {
				emun.insertText = new SnippetString(key + '="${1}"'); 
			}
			
			return emun;
		})
    }
}