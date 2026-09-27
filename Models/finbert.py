import pandas as pd
import torch
from pathlib import Path
from tqdm import tqdm
from transformers import BertTokenizer, BertForSequenceClassification


# ==========================================================
# PROJECT PATHS
# ==========================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"

INPUT_FILE = DATA_DIR / "gold_news_clean.csv"
OUTPUT_FILE = DATA_DIR / "sentiment_news.csv"


# ==========================================================
# STEP 1 — CHECK INPUT FILE
# ==========================================================

print("=" * 60)
print("STAGE 5 — FINBERT SENTIMENT ANALYSIS")
print("=" * 60)


if not INPUT_FILE.exists():
    raise FileNotFoundError(
        f"\nCleaned news file not found:\n{INPUT_FILE}\n"
        "\nPlease run clean_data.py first."
    )


# ==========================================================
# STEP 2 — LOAD CLEANED NEWS
# ==========================================================

print("\nLoading cleaned news data...")

news = pd.read_csv(INPUT_FILE)

print(f"Articles found: {len(news)}")

print("\nColumns:")
print(list(news.columns))


# Check required columns
required_columns = ["date", "title", "text"]

missing_columns = [
    column
    for column in required_columns
    if column not in news.columns
]

if missing_columns:
    raise KeyError(
        f"\nMissing required columns: {missing_columns}"
    )


# Remove empty text
news["text"] = news["text"].fillna("").astype(str)

news = news[
    news["text"].str.strip() != ""
].copy()

news.reset_index(
    drop=True,
    inplace=True
)

print(f"Articles ready for FinBERT: {len(news)}")


# ==========================================================
# STEP 3 — LOAD FINBERT
# ==========================================================

print("\nLoading FinBERT model...")
print("First run may take a few minutes.")


model_name = "ProsusAI/finbert"

tokenizer = BertTokenizer.from_pretrained(
    model_name
)

model = BertForSequenceClassification.from_pretrained(
    model_name
)

model.eval()


# FinBERT label mapping
labels = [
    "positive",
    "negative",
    "neutral"
]


print("FinBERT loaded successfully!")


# ==========================================================
# STEP 4 — RUN SENTIMENT ANALYSIS
# ==========================================================

print("\nRunning sentiment analysis...")
print("Please wait...\n")


sentiments = []
confidences = []


for _, row in tqdm(
    news.iterrows(),
    total=len(news),
    desc="Analyzing articles"
):

    text = str(row["text"])


    # Tokenize text
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=512,
        padding=True
    )


    # Run FinBERT
    with torch.no_grad():

        outputs = model(
            **inputs
        )


    # Convert logits to probabilities
    probabilities = torch.softmax(
        outputs.logits,
        dim=1
    )


    # Get predicted class
    predicted_index = torch.argmax(
        probabilities,
        dim=1
    ).item()


    # Get confidence
    confidence = probabilities[
        0,
        predicted_index
    ].item()


    # Save results
    sentiments.append(
        labels[predicted_index]
    )

    confidences.append(
        round(confidence, 4)
    )


# ==========================================================
# STEP 5 — ADD SENTIMENT RESULTS
# ==========================================================

news["sentiment"] = sentiments

news["confidence"] = confidences


# ==========================================================
# STEP 6 — CREATE NUMERICAL SENTIMENT SCORE
# ==========================================================

sentiment_mapping = {
    "positive": 1,
    "negative": -1,
    "neutral": 0
}


news["sentiment_score"] = news[
    "sentiment"
].map(
    sentiment_mapping
)


# ==========================================================
# STEP 7 — SAVE RESULTS
# ==========================================================

news.to_csv(
    OUTPUT_FILE,
    index=False
)


# ==========================================================
# SUMMARY
# ==========================================================

print("\n" + "=" * 60)
print("FINBERT ANALYSIS COMPLETE")
print("=" * 60)

print(f"\nTotal articles analyzed: {len(news)}")

print("\nSentiment breakdown:")

print(
    news["sentiment"]
    .value_counts()
)


print("\nAverage confidence:")

print(
    f"{news['confidence'].mean():.2%}"
)


print("\nSentiment scores:")

print("Positive =  1")
print("Neutral  =  0")
print("Negative = -1")


print("\nSample results:")

print(
    news[
        [
            "date",
            "title",
            "sentiment",
            "confidence",
            "sentiment_score"
        ]
    ]
    .head(10)
    .to_string()
)


print("\nSaved successfully to:")

print(OUTPUT_FILE)


print("\nNEXT STEP:")
print("Run merge_data.py to combine")
print("FinBERT sentiment with gold price data.")