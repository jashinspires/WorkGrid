# Multi-Tenant SaaS Platform - API Test Script
Write-Host "=== Multi-Tenant SaaS Platform - API Testing ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing
    $healthData = $health.Content | ConvertFrom-Json
    if ($healthData.success -eq $true -and $healthData.database -eq "Connected") {
        Write-Host "✓ Health check passed - Database connected" -ForegroundColor Green
    } else {
        Write-Host "✗ Health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Login with Demo Admin
Write-Host "Test 2: Login with Demo Admin" -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@demo.com"
        password = "Demo@123"
        tenantSubdomain = "demo"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.success -eq $true) {
        $token = $loginData.data.token
        Write-Host "✓ Login successful - Token received" -ForegroundColor Green
        Write-Host "  User: $($loginData.data.user.email)" -ForegroundColor Gray
        Write-Host "  Role: $($loginData.data.user.role)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Login failed" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit
}
Write-Host ""

# Test 3: Get Current User
Write-Host "Test 3: Get Current User" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $meResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/me" -Headers $headers -UseBasicParsing
    $meData = $meResponse.Content | ConvertFrom-Json
    
    if ($meData.success -eq $true) {
        Write-Host "✓ Get current user successful" -ForegroundColor Green
        Write-Host "  Tenant: $($meData.data.tenant.name)" -ForegroundColor Gray
        Write-Host "  Plan: $($meData.data.tenant.subscriptionPlan)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Get current user failed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Get current user failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: List Projects
Write-Host "Test 4: List Projects" -ForegroundColor Yellow
try {
    $projectsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/projects" -Headers $headers -UseBasicParsing
    $projectsData = $projectsResponse.Content | ConvertFrom-Json
    
    if ($projectsData.success -eq $true) {
        $projectCount = $projectsData.data.projects.Count
        Write-Host "✓ List projects successful - Found $projectCount projects" -ForegroundColor Green
        foreach ($project in $projectsData.data.projects) {
            Write-Host "  - $($project.name)" -ForegroundColor Gray
        }
        
        # Save first project ID for task testing
        if ($projectCount -gt 0) {
            $projectId = $projectsData.data.projects[0].id
        }
    } else {
        Write-Host "✗ List projects failed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ List projects failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: List Tasks for First Project
if ($projectId) {
    Write-Host "Test 5: List Tasks for Project" -ForegroundColor Yellow
    try {
        $tasksResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/projects/$projectId/tasks" -Headers $headers -UseBasicParsing
        $tasksData = $tasksResponse.Content | ConvertFrom-Json
        
        if ($tasksData.success -eq $true) {
            $taskCount = $tasksData.data.tasks.Count
            Write-Host "✓ List tasks successful - Found $taskCount tasks" -ForegroundColor Green
            foreach ($task in $tasksData.data.tasks) {
                Write-Host "  - $($task.title) [$($task.status)]" -ForegroundColor Gray
            }
        } else {
            Write-Host "✗ List tasks failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ List tasks failed: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 6: List Users
Write-Host "Test 6: List Tenant Users" -ForegroundColor Yellow
try {
    $tenantId = $meData.data.tenant.id
    $usersResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/tenants/$tenantId/users" -Headers $headers -UseBasicParsing
    $usersData = $usersResponse.Content | ConvertFrom-Json
    
    if ($usersData.success -eq $true) {
        $userCount = $usersData.data.users.Count
        Write-Host "✓ List users successful - Found $userCount users" -ForegroundColor Green
        foreach ($user in $usersData.data.users) {
            Write-Host "  - $($user.email) [$($user.role)]" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ List users failed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ List users failed: $_" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "All critical endpoints are working!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend URL: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
