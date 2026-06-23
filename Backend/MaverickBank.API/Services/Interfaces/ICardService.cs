using MaverickBank.API.DTOs;
using System.Collections.Generic;

namespace MaverickBank.API.Services
{
    public interface ICardService
    {
        IEnumerable<CardDto> GetMyCards(int userId);
        (bool Success, string Message, CardDto? Card) ApplyCard(ApplyCardRequest request, int userId);
        (bool Success, string Message) ToggleBlock(int cardId, int userId, string userRole);
        (bool Success, string Message) UpdateLimits(int cardId, UpdateLimitsRequest request, int userId, string userRole);
        (bool Success, string Message) UpdatePin(int cardId, UpdatePinRequest request, int userId);
    }
}
