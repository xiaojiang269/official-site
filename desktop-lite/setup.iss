; 550W 综合指挥系统 轻量桌面版安装程序（Inno Setup）
#define MyAppName "550W 综合指挥系统"
#define MyAppVersion "2.0.0"
#define MyAppExe "550W.exe"

[Setup]
AppId={{B550W-2026-LITE-XIANGJIANG}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher=xiaojiang269
DefaultDirName={autopf}\550W
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=Output
OutputBaseFilename=550W-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Files]
Source: "dist\550W\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"; WorkingDir: "{app}"
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"; WorkingDir: "{app}"

[Run]
Filename: "{app}\{#MyAppExe}"; Description: "立即运行 550W"; Flags: nowait postinstall skipifsilent
