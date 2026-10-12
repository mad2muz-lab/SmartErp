@echo off
set SCRIPT_DIR=%~dp0
set TARGET_PATH=%SCRIPT_DIR%Launch-SmartERP.bat

powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktop = [Environment]::GetFolderPath('Desktop'); $shortcutPath = Join-Path $desktop 'Smart ERP.lnk'; $ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut($shortcutPath); $s.TargetPath = '%TARGET_PATH%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'Smart ERP - ZATCA Invoicing Web Application'; $s.Save(); Write-Host 'Desktop shortcut created successfully at:' $shortcutPath"
