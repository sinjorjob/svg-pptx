# トラブルシューティングガイド

SVG-PPTX MCP Serverの一般的な問題と解決方法について説明します。

## 一般的な問題と解決方法

### 1. インストール関連

#### Q: npm installでエラーが発生する

**症状:**
```
npm ERR! Could not resolve dependency
npm ERR! peer dep missing: @anthropic-ai/mcp-sdk@>=0.5.0
```

**解決方法:**
```bash
# Node.js版確認
node --version  # v18以上が必要

# パッケージキャッシュクリア
npm cache clean --force

# 再インストール
npm install
```

#### Q: TypeScriptビルドエラー

**症状:**
```
error TS2307: Cannot find module '@anthropic-ai/mcp-sdk/server/index.js'
```

**解決方法:**
```bash
# MCP SDKの再インストール
npm uninstall @anthropic-ai/mcp-sdk
npm install @anthropic-ai/mcp-sdk@latest

# TypeScript設定確認
npx tsc --showConfig
```

### 2. Claude Code連携

#### Q: MCPサーバーが認識されない

**症状:**
- Claude Code内でツールが表示されない
- "MCP server not found" エラー

**解決方法:**

1. **設定ファイル確認:**
```json
// ~/.config/claude-code/mcp_settings.json
{
  \"mcpServers\": {
    \"svg-pptx\": {
      \"command\": \"node\",
      \"args\": [\"C:/完全な/パス/to/svg-pptx-mcp/dist/index.js\"],
      \"env\": {}
    }
  }
}
```

2. **パス確認:**
```bash
# ビルド成果物の存在確認
ls -la C:/path/to/svg-pptx-mcp/dist/index.js

# 実行可能性確認
node C:/path/to/svg-pptx-mcp/dist/index.js
```

3. **Claude Code再起動:**
- Claude Codeを完全終了
- プロセス確認: `tasklist | findstr claude` (Windows) / `ps aux | grep claude` (Mac/Linux)
- 再起動

### 3. PowerPoint連携問題

#### Q: PowerPointファイルが作成されない (Windows)

**症状:**
```
Error: PowerPoint操作に失敗: spawn cscript ENOENT
Error: PowerPointの起動に失敗
```

**解決方法:**

1. **PowerPoint インストール確認:**
```bash
# PowerPoint実行ファイル確認
dir \"C:\\Program Files\\Microsoft Office\\root\\Office16\\POWERPNT.EXE\"
# または
dir \"C:\\Program Files (x86)\\Microsoft Office\\Office16\\POWERPNT.EXE\"
```

2. **COM オブジェクト確認:**
```vbs
' test_powerpoint.vbs - PowerPoint COM オブジェクトテスト
On Error Resume Next
Set ppt = CreateObject(\"PowerPoint.Application\")
If Err.Number = 0 Then
    WScript.Echo \"PowerPoint COM OK\"
    ppt.Quit
Else
    WScript.Echo \"PowerPoint COM Error: \" & Err.Description
End If
```

```bash
cscript test_powerpoint.vbs
```

### 4. 日本語文字化け問題

#### Q: 日本語文字が正しく表示されない

**解決方法:**

1. **フォント設定修正:**
```typescript
// svg-generator.ts でフォント指定を修正
const templates = {
  basic: {
    titleStyle: 'font-family: \"Noto Sans JP\", \"Yu Gothic\", \"Hiragino Sans\", Arial, sans-serif; ...',
    contentStyle: 'font-family: \"Noto Sans JP\", \"Yu Gothic\", \"Hiragino Sans\", Arial, sans-serif; ...'
  }
};
```

2. **文字エンコーディング確認:**
```typescript
// SVGファイルの先頭にBOM確認
const svg = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<svg xmlns=\"http://www.w3.org/2000/svg\">...`;
```

## サポートリソース

### ログファイル確認

1. **MCPサーバーログ:**
   - Claude Codeのログディレクトリを確認
   - `~/.config/claude-code/logs/` (推定)

2. **デバッグモード:**
```bash
# 詳細出力でMCPサーバー起動
DEBUG=* node dist/index.js
```

### 問題報告テンプレート

```markdown
## 環境情報
- OS: [Windows 11 / macOS 13 / Ubuntu 22.04]
- Node.js: [version]
- Claude Code: [version]
- PowerPoint: [version (Windows only)]

## 問題の詳細
[問題の説明]

## 再現手順
1. [手順1]
2. [手順2]
3. [手順3]

## 期待する動作
[期待していた結果]

## 実際の動作
[実際に起こった結果]

## エラーメッセージ
[エラーの内容]

## その他の情報
[追加の情報やスクリーンショット]
```

これらのトラブルシューティング手順により、多くの一般的な問題を解決できます。