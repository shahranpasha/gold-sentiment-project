import yfinance as yf
import pandas as pd

# GC=F is the ticker symbol for Gold Futures on Yahoo Finance
gold = yf.Ticker("GC=F")

# Download daily historical price data for the last 5 years
data = gold.history(period="5y", interval="1d")

# Keep only the columns we actually need
data = data[["Open", "High", "Low", "Close", "Volume"]]

# Save it to a CSV file so we can use it later
data.to_csv("data/gold_prices.csv")

print("Done! Gold price data saved to gold_prices.csv")
print(f"Total rows downloaded: {len(data)}")
print(data.tail())  # show the last 5 rows as a preview