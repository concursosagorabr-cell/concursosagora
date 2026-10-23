param(
    [string]$Sources = "all",
    [int]$Limit = 8,
    [int]$MaxExtract = 12,
    [int]$StaleDays = 7,
    [switch]$NoExtract
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$python = $env:PIPELINE_PYTHON
if (-not $python) {
    $python = "G:\opencode-work\scrapling-venv\Scripts\python.exe"
}
if (-not (Test-Path $python)) {
    $python = "python"
}

$logDir = Join-Path $root "data\daily\logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir ("{0}.log" -f (Get-Date -Format "yyyy-MM-dd"))

$arguments = @(
    "-m", "pipeline", "daily",
    "--sources", $Sources,
    "--limit", $Limit,
    "--max-extract", $MaxExtract,
    "--stale-days", $StaleDays
)
if ($NoExtract) {
    $arguments += "--no-extract"
}

$env:PYTHONIOENCODING = "utf-8"
# Separa stdout/stderr em arquivos temporários. O pipeline escreve logs em
# stderr e, se fundirmos os fluxos, o PowerShell 5.1 transforma cada linha em
# um ErrorRecord ("NativeCommandError") no log.
$outFile = [System.IO.Path]::GetTempFileName()
$errFile = [System.IO.Path]::GetTempFileName()
try {
    $process = Start-Process `
        -FilePath $python `
        -ArgumentList $arguments `
        -WindowStyle Hidden `
        -Wait `
        -PassThru `
        -RedirectStandardOutput $outFile `
        -RedirectStandardError $errFile
    $code = $process.ExitCode
    if (Test-Path $outFile) {
        Get-Content $outFile -Encoding UTF8 | Tee-Object -FilePath $log -Append
    }
    if (Test-Path $errFile) {
        Get-Content $errFile -Encoding UTF8 | Tee-Object -FilePath $log -Append
    }
}
finally {
    Remove-Item $outFile, $errFile -Force -ErrorAction SilentlyContinue
}
exit $code
