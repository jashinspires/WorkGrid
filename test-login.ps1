# Test login
$loginBody = @{
    email = "admin@demo.com"
    password = "Demo@123"
    tenantSubdomain = "demo"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
Write-Output $response.Content
