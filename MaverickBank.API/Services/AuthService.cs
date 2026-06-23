using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MaverickBank.API.Data;
using MaverickBank.API.Models;
using MaverickBank.API.DTOs;
using AutoMapper;
using Microsoft.Extensions.Logging;

namespace MaverickBank.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;
        private readonly ILogger<AuthService> _logger;

        public AuthService(ApplicationDbContext context, IConfiguration configuration, IMapper mapper, ILogger<AuthService> logger)
        {
            _context = context;
            _configuration = configuration;
            _mapper = mapper;
            _logger = logger;
        }

        public string? Login(string email, string password, out UserDto? authenticatedUser)
        {
            try
            {
                var userEntity = _context.Users.FirstOrDefault(x => x.Email == email);

                if (userEntity == null)
                {
                    authenticatedUser = null;
                    return null;
                }

                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(password, userEntity.PasswordHash);

                if (!isPasswordValid)
                {
                    authenticatedUser = null;
                    return null;
                }

                authenticatedUser = _mapper.Map<UserDto>(userEntity);

                var claims = new[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, userEntity.Email!),
                    new Claim("UserId", userEntity.Id.ToString()),
                    new Claim(ClaimTypes.Role, userEntity.Role!)
                };

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var token = new JwtSecurityToken(
                    issuer: _configuration["Jwt:Issuer"],
                    audience: _configuration["Jwt:Audience"],
                    claims: claims,
                    expires: DateTime.Now.AddHours(2),
                    signingCredentials: creds);

                return new JwtSecurityTokenHandler().WriteToken(token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during login for Email: {Email}", email);
                authenticatedUser = null;
                throw new Exception("An error occurred while processing your login. Please try again.", ex);
            }
        }
    }
}
