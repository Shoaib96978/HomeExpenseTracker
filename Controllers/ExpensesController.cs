using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HomeExpenseTracker.Data;
using HomeExpenseTracker.Models;

namespace HomeExpenseTracker.Controllers
{
    public class ExpensesController : Controller
    {
        private readonly AppDbContext _context;

        public ExpensesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: /Expenses
        public IActionResult Index()
        {
            if (Request.Query["format"] == "json")
            {
                var expenses =  _context.Expenses
                    .OrderByDescending(e => e.Date)
                    .Select(e => new {
                        e.Id,
                        e.ItemName,
                        e.Amount,
                        e.Category,
                        Date = e.Date.ToString("yyyy-MM-dd"),
                        e.Notes
                    })
                    .ToList();

                return Json(expenses);
            }
            return View();
        }

        // GET: /Expenses/GetAll
        [HttpGet]
        public async Task<IActionResult> GetAll(
            string? search,
            string? category,
            int? month,
            int? year,
            int page = 1,
            int pageSize = 10)
        {
            var query = _context.Expenses.AsQueryable();

            if (!string.IsNullOrEmpty(search))
                query = query.Where(e =>
                    e.ItemName.ToLower().Contains(search.ToLower()));

            if (!string.IsNullOrEmpty(category))
                query = query.Where(e => e.Category == category);

            if (month.HasValue)
                query = query.Where(e => e.Date.Month == month.Value);

            if (year.HasValue)
                query = query.Where(e => e.Date.Year == year.Value);

            var total = await query.CountAsync();

            var expenses = await query
                .OrderByDescending(e => e.Date)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new
                {
                    e.Id,
                    e.ItemName,
                    e.Amount,
                    e.Category,
                    Date = e.Date.ToString("dd MMM yyyy"),
                    e.Notes
                })
                .ToListAsync();

            return Json(new
            {
                Data = expenses,
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize)
            });
        }

        // GET: /Expenses/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: /Expenses/Create
        [HttpPost]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> Create([FromBody] Expense expense)
        {
            if (!ModelState.IsValid)
                return Json(new
                {
                    success = false,
                    message = "Invalid data"
                });

            expense.Date = expense.Date == default
                ? DateTime.Now
                : expense.Date;

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                message = "Expense added successfully!"
            });
        }

        // GET: /Expenses/Edit/5
        [HttpGet]
        public async Task<IActionResult> Edit(int id)
        {
            var expense = await _context.Expenses.FindAsync(id);

            if (expense == null)
                return Json(new
                {
                    success = false,
                    message = "Expense not found"
                });

            return Json(new
            {
                success = true,
                data = new
                {
                    expense.Id,
                    expense.ItemName,
                    expense.Amount,
                    expense.Category,
                    Date = expense.Date.ToString("yyyy-MM-dd"),
                    expense.Notes
                }
            });
        }

        // POST: /Expenses/Edit/5
        [HttpPost]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> Edit(
            int id,
            [FromBody] Expense expense)
        {
            var existing = await _context.Expenses.FindAsync(id);

            if (existing == null)
                return Json(new
                {
                    success = false,
                    message = "Expense not found"
                });

            existing.ItemName = expense.ItemName;
            existing.Amount = expense.Amount;
            existing.Category = expense.Category;
            existing.Date = expense.Date;
            existing.Notes = expense.Notes;

            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                message = "Expense updated successfully!"
            });
        }

        // POST: /Expenses/Delete/5
        [HttpPost]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            var expense = await _context.Expenses.FindAsync(id);

            if (expense == null)
                return Json(new
                {
                    success = false,
                    message = "Expense not found"
                });

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                message = "Expense deleted successfully!"
            });
        }
    }
}