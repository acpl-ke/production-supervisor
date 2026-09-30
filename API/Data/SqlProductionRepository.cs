using System.Data;
using System.Globalization;
using Dapper;
using IGI.ProductionManager.Api.Models;

namespace IGI.ProductionManager.Api.Data;

public sealed class SqlProductionRepository : IProductionRepository
{
    private readonly ISqlConnectionFactory _connections;
    private readonly IConfiguration _configuration;

    public SqlProductionRepository(ISqlConnectionFactory connections, IConfiguration configuration)
    {
        _connections = connections;
        _configuration = configuration;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        await using var connection = _connections.Create();
        var row = await connection.QueryFirstOrDefaultAsync<LoginRow>(new CommandDefinition(
            Procedure("Login"),
            new { loginID = request.UserId.Trim(), Pwd = request.Password },
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken));

        if (row is null)
        {
            return null;
        }

        return new LoginResponse
        {
            StatusCode = row.StatusCode,
            StatusMessage = row.StatusMessage,
            UserId = request.UserId.Trim(),
            UserName = row.UserName ?? "",
            LabourId = row.LabourID ?? ""
        };
    }

    public async Task<IReadOnlyList<JobCardDto>> GetDriveJobsAsync(CancellationToken cancellationToken)
    {
        var rows = await QueryAsync<JobRow>(Procedure("GetDriveJobs"), null, cancellationToken);
        return rows.Select(ToJob).ToList();
    }

    public async Task<JobBatchesDto?> GetJobBatchesAsync(int jbcNoId, int itemSpecId, CancellationToken cancellationToken)
    {
        await using var connection = _connections.Create();
        var jobs = (await connection.QueryAsync<JobRow>(new CommandDefinition(
            Procedure("GetDriveJobs"),
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken))).ToList();

        var job = jobs.FirstOrDefault(row => row.Srno == jbcNoId && row.ItemSpecID == itemSpecId);
        if (job is null)
        {
            return null;
        }

        var parameters = new { JBCNoID = jbcNoId, ItemSpecID = itemSpecId };
        var under = (await connection.QueryAsync<BatchRow>(new CommandDefinition(
            Procedure("GetUnderProcess"),
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken))).Select(ToBatch).ToList();
        var waiting = (await connection.QueryAsync<BatchRow>(new CommandDefinition(
            Procedure("GetWaiting"),
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken))).Select(ToBatch).ToList();

        var card = ToJob(job);
        return new JobBatchesDto
        {
            Srno = card.Srno,
            ItemSpecId = card.ItemSpecId,
            JobNo = card.JobNo,
            Date = card.Date,
            Item = card.Item,
            JobQuantity = card.Quantity,
            UnderProcessCount = under.Count,
            WaitingCount = waiting.Count,
            UnderProcess = under,
            Waiting = waiting
        };
    }

    private async Task<IReadOnlyList<T>> QueryAsync<T>(string procedure, object? parameters, CancellationToken cancellationToken)
    {
        await using var connection = _connections.Create();
        var rows = await connection.QueryAsync<T>(new CommandDefinition(
            procedure,
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken));
        return rows.ToList();
    }

    private string Procedure(string key)
    {
        var name = _configuration[$"StoredProcedures:{key}"];
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException($"Stored procedure '{key}' is not configured.");
        }

        return name;
    }

    private static JobCardDto ToJob(JobRow row) => new()
    {
        Srno = row.Srno,
        ItemSpecId = row.ItemSpecID,
        JobNo = row.JBCNo ?? "",
        Date = FormatJobDate(row.JBCDate),
        Item = row.ItemSpecName ?? "",
        Quantity = row.ITEMTOTALQTY
    };

    private static BatchDto ToBatch(BatchRow row) => new()
    {
        BatchNo = row.JobNo ?? "",
        Item = row.ItemSpecName ?? "",
        Quantity = row.Quantity,
        Stage = $"S{row.StageNo}"
    };

    private static string FormatJobDate(object? value) => value switch
    {
        DateTime date => date.ToString("dd.MM.yy", CultureInfo.InvariantCulture),
        DateTimeOffset date => date.ToString("dd.MM.yy", CultureInfo.InvariantCulture),
        null => "",
        _ => Convert.ToString(value, CultureInfo.InvariantCulture) ?? ""
    };

    private sealed class LoginRow
    {
        public int StatusCode { get; set; }
        public string StatusMessage { get; set; } = "";
        public string? UserName { get; set; }
        public string? LabourID { get; set; }
    }

    private sealed class JobRow
    {
        public string? JBCNo { get; set; }
        public object? JBCDate { get; set; }
        public string? ItemSpecName { get; set; }
        public decimal ITEMTOTALQTY { get; set; }
        public int Srno { get; set; }
        public int ItemSpecID { get; set; }
    }

    private sealed class BatchRow
    {
        public string? JobNo { get; set; }
        public string? ItemSpecName { get; set; }
        public decimal Quantity { get; set; }
        public int StageNo { get; set; }
    }
}
