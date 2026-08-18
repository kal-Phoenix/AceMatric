$json = Get-Content -Raw -Path "C:\Users\kal3n\Desktop\Projects\AceMatric\AceMatric\storage\past-exams\past-physics-g12-2017ec-raw.json"
$json | Set-Content -Path "C:\Users\kal3n\Desktop\Projects\AceMatric\AceMatric\storage\past-exams\past-physics-g12-2017ec.json" -Encoding UTF8
