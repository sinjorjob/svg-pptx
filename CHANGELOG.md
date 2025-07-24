# Changelog

SVG-PPTX MCP Serverの変更履歴

## [1.0.0] - 2025-07-22

### Added
- 初回リリース
- SVGスライド生成機能
- PowerPointファイル自動作成機能
- 基本、図解、グラフテンプレート
- Windows PowerPoint直接操作サポート
- クロスプラットフォーム対応（PNG変換経由）
- Claude Code MCP統合

### Features
- `generate_svg_slide` ツール：プレゼン用SVG生成
- `create_pptx_slide` ツール：SVG→PowerPoint変換
- 複数テンプレートサポート
- 自動的な図形変換（Windows環境）

### Technical
- TypeScript実装
- MCP SDK 0.5.0対応
- Puppeteerによる画像変換
- VBScript経由PowerPoint操作（Windows）
- officegen代替機能（macOS/Linux）

## [Future Releases]

### Planned Features
- [ ] カスタムテンプレート作成機能
- [ ] アニメーション効果追加
- [ ] 複数スライド一括生成
- [ ] PowerPoint テーマ適用
- [ ] グラフ・チャート生成機能
- [ ] マスタースライド対応
- [ ] 画像・アイコン埋め込み
- [ ] Web API連携機能