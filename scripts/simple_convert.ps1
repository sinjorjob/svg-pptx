# Improved SVG to PPTX converter with better error handling
param(
    [string]$svgPath = "slide_accenture_style.svg",
    [string]$outputPath = "slide_accenture_style.pptx"
)

$ppt = $null
$presentation = $null

try {
    # Check if SVG file exists
    if (-not (Test-Path $svgPath)) {
        throw "SVG file not found: $svgPath"
    }
    
    # Create PowerPoint application (invisible)
    $ppt = New-Object -ComObject PowerPoint.Application
    $ppt.Visible = 0
    $ppt.DisplayAlerts = 0
    
    # Create new presentation
    $presentation = $ppt.Presentations.Add()
    $slide = $presentation.Slides.Add(1, 12)
    
    # Get full paths
    $fullSvgPath = Resolve-Path $svgPath
    $fullOutputPath = Join-Path (Get-Location) $outputPath
    
    # Insert SVG as picture
    $shape = $slide.Shapes.AddPicture($fullSvgPath, 0, -1, 0, 0, 720, 540)
    
    # Save presentation
    $presentation.SaveAs($fullOutputPath)
    
    Write-Host "SVG to PPTX conversion completed successfully: $outputPath"
}
catch {
    Write-Host "Conversion failed: $($_.Exception.Message)"
    exit 1
}
finally {
    # Clean up COM objects properly
    if ($presentation) {
        try { $presentation.Close() } catch { }
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) | Out-Null
    }
    if ($ppt) {
        try { $ppt.Quit() } catch { }
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
    }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}