import * as readline from 'readline';
import * as path from 'path';
import * as fs from 'fs';
import { window, Position, Range } from 'vscode';

const PROPS_REGEX = /([\u4e00-\u9fa5|\d|\D]+\s*\|\s*){4}[\u4e00-\u9fa5|\d|\D]+/;
const PROPS_TITLE_REGEX = /([\u4e00-\u9fa5]+\s*\|\s*){4}[\u4e00-\u9fa5]+/;
const PROPS_DIVIDER_REGEX = /(-+\s*\|\s*){4}-+/;
const EMIT_REGEX = /([\u4e00-\u9fa5|\d|\D]+\s*\|\s*){3}[\u4e00-\u9fa5|\d|\D]+/;
const EMIT_TITLE_REGEX = /([\u4e00-\u9fa5]+\s*\|\s*){3}[\u4e00-\u9fa5]+/;
const EMIT_DIVIDER_REGEX = /(-+\s*\|\s*){3}-+/;

/**
* 获取属性
* @param {*} stream 
*/
export const readMarkDown = (stream) => {
   let props = {};
   let events = {};
   
   return new Promise((r, j) => {
		const rl = readline.createInterface({
			input: stream,
			crlfDelay: Infinity
		});
		rl.on('line', (line) => {
			 if (PROPS_REGEX.test(line)) {
				 let isTitle = PROPS_TITLE_REGEX.test(line)
				 let isDivider = PROPS_DIVIDER_REGEX.test(line)
				//  if (isTitle && !addedPropsTitle) {
				// 	 addedPropsTitle = true;
				// 	 propsMD += line + '\n';
				//  } else if (isDivider && !addedPropsDivider) {
				// 	 addedPropsDivider = true;
				// 	 propsMD += line + '\n'
				//  } else 
				 if (!isDivider && !isTitle) {
					let [prop = '', explain = '', type = '', choosable = '', defaultValue = ''] = line.split('|') || [];
					// 获取属性的md
					prop = prop.replace(/\s|`/g, '');
					explain = explain.replace(/\s|`/g, '');
					type = type.replace(/\s|`/g, '');
					choosable = choosable.replace(/、/g, ',').replace(/\s|`/g, '');
					defaultValue = defaultValue.replace(/\s|`/g, '');
					if (type === 'boolean' || type === 'Boolean') {
						choosable = "true,false"
					}
					props[prop] = {
						...props[prop],
						prop, 
						explain, 
						type, 
						choosable: choosable, 
						defaultValue,
						md: `key|value 
						---|--- 
						说明 | ${explain} 
						类型 | ${type} 
						可选值 | ${choosable} 
						默认值 | ${defaultValue}`
					}
				 }
			 } else if (EMIT_REGEX.test(line)) {
				 let isTitle = EMIT_TITLE_REGEX.test(line)
				 let isDivider = EMIT_DIVIDER_REGEX.test(line)
				//  if (isTitle && !addedEmitTitle) {
				// 	 addedEmitTitle = true;
				// 	 emitMD += line + '\n';
				//  } else if (isDivider && !addedEmitDivider) {
				// 	 addedEmitDivider = true;
				// 	 emitMD += line + '\n'
				//  } else 
				 if (!isDivider && !isTitle) {
					let [prop = '', explain = '', type = '', params = ''] = line.split('|') || [];
					// 获取属性的md
					prop = prop.replace(/\s|`/g, '');
					explain = explain.replace(/\s|`/g, '');
					type = type.replace(/\s|`/g, '');
					params = params.replace(/\s|`/g, '');
					events[prop] = {
						...events[prop],
						prop, 
						explain, 
						type, 
						params,
						md: `key|value 
						---|--- 
						说明 | ${explain} 
						类型 | ${type} 
						参数 | ${params}`
					}
				 }
			 }
		});
		rl.on('close', () => {
			r({
				props,
				events
			});
		});
   })
}

/**
 * 获取vc组件库的文件路径
 * @param {*} fileName 触发代码提示的文件路径
 */
export const getVCPackagePath = (fileName) => {
	let dir = path.dirname(fileName);
	let packagePath = path.resolve(dir, 'package.json');
	let nodeModulesPath = path.resolve(dir, 'node_modules');
	if (fs.existsSync(packagePath) && fs.existsSync(nodeModulesPath)) {
		return path.resolve(nodeModulesPath, '@wya/vc/lib');
	} else if (fs.existsSync(packagePath) && !fs.existsSync(nodeModulesPath)) {
		window.showInformationMessage('【wya-vc-extension】: 请先安装依赖');
		return '';
	}
	return getVCPackagePath(dir);
}

/**
 * 返回组件的路径 map
 * @param path 
 */
export const getVCComponentPath = (vcPath) => {
	let obj = {}
	fs.readdirSync(vcPath).forEach((component) => {
		let readmePath = path.resolve(vcPath, `${component}/README.md`);
		obj[component] = readmePath;
	})
	return obj
}

/**
 * 获取组件名称
 * @param position 
 */
export const getComponentName = (position) => {
	// 往上一行一行查找，是否在标签内
	let editor = window.activeTextEditor
	let line = position.line;
	let isInLabel = true;
	let component = ''
	while (isInLabel && line > 0) {
		let start = new Position(line, 0);
		let end = new Position(line, 100); // 100是写死的，一般一行代码不超过150
		let range = new Range(start, end);
		let text = editor.document.getText(range);
		let compRegex = /<vc-\w+/;
		let endRegex = /\/?>/;
		let res = compRegex.exec(text);
		if (res !== null) {
			isInLabel = false;
			component = res[0].replace('<vc-', '');
		} else if (endRegex.test(text)) {
			isInLabel = false;
		}
		line--;
	}
	return component;
}

/**
 * 获取输入的字符
 * @param position 
 */
export const getInputText = (position) => {
	let editor = window.activeTextEditor
	let {line, character} = position;
	let start = new Position(line, character - 1);
	let range = new Range(start, position);
	return editor.document.getText(range);
}