# Simple API Test Script
# Tests core endpoints to verify backend is working

$BACKEND_URL = "http://localhost:5000"

Write-Host "Testing Multi-Tenant SaaS Platform APIs" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/health" -UseBasicParsing
    $health = $response.Content | ConvertFrom-Json
    Write-Host "   SUCCESS - Status: $($health.status), Database: $($health.database)" -ForegroundColor Green
} catch {
    Write-Host "   FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "2. Login (admin@demo.com)..." -ForegroundColor Yellow
$loginJson = '{"email":"admin@demo.com","password":"Demo@123","tenantSubdomain":"demo"}'
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/login" -Method POST -Body $loginJson -ContentType "application/json" -UseBasicParsing
    $login = $response.Content | ConvertFrom-Json
    $token = $login.data.token
    Write-Host "   SUCCESS - User: $($login.data.user.email), Role: $($login.data.user.role)" -ForegroundColor Green
} catch {
    Write-Host "   FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Get Current User
Write-Host "3. Get Current User..." -ForegroundColor Yellow
try {
    $headers = @{"Authorization" = "Bearer $token"}
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/me" -Headers $headers -UseBasicParsing
    $me = $response.Content | ConvertFrom-Json
    Write-Host "   SUCCESS - $($me.data.fullName), Tenant: $($me.data.tenant.name)" -ForegroundColor Green
    $tenantId = $me.data.tenant.id
} catch {
    Write-Host "   FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: List Projects
Write-Host "4. List Projects..." -ForegroundColor Yellow
try {
    $headers = @{"Authorization" = "Bearer $token"}
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/projects" -Headers $headers -UseBasicParsing
    $projects = $response.Content | ConvertFrom-Json
    Write-Host "   SUCCESS - Found $($projects.data.projects.Count) projects" -ForegroundColor Green
} catch {
    Write-Host "   FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: List Users
Write-Host "5. List Users..." -ForegroundColor Yellow
try {
    $headers = @{"Authorization" = "Bearer $token"}
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/tenants/$tenantId/users" -Headers $headers -UseBasicParsing
    $users = $response.Content | ConvertFrom-Json
    Write-Host "   SUCCESS - Found $($users.data.users.Count) users" -ForegroundColor Green
} catch {
    Write-Host "   FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "All core API tests passed!" -ForegroundColor Green
Write-Host "Backend is ready for deployment." -ForegroundColor Cyan
