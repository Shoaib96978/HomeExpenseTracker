# HomeExpenseTracker

A simple home expense tracking app built with ASP.NET MVC Core.
Track your daily household expenses with category-wise monthly summary.

## Tech Stack

- ASP.NET MVC Core (.NET 10)
- Entity Framework Core + SQLite
- Bootstrap 5 + Custom CSS
- Vanilla JavaScript (Fetch API)

## Prerequisites

- .NET 10 SDK → https://dotnet.microsoft.com/download
- Git

## How to Run

1. Clone the repository
   git clone https://github.com/shoaib96978/HomeExpenseTracker.git
   cd HomeExpenseTracker

2. Restore packages
   dotnet restore

3. Apply database migrations
   dotnet ef database update

4. Run the app
   dotnet run

5. Open browser
   https://localhost:7086

## Features

- Add, view, edit, delete expenses
- Category-wise filtering and search
- Monthly summary dashboard with chart
- Data persists between runs (SQLite)