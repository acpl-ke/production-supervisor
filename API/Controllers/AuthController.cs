using IGI.ProductionManager.Api.Data;
using IGI.ProductionManager.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace IGI.ProductionManager.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IProductionRepository _repository;

    public AuthController(IProductionRepository repository) => _repository = repository;

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.UserId) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new ApiMessage("Enter user ID and password."));
        }

        var result = await _repository.LoginAsync(request, cancellationToken);
        if (result is null || result.StatusCode != 1)
        {
            var message = result?.StatusMessage switch
            {
                "User InActive" => "This user is inactive.",
                null or "" or "Failed" => "User ID or password is not valid.",
                var status => status
            };
            return Unauthorized(new ApiMessage(message));
        }

        if (string.IsNullOrWhiteSpace(result.UserName))
        {
            result.UserName = result.UserId;
        }

        return Ok(result);
    }
}
