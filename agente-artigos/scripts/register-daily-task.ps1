param(
    [string]$Time = "08:00",
    [string]$TaskName = "Concursos Agora - Fila Editorial"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$daily = Join-Path $root "scripts\daily.ps1"
if (-not (Test-Path $daily)) {
    throw "Script não encontrado: $daily"
}

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$daily`""
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopIfGoingOnBatteries `
    -AllowStartIfOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Monta a fila editorial diária do Concursos Agora. Não publica: apenas descobre fontes oficiais, aplica deduplicação/cooldown e grava a fila para redação e revisão humana." `
    -Force | Out-Null

Write-Host "Tarefa '$TaskName' registrada para todos os dias às $Time."
Write-Host "Script: $daily"
Write-Host "Logs: $root\data\daily\logs"
