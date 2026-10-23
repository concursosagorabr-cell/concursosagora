param(
    [int]$Limit = 10,
    [switch]$Force
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
$log = Join-Path $logDir ("enrich-{0}.log" -f (Get-Date -Format "yyyy-MM-dd"))

$arguments = @(
    "-m", "pipeline", "enrich",
    "--limit", $Limit,
    "--apply"
)
if ($Force) {
    $arguments += "--force"
}

$env:PYTHONIOENCODING = "utf-8"
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