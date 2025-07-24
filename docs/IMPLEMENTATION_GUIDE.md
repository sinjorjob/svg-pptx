# 実装ガイド

SVG-PPTX MCP Serverの詳細な実装ガイドです。

## アーキテクチャ概要

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude Code   │───▶│  MCP Server     │───▶│  PowerPoint     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────▶│   SVG Files     │◀─────────────┘
                        │                 │
                        └─────────────────┘
```

## コア実装

### 1. MCP Server (src/index.ts)

```typescript
import { Server } from '@anthropic-ai/mcp-sdk/server/index.js';
import { StdioServerTransport } from '@anthropic-ai/mcp-sdk/server/stdio.js';
import { generateSVGSlide } from './svg-generator.js';
import { createPowerPointSlide } from './pptx-handler.js';

const server = new Server(
  {
    name: 'svg-pptx-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツール一覧の提供
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'generate_svg_slide',
      description: 'プレゼン用のSVGスライドを生成する',
      inputSchema: {
        type: 'object',
        properties: {
          title: { 
            type: 'string', 
            description: 'スライドタイトル' 
          },
          content: { 
            type: 'array', 
            items: { type: 'string' }, 
            description: 'スライド内容（箇条書き）' 
          },
          template: { 
            type: 'string', 
            enum: ['basic', 'diagram', 'chart'], 
            description: 'テンプレート選択',
            default: 'basic'
          }
        },
        required: ['title', 'content']
      }
    },
    {
      name: 'create_pptx_slide',
      description: 'SVGからPowerPointスライドを作成する',
      inputSchema: {
        type: 'object',
        properties: {
          svgPath: { 
            type: 'string', 
            description: 'SVGファイルのパス' 
          },
          outputPath: { 
            type: 'string', 
            description: '出力PPTXファイルパス' 
          }
        },
        required: ['svgPath', 'outputPath']
      }
    }
  ]
}));

// ツール実行ハンドラ
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'generate_svg_slide') {
      const result = await generateSVGSlide(
        args.title, 
        args.content, 
        args.template || 'basic'
      );
      return { 
        content: [{ 
          type: 'text', 
          text: `SVG生成完了: ${result.path}\nファイルサイズ: ${result.size}KB` 
        }] 
      };
    }

    if (name === 'create_pptx_slide') {
      const result = await createPowerPointSlide(args.svgPath, args.outputPath);
      return { 
        content: [{ 
          type: 'text', 
          text: `PowerPoint作成完了: ${result.path}` 
        }] 
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `エラーが発生しました: ${error.message}`
      }],
      isError: true
    };
  }
});

// サーバー開始
const transport = new StdioServerTransport();
server.connect(transport);

