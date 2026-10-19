namespace IGI.ProductionManager.Api.Models;

public sealed class ApiMessage
{
    public ApiMessage(string message) => Message = message;

    public string Message { get; }
}

public sealed class LoginRequest
{
    public string UserId { get; set; } = "";
    public string Password { get; set; } = "";
}

public sealed class LoginResponse
{
    public string UserId { get; set; } = "";
    public string UserName { get; set; } = "";
    public string LabourId { get; set; } = "";
    public int StatusCode { get; set; }
    public string StatusMessage { get; set; } = "";
}

public sealed class JobCardDto
{
    public int Srno { get; set; }
    public int ItemSpecId { get; set; }
    public string JobNo { get; set; } = "";
    public string Date { get; set; } = "";
    public string Item { get; set; } = "";
    public decimal Quantity { get; set; }
    public int WaitingCount { get; set; }
    public int UnderProcessCount { get; set; }
}

public sealed class BatchDto
{
    public string BatchNo { get; set; } = "";
    public string Item { get; set; } = "";
    public decimal Quantity { get; set; }
    public string Stage { get; set; } = "";
}

public sealed class LabourDetailsDto
{
    public string Date { get; set; } = "";
    public int PresentCount { get; set; }
    public int UnassignedCount { get; set; }
    public List<LabourPersonDto> Present { get; set; } = new();
    public List<LabourPersonDto> Unassigned { get; set; } = new();
    public List<LabourGroupDto> Groups { get; set; } = new();
}

public sealed class LabourGroupDto
{
    public string Name { get; set; } = "";
    public int Assigned { get; set; }
    public int? Required { get; set; }
    public List<LabourPersonDto> Labour { get; set; } = new();
}

public sealed class LabourPersonDto
{
    public string EmployeeId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Ssl { get; set; } = "";
    public string Group { get; set; } = "";
    public string PortalUser { get; set; } = "";
    public bool Unassigned { get; set; }
    public string Status { get; set; } = "";
}

public sealed class JobBatchesDto
{
    public int Srno { get; set; }
    public int ItemSpecId { get; set; }
    public string JobNo { get; set; } = "";
    public string Date { get; set; } = "";
    public string Item { get; set; } = "";
    public decimal JobQuantity { get; set; }
    public int UnderProcessCount { get; set; }
    public int WaitingCount { get; set; }
    public List<BatchDto> UnderProcess { get; set; } = new();
    public List<BatchDto> Waiting { get; set; } = new();
}
