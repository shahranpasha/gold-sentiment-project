import os
import copy
import random
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

import torch
import torch.nn as nn

from torch.utils.data import TensorDataset, DataLoader

from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    confusion_matrix,
    roc_auc_score
)

# ============================================================
# GOLD SENTIMENT ANALYSIS USING LSTM
# CORRECTED TRAIN -> VALIDATION -> TEST PIPELINE
# ============================================================

print("=" * 68)
print(" GOLD SENTIMENT LSTM - FINAL CORRECTED PIPELINE")
print("=" * 68)

# ============================================================
# CONFIGURATION
# ============================================================

SEED = 42

SEQ_LEN = 15

BATCH_SIZE = 32

EPOCHS = 100

LEARNING_RATE = 0.001

PATIENCE = 15

TRAIN_RATIO = 0.70

VAL_RATIO = 0.15

TEST_RATIO = 0.15

MODEL_PATH = "Models/lstm_gold.pt"

CHART_PATH = "Models/training_curves.png"

DATA_PATH = "data/final_dataset.csv"

os.makedirs("Models", exist_ok=True)

# ============================================================
# REPRODUCIBILITY
# ============================================================

random.seed(SEED)

np.random.seed(SEED)

torch.manual_seed(SEED)

if torch.cuda.is_available():

    torch.cuda.manual_seed_all(SEED)

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print(f"\\nDevice: {device}")

# ============================================================
# STEP 1 - LOAD DATASET
# ============================================================

print("\\n[1/9] Loading master dataset...")

df = pd.read_csv(DATA_PATH)

if "date" not in df.columns:

    raise ValueError(
        "date column not found in final_dataset.csv"
    )

df["date"] = pd.to_datetime(
    df["date"],
    errors="coerce"
)

df = df.sort_values("date").reset_index(drop=True)

print(f"Rows loaded : {len(df)}")

print(
    f"Date range  : {df['date'].min().date()} "
    f"to {df['date'].max().date()}"
)

# ============================================================
# STEP 2 - CREATE FEATURES AND TARGET
# ============================================================

print("\\n[2/9] Creating features and next-day target...")

# --------------------------------------------
# Technical Features
# --------------------------------------------

df["price_change"] = (
    df["Close"].pct_change() * 100
)

df["price_change_3"] = (
    df["Close"].pct_change(3) * 100
)

df["price_change_5"] = (
    df["Close"].pct_change(5) * 100
)

df["ma_cross"] = (
    df["MA7"] - df["MA20"]
)

df["sent_momentum"] = (
    df["sentiment_score"].diff()
)

# --------------------------------------------
# Recreate NEXT DAY target
# --------------------------------------------

df["target"] = np.where(
    df["Close"].shift(-1) > df["Close"],
    1,
    0
)

# Last row has no tomorrow

df.loc[df.index[-1], "target"] = np.nan

# ============================================================
# STEP 3 - SELECT FEATURES
# ============================================================

print("\\n[3/9] Selecting features...")

FEATURE_COLS = [
    "Close",
    "price_change",
    "price_change_3",
    "price_change_5",
    "sentiment_score",
    "article_count",
    "positive_count",
    "negative_count",
    "neutral_count",
    "MA7",
    "MA20",
    "ma_cross",
    "volatility",
    "momentum",
    "sent_momentum"
]

# --------------------------------------------
# Automatically include FRED variables
# --------------------------------------------

FRED_FEATURES = [
    "Federal_Funds_Rate",
    "CPI",
    "Unemployment",
    "GDP",
    "PCE",
    "Treasury10Y"
]

available_fred = []

for col in FRED_FEATURES:

    if col in df.columns:

        FEATURE_COLS.append(col)

        available_fred.append(col)

print("\\nFRED features detected:")

if len(available_fred) == 0:

    print("None found")

else:

    for col in available_fred:

        print(" +", col)

print(f"\\nTotal features: {len(FEATURE_COLS)}")

