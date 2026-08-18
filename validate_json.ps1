Add-Type -AssemblyName System.Web.Extensions
$serializer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$serializer.MaxJsonLength = 10000000

$json = Get-Content -LiteralPath "$dir\temp_biology_g11_raw.json" -Raw
$serializer.DeserializeObject($json) | Out-Null
$json | Out-File -LiteralPath "$dir\temp_biology_g11.json" -Encoding UTF8
Write-Host "JSON validated and written successfully"