console.log('SVG-PPTX MCP Server started');
```

### 2. SVG生成エンジン (src/svg-generator.ts)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SlideTemplate {
  width: number;
  height: number;
  background: string;
  titleStyle: string;
  contentStyle: string;
  accentColor: string;
  lineColor: string;
}

export interface GenerationResult {
  path: string;
  content: string;
  size: number;
}

// テンプレート定義
const templates: Record<string, SlideTemplate> = {
  basic: {
    width: 1280,
    height: 720,
    background: '#ffffff',
    titleStyle: 'font-family: Arial, sans-serif; font-size: 48px; font-weight: bold; fill: #333333;',
    contentStyle: 'font-family: Arial, sans-serif; font-size: 32px; fill: #666666;',
    accentColor: '#4285f4',
    lineColor: '#e0e0e0'
  },
  diagram: {
    width: 1280,
    height: 720,
    background: '#f8f9fa',
    titleStyle: 'font-family: Arial, sans-serif; font-size: 44px; font-weight: bold; fill: #2c3e50;',
    contentStyle: 'font-family: Arial, sans-serif; font-size: 28px; fill: #34495e;',
    accentColor: '#3498db',
    lineColor: '#bdc3c7'
  },
  chart: {
    width: 1280,
    height: 720,
    background: '#fefefe',
    titleStyle: 'font-family: Arial, sans-serif; font-size: 46px; font-weight: bold; fill: #2c3e50;',
    contentStyle: 'font-family: Arial, sans-serif; font-size: 30px; fill: #7f8c8d;',
    accentColor: '#e74c3c',
    lineColor: '#ecf0f1'
  }
};

export async function generateSVGSlide(
  title: string,
  content: string[],
  templateName = 'basic'
): Promise<GenerationResult> {
  const template = templates[templateName] || templates.basic;
  
  // SVG要素の生成
  const titleElement = `<text x="80" y="120" style="${template.titleStyle}">${escapeXML(title)}</text>`;
  
  const separatorLine = `<line x1="80" y1="160" x2="${template.width - 80}" y2="160" stroke="${template.lineColor}" stroke-width="3"/>`;
  
  const contentElements = content.map((item, index) => {
    const y = 220 + index * 80;
    const bulletColor = template.accentColor;
    
    return `
      <circle cx="120" cy="${y - 8}" r="6" fill="${bulletColor}"/>
      <text x="150" y="${y}" style="${template.contentStyle}">${escapeXML(item)}</text>
    `;
  }).join('\n');

  // SVG文書の構築
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${template.width}" height="${template.height}" 
     xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink">
  
  <!-- 背景 -->
  <rect width="100%" height="100%" fill="${template.background}"/>
  
  <!-- タイトル -->
  ${titleElement}
  
  <!-- 区切り線 -->
  ${separatorLine}
  
  <!-- コンテンツ -->
  ${contentElements}
  
  <!-- フッター -->
  <text x="${template.width - 200}" y="${template.height - 30}" 
        style="font-family: Arial, sans-serif; font-size: 16px; fill: #999999;">
    Generated by SVG-PPTX MCP
  </text>
  
</svg>`;

  // ファイル保存
  const timestamp = Date.now();
  const outputPath = path.join(process.cwd(), `slide_${timestamp}.svg`);
  await fs.writeFile(outputPath, svg, 'utf-8');
  
  // ファイルサイズ計算
  const stats = await fs.stat(outputPath);
  const sizeKB = Math.round(stats.size / 1024);
  
  return { 
    path: outputPath, 
    content: svg,
    size: sizeKB
  };
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

### 3. PowerPoint操作 (src/pptx-handler.ts)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync, spawn } from 'child_process';

export interface PowerPointResult {
  path: string;
  method: 'windows' | 'cross-platform';
}

export async function createPowerPointSlide(
  svgPath: string,
  outputPath: string
): Promise<PowerPointResult> {
  // ファイル存在確認
  try {
    await fs.access(svgPath);
  } catch {
    throw new Error(`SVGファイルが見つかりません: ${svgPath}`);
  }

  // プラットフォーム判定
  if (process.platform === 'win32') {
    return await createPowerPointWindows(svgPath, outputPath);
  } else {
    return await createPowerPointCrossPlatform(svgPath, outputPath);
  }
}

