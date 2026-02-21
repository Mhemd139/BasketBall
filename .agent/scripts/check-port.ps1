# PowerShell script to check if a port is in use and optionally kill the process
# Usage: .\check-port.ps1 -Port 3000 [-Kill]

param(
    [Parameter(Mandatory=$true)]
    [int]$Port,
    
    [Parameter(Mandatory=$false)]
    [switch]$Kill
)

Write-Host "Checking port $Port..." -ForegroundColor Cyan

# Find processes using the port
$connections = netstat -ano | findstr ":$Port"

if ($connections) {
    Write-Host "`nPort $Port is IN USE:" -ForegroundColor Yellow
    Write-Host $connections
    
    # Extract process IDs
    $processIds = $connections | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') {
            $Matches[1]
        }
    } | Select-Object -Unique
    
    foreach ($processId in $processIds) {
        try {
            $process = Get-Process -Id $processId -ErrorAction Stop
            Write-Host "`nProcess Details:" -ForegroundColor Yellow
            Write-Host "  PID: $processId"
            Write-Host "  Name: $($process.ProcessName)"
            Write-Host "  Path: $($process.Path)"
            
            if ($Kill) {
                Write-Host "`nKilling process $processId ($($process.ProcessName))..." -ForegroundColor Red
                Stop-Process -Id $processId -Force
                Write-Host "Process killed successfully!" -ForegroundColor Green
            }
        } catch {
            Write-Host "  PID: $processId (process details not available)" -ForegroundColor Gray
            
            if ($Kill) {
                Write-Host "`nAttempting to kill process $processId..." -ForegroundColor Red
                taskkill /F /PID $processId 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Process killed successfully!" -ForegroundColor Green
                } else {
                    Write-Host "Failed to kill process. You may need administrator privileges." -ForegroundColor Red
                }
            }
        }
    }
    
    if (-not $Kill) {
        Write-Host "`nTo kill the process(es), run:" -ForegroundColor Cyan
        Write-Host "  .\check-port.ps1 -Port $Port -Kill" -ForegroundColor White
    }
} else {
    Write-Host "`nPort $Port is AVAILABLE" -ForegroundColor Green
}
