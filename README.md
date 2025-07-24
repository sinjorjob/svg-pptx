# SVG-PPTX MCP Server

ClaudeCode用のMCPサーバーで、SVGファイルをPowerPointプレゼンテーションに変換します。

## 🚀 機能

- **💼 PowerPoint変換** - SVGファイルをPowerPoint(.pptx)に自動変換
- **🖼️ 図形として挿入** - SVGがPowerPoint内で編集可能な図形として配置
- **⚡ 高速処理** - PowerShell + COM オブジェクトによる直接操作
- **🔄 MCPサーバー** - ClaudeCodeから直接呼び出し可能

## 📋 システム要件

| 要件 | バージョン/詳細 |
|------|----------------|
| Node.js | 18以上 |
| Claude Code | 最新版推奨 |
| OS | Windows環境必須 |
| Microsoft PowerPoint | Windows版必須 |

## 📦 インストール

### 1. GitHubからクローン

```bash
# リポジトリをクローン
git clone https://github.com/sinjorjob/svg-pptx.git
cd svg-pptx
```

### 2. 依存関係のインストールとビルド

```bash
# 依存関係をインストール
npm install

# TypeScriptをコンパイル
npm run build
```

### 3. ClaudeCodeへの登録

クローンしたディレクトリのパスを使用してMCPサーバーを登録：

```cmd
# 例: C:\your\path\svg-pptx にクローンした場合
claude mcp add-json svg-pptx "{\"name\":\"svg-pptx\",\"command\":\"node\",\"args\":[\"C:/your/path/svg-pptx/dist/index.js\"]}"
```

**注意:** パスは実際にクローンした場所に合わせて変更してください。

### 4. 登録確認

```cmd
claude mcp list
```

以下のような出力が表示されれば成功：
```
svg-pptx: node C:/your/path/svg-pptx/dist/index.js - ✓ Connected
```

### 5. ClaudeCodeの再起動

設定変更後、ClaudeCodeを再起動してMCPサーバーを読み込みます。

## 💻 使用方法

### ClaudeCode内でのコマンド例

```
@スライド構成.txtに記載している情報を１枚スライドのSVG画像にした後、PPTファイルに変換して
```

```
SVGファイル「slide.svg」をPowerPointに変換して
```

```
@slide_sample.svgをPPTファイルにして
```

### MCPツール直接呼び出し

ClaudeCodeが自動で以下のMCPツールを呼び出します：

```typescript
await create_pptx_slide({
  svgPath: "path/to/your/file.svg",
  outputPath: "output.pptx"
});
```

## 📁 プロジェクト構造

```
svg-pptx/
├── README.md                 # このファイル
├── CHANGELOG.md              # 変更履歴
├── LICENSE                   # MITライセンス
├── package.json              # パッケージ設定
├── tsconfig.json             # TypeScript設定
├── .gitignore               # Git除外設定
├── .github/                 # GitHub設定
├── src/
│   ├── index.ts             # メインMCPサーバー
│   └── pptx-handler.ts      # PowerPoint操作
├── scripts/
│   └── simple_convert.ps1   # PowerShell変換スクリプト
├── dist/                    # ビルド成果物
├── docs/                    # 詳細ドキュメント
│   ├── DEPLOYMENT.md
│   ├── ERROR_HANDLING.md
│   ├── IMPLEMENTATION_GUIDE.md
│   └── TROUBLESHOOTING.md
└── examples/
    ├── basic-usage.md       # 使用例
    └── svg-samples/         # サンプルSVGファイル
        └── slide_accenture_style.svg
```

## 🔧 開発・ビルド

```bash
# 依存関係のインストール
npm install

# 開発モード（ファイル監視）
npm run dev

# プロダクションビルド
npm run build

# MCPサーバー起動（デバッグ用）
npm start

# リンター実行
npm run lint

# リンター自動修正
npm run lint:fix
```

## ⚙️ 技術詳細

### アーキテクチャ

1. **ClaudeCode** → MCPプロトコル
2. **MCPサーバー** (`src/index.ts`) → リクエスト受信
3. **PPTXハンドラー** (`src/pptx-handler.ts`) → PowerShellスクリプト生成・実行
4. **PowerShell** → PowerPoint COM操作
5. **PowerPoint** → .pptxファイル生成

### 使用技術

- **TypeScript** - 型安全なサーバー開発
- **@modelcontextprotocol/sdk** - MCPサーバー実装
- **PowerShell** - Windows PowerPoint自動化
- **COM オブジェクト** - PowerPoint直接操作

## 📚 ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [実装ガイド](./docs/IMPLEMENTATION_GUIDE.md) | 詳細な技術実装 |
| [エラーハンドリング](./docs/ERROR_HANDLING.md) | エラー処理戦略 |
| [トラブルシューティング](./docs/TROUBLESHOOTING.md) | 一般的な問題の解決法 |
| [デプロイメント](./docs/DEPLOYMENT.md) | 本番環境配布方法 |
| [使用例](./examples/basic-usage.md) | 実践的なサンプル |

## 🐛 トラブルシューティング

### よくある問題

1. **PowerPointが開かない**
   - PowerPointがインストールされているか確認
   - PowerShellの実行ポリシーを確認

2. **MCPサーバーに接続できない**
   - `npm run build` でビルドが完了しているか確認
   - ClaudeCodeを再起動

3. **権限エラー**
   - PowerShellを管理者権限で実行
   - ウイルス対策ソフトの除外設定を確認

## 📄 ライセンス

MIT License

---

> **注意:** このツールはWindows環境でのMicrosoft PowerPoint必須です。PowerPointのCOMオブジェクトを使用してSVG→PPTX変換を行います。
