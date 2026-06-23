using MaverickBank.API.DTOs;
using System.Collections.Generic;

namespace MaverickBank.API.Services
{
    public interface IUserService
    {
        UserDto? CreateUser(RegisterRequest request, out string errorMessage);
        IEnumerable<UserDto> GetUsers();
        UserDto? UpdateUser(int id, UpdateUserRequest request, out string errorMessage);
        bool? ToggleUserStatus(int id, out bool isActive);
    }
}


