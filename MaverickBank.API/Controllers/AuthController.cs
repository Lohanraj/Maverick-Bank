using Microsoft.AspNetCore.Mvc;
using MaverickBank.API.Models;
using MaverickBank.API.DTOs;
using MaverickBank.API.Services;

namespace MaverickBank.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IAuthService authService,
            ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("login")]
        public IActionResult Login(LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest("Email and password are required.");
            }

            var token = _authService.Login(request.Email, request.Password, out var user);

            if (token == null || user == null)
            {
                _logger.LogWarning("Login failed for {Email}", request.Email);
                return Unauthorized("Invalid email or password");
            }

            _logger.LogInformation("User {Email} logged in successfully", request.Email);

            return Ok(new
            {
                token = token,
                role = user.Role,
                email = user.Email,
                id = user.Id,
                fullName = user.FullName
            });
        }
    }
}


