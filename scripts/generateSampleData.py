import csv
import os
import random
from datetime import datetime, timedelta

def generate_data():
    categories = [
        {"name": "Food", "color": "#EF4444", "icon": "Utensils", "avg_min": 100, "avg_max": 800, "freq_per_month": 25},
        {"name": "Transport", "color": "#3B82F6", "icon": "Car", "avg_min": 50, "avg_max": 300, "freq_per_month": 15},
        {"name": "Shopping", "color": "#EC4899", "icon": "ShoppingBag", "avg_min": 500, "avg_max": 4000, "freq_per_month": 4},
        {"name": "Entertainment", "color": "#8B5CF6", "icon": "Film", "avg_min": 200, "avg_max": 1500, "freq_per_month": 5},
        {"name": "Medical", "color": "#10B981", "icon": "HeartPulse", "avg_min": 300, "avg_max": 2500, "freq_per_month": 1},
        {"name": "Education", "color": "#F59E0B", "icon": "GraduationCap", "avg_min": 1000, "avg_max": 5000, "freq_per_month": 1},
        {"name": "Travel", "color": "#06B6D4", "icon": "Plane", "avg_min": 1500, "avg_max": 8000, "freq_per_month": 1},
        {"name": "Bills", "color": "#6B7280", "icon": "FileText", "avg_min": 1000, "avg_max": 3500, "freq_per_month": 3},
        {"name": "Rent", "color": "#6366F1", "icon": "Home", "avg_min": 12000, "avg_max": 18000, "freq_per_month": 1},
        {"name": "Investment", "color": "#10B981", "icon": "TrendingUp", "avg_min": 2000, "avg_max": 10000, "freq_per_month": 2},
        {"name": "Others", "color": "#9CA3AF", "icon": "Grid", "avg_min": 100, "avg_max": 1000, "freq_per_month": 5}
    ]

    payment_methods = ["Cash", "Credit Card", "Debit Card", "UPI", "Net Banking"]

    # Start date: 14 months ago
    start_date = datetime.now() - timedelta(days=420)
    end_date = datetime.now()

    expenses = []

    # Loop through each month
    current_month_start = start_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    while current_month_start < end_date:
        year = current_month_start.year
        month = current_month_start.month
        
        # Calculate days in this month
        if month == 12:
            next_month = current_month_start.replace(year=year+1, month=1, day=1)
        else:
            next_month = current_month_start.replace(month=month+1, day=1)
        
        days_in_month = (next_month - current_month_start).days

        # Let's generate data for each category
        for cat in categories:
            # Rent is exactly once a month, on the 1st to 5th
            if cat["name"] == "Rent":
                rent_day = random.randint(1, 5)
                rent_date = current_month_start + timedelta(days=rent_day - 1)
                if rent_date <= end_date:
                    expenses.append({
                        "date": rent_date.strftime("%Y-%m-%d %H:%M:%S"),
                        "category": cat["name"],
                        "amount": round(random.uniform(cat["avg_min"], cat["avg_max"]), 2),
                        "payment_method": "Net Banking",
                        "description": "Monthly rent payment"
                    })
                continue
                
            # Regular categories
            freq = cat["freq_per_month"]
            # Add some randomness to frequency
            actual_freq = max(1, freq + random.randint(-int(freq * 0.2), int(freq * 0.2)))
            
            for _ in range(actual_freq):
                day = random.randint(1, days_in_month)
                expense_date = current_month_start + timedelta(days=day - 1)
                
                # Add hour and minute
                expense_date = expense_date.replace(
                    hour=random.randint(8, 22),
                    minute=random.randint(0, 59)
                )

                if expense_date > end_date:
                    continue

                # Add a seasonal effect: Bills are higher in summer (June, July, August)
                amount = random.uniform(cat["avg_min"], cat["avg_max"])
                if cat["name"] == "Bills" and month in [5, 6, 7, 8]:
                    amount *= 1.35  # 35% higher bills
                
                # Add a general growth/inflation trend over time
                # Months since start
                months_since_start = (current_month_start - start_date).days // 30
                trend_factor = 1 + (months_since_start * 0.008) # 0.8% inflation increase per month
                amount *= trend_factor

                expenses.append({
                    "date": expense_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "category": cat["name"],
                    "amount": round(amount, 2),
                    "payment_method": random.choice(payment_methods),
                    "description": f"Paid for {cat['name'].lower()}"
                })
        
        current_month_start = next_month

    # Sort expenses by date
    expenses.sort(key=lambda x: x["date"])

    # Ensure folders exist
    os.makedirs("ai-service/datasets", exist_ok=True)
    os.makedirs("scripts", exist_ok=True)

    output_path = "ai-service/datasets/sample_expenses.csv"
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["date", "category", "amount", "payment_method", "description"])
        writer.writeheader()
        writer.writerows(expenses)

    print(f"Generated {len(expenses)} transactions in {output_path}")

if __name__ == "__main__":
    generate_data()