for feature in FEATURE_COLS:

    print(" -", feature)

# Keep only required columns

required_cols = FEATURE_COLS + ["target", "date"]

df = df[required_cols].copy()

# Remove missing rows

df = df.dropna().reset_index(drop=True)

print(f"\\nClean rows available: {len(df)}")

up_count = int((df["target"] == 1).sum())

down_count = int((df["target"] == 0).sum())

print(f"UP samples   : {up_count}")

print(f"DOWN samples : {down_count}")

# ============================================================
# STEP 4 - CHRONOLOGICAL SPLIT
# ============================================================

print("\\n[4/9] Splitting chronologically...")

n = len(df)

train_end = int(n * TRAIN_RATIO)

val_end = int(n * (TRAIN_RATIO + VAL_RATIO))

train_df = df.iloc[:train_end].copy()

val_df = df.iloc[train_end:val_end].copy()

test_df = df.iloc[val_end:].copy()

print(f"Training rows   : {len(train_df)}")

print(f"Validation rows : {len(val_df)}")

print(f"Testing rows    : {len(test_df)}")

print("\\nTraining period:")

print(
    train_df["date"].iloc[0].date(),
    "to",
    train_df["date"].iloc[-1].date()
)

print("\\nValidation period:")

print(
    val_df["date"].iloc[0].date(),
    "to",
    val_df["date"].iloc[-1].date()
)

print("\\nTesting period:")

print(
    test_df["date"].iloc[0].date(),
    "to",
    test_df["date"].iloc[-1].date()
)

# ============================================================
# STEP 5 - SCALE FEATURES
# ============================================================

print("\\n[5/9] Scaling features using TRAIN only...")

scaler = StandardScaler()

scaler.fit(
    train_df[FEATURE_COLS]
)

scaled_features = scaler.transform(
    df[FEATURE_COLS]
)

targets = df["target"].astype(int).values

dates = df["date"].values

# ============================================================
# STEP 6 - CREATE SEQUENCES
# ============================================================

print("\\n[6/9] Creating sequences...")

X_train = []
y_train = []

X_val = []
y_val = []

X_test = []
y_test = []

test_dates = []

for i in range(SEQ_LEN - 1, len(df)):

    sequence = scaled_features[
        i - SEQ_LEN + 1:i + 1
    ]

    label = targets[i]

    if i < train_end:

        X_train.append(sequence)
        y_train.append(label)

    elif i < val_end:

        X_val.append(sequence)
        y_val.append(label)

    else:

        X_test.append(sequence)
        y_test.append(label)
        test_dates.append(dates[i])

X_train = np.array(X_train)

y_train = np.array(y_train)

X_val = np.array(X_val)

y_val = np.array(y_val)

X_test = np.array(X_test)

y_test = np.array(y_test)

print(f"Sequence length : {SEQ_LEN}")

print(f"Training sequences   : {len(X_train)}")

print(f"Validation sequences : {len(X_val)}")

print(f"Testing sequences    : {len(X_test)}")

print(
    f"\\nTrain UP={int((y_train==1).sum())} "
    f"DOWN={int((y_train==0).sum())}"
)

print(
    f"Validation UP={int((y_val==1).sum())} "
    f"DOWN={int((y_val==0).sum())}"
)

print(
    f"Test UP={int((y_test==1).sum())} "
    f"DOWN={int((y_test==0).sum())}"
)

# ============================================================
# PYTORCH DATASETS
# ============================================================

train_dataset = TensorDataset(
    torch.tensor(X_train, dtype=torch.float32),
    torch.tensor(y_train, dtype=torch.float32).unsqueeze(1)
)

val_dataset = TensorDataset(
    torch.tensor(X_val, dtype=torch.float32),
    torch.tensor(y_val, dtype=torch.float32).unsqueeze(1)
)

test_dataset = TensorDataset(
    torch.tensor(X_test, dtype=torch.float32),
    torch.tensor(y_test, dtype=torch.float32).unsqueeze(1)
)

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True
)

val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False
)

test_loader = DataLoader(
    test_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False
)

# ============================================================
# LSTM MODEL
# ============================================================

class GoldLSTM(nn.Module):

    def __init__(self, input_size):

        super().__init__()

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=64,
            num_layers=2,
            batch_first=True,
            dropout=0.20
        )

        self.dropout = nn.Dropout(0.25)

        self.fc1 = nn.Linear(64, 32)

        self.relu = nn.ReLU()

        self.fc2 = nn.Linear(32, 1)

    def forward(self, x):

        output, _ = self.lstm(x)

        output = output[:, -1, :]

        output = self.dropout(output)

        output = self.fc1(output)

        output = self.relu(output)

        output = self.fc2(output)

        return output

model = GoldLSTM(
    len(FEATURE_COLS)
).to(device)

print("\\nModel Architecture:")

print(model)

# ============================================================
# CLASS WEIGHT
# ============================================================

n_down = int((y_train == 0).sum())

n_up = int((y_train == 1).sum())

if n_down == 0 or n_up == 0:

    raise ValueError(
        "Training data must contain both classes."
    )

pos_weight_value = n_down / n_up

pos_weight = torch.tensor(
    [pos_weight_value],
    dtype=torch.float32
).to(device)

print(
    f"\\nPositive class weight: "
    f"{pos_weight_value:.4f}"
)

criterion = nn.BCEWithLogitsLoss(
    pos_weight=pos_weight
)

optimizer = torch.optim.Adam(
    model.parameters(),
    lr=LEARNING_RATE,
    weight_decay=1e-5
)

scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode="max",
    factor=0.5,
    patience=5
)

# ============================================================
# HELPER FUNCTION
# ============================================================

def evaluate(loader):

    model.eval()

    losses = []

    probabilities = []

    actuals = []

    with torch.no_grad():

        for X_batch, y_batch in loader:

            X_batch = X_batch.to(device)

            y_batch = y_batch.to(device)

            logits = model(X_batch)

            loss = criterion(logits, y_batch)

            losses.append(loss.item())

            probs = torch.sigmoid(logits)

            probabilities.extend(
                probs.cpu().numpy().flatten()
            )

            actuals.extend(
                y_batch.cpu().numpy().flatten()
            )

    return (
        np.mean(losses),
        np.array(probabilities),
        np.array(actuals).astype(int)
    )

# ============================================================
# FIND BEST THRESHOLD ON VALIDATION
# ============================================================

def find_best_threshold(y_true, probabilities):

    best_threshold = 0.50

    best_f1 = -1

    for threshold in np.arange(0.30, 0.71, 0.01):

        preds = (
            probabilities >= threshold
        ).astype(int)

        score = f1_score(
            y_true,
            preds,
            average="macro",
            zero_division=0
        )

        if score > best_f1:

            best_f1 = score

            best_threshold = threshold

    return best_threshold, best_f1

# ============================================================
# STEP 7 - TRAINING
# ============================================================

print("\\n[7/9] Training model...")

print(f"Epochs        : {EPOCHS}")

print(f"Batch size    : {BATCH_SIZE}")

print(f"Learning rate : {LEARNING_RATE}")

print("-" * 68)

train_losses = []

val_losses = []

train_f1_history = []

val_f1_history = []

best_score = -1

best_state = None

best_threshold = 0.50

epochs_without_improvement = 0

