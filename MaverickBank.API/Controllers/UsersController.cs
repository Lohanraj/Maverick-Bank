using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MaverickBank.API.DTOs;
using MaverickBank.API.Services;

namespace MaverickBank.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IUserService userService, ILogger<UsersController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        // CREATE USER (REGISTRATION / ADMIN CREATE)
        [HttpPost]
        public IActionResult CreateUser(RegisterRequest request)
        {
            var user = _userService.CreateUser(request, out string errorMessage);
            if (user == null)
            {
                return BadRequest(errorMessage);
            }

            _logger.LogInformation("New user registered: {Email} (Role: {Role})", user.Email, user.Role);

            return Ok(user);
        }

        // GET ALL USERS (ADMIN/EMPLOYEE ONLY)
        [Authorize(Roles = "Admin,Employee")]
        [HttpGet]
        public IActionResult GetUsers()
        {
            var users = _userService.GetUsers();
            return Ok(users);
        }

        // UPDATE USER (ADMIN ONLY)
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public IActionResult UpdateUser(int id, UpdateUserRequest request)
        {
            var user = _userService.UpdateUser(id, request, out string errorMessage);
            
            if (user == null)
            {
                if (errorMessage == "User not found")
                    return NotFound(errorMessage);
                return BadRequest(errorMessage);
            }

            _logger.LogInformation("User {UserId} updated by admin", id);

            return Ok(user);
        }

        // TOGGLE USER ACTIVE STATUS (ADMIN ONLY)
        [Authorize(Roles = "Admin")]
        [HttpPut("toggle/{id}")]
        public IActionResult ToggleUserStatus(int id)
        {
            var result = _userService.ToggleUserStatus(id, out bool isActive);
            if (result == null)
            {
                return NotFound("User not found");
            }

            return Ok(new { Message = $"User account has been {(isActive ? "activated" : "deactivated")}", IsActive = isActive });
        }
    }
}


