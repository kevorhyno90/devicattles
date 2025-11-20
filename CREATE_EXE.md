# Creating a Windows EXE Installer

## Option 1: Using IExpress (Built into Windows)

IExpress is a built-in Windows tool for creating self-extracting archives.

### Steps:

1. Press `Win + R`
2. Type `iexpress` and press Enter
3. Select "Create new Self Extraction Directive file"
4. Select "Extract files and run an installation command"
5. Package title: "Devins Farm Installer"
6. Confirmation prompt: "Do you want to install Devins Farm?"
7. Add files:
   - Select all files from `devins-farm-windows-installer` folder
8. Install program: `INSTALL_DEVINS_FARM.bat`
9. Window style: Default
10. Finished message: "Devins Farm installed successfully!"
11. Browse and save as: `DevinsFarm-Setup.exe`
12. Save Self Extraction Directive: `DevinsFarm.sed`
13. Click "Next" and wait for creation
14. Done! You now have `DevinsFarm-Setup.exe`

## Option 2: Using Inno Setup (Free)

Download: https://jrsoftware.org/isinfo.php

### Quick Script:

```pascal
[Setup]
AppName=Devins Farm
AppVersion=1.0
DefaultDirName={localappdata}\DevinsFarm
DefaultGroupName=Devins Farm
OutputDir=.
OutputBaseFilename=DevinsFarm-Setup
Compression=lzma2
SolidCompression=yes

[Files]
Source: "devins-farm-windows-installer\*"; DestDir: "{app}"; Flags: recursesubdirs

[Icons]
Name: "{userdesktop}\Devins Farm"; Filename: "{app}\INSTALL_DEVINS_FARM.bat"
Name: "{group}\Devins Farm"; Filename: "{app}\INSTALL_DEVINS_FARM.bat"

[Run]
Filename: "{app}\INSTALL_DEVINS_FARM.bat"; Description: "Launch Devins Farm"; Flags: postinstall nowait
```

Save as `DevinsFarm.iss` and compile with Inno Setup.

## Option 3: Using NSIS (Free)

Download: https://nsis.sourceforge.io/

### Quick Script:

```nsis
OutFile "DevinsFarm-Setup.exe"
InstallDir "$LOCALAPPDATA\DevinsFarm"

Section "Install"
  SetOutPath $INSTDIR
  File /r "devins-farm-windows-installer\*.*"
  CreateShortcut "$DESKTOP\Devins Farm.lnk" "$INSTDIR\INSTALL_DEVINS_FARM.bat"
  CreateShortcut "$SMPROGRAMS\Devins Farm.lnk" "$INSTDIR\INSTALL_DEVINS_FARM.bat"
SectionEnd
```

Save as `DevinsFarm.nsi` and compile with NSIS.

## Option 4: Using Bat2Exe (Simple)

Download: http://bat2exe.net/

1. Open Bat2Exe
2. Select `INSTALL_DEVINS_FARM.bat`
3. Include all files from folder
4. Set icon (optional)
5. Click "Compile"
6. Done!

## Recommended: IExpress

IExpress is the easiest option as it's already installed on Windows.
The created EXE will be around 500-600 KB.

## Distribution

Once you have the EXE:
1. Upload to your website/cloud storage
2. Share the single EXE file
3. Users just double-click to install
4. No technical knowledge required!

## Digital Signature (Optional)

For professional distribution:
1. Get a code signing certificate
2. Use SignTool.exe (from Windows SDK)
3. Sign the EXE: `signtool sign /f cert.pfx DevinsFarm-Setup.exe`

This removes "Unknown Publisher" warnings.
