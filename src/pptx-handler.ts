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
  
  const vbsScript = `
Option Explicit
Dim pptApp, pptPres, pptSlide, shape
Dim svgPath, outputPath

svgPath = "${absoluteSvgPath.replace(/\\/g, '\\\\')}"
outputPath = "${absoluteOutputPath.replace(/\\/g, '\\\\')}"

On Error Resume Next

WScript.Echo "PowerPoint起動中..."
Set pptApp = CreateObject("PowerPoint.Application")
If Err.Number <> 0 Then
    WScript.Echo "エラー: PowerPointを起動できません"
    WScript.Quit 1
End If

pptApp.Visible = True
WScript.Echo "PowerPoint起動完了"

Set pptPres = pptApp.Presentations.Add
Set pptSlide = pptPres.Slides.Add(1, 12)
WScript.Echo "新しいプレゼンテーションを作成しました"

' SVGファイルを直接挿入（PNG変換せずに）
WScript.Echo "SVGファイルを挿入中: " & svgPath
Err.Clear
Set shape = pptSlide.Shapes.AddPicture(svgPath, 0, -1, 0, 0, 720, 540)

If Err.Number = 0 Then
    WScript.Echo "SVG挿入成功！図形変換が可能な状態です"
    
    ' 図形をスライド全体にサイズ調整
    shape.Left = 0
    shape.Top = 0
    shape.Width = pptPres.PageSetup.SlideWidth
    shape.Height = pptPres.PageSetup.SlideHeight
    
    shape.Select
    WScript.Echo "SVGが選択されました"
    WScript.Echo "手動で [図形ツール] → [グラフィックス形式] → [図形に変換] を実行してください"
    
Else
    WScript.Echo "SVG挿入に失敗しました: " & Err.Description
    pptPres.Close
    pptApp.Quit
    WScript.Quit 1
End If

' ファイル保存
WScript.Echo "ファイル保存中: " & outputPath
Err.Clear
pptPres.SaveAs outputPath
If Err.Number <> 0 Then
    WScript.Echo "保存エラー: " & Err.Description
Else
    WScript.Echo "保存完了: " & outputPath
End If

pptPres.Close
pptApp.Quit
WScript.Echo "処理完了"
`;

  const scriptPath = path.join(process.cwd(), 'scripts', `temp_pptx_${Date.now()}.vbs`);
  await fs.writeFile(scriptPath, vbsScript, 'utf-8');
  
  try {
    console.log('SVGを直接PowerPointに挿入中...');
    const result = execSync(`cscript //NoLogo "${scriptPath}"`, { 
      encoding: 'utf-8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    console.log('VBScript実行結果:', result);
    console.log('SVGが図形変換可能な状態でPowerPointに挿入されました');
    
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
      throw new Error(`SVG直接挿入に失敗: ${error.message}`);
    }
    throw new Error(`SVG直接挿入に失敗: ${String(error)}`);
  }
}