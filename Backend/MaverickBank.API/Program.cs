using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using MaverickBank.API.Data;
using MaverickBank.API.Models;
using MaverickBank.API.DTOs;
using FluentValidation;
using FluentValidation.AspNetCore;
using System.Reflection;
using MaverickBank.API.Middlewares;
using MaverickBank.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.AddLog4Net("log4net.config");

// DATABASE
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// CONTROLLERS
builder.Services.AddControllers();

// SERVICES
builder.Services.AddScoped<MaverickBank.API.Services.IAccountService, MaverickBank.API.Services.AccountService>();
builder.Services.AddScoped<MaverickBank.API.Services.IAuthService, MaverickBank.API.Services.AuthService>();
builder.Services.AddScoped<MaverickBank.API.Services.IBeneficiaryService, MaverickBank.API.Services.BeneficiaryService>();
builder.Services.AddScoped<MaverickBank.API.Services.ILoanService, MaverickBank.API.Services.LoanService>();
builder.Services.AddScoped<MaverickBank.API.Services.IUserService, MaverickBank.API.Services.UserService>();
builder.Services.AddScoped<MaverickBank.API.Services.ICardService, MaverickBank.API.Services.CardService>();

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

builder.Services.AddAutoMapper(cfg => cfg.AddProfile<MaverickBank.API.MappingProfile>());

builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // Required for SignalR WebSocket connections
        });
});

// API VERSIONING
builder.Services.AddApiVersioning(options =>
{
    options.AssumeDefaultVersionWhenUnspecified = true;

    options.DefaultApiVersion = new ApiVersion(1, 0);

    options.ReportApiVersions = true;
});

// JWT AUTHENTICATION
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters =
        new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer =
                builder.Configuration["Jwt:Issuer"],

            ValidAudience =
                builder.Configuration["Jwt:Audience"],

            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(
                        builder.Configuration["Jwt:Key"]!))
        };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notifications"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine(
                "JWT FAILED: " +
                context.Exception.Message
            );

            return Task.CompletedTask;
        },

        OnTokenValidated = context =>
        {
            Console.WriteLine(
                "JWT SUCCESS"
            );

            return Task.CompletedTask;
        }
    };
});

// SWAGGER
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MaverickBank API",
        Version = "v1"
    });

    // JWT AUTH IN SWAGGER
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new List<string>()
        }
    });
});

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<LoggingMiddleware>();

// SWAGGER
app.UseSwagger();

app.UseSwaggerUI();

// HTTPS
app.UseHttpsRedirection();

app.UseCors("AllowAngular");

// AUTHENTICATION
app.UseAuthentication();

app.UseAuthorization();

// MAP CONTROLLERS
app.MapControllers();

// MAP SIGNALR HUB
app.MapHub<NotificationHub>("/hubs/notifications");

// DATABASE AUTO-CREATION AND SEEDING
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        Console.WriteLine("Applying migrations...");
        dbContext.Database.Migrate();

        // Seed Users
        if (!dbContext.Users.Any())
        {
            Console.WriteLine("Seeding users...");
            var admin = new User
            {
                FullName = "System Admin",
                Email = "admin@maverick.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = "Admin",
                CreatedAt = DateTime.Now
            };

            var employee = new User
            {
                FullName = "John Doe",
                Email = "employee@maverick.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Employee@123"),
                Role = "Employee",
                CreatedAt = DateTime.Now
            };

            var customer = new User
            {
                FullName = "Jane Smith",
                Email = "customer@maverick.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123"),
                Role = "Customer",
                PhoneNumber = "555-0199",
                Address = "456 Main St, Dallas, TX",
                Gender = "Female",
                DateOfBirth = new DateTime(1996, 5, 15),
                AadharNumber = "123456789012",
                PANNumber = "ABCDE1234F",
                CreatedAt = DateTime.Now
            };

            var customer2 = new User
            {
                FullName = "Lohanraj B",
                Email = "lohanraj.b@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("@Lohan123"),
                Role = "Customer",
                PhoneNumber = "555-0200",
                Address = "Bangalore, India",
                Gender = "Male",
                DateOfBirth = new DateTime(1995, 1, 1),
                AadharNumber = "111122223333",
                PANNumber = "ABCDE5678F",
                CreatedAt = DateTime.Now
            };

            var customer3 = new User
            {
                FullName = "Pushpanjali Anjali",
                Email = "pushpanjalianjali85@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("@Pushpa123"),
                Role = "Customer",
                PhoneNumber = "555-0201",
                Address = "Bangalore, India",
                Gender = "Female",
                DateOfBirth = new DateTime(1995, 1, 1),
                AadharNumber = "444455556666",
                PANNumber = "XYZAB1234D",
                CreatedAt = DateTime.Now
            };

            dbContext.Users.AddRange(admin, employee, customer, customer2, customer3);
            dbContext.SaveChanges();

            // Seed Accounts for Customer
            var acc1 = new Account
            {
                UserId = customer.Id,
                AccountNumber = "ACC1001",
                AccountType = "Savings",
                Balance = 15000.00m,
                Status = "Active",
                FullName = customer.FullName,
                Address = customer.Address,
                DateOfBirth = customer.DateOfBirth,
                AadharNumber = customer.AadharNumber,
                PANNumber = customer.PANNumber,
                Age = 30,
                BranchName = "Maverick Main Branch",
                IFSCCode = "MAVB0000001",
                BranchAddress = "123 Financial Way",
                CreatedAt = DateTime.Now.AddDays(-10)
            };

            var acc2 = new Account
            {
                UserId = customer.Id,
                AccountNumber = "ACC1002",
                AccountType = "Checking",
                Balance = 5000.00m,
                Status = "Active",
                FullName = customer.FullName,
                Address = customer.Address,
                DateOfBirth = customer.DateOfBirth,
                AadharNumber = customer.AadharNumber,
                PANNumber = customer.PANNumber,
                Age = 30,
                BranchName = "Maverick Main Branch",
                IFSCCode = "MAVB0000001",
                BranchAddress = "123 Financial Way",
                CreatedAt = DateTime.Now.AddDays(-10)
            };

            var acc3 = new Account
            {
                UserId = customer.Id,
                AccountNumber = "ACC1003",
                AccountType = "Business",
                Balance = 0.00m,
                Status = "Pending",
                FullName = customer.FullName,
                Address = customer.Address,
                DateOfBirth = customer.DateOfBirth,
                AadharNumber = customer.AadharNumber,
                PANNumber = customer.PANNumber,
                Age = 30,
                BranchName = "Maverick Downtown Branch",
                IFSCCode = "MAVB0000002",
                BranchAddress = "789 Commerce St",
                CreatedAt = DateTime.Now
            };

            // Seed Accounts for customer2
            var acc2_1 = new Account
            {
                UserId = customer2.Id,
                AccountNumber = "ACC1004",
                AccountType = "Savings",
                Balance = 25000.00m,
                Status = "Active",
                FullName = customer2.FullName,
                Address = customer2.Address,
                DateOfBirth = customer2.DateOfBirth,
                AadharNumber = customer2.AadharNumber,
                PANNumber = customer2.PANNumber,
                Age = 30,
                BranchName = "Maverick Main Branch",
                IFSCCode = "MAVB0000001",
                BranchAddress = "123 Financial Way",
                CreatedAt = DateTime.Now.AddDays(-10)
            };

            // Seed Accounts for customer3
            var acc3_1 = new Account
            {
                UserId = customer3.Id,
                AccountNumber = "ACC1006",
                AccountType = "Savings",
                Balance = 35000.00m,
                Status = "Active",
                FullName = customer3.FullName,
                Address = customer3.Address,
                DateOfBirth = customer3.DateOfBirth,
                AadharNumber = customer3.AadharNumber,
                PANNumber = customer3.PANNumber,
                Age = 30,
                BranchName = "Maverick Main Branch",
                IFSCCode = "MAVB0000001",
                BranchAddress = "123 Financial Way",
                CreatedAt = DateTime.Now.AddDays(-10)
            };

            dbContext.Accounts.AddRange(acc1, acc2, acc3, acc2_1, acc3_1);
            dbContext.SaveChanges();

            // Seed Transactions
            var t1 = new Transaction
            {
                AccountId = acc1.Id,
                TransactionType = "Deposit",
                Amount = 20000.00m,
                Description = "Initial Deposit",
                CreatedAt = DateTime.Now.AddDays(-5)
            };

            var t2 = new Transaction
            {
                AccountId = acc1.Id,
                TransactionType = "Withdraw",
                Amount = 5000.00m,
                Description = "ATM Withdrawal",
                CreatedAt = DateTime.Now.AddDays(-2)
            };

            var t3 = new Transaction
            {
                AccountId = acc2.Id,
                TransactionType = "Deposit",
                Amount = 5000.00m,
                Description = "Initial Deposit",
                CreatedAt = DateTime.Now.AddDays(-3)
            };

            dbContext.Transactions.AddRange(t1, t2, t3);

            // Seed Beneficiaries
            var b1 = new Beneficiary
            {
                UserId = customer.Id,
                BeneficiaryName = "Bob Jones",
                AccountNumber = "ACC9001",
                BankName = "State Bank of India",
                BranchName = "Mumbai Main",
                IFSCCode = "SBIN0000001",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            var b2 = new Beneficiary
            {
                UserId = customer.Id,
                BeneficiaryName = "Alice Miller",
                AccountNumber = "ACC9002",
                BankName = "HDFC Bank",
                BranchName = "Bangalore",
                IFSCCode = "HDFC0000123",
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            dbContext.Beneficiaries.AddRange(b1, b2);

            // Seed Loan Application
            var l1 = new Loan
            {
                UserId = customer.Id,
                LoanAmount = 250000.00m,
                InterestRate = 8.5m,
                LoanStatus = "Pending",
                Purpose = "Home Purchase",
                TenureMonths = 120,
                AccountNumber = "ACC1001",
                RemainingBalance = 0,
                CreatedAt = DateTime.Now
            };

            var l2 = new Loan
            {
                UserId = customer.Id,
                LoanAmount = 150000.00m,
                InterestRate = 9.0m,
                LoanStatus = "Approved",
                Purpose = "Car Loan: Seeded Approved Loan",
                TenureMonths = 60,
                AccountNumber = "ACC1001",
                RemainingBalance = 150000.00m,
                CreatedAt = DateTime.Now.AddDays(-1)
            };

            dbContext.Loans.AddRange(l1, l2);

            // Seed Cards
            if (!dbContext.Cards.Any())
            {
                var card1 = new Card
                {
                    AccountId = acc1.Id,
                    UserId = customer.Id,
                    CardNumber = "4532781290345678",
                    CardHolderName = customer.FullName,
                    ExpiryDate = DateTime.Now.AddYears(5).ToString("MM/yy"),
                    CVV = "123",
                    CardType = "Visa Debit",
                    IsBlocked = false,
                    DailyAtmLimit = 50000.00m,
                    DailyOnlineLimit = 100000.00m,
                    PinHash = BCrypt.Net.BCrypt.HashPassword("1234"),
                    CreatedAt = DateTime.Now
                };

                var card2 = new Card
                {
                    AccountId = acc2_1.Id,
                    UserId = customer2.Id,
                    CardNumber = "4532781290341111",
                    CardHolderName = customer2.FullName,
                    ExpiryDate = DateTime.Now.AddYears(5).ToString("MM/yy"),
                    CVV = "111",
                    CardType = "Visa Gold",
                    IsBlocked = false,
                    DailyAtmLimit = 50000.00m,
                    DailyOnlineLimit = 100000.00m,
                    PinHash = BCrypt.Net.BCrypt.HashPassword("1111"),
                    CreatedAt = DateTime.Now
                };

                var card3 = new Card
                {
                    AccountId = acc3_1.Id,
                    UserId = customer3.Id,
                    CardNumber = "4532781290342222",
                    CardHolderName = customer3.FullName,
                    ExpiryDate = DateTime.Now.AddYears(5).ToString("MM/yy"),
                    CVV = "222",
                    CardType = "Visa Platinum",
                    IsBlocked = false,
                    DailyAtmLimit = 50000.00m,
                    DailyOnlineLimit = 100000.00m,
                    PinHash = BCrypt.Net.BCrypt.HashPassword("2222"),
                    CreatedAt = DateTime.Now
                };

                dbContext.Cards.AddRange(card1, card2, card3);
            }

            dbContext.SaveChanges();
            Console.WriteLine("Database seeding completed!");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error during DB initialization: {ex.Message}");
    }
}

app.Run();
