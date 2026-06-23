using MaverickBank.API.Data;
using MaverickBank.API.Models;
using MaverickBank.API.DTOs;
using AutoMapper;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MaverickBank.API.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<UserService> _logger;

        public UserService(ApplicationDbContext context, IMapper mapper, ILogger<UserService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public UserDto? CreateUser(RegisterRequest request, out string errorMessage)
        {
            errorMessage = string.Empty;
            try
            {
                if (_context.Users.Any(x => x.Email == request.Email))
                {
                    errorMessage = "Email already registered";
                    return null;
                }

                var user = new User
                {
                    FullName = request.FullName,
                    Email = request.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    PhoneNumber = request.PhoneNumber,
                    Address = request.Address,
                    Role = string.IsNullOrEmpty(request.Role) ? "Customer" : request.Role,
                    Gender = request.Gender,
                    DateOfBirth = request.DateOfBirth,
                    AadharNumber = request.AadharNumber,
                    PANNumber = request.PANNumber,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                _context.Users.Add(user);
                _context.SaveChanges();

                return _mapper.Map<UserDto>(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating user with Email: {Email}", request.Email);
                throw new Exception("An error occurred while registering the user. Please try again.", ex);
            }
        }

        public IEnumerable<UserDto> GetUsers()
        {
            try
            {
                return _mapper.Map<IEnumerable<UserDto>>(_context.Users.ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching all users.");
                throw new Exception("An error occurred while retrieving users.", ex);
            }
        }

        public UserDto? GetUserById(int id)
        {
            try
            {
                var user = _context.Users.Find(id);
                return user == null ? null : _mapper.Map<UserDto>(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching user with UserId: {UserId}", id);
                throw new Exception("An error occurred while retrieving the user.", ex);
            }
        }

        public UserDto? UpdateProfile(int id, UpdateProfileRequest request, out string errorMessage)
        {
            errorMessage = string.Empty;
            try
            {
                var user = _context.Users.Find(id);
                if (user == null)
                {
                    errorMessage = "User not found";
                    return null;
                }

                if (!string.IsNullOrWhiteSpace(request.FullName)) user.FullName = request.FullName;
                if (!string.IsNullOrWhiteSpace(request.PhoneNumber)) user.PhoneNumber = request.PhoneNumber;
                if (!string.IsNullOrWhiteSpace(request.Address)) user.Address = request.Address;
                if (!string.IsNullOrWhiteSpace(request.Gender)) user.Gender = request.Gender;
                if (request.DateOfBirth.HasValue) user.DateOfBirth = request.DateOfBirth;

                _context.SaveChanges();
                return _mapper.Map<UserDto>(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating profile for UserId: {UserId}", id);
                throw new Exception("An error occurred while updating your profile. Please try again.", ex);
            }
        }


        public UserDto? UpdateUser(int id, UpdateUserRequest request, out string errorMessage)
        {
            errorMessage = string.Empty;
            try
            {
                var user = _context.Users.Find(id);
                if (user == null)
                {
                    errorMessage = "User not found";
                    return null;
                }

                if (user.Email != request.Email && _context.Users.Any(x => x.Email == request.Email))
                {
                    errorMessage = "Email already exists";
                    return null;
                }

                user.FullName = request.FullName;
                user.Email = request.Email;
                user.PhoneNumber = request.PhoneNumber;
                user.Address = request.Address;
                user.Role = request.Role;
                user.Gender = request.Gender;
                user.DateOfBirth = request.DateOfBirth;
                user.AadharNumber = request.AadharNumber;
                user.PANNumber = request.PANNumber;

                _context.SaveChanges();

                return _mapper.Map<UserDto>(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating user with UserId: {UserId}", id);
                throw new Exception("An error occurred while updating the user. Please try again.", ex);
            }
        }

        public bool? ToggleUserStatus(int id, out bool isActive)
        {
            isActive = false;
            try
            {
                var user = _context.Users.Find(id);
                if (user == null)
                {
                    return null; // Not found
                }

                user.IsActive = !user.IsActive;
                isActive = user.IsActive;
                _context.SaveChanges();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while toggling status for UserId: {UserId}", id);
                throw new Exception("An error occurred while updating the user status.", ex);
            }
        }

        public bool DeleteUser(int id, out string errorMessage)
        {
            errorMessage = string.Empty;
            try
            {
                var user = _context.Users.Find(id);
                if (user == null)
                {
                    errorMessage = "User not found";
                    return false;
                }

                // Retrieve account ids for transaction deletion
                var accountIds = _context.Accounts
                    .Where(a => a.UserId == id)
                    .Select(a => a.Id)
                    .ToList();

                // Delete related transactions
                if (accountIds.Any())
                {
                    var transactions = _context.Transactions.Where(t => accountIds.Contains(t.AccountId));
                    _context.Transactions.RemoveRange(transactions);
                }

                // Delete related loans
                var loans = _context.Loans.Where(l => l.UserId == id);
                _context.Loans.RemoveRange(loans);

                // Delete related cards
                var cards = _context.Cards.Where(c => c.UserId == id);
                _context.Cards.RemoveRange(cards);

                // Delete related beneficiaries
                var beneficiaries = _context.Beneficiaries.Where(b => b.UserId == id);
                _context.Beneficiaries.RemoveRange(beneficiaries);

                // Delete accounts
                var accounts = _context.Accounts.Where(a => a.UserId == id);
                _context.Accounts.RemoveRange(accounts);

                // Delete user
                _context.Users.Remove(user);

                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting user with UserId: {UserId}", id);
                errorMessage = "An error occurred while deleting the user account.";
                return false;
            }
        }
    }
}