async function createPowerPointWindows(
  svgPath: string, 
  outputPath: string
): Promise<PowerPointResult> {
  
  const absoluteSvgPath = path.resolve(svgPath);
  const absoluteOutputPath = path.resolve(outputPath);
  
  const vbsScript = `
Option Explicit

Dim pptApp, pptPres, pptSlide, shape
Dim svgPath, outputPath

' パスの設定
svgPath = "${absoluteSvgPath.replace(/\\/g, '\\\\')}"
outputPath = "${absoluteOutputPath.replace(/\\/g, '\\\\')}"

On Error Resume Next

' PowerPointアプリケーションを開始
Set pptApp = CreateObject("PowerPoint.Application")
If Err.Number <> 0 Then
    WScript.Echo "Error: PowerPointの起動に失敗しました"
    WScript.Quit 1
End If

pptApp.Visible = True

' 新しいプレゼンテーションを作成
Set pptPres = pptApp.Presentations.Add
Set pptSlide = pptPres.Slides.Add(1, 12) ' ppLayoutBlank = 12

' SVGを画像として挿入
Set shape = pptSlide.Shapes.AddPicture(svgPath, False, True, 50, 50, -1, -1)
If Err.Number <> 0 Then
    WScript.Echo "Error: SVGの挿入に失敗しました"
    pptPres.Close
    pptApp.Quit
    WScript.Quit 1
End If

' 図形に変換を試行
shape.Select
On Error Resume Next
pptApp.CommandBars.ExecuteMso("PictureConvertToSmartArt")
If Err.Number <> 0 Then
    ' SmartArtへの変換に失敗した場合は図形グループ化を試行
    pptApp.CommandBars.ExecuteMso("PictureUngroup")
End If
On Error GoTo 0

' ファイル保存
pptPres.SaveAs outputPath
pptPres.Close
pptApp.Quit

WScript.Echo "PowerPoint作成完了: " & outputPath
`;

  const scriptPath = path.join(process.cwd(), `temp_pptx_${Date.now()}.vbs`);
  await fs.writeFile(scriptPath, vbsScript, 'utf-8');
  
  try {
    const result = execSync(`cscript //NoLogo "${scriptPath}"`, { 
      encoding: 'utf-8',
      timeout: 30000 // 30秒タイムアウト
    });
    
    await fs.unlink(scriptPath);
    
    // 結果ファイルの存在確認
    await fs.access(outputPath);
    
    return { path: outputPath, method: 'windows' };
  } catch (error) {
    await fs.unlink(scriptPath).catch(() => {});
    throw new Error(`PowerPoint操作に失敗: ${error}`);
  }
}

async function createPowerPointCrossPlatform(
  svgPath: string, 
  outputPath: string
): Promise<PowerPointResult> {
  
  // SVGをPNG変換
  const pngPath = await convertSVGtoPNG(svgPath);
  
  try {
    // officegenを使用してPowerPoint作成
    const officegen = require('officegen');
    const pptx = officegen('pptx');

    // スライドレイアウト設定
    pptx.setSlideSize(1280, 720, 'px');
    
    const slide = pptx.makeNewSlide();
    slide.addImage(pngPath, { 
      x: 50, 
      y: 50, 
      cx: 1180, 
      cy: 620 
    });

    return new Promise((resolve, reject) => {
      const out = require('fs').createWriteStream(outputPath);
      pptx.generate(out);
      
      out.on('close', () => {
        // 一時PNGファイルを削除
        fs.unlink(pngPath).catch(() => {});
        resolve({ path: outputPath, method: 'cross-platform' });
      });
      
      out.on('error', (err) => {
        fs.unlink(pngPath).catch(() => {});
        reject(err);
      });
    });
  } catch (error) {
    // 一時PNGファイルを削除
    await fs.unlink(pngPath).catch(() => {});
    throw error;
  }
}

async function convertSVGtoPNG(svgPath: string): Promise<string> {
  const puppeteer = require('puppeteer');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // SVGファイル読み込み
    const svgContent = await fs.readFile(svgPath, 'utf-8');
    
    // HTMLラッパー作成
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; padding: 0; }
            svg { display: block; }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `;
    
    await page.setContent(html);
    await page.setViewport({ width: 1280, height: 720 });
    
    const pngPath = svgPath.replace(/\.svg$/i, '_converted.png');
    
    await page.screenshot({ 
      path: pngPath, 
      fullPage: true,
      type: 'png'
    });
    
    return pngPath;
  } finally {
    await browser.close();
  }
}
```

## テンプレートシステム

### テンプレートの拡張

新しいテンプレートを追加するには：

```typescript
// src/templates/custom-template.ts
export const customTemplate: SlideTemplate = {
  width: 1920,
  height: 1080,
  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
  titleStyle: 'font-family: "Segoe UI", sans-serif; font-size: 60px; font-weight: 300; fill: white;',
  contentStyle: 'font-family: "Segoe UI", sans-serif; font-size: 36px; fill: #f0f0f0;',
  accentColor: '#ffd700',
  lineColor: 'rgba(255,255,255,0.3)'
};
```

プロジェクト構成とサンプルコードの準備が完了しました。次に、エラーハンドリングとテスト戦略について説明します。