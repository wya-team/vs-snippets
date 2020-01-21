import {  languages, ExtensionContext } from 'vscode';
import VcCompletionItemProvider from './extension/component';

export const activate = (context: ExtensionContext): void => {	
	// 组件属性代码自动补全
	context.subscriptions.push(languages.registerCompletionItemProvider('vue', new VcCompletionItemProvider(), ':', '@'));
}