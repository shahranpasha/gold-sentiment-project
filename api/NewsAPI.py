import requests
import pandas as pd
from datetime import datetime, timedelta

api_key = "32cd3be87d33407fbf804a8d2a170c19"

queries = [
    "gold price",
    "gold market",
    "XAU USD",
    "gold investment",
    "gold inflation"
]

# We'll collect all articles here
all_articles = []

# Today and 30 days back
end_date   = datetime.today().strftime("%Y-%m-%d")
start_date = (datetime.today() - timedelta(days=30)).strftime("%Y-%m-%d")

print(f"Fetching gold news from {start_date} to {end_date}...")

# Loop through each search term and fetch articles
for query in queries:
    url = (
        f"https://newsapi.org/v2/everything?"
        f"q={query}&"
        f"from={start_date}&"
        f"to={end_date}&"
        f"language=en&"
        f"sortBy=publishedAt&"
        f"pageSize=100&"
        f"apiKey={api_key}"
    )

    response = requests.get(url)
    data     = response.json()

    if data["status"] == "ok":
        articles = data["articles"]
        for article in articles:
            all_articles.append({
                "date":        article["publishedAt"][:10],
                "title":       article["title"],
                "description": article["description"],
                "source":      article["source"]["name"],
                "url":         article["url"]
            })
        print(f"'{query}' → {len(articles)} articles fetched")
    else:
        print(f"Error for '{query}': {data.get('message', 'Unknown error')}")

# Remove duplicate articles
df = pd.DataFrame(all_articles)
df.drop_duplicates(subset=["title"], inplace=True)
df.sort_values("date", ascending=False, inplace=True)

# Save to CSV
df.to_csv("data/raw_news.csv", index=False)

print(f"\nDone! Total unique articles saved: {len(df)}")
print(f"Saved to gold_news.csv")
print(df.head())


