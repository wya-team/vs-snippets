"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const component_1 = require("./extension/component");
exports.activate = (context) => {
    // 组件属性代码自动补全
    context.subscriptions.push(vscode_1.languages.registerCompletionItemProvider('vue', new component_1.default(), ':', '@'));
};
//# sourceMappingURL=extension.js.map