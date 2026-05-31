# ANSWERS.md

## 1. How to Run

Make sure you have .NET 10 SDK and Git installed.

git clone https://github.com/shoaib96978/HomeExpenseTracker.git
cd HomeExpenseTracker
dotnet restore
dotnet ef database update
dotnet run

Then open https://localhost:7086 in your browser.
The SQLite database file (expenses.db) will be created 
automatically on first run.

## 2. Stack Choice

I picked ASP.NET MVC Core with SQLite and EF Core because 
I already know C# and this stack lets me run everything 
with one command. No separate frontend server, no database 
installation — just dotnet run and it works.

SQLite was the right call here because the database is just 
a single file sitting in the project folder. The grader 
does not need to install anything extra to run it.

A worse choice would have been React + Web API. I actually 
know both but for this task it would mean two separate 
projects, two terminals, CORS setup, and more chances 
something breaks on a fresh machine.

## 3. One Real Edge Case

File: Controllers/ExpensesController.cs, Create action.

When the form submits, the Date field sometimes comes in 
as a default empty DateTime value. I handle this like:

    expense.Date = expense.Date == default
        ? DateTime.Now
        : expense.Date;

Without this, the database would save 01/01/0001 as the 
expense date. This would completely break the monthly 
summary on the dashboard because the filter checks 
current month and year.

## 4. AI Usage

I used Claude (claude.ai) for most of this project 
because I was short on time.

- Asked Claude for the controller code. It gave me a 
  working base but the Create action kept returning 
  500 errors when I tested it. We debugged it together 
  and found the issue was DateTime not parsing correctly 
  from JSON. Claude changed the parameter from 
  [FromBody] Expense to JsonElement and it worked.

- Asked Claude for the frontend views. It generated the 
  HTML with Bootstrap 5. I changed the color scheme 
  myself because the first version did not look the way 
  I wanted.

- Asked Claude for the layout. It got confused and put 
  Create page content inside _Layout.cshtml. I caught 
  the mistake and asked it to fix it properly.


## 5. Honest Gap

The app works but the dashboard summary loads all data 
every time the page opens. There is no caching at all. 
If someone has hundreds of expense entries the dashboard 
query will get slow.

With another day I would add simple response caching on 
the Summary endpoint so it does not hit the database on 
every single page load.