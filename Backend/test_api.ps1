$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

Write-Host "Registering a new user..."
$registerBody = @{
    fullName = "Test User"
    email = "test.api.user@maverick.com"
    password = "Password123"
    phoneNumber = "1234567890"
    address = "123 Test St"
    role = "Customer"
    gender = "Male"
    dateOfBirth = "1990-01-01T00:00:00Z"
    aadharNumber = "123412341234"
    panNumber = "ABCDE1234F"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "https://localhost:7174/api/Users" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "Registration successful!"
} catch {
    Write-Host "Registration failed: $_"
    # Ignore if already exists
}

Write-Host "Logging in..."
$loginBody = @{
    email = "test.api.user@maverick.com"
    password = "Password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "https://localhost:7174/api/Auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "Login successful! Token acquired."

Write-Host "Creating an account..."
$accountBody = @{
    accountType = "Savings"
    fullName = "Test User"
    address = "123 Test St"
    dateOfBirth = "1990-01-01T00:00:00Z"
    aadharNumber = "123412341234"
    panNumber = "ABCDE1234F"
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $token"
}

try {
    $accountResponse = Invoke-RestMethod -Uri "https://localhost:7174/api/v1/Accounts" -Method Post -Body $accountBody -ContentType "application/json" -Headers $headers
    Write-Host "Account created successfully! Account Number: $($accountResponse.accountNumber)"
} catch {
    Write-Host "Account creation failed: $_"
    $errMessage = $_.ErrorDetails.Message
    if ($null -ne $errMessage) {
        Write-Host "Error Details: $errMessage"
    }
}
