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