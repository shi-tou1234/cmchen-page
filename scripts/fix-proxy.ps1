reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f
Write-Host "System proxy disabled. Network restored." -ForegroundColor Green
