import pandas as pd

prices = pd.read_csv("data/gold_prices.csv")

print("Columns:")
print(prices.columns.tolist())

print("\nFirst 10 rows:")
print(prices.head(10))

print("\nData types:")
print(prices.dtypes)
