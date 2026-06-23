using MaverickBank.API.DTOs;
using System.Collections.Generic;

namespace MaverickBank.API.Services
{
    public interface IUserService
    {
        UserDto? CreateUser(RegisterRequest request, out string errorMessage);
        IEnumerable<UserDto> GetUsers();
        UserDto? GetUserById(int id);
        UserDto? UpdateUser(int id, UpdateUserRequest request, out string errorMessage);
        UserDto? UpdateProfile(int id, UpdateProfileRequest request, out string errorMessage);
        bool? ToggleUserStatus(int id, out bool isActive);
        bool DeleteUser(int id, out string errorMessage);
    }
}


