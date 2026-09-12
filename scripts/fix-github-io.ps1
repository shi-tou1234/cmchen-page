$f = "$env:SystemRoot\System32\drivers\etc\hosts"
$c = [System.IO.File]::ReadAllText($f)
$lines = $c -split "`r?`n"
$filtered = $lines | Where-Object { $_ -notmatch '^\s*127\.0\.0\.1\s+github\.io\s*$' -and $_ -notmatch '^\s*127\.0\.0\.1\s+www\.github\.io\s*$' }
$result = $filtered -join "`r`n"
[System.IO.File]::WriteAllText($f, $result, [System.Text.Encoding]::ASCII)
ipconfig /flushdns
Write-Host "github.io entries removed" -ForegroundColor Green
