# SurakshaPay Backend — Quick Start Script
# Run this from the backend folder: .\start.ps1

Write-Host "Starting SurakshaPay Backend..." -ForegroundColor Cyan

# Load .env
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]*)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
        }
    }
    Write-Host ".env loaded" -ForegroundColor Green
} else {
    Write-Host "WARNING: No .env file found. Using defaults." -ForegroundColor Yellow
}

$db = [System.Environment]::GetEnvironmentVariable("DATABASE_URL", "Process")
Write-Host "Connecting to: $($db.Substring(0, [Math]::Min(40, $db.Length)))..." -ForegroundColor DarkGray

py -m uvicorn main:app --reload --port 8000
