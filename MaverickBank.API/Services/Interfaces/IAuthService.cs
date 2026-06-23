using MaverickBank.API.DTOs;
namespace MaverickBank.API.Services
{
    public interface IAuthService
    {
        string? Login(string email, string password, out UserDto? authenticatedUser);
    }
}


