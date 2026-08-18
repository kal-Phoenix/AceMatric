$json = Get-Content -Path "C:\Users\kal3n\Desktop\Projects\AceMatric\AceMatric\temp_biology_g11_raw.json" -Raw
$json | Out-File -FilePath "C:\Users\kal3n\Desktop\Projects\AceMatric\AceMatric\temp_biology_g11.json" -Encoding UTF8
Write-Host "Done"