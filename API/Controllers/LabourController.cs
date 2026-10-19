using IGI.ProductionManager.Api.Data;
using IGI.ProductionManager.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace IGI.ProductionManager.Api.Controllers;

[ApiController]
[Route("api/labour")]
public sealed class LabourController : ControllerBase
{
    private readonly IProductionRepository _repository;

    public LabourController(IProductionRepository repository) => _repository = repository;

    [HttpGet]
    public async Task<ActionResult<LabourDetailsDto>> Get([FromQuery] DateTime? date, CancellationToken cancellationToken)
    {
        var attendanceDate = (date ?? DateTime.Today).Date;
        var details = await _repository.GetLabourDetailsAsync(attendanceDate, cancellationToken);
        return Ok(details);
    }
}
