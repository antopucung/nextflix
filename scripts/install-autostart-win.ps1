Param()
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$startup = [Environment]::GetFolderPath('Startup')
$shortcut = Join-Path $startup 'Nextflix Preview.lnk'
$target = Join-Path $root 'scripts\start-nextflix-win.bat'

$WshShell = New-Object -ComObject WScript.Shell
$sc = $WshShell.CreateShortcut($shortcut)
$sc.TargetPath = $target
$sc.WorkingDirectory = $root
$sc.WindowStyle = 7
$sc.IconLocation = 'shell32.dll,1'
$sc.Save()

Write-Host "Installed Startup shortcut: $shortcut" 