using Microsoft.EntityFrameworkCore;
using MaverickBank.API.Models;

namespace MaverickBank.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Loan> Loans { get; set; }
        public DbSet<Beneficiary> Beneficiaries { get; set; }
        public DbSet<Card> Cards { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Fix EF Core decimal precision warnings - use HasPrecision which works with both
            // SQL Server (production) and InMemory (unit tests) providers
            modelBuilder.Entity<Account>(entity =>
            {
                entity.Property(e => e.Balance).HasPrecision(18, 2);
            });

            modelBuilder.Entity<Transaction>(entity =>
            {
                entity.Property(e => e.Amount).HasPrecision(18, 2);
            });

            modelBuilder.Entity<Loan>(entity =>
            {
                entity.Property(e => e.LoanAmount).HasPrecision(18, 2);
                entity.Property(e => e.InterestRate).HasPrecision(5, 2);
                entity.Property(e => e.RemainingBalance).HasPrecision(18, 2);
            });

            modelBuilder.Entity<Card>(entity =>
            {
                entity.Property(e => e.DailyAtmLimit).HasPrecision(18, 2);
                entity.Property(e => e.DailyOnlineLimit).HasPrecision(18, 2);
            });
        }
    }
}