for epoch in range(1, EPOCHS + 1):

    model.train()

    running_loss = 0.0

    train_probs = []

    train_true = []

    for X_batch, y_batch in train_loader:

        X_batch = X_batch.to(device)

        y_batch = y_batch.to(device)

        optimizer.zero_grad()

        logits = model(X_batch)

        loss = criterion(logits, y_batch)

        loss.backward()

        torch.nn.utils.clip_grad_norm_(
            model.parameters(),
            1.0
        )

        optimizer.step()

        running_loss += loss.item()

        probs = torch.sigmoid(logits)

        train_probs.extend(
            probs.detach().cpu().numpy().flatten()
        )

        train_true.extend(
            y_batch.detach().cpu().numpy().flatten()
        )

    train_loss = (
        running_loss / max(len(train_loader), 1)
    )

    train_probs = np.array(train_probs)

    train_true = np.array(train_true).astype(int)

    train_preds = (
        train_probs >= 0.50
    ).astype(int)

    train_macro_f1 = f1_score(
        train_true,
        train_preds,
        average="macro",
        zero_division=0
    )

    val_loss, val_probs, val_true = evaluate(
        val_loader
    )

    threshold, val_macro_f1 = find_best_threshold(
        val_true,
        val_probs
    )

    val_preds = (
        val_probs >= threshold
    ).astype(int)

    val_bal_acc = balanced_accuracy_score(
        val_true,
        val_preds
    )

    train_losses.append(train_loss)

    val_losses.append(val_loss)

    train_f1_history.append(train_macro_f1)

    val_f1_history.append(val_macro_f1)

    scheduler.step(val_macro_f1)

    if val_macro_f1 > best_score:

        best_score = val_macro_f1

        best_state = copy.deepcopy(
            model.state_dict()
        )

        best_threshold = threshold

        epochs_without_improvement = 0

    else:

        epochs_without_improvement += 1

    if epoch == 1 or epoch % 10 == 0:

        print(
            f"Epoch [{epoch:3}/{EPOCHS}] | "
            f"Train Loss: {train_loss:.4f} | "
            f"Val Loss: {val_loss:.4f} | "
            f"Train F1: {train_macro_f1:.3f} | "
            f"Val F1: {val_macro_f1:.3f} | "
            f"Bal Acc: {val_bal_acc:.3f} | "
            f"Thr: {threshold:.2f}"
        )

    if epochs_without_improvement >= PATIENCE:

        print(
            f"\\nEarly stopping at epoch {epoch}."
        )

        break

# ============================================================
# STEP 8 - FINAL TEST EVALUATION
# ============================================================

print("\\n[8/9] Evaluating FINAL TEST SET...")

model.load_state_dict(best_state)

model.eval()

test_loss, test_probs, test_true = evaluate(
    test_loader
)

test_preds = (
    test_probs >= best_threshold
).astype(int)

accuracy = accuracy_score(
    test_true,
    test_preds
)

balanced_acc = balanced_accuracy_score(
    test_true,
    test_preds
)

macro_f1 = f1_score(
    test_true,
    test_preds,
    average="macro",
    zero_division=0
)

precision_up = precision_score(
    test_true,
    test_preds,
    pos_label=1,
    zero_division=0
)

recall_up = recall_score(
    test_true,
    test_preds,
    pos_label=1,
    zero_division=0
)

precision_down = precision_score(
    test_true,
    test_preds,
    pos_label=0,
    zero_division=0
)

recall_down = recall_score(
    test_true,
    test_preds,
    pos_label=0,
    zero_division=0
)

try:

    auc = roc_auc_score(
        test_true,
        test_probs
    )

except:

    auc = float("nan")

cm = confusion_matrix(
    test_true,
    test_preds,
    labels=[0,1]
)

# ============================================================
# BASELINE
# ============================================================

baseline_preds = np.ones_like(test_true)

baseline_accuracy = accuracy_score(
    test_true,
    baseline_preds
)

baseline_balanced = balanced_accuracy_score(
    test_true,
    baseline_preds
)

print("\\n" + "=" * 68)

print(" FINAL TEST PERFORMANCE")

print("=" * 68)

print(
    f"Accuracy             : {accuracy*100:.2f}%"
)

print(
    f"Balanced Accuracy    : {balanced_acc*100:.2f}%"
)

print(
    f"Macro F1 Score       : {macro_f1*100:.2f}%"
)

