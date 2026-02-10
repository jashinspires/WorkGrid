# Multi-Tenant SaaS Platform - API Test Suite
Write-Host "=== Multi-Tenant SaaS Platform - API Tests ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api"
$passCount = 0
$failCount = 0

# Test 1: Health Check
Write-Host "`n1. Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing
    $healthData = $health.Content | ConvertFrom-Json
    if ($healthData.success) {
        Write-Host "   PASS - Database connected" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "   FAIL - $_" -ForegroundColor Red
    $failCount++
    exit 1
}

# Test 2: Login
Write-Host "`n2. POST /api/auth/login" -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@demo.com"
        password = "Demo@123"
        tenantSubdomain = "demo"
    } | ConvertTo-Json
    
    $loginResp = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $loginData = $loginResp.Content | ConvertFrom-Json
    
    if ($loginData.success) {
        $token = $loginData.data.token
        $tenantId = $loginData.data.user.tenantId
        Write-Host "   PASS - Token received" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "   FAIL - $_" -ForegroundColor Red
    $failCount++
    exit 1
}

$headers = @{ "Authorization" = "Bearer $token" }

# Test 3: Get Current User
Write-Host "`n3. GET /api/auth/me" -ForegroundColor Yellow
try {
    $meResp = Invoke-WebRequest -Uri "$baseUrl/auth/me" -Headers $headers -UseBasicParsing
    $meData = $meResp.Content | ConvertFrom-Json
    if ($meData.success) {
        Write-Host "   PASS - User data retrieved" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "   FAIL - $_" -ForegroundColor Red
    $failCount++
}

# Test 4: List Tenants
Write-Host "`n4. GET /api/tenants" -ForegroundColor Yellow
try {
    $tenantsResp = Invoke-WebRequest -Uri "$baseUrl/tenants" -Headers $headers -UseBasicParsing
    $tenantsData = $tenantsResp.Content | ConvertFrom-Json
    if ($tenantsData.success) {
        Write-Host "   PASS - Found $($tenantsData.data.tenants.Count) tenants" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "   FAIL - $_" -ForegroundColor Red
    $failCount++
}

# Test 5: Get Tenant Details
Write-Host "`n5. GET /api/tenants/:tenantId" -ForegroundColor Yellow
try {
    $tenantResp = Invoke-WebRequest -Uri "$baseUrl/tenants/$tenantId" -Headers $headers -UseBasicParsing
    $tenantData = $tenantResp.Content | ConvertFrom-Json
    if ($tenantData.success) {
        Write-Host "   PASS - Tenant: $($tenantData.data.tenant.name)" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "   FAIL - $_" -ForegroundColor Red
    $failCount++
}

# Test 6: List Users
Write-Host "`n6. GET /api/tenants/:tenantId/users" -ForegroundColor Yellow
try {
    $usersResp = Invoke-WebRequest -Uri "$baseUrl/tenants/$tenantId/users" -Headers $headers -UseBasicParsing
    $usersData = $usersResp.Content | ConvertFrom-Json
    if ($usersData.success) {
        Write-Host "   PASS - Found $($usersData.data.users.Count) users" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "   FAIL - $_" -ForegroundColor Red
    $failCount++
}

# Test 7: List Projects
Write-Host "`n7. GET /api/projects" -ForegroundColor Yellow
try {
    $projectsResp = Invoke-WebRequest -Uri "$baseUrl/projects" -Headers $headers -UseBasicParsing
    $projectsData = $projectsResp.Content | ConvertFrom-Json
    if ($projectsData.success) {
        $projectId = $projectsData.data.projects[0].id
        Write-Host "   PASS - Found $($projectsData.data.projects.Count) projects" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "   FAIL - $_" -ForegroundColor Red
    $failCount++
}

# Test 8: Create Project
Write-Host "`n8. POST /api/projects" -ForegroundColor Yellow
try {
    $createProjBody = @{
        name = "API Test Project"
        description = "Created by test script"
        status = "active"
    } | ConvertTo-Json
    
    $createProjResp = Invoke-WebRequest -Uri "$baseUrl/projects" -Method POST -Headers $headers -Body $createProjBody -ContentType "application/json" -UseBasicParsing
    $createProjData = $createProjResp.Content | ConvertFrom-Json
    if ($createProjData.success) {
        $newProjectId = $createProjData.data.project.id
        Write-Host "   PASS - Project created: $newProjectId" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "   FAIL - $_" -ForegroundColor Red
    $failCount++
}

# Test 9: List Tasks
Write-Host "`n9. GET /api/projects/:projectId/tasks" -ForegroundColor Yellow
try {
    $tasksResp = Invoke-WebRequest -Uri "$baseUrl/projects/$projectId/tasks" -Headers $headers -UseBasicParsing
    $tasksData = $tasksResp.Content | ConvertFrom-Json
    if ($tasksData.success) {
        Write-Host "   PASS - Found $($tasksData.data.tasks.Count) tasks" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "   FAIL - $_" -ForegroundColor Red
    $failCount++
}

# Test 10: Create Task
Write-Host "`n10. POST /api/projects/:projectId/tasks" -ForegroundColor Yellow
try {
    $createTaskBody = @{
        title = "API Test Task"
        description = "Created by test script"
        status = "todo"
        priority = "high"
    } | ConvertTo-Json
    
    $createTaskResp = Invoke-WebRequest -Uri "$baseUrl/projects/$projectId/tasks" -Method POST -Headers $headers -Body $createTaskBody -ContentType "application/json" -UseBasicParsing
    $createTaskData = $createTaskResp.Content | ConvertFrom-Json
    if ($createTaskData.success) {
        $taskId = $createTaskData.data.task.id
        Write-Host "   PASS - Task created: $taskId" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "   FAIL - $_" -ForegroundColor Red
    $failCount++
}

# Test 11: Update Task Status
Write-Host "`n11. PATCH /api/tasks/:taskId/status" -ForegroundColor Yellow
try {
    $updateStatusBody = @{ status = "in_progress" } | ConvertTo-Json
    $updateStatusResp = Invoke-WebRequest -Uri "$baseUrl/tasks/$taskId/status" -Method PATCH -Headers $headers -Body $updateStatusBody -ContentType "application/json" -UseBasicParsing
    $updateStatusData = $updateStatusResp.Content | ConvertFrom-Json
    if ($updateStatusData.success) {
        Write-Host "   PASS - Task status updated" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "   FAIL - $_" -ForegroundColor Red
    $failCount++
}

# Test 12: Update Task
Write-Host "`n12. PUT /api/tasks/:taskId" -ForegroundColor Yellow
try {
    $updateTaskBody = @{
        title = "Updated Task Title"
        description = "Updated description"
        status = "done"
        priority = "medium"
    } | ConvertTo-Json
    
    $updateTaskResp = Invoke-WebRequest -Uri "$baseUrl/tasks/$taskId" -Method PUT -Headers $headers -Body $updateTaskBody -ContentType "application/json" -UseBasicParsing
    $updateTaskData = $updateTaskResp.Content | ConvertFrom-Json
    if ($updateTaskData.success) {
        Write-Host "   PASS - Task updated" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "   FAIL - $_" -ForegroundColor Red
    $failCount++
}

# Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

if ($failCount -eq 0) {
    Write-Host "`nALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "`nSOME TESTS FAILED" -ForegroundColor Yellow
}
