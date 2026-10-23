param(
    [string]$Time = "09:00",
    [string]$TaskName = "Concursos Agora - Enriquecimento"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$enrich = Join-Path $root "scripts\enrich.ps1"
if (-not (Test-Path $enrich)) {
    throw "Script não encontrado: $enrich"
}

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$enrich`""
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
    -Description "Enriquece rascunhos recentes do Concursos Agora com seção complementar e orientação de estudo. Não publica: cria ou atualiza apenas drafts.* com reviewStatus=pending." `
    -Force | Out-Null

Write-Host "Tarefa '$TaskName' registrada para todos os dias às $Time."
Write-Host "Script: $enrich"