print(
    f"ROC-AUC              : {auc:.4f}"
)

print(
    f"Best Threshold       : {best_threshold:.2f}"
)

print("\\nUP Metrics")

print(
    f"Precision : {precision_up*100:.2f}%"
)

print(
    f"Recall    : {recall_up*100:.2f}%"
)

print("\\nDOWN Metrics")

print(
    f"Precision : {precision_down*100:.2f}%"
)

print(
    f"Recall    : {recall_down*100:.2f}%"
)

print("\\nConfusion Matrix")

print(
    "                Pred DOWN   Pred UP"
)

print(
    f"Actual DOWN      {cm[0][0]:6}   {cm[0][1]:6}"
)

print(
    f"Actual UP        {cm[1][0]:6}   {cm[1][1]:6}"
)

print("\\nBaseline Comparison")

print(
    f"Always UP Accuracy          : "
    f"{baseline_accuracy*100:.2f}%"
)

print(
    f"Always UP Balanced Accuracy : "
    f"{baseline_balanced*100:.2f}%"
)

print("=" * 68)

# ============================================================
# SAVE MODEL
# ============================================================

torch.save(
    {
        "model_state_dict": best_state,
        "scaler": scaler,
        "feature_cols": FEATURE_COLS,
        "seq_len": SEQ_LEN,
        "threshold": best_threshold,
        "validation_macro_f1": best_score,
        "test_accuracy": accuracy,
        "test_balanced_accuracy": balanced_acc,
        "test_macro_f1": macro_f1,
        "roc_auc": auc
    },
    MODEL_PATH
)

print("\\nModel saved:")

print(MODEL_PATH)

# ============================================================
# SAVE TRAINING CURVES
# ============================================================

plt.figure(figsize=(12,5))

plt.plot(
    train_losses,
    label="Training Loss"
)

plt.plot(
    val_losses,
    label="Validation Loss"
)

plt.xlabel("Epoch")

plt.ylabel("Loss")

plt.title(
    "LSTM Training and Validation Loss"
)

plt.legend()

plt.grid(alpha=0.3)

plt.tight_layout()

plt.savefig(
    CHART_PATH,
    dpi=150
)

plt.close()

print("\\nTraining chart saved:")

print(CHART_PATH)

# ============================================================
# SAVE TEST PREDICTIONS
# ============================================================

prediction_df = pd.DataFrame(
    {
        "date": pd.to_datetime(test_dates),
        "actual": test_true,
        "probability_up": test_probs,
        "prediction": test_preds
    }
)

prediction_df.to_csv(
    "Models/test_predictions.csv",
    index=False
)

print("\\nTest predictions saved:")

print("Models/test_predictions.csv")

# ============================================================
# STEP 9 - NEXT DAY PREDICTION
# ============================================================

print("\\n[9/9] NEXT GOLD PRICE DIRECTION")

# Use the latest available 15 rows

latest_features = df[FEATURE_COLS].iloc[-SEQ_LEN:]

latest_scaled = scaler.transform(
    latest_features
)

latest_tensor = torch.tensor(
    latest_scaled,
    dtype=torch.float32
).unsqueeze(0).to(device)

with torch.no_grad():

    logit = model(latest_tensor)

    probability = torch.sigmoid(logit).item()

if probability >= best_threshold:

    prediction = "UP"

    confidence = probability * 100

else:

    prediction = "DOWN"

    confidence = (1 - probability) * 100

print("=" * 68)

print(
    f"Last Gold Price : "
    f"${df['Close'].iloc[-1]:,.2f}"
)

print(
    f"Sentiment Score : "
    f"{df['sentiment_score'].iloc[-1]:.3f}"
)

print(
    f"Prediction      : {prediction}"
)

print(
    f"Confidence      : {confidence:.2f}%"
)

print(
    f"Threshold Used  : {best_threshold:.2f}"
)

print("=" * 68)

print("\\nTRAINING COMPLETE")