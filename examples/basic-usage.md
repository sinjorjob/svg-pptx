# 基本的な使用例

SVG-PPTX MCP Serverの基本的な使用方法を紹介します。

## 1. シンプルなスライド生成

### Claude Code内での実行例

```javascript
// 基本的なプレゼンスライドの生成
const slideResult = await generate_svg_slide({
  title: "プロジェクト進捗報告",
  content: [
    "第1四半期目標を達成",
    "新機能開発が順調に進行",
    "テスト工程に移行予定",
    "リリースは来月末を予定"
  ],
  template: "basic"
});

console.log("生成されたSVG:", slideResult);

// PowerPointファイルの作成
const pptxResult = await create_pptx_slide({
  svgPath: "./slide_1642123456789.svg",
  outputPath: "./project_progress.pptx"
});

console.log("PowerPointファイル作成完了:", pptxResult);
```

## 2. 異なるテンプレートの使用

### 図解用テンプレート

```javascript
await generate_svg_slide({
  title: "システム構成図",
  content: [
    "フロントエンド: React + TypeScript",
    "バックエンド: Node.js + Express",
    "データベース: PostgreSQL",
    "クラウド: AWS EC2 + RDS"
  ],
  template: "diagram"
});
```

### グラフ・データ表示用テンプレート

```javascript
await generate_svg_slide({
  title: "売上実績 2024年",
  content: [
    "Q1: 1,200万円 (+15%)",
    "Q2: 1,350万円 (+12%)",  
    "Q3: 1,480万円 (+9%)",
    "Q4: 1,600万円（予測）"
  ],
  template: "chart"
});
```

## 3. 複数スライドの一括生成

```javascript
// 複数のスライド内容を定義
const slides = [
  {
    title: "プロジェクト概要",
    content: [
      "目的: 業務効率化システムの構築",
      "期間: 2024年1月〜6月",
      "チーム: 5名（開発3名、デザイン1名、PM1名）"
    ],
    template: "basic"
  },
  {
    title: "技術スタック",
    content: [
      "フロントエンド: Next.js 14",
      "バックエンド: FastAPI",
      "データベース: MongoDB",
      "インフラ: Vercel + MongoDB Atlas"
    ],
    template: "diagram"
  },
  {
    title: "開発スケジュール",
    content: [
      "設計フェーズ: 1-2月",
      "開発フェーズ: 3-5月",
      "テストフェーズ: 5月",
      "リリース: 6月"
    ],
    template: "basic"
  }
];

// 各スライドを生成
const generatedSlides = [];
for (let i = 0; i < slides.length; i++) {
  const slide = slides[i];
  const result = await generate_svg_slide({
    title: slide.title,
    content: slide.content,
    template: slide.template
  });
  generatedSlides.push(result);
  console.log(`スライド ${i + 1} 生成完了: ${result}`);
}

console.log(`${generatedSlides.length}枚のスライドを生成しました`);
```

## 4. カスタマイズ例

### 長いテキストを含むスライド

```javascript
await generate_svg_slide({
  title: "新機能の詳細説明",
  content: [
    "ユーザー認証システムの強化により、セキュリティを向上",
    "リアルタイム通知機能で、重要な情報を即座に共有",
    "モバイル対応により、外出先でも利用可能",
    "APIの拡張で、外部システムとの連携を強化"
  ],
  template: "basic"
});
```

### 短い要点のスライド

```javascript
await generate_svg_slide({
  title: "キーポイント",
  content: [
    "品質向上",
    "コスト削減", 
    "効率化",
    "顧客満足度UP"
  ],
  template: "diagram"
});
```

## 5. ファイル管理のベストプラクティス

```javascript
// 日付とプロジェクト名を含むファイル名
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const projectName = "quarterly_report";

const result = await generate_svg_slide({
  title: "四半期レポート",
  content: [
    "売上目標達成率: 105%",
    "新規顧客獲得: 45社",
    "顧客満足度: 4.8/5.0",
    "次期目標: 売上20%向上"
  ],
  template: "chart"
});

// 整理されたファイル名でPowerPoint作成
await create_pptx_slide({
  svgPath: result.path,
  outputPath: `./presentations/${today}_${projectName}.pptx`
});
```

## 6. エラーハンドリングの例

```javascript
try {
  const result = await generate_svg_slide({
    title: "テストスライド",
    content: [
      "テスト項目1",
      "テスト項目2"
    ],
    template: "basic"
  });
  
  const pptxResult = await create_pptx_slide({
    svgPath: result.path,
    outputPath: "./test_presentation.pptx"
  });
  
  console.log("処理完了:", pptxResult);
  
} catch (error) {
  console.error("エラーが発生しました:", error.message);
  
  // エラーの種類に応じた処理
  if (error.message.includes("SVGファイルが見つかりません")) {
    console.log("SVGファイルの生成から再実行してください");
  } else if (error.message.includes("PowerPoint")) {
    console.log("PowerPointが正しくインストールされているか確認してください");
  }
}
```

## 出力例

生成されるSVGファイルの例：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="80" y="120" style="font-family: Arial, sans-serif; font-size: 48px; font-weight: bold; fill: #333333;">プロジェクト進捗報告</text>
  <line x1="80" y1="160" x2="1200" y2="160" stroke="#e0e0e0" stroke-width="3"/>
  <circle cx="120" cy="212" r="6" fill="#4285f4"/>
  <text x="150" y="220" style="font-family: Arial, sans-serif; font-size: 32px; fill: #666666;">第1四半期目標を達成</text>
  <!-- その他の要素... -->
</svg>
```

これらの例を参考に、プロジェクトのニーズに合わせてスライドを生成してください。