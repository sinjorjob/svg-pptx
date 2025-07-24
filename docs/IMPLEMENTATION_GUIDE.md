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

### 2. MCPツール実装

現在の実装では、SVG生成機能は含まれておらず、既存のSVGファイルをPowerPointファイルに変換する機能のみが実装されています。

主要なツール：
- `create_pptx_slide`: SVGファイルをPowerPointファイルに変換

### 3. PowerPoint操作 (src/pptx-handler.ts)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

export interface PowerPointResult {
  path: string;
  method: 'windows';
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

  // Windows環境でのみ動作
  if (process.platform !== 'win32') {
    throw new Error('このツールはWindows環境でのみ動作します');
  }

  return await createPowerPointWindows(svgPath, outputPath);
}

async function createPowerPointWindows(
  svgPath: string, 
  outputPath: string
): Promise<PowerPointResult> {
  
  const absoluteSvgPath = path.resolve(svgPath);
  const absoluteOutputPath = path.resolve(outputPath);
  
  const psScript = `
try {
    $ppt = New-Object -ComObject PowerPoint.Application
    
    $presentation = $ppt.Presentations.Add()
    $slide = $presentation.Slides.Add(1, 12)
    
    $svgPath = "${absoluteSvgPath.replace(/\\/g, '\\\\')}"
    $outputPath = "${absoluteOutputPath.replace(/\\/g, '\\\\')}"
    
    $shape = $slide.Shapes.AddPicture($svgPath, $false, $true, 0, 0)
    
    $shape.Width = 720
    $shape.Height = 540
    
    $presentation.SaveAs($outputPath)
    $presentation.Close()
    $ppt.Quit()
    
    Write-Host "PowerPoint作成完了: $outputPath"
}
catch {
    Write-Host "エラー: $($_.Exception.Message)"
    try { if ($presentation) { $presentation.Close() } } catch {}
    try { if ($ppt) { $ppt.Quit() } } catch {}
    exit 1
}
`;

  const scriptPath = path.join(process.cwd(), 'scripts', `temp_pptx_${Date.now()}.ps1`);
  await fs.writeFile(scriptPath, psScript, 'utf-8');
  
  try {
    console.log('SVGを直接PowerPointに挿入中...');
    const result = execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, { 
      encoding: 'utf-8',
      timeout: 60000
    });
    
    console.log('PowerShell実行結果:', result);
    console.log('SVGがPowerPointに挿入されました');
    
    // 一時ファイル削除
    await fs.unlink(scriptPath);
    
    // 結果ファイルの存在確認
    await fs.access(outputPath);
    
    return { path: outputPath, method: 'windows' };
  } catch (error) {
    // エラー時のクリーンアップ
    await fs.unlink(scriptPath).catch(() => {});
    
    // より詳細なエラー情報
    if (error instanceof Error) {
      throw new Error(`PowerShell実行に失敗: ${error.message}`);
    }
    throw new Error(`PowerShell実行に失敗: ${String(error)}`);
  }
}

```

## 重要な変更点

### VBScriptからPowerShellへの移行

以前のバージョンではVBScriptを使用していましたが、以下の理由でPowerShellに変更されました：

1. **文字エスケープ問題の解決**: VBScriptでのパス文字列エスケープエラーを回避
2. **より良いエラーハンドリング**: PowerShellのtry-catch構文でより安定した処理
3. **保守性の向上**: PowerShellの方が読みやすく、デバッグしやすい

### 実装の簡素化

現在の実装は以下に焦点を当てています：

- 既存SVGファイルのPowerPoint変換
- Windows環境でのPowerPoint COM操作
- シンプルで安定した処理フロー