# Devins Farm - Windows 10 PowerShell Installer
# Modern installer with GUI dialogs

# Requires -Version 5.1

# Set error action
$ErrorActionPreference = "Stop"

# Installation configuration
$AppName = "Devins Farm"
$AppVersion = "1.0.0"
$InstallDir = Join-Path $env:LOCALAPPDATA "DevinsFarm"
$SourceDir = Join-Path $PSScriptRoot "devins-farm-offline-installer"

# Colors
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "Green"
Clear-Host

# ASCII Art Banner
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "      DEVINS FARM - Windows 10 Installer" -ForegroundColor Yellow
Write-Host "      Comprehensive Farm Management System" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "      Version: $AppVersion" -ForegroundColor Gray
Write-Host "      Build Date: $(Get-Date -Format 'yyyy-MM-dd')" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Function to show progress
function Write-Progress-Step {
    param (
        [string]$Step,
        [string]$Status
    )
    Write-Host "[$Step] " -NoNewline -ForegroundColor Cyan
    Write-Host $Status -ForegroundColor White
}

# Function to show success
function Write-Success {
    param ([string]$Message)
    Write-Host "[OK] " -NoNewline -ForegroundColor Green
    Write-Host $Message -ForegroundColor White
}

# Function to show error
function Write-Error-Message {
    param ([string]$Message)
    Write-Host "[X] " -NoNewline -ForegroundColor Red
    Write-Host $Message -ForegroundColor White
}

try {
    # Step 1: Check Python
    Write-Progress-Step "1/6" "Checking system requirements..."
    
    $pythonVersion = $null
    try {
        $pythonVersion = python --version 2>&1
    } catch {
        $pythonVersion = $null
    }
    
    if (-not $pythonVersion) {
        Write-Error-Message "Python 3 is not installed!"
        Write-Host ""
        Write-Host "Please install Python 3 from:" -ForegroundColor Yellow
        Write-Host "https://www.python.org/downloads/" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Make sure to check 'Add Python to PATH' during installation." -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Success "Python detected: $pythonVersion"
    Start-Sleep -Milliseconds 500
    Write-Host ""

    # Step 2: Check source files
    Write-Progress-Step "2/6" "Checking installation files..."
    
    if (-not (Test-Path $SourceDir)) {
        Write-Error-Message "Installation files not found!"
        Write-Host ""
        Write-Host "Expected location: $SourceDir" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Success "Installation files found"
    Start-Sleep -Milliseconds 500
    Write-Host ""

    # Step 3: Create installation directory
    Write-Progress-Step "3/6" "Creating installation directory..."
    Write-Host "      Location: $InstallDir" -ForegroundColor Gray
    
    if (Test-Path $InstallDir) {
        Write-Host "      Directory exists, cleaning..." -ForegroundColor Yellow
        Remove-Item -Path $InstallDir -Recurse -Force
    }
    
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Success "Installation directory created"
    Start-Sleep -Milliseconds 500
    Write-Host ""

    # Step 4: Copy files
    Write-Progress-Step "4/6" "Installing application files..."
    
    Copy-Item -Path "$SourceDir\*" -Destination $InstallDir -Recurse -Force
    
    $fileCount = (Get-ChildItem -Path $InstallDir -Recurse -File).Count
    Write-Success "Installed $fileCount files"
    Start-Sleep -Milliseconds 500
    Write-Host ""

    # Step 5: Create launcher
    Write-Progress-Step "5/6" "Creating launcher scripts..."
    
    # Create PowerShell launcher
    $launcherContent = @"
# Devins Farm Launcher
`$Host.UI.RawUI.WindowTitle = "Devins Farm Server"
Clear-Host

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DEVINS FARM SERVER" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server URL: " -NoNewline
Write-Host "http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "To install on Android:" -ForegroundColor Yellow
Write-Host "  1. Connect phone to same WiFi"
Write-Host "  2. Find PC IP: ipconfig"
Write-Host "  3. Open http://YOUR_IP:8080 on phone"
Write-Host "  4. Tap menu (⋮) -> Install app"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Green
Write-Host ""

# Open browser
Start-Process "http://localhost:8080"

# Start server
Set-Location "$InstallDir"
python -m http.server 8080
"@
    
    $launcherPath = Join-Path $InstallDir "Launch.ps1"
    $launcherContent | Out-File -FilePath $launcherPath -Encoding UTF8
    
    # Create batch launcher (calls PowerShell)
    $batchLauncherContent = @"
@echo off
powershell -ExecutionPolicy Bypass -File "$launcherPath"
pause
"@
    
    $batchLauncherPath = Join-Path $InstallDir "Launch Devins Farm.bat"
    $batchLauncherContent | Out-File -FilePath $batchLauncherPath -Encoding ASCII
    
    Write-Success "Launcher scripts created"
    Start-Sleep -Milliseconds 500
    Write-Host ""

    # Step 6: Create shortcuts
    Write-Progress-Step "6/6" "Creating shortcuts..."
    
    $WshShell = New-Object -ComObject WScript.Shell
    
    # Desktop shortcut
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = Join-Path $desktopPath "$AppName.lnk"
    $shortcut = $WshShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $batchLauncherPath
    $shortcut.WorkingDirectory = $InstallDir
    $shortcut.Description = "Devins Farm Management System"
    $shortcut.IconLocation = "shell32.dll,13"
    $shortcut.Save()
    
    # Start Menu shortcut
    $startMenuPath = Join-Path ([Environment]::GetFolderPath("Programs")) "$AppName.lnk"
    $startMenuShortcut = $WshShell.CreateShortcut($startMenuPath)
    $startMenuShortcut.TargetPath = $batchLauncherPath
    $startMenuShortcut.WorkingDirectory = $InstallDir
    $startMenuShortcut.Description = "Devins Farm Management System"
    $startMenuShortcut.IconLocation = "shell32.dll,13"
    $startMenuShortcut.Save()
    
    Write-Success "Desktop and Start Menu shortcuts created"
    Start-Sleep -Milliseconds 500
    Write-Host ""

    # Create uninstaller
    $uninstallerContent = @"
# Devins Farm Uninstaller
`$Host.UI.RawUI.BackgroundColor = "Black"
`$Host.UI.RawUI.ForegroundColor = "Red"
Clear-Host

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "   UNINSTALL DEVINS FARM" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "This will remove all program files." -ForegroundColor White
Write-Host "Your data will be preserved." -ForegroundColor Green
Write-Host ""

`$confirm = Read-Host "Continue with uninstallation? (Y/N)"

if (`$confirm -eq "Y" -or `$confirm -eq "y") {
    Write-Host ""
    Write-Host "Removing program files..." -ForegroundColor Yellow
    
    Remove-Item -Path "$InstallDir" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$shortcutPath" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$startMenuPath" -Force -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "Devins Farm has been uninstalled." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Uninstallation cancelled." -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Press Enter to exit"
"@
    
    $uninstallerPath = Join-Path $InstallDir "Uninstall.ps1"
    $uninstallerContent | Out-File -FilePath $uninstallerPath -Encoding UTF8
    
    # Success message
    Clear-Host
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "      INSTALLATION COMPLETE!" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Devins Farm has been installed successfully!" -ForegroundColor White
    Write-Host ""
    Write-Host "Installation location:" -ForegroundColor Cyan
    Write-Host "  $InstallDir" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Shortcuts created:" -ForegroundColor Cyan
    Write-Host "  - Desktop: $AppName" -ForegroundColor Gray
    Write-Host "  - Start Menu: $AppName" -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "How to use:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Click '$AppName' icon on your desktop" -ForegroundColor White
    Write-Host "  2. Server starts automatically" -ForegroundColor White
    Write-Host "  3. Browser opens to http://localhost:8080" -ForegroundColor White
    Write-Host "  4. Install as PWA for best experience" -ForegroundColor White
    Write-Host ""
    Write-Host "For Android:" -ForegroundColor Yellow
    Write-Host "  1. Launch app from desktop" -ForegroundColor White
    Write-Host "  2. Connect Android to same WiFi" -ForegroundColor White
    Write-Host "  3. Find your PC IP: ipconfig" -ForegroundColor White
    Write-Host "  4. Open http://YOUR_IP:8080 on phone" -ForegroundColor White
    Write-Host "  5. Tap menu (⋮) -> Install app" -ForegroundColor White
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    
    $launch = Read-Host "Launch Devins Farm now? (Y/N)"
    
    if ($launch -eq "Y" -or $launch -eq "y") {
        Write-Host ""
        Write-Host "Launching Devins Farm..." -ForegroundColor Green
        Start-Sleep -Seconds 1
        Start-Process $batchLauncherPath
    }
    
    Write-Host ""
    Write-Host "Installation complete. You can close this window." -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Error-Message "Installation failed: $_"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
