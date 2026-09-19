param([int]$Port = 3000)

$ErrorActionPreference = 'Stop'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) {
    & $nodeCommand.Source (Join-Path $PSScriptRoot 'server.mjs') $Port
} else {
    $editorRuntime = Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\Code.exe'
    if (-not (Test-Path -LiteralPath $editorRuntime)) {
        throw 'Install Node.js to run the local preview.'
    }
    $previousMode = $env:ELECTRON_RUN_AS_NODE
    try {
        $env:ELECTRON_RUN_AS_NODE = '1'
        & $editorRuntime (Join-Path $PSScriptRoot 'server.mjs') $Port
    } finally {
        $env:ELECTRON_RUN_AS_NODE = $previousMode
    }
}
