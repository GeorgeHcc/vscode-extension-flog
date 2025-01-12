import * as vscode from "vscode";

// 全局变量，用于存储 FLOG 面板
let flogPanel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  // 创建 FLOG 面板
  flogPanel = vscode.window.createOutputChannel("FLOG");

  // 注册 Hover Provider
  const hoverProvider = vscode.languages.registerHoverProvider("typescript", {
    provideHover(document, position, token) {
      const range = document.getWordRangeAtPosition(position);
      const word = document.getText(range);

      // 创建 Hover 内容
      const hoverContent = new vscode.MarkdownString();
      hoverContent.appendMarkdown(`**Flog Actions for \`${word}\`:**\n\n`);
      hoverContent.appendMarkdown(
        `- [Flog(nextLine)](command:fast-log.insertLog?${encodeURIComponent(
          JSON.stringify([word])
        )})\n`
      );
      hoverContent.appendMarkdown(
        `- [Flog(Copy)](command:fast-log.copyLog?${encodeURIComponent(JSON.stringify([word]))})\n`
      );

      return new vscode.Hover(hoverContent);
    },
  });

  // 注册命令：插入 console.log
  const insertLogCommand = vscode.commands.registerCommand("fast-log.insertLog", (word: string) => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const position = editor.selection.active;
      const line = position.line;
      const indent = editor.document.lineAt(line).text.match(/^\s*/)?.[0] || ""; // 获取缩进
      editor.edit((editBuilder) => {
        editBuilder.insert(
          new vscode.Position(line + 1, 0),
          `${indent}console.log('${word}:', ${word});\n`
        );
      });

      // 将 log 输出到 FLOG 面板
      flogPanel.appendLine(`[${new Date().toLocaleTimeString()}] ${word}: ${word}`);
    }
  });

  // 注册命令：将生成的 log 复制到剪贴板
  const copyLogCommand = vscode.commands.registerCommand("fast-log.copyLog", (word: string) => {
    const logStatement = `console.log('${word}:', ${word});`;
    vscode.env.clipboard.writeText(logStatement).then(() => {
      vscode.window.showInformationMessage("Log copied to clipboard!");
    });

    // 将 log 输出到 FLOG 面板
    flogPanel.appendLine(`[${new Date().toLocaleTimeString()}] ${word}: ${word}`);
  });

  // 注册命令：显示 FLOG 面板
  const showFlogPanelCommand = vscode.commands.registerCommand("fast-log.showFlogPanel", () => {
    flogPanel.show(); // 显示 FLOG 面板
  });

  // 将命令和 Hover Provider 添加到订阅中
  context.subscriptions.push(hoverProvider, insertLogCommand, copyLogCommand, showFlogPanelCommand);
}

export function deactivate() {
  // 清理资源
  if (flogPanel) {
    flogPanel.dispose();
  }
}
