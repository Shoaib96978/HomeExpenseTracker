using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HomeExpenseTracker.Data;

namespace HomeExpenseTracker.Controllers
{
    public class HomeController : Controller
    {
        private readonly AppDbContext _context;

        public HomeController(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> Summary()
        {
            var now = DateTime.Now;
            var startOfMonth = new DateTime(now.Year, now.Month, 1);
            var startOfLastMonth = startOfMonth.AddMonths(-1);

            var thisMonthExpenses = await _context.Expenses
                .Where(e => e.Date >= startOfMonth)
                .ToListAsync();

            var lastMonthExpenses = await _context.Expenses
                .Where(e => e.Date >= startOfLastMonth && e.Date < startOfMonth)
                .ToListAsync();

            var categoryBreakdown = thisMonthExpenses
                .GroupBy(e => e.Category)
                .Select(g => new
                {
                    Category = g.Key,
                    Total = g.Sum(e => e.Amount)
                }).ToList();

            var summary = new
            {
                TotalThisMonth = thisMonthExpenses.Sum(e => e.Amount),
                TotalLastMonth = lastMonthExpenses.Sum(e => e.Amount),
                ExpenseCount = thisMonthExpenses.Count,
                HighestCategory = categoryBreakdown
                    .OrderByDescending(c => c.Total)
                    .FirstOrDefault()?.Category ?? "N/A",
                CategoryBreakdown = categoryBreakdown,
                RecentExpenses = await _context.Expenses
                    .OrderByDescending(e => e.Date) 
                    .Take(5)
                    .Select(e => new
                    {
                        e.Id,
                        e.ItemName,
                        e.Amount,
                        e.Category,
                        Date = e.Date.ToString("dd MMM yyyy"),
                        e.Notes
                    })
                    .ToListAsync()
            };

            return Json(summary);
        }
    }
}