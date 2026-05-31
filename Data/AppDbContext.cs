using HomeExpenseTracker.Models;
using Microsoft.EntityFrameworkCore;

namespace HomeExpenseTracker.Data
{
    public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        public DbSet<Expense> Expenses { get; set; }
    }
}
