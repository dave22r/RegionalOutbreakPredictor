import pandas as pd
from pathlib import Path
from sklearn.model_selection import RandomizedSearchCV, TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
from sklearn.compose import make_column_transformer
from sklearn.pipeline import make_pipeline
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    f1_score,
    precision_score,
    recall_score,
    accuracy_score,
    confusion_matrix,
    roc_auc_score,
    precision_recall_curve,
    roc_curve,
    average_precision_score,
)
from scipy.stats import loguniform
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib


# config
ML_ROOT = Path(__file__).parent.parent
DF_PATH = ML_ROOT / "data" / "processed" / "test_dataset.csv"
MODEL_PATH = ML_ROOT / "models" / "lr_classifier.pkl"
RANDOM_STATE = 67

# reading file, splitting data manually because of time series
df = pd.read_csv(DF_PATH)
df.sort_values(by=["YEAR", "WEEK"],inplace=True)

split_idx = int(len(df)*0.75)
df_train = df.iloc[:split_idx]
df_test = df.iloc[split_idx:]

df_train.drop(columns=["YEAR", "WEEK"], inplace=True)
df_test.drop(columns=["YEAR", "WEEK"], inplace=True)

X_train = df_train.drop(columns=["FUTURE_OUTBREAK"])
y_train = df_train["FUTURE_OUTBREAK"]
X_test = df_test.drop(columns=["FUTURE_OUTBREAK"])
y_test = df_test["FUTURE_OUTBREAK"]

# data preprocessing
numeric_transformer = StandardScaler()
numeric_cols = X_train.columns.tolist()[6:]
time_series = X_train.columns.tolist()[:2]
preprocessor = make_column_transformer(
        (
            numeric_transformer, 
            numeric_cols
        ),
        (
            "passthrough",
            time_series
        )
    )


# making model, hyperparamter optimization
lr = LogisticRegression(
    max_iter=1000, random_state=RANDOM_STATE, class_weight="balanced"
)
pipe = make_pipeline(preprocessor, lr)

param_choices = {"logisticregression__C": loguniform(1e-3, 1e3)}
tscv = TimeSeriesSplit(n_splits=5)
random_search = RandomizedSearchCV(
    # TODO: test optimizing for other scores?
    pipe, param_choices, random_state=RANDOM_STATE, scoring="f1", n_iter=50, cv=tscv, n_jobs=-1
)
random_search.fit(X_train, y_train)
final_model = random_search.best_estimator_
joblib.dump(final_model, MODEL_PATH)





# visualization function
def get_model_metrics(
    model,
    X_train,
    X_test,
    y_train,
    y_test,
    model_name="Model",
    random_state=RANDOM_STATE,
):
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    y_proba_test = model.predict_proba(X_test)[:, 1]

    # Baseline model
    dummy = DummyClassifier(strategy="most_frequent", random_state=random_state)
    dummy.fit(X_train, y_train)
    y_pred_dummy = dummy.predict(X_test)

    metrics = {
        "F1 Score": [f1_score(y_test, y_pred_dummy), f1_score(y_test, y_pred_test)],
        "Precision": [
            precision_score(y_test, y_pred_dummy, zero_division=0),
            precision_score(y_test, y_pred_test),
        ],
        "Recall": [
            recall_score(y_test, y_pred_dummy, zero_division=0),
            recall_score(y_test, y_pred_test),
        ],
        "Accuracy": [
            accuracy_score(y_test, y_pred_dummy),
            accuracy_score(y_test, y_pred_test),
        ],
        "ROC-AUC": [
            0.5,  # Dummy always predicts one class
            roc_auc_score(y_test, y_proba_test),
        ],
    }

    comparison_df = pd.DataFrame(
        metrics, index=["Baseline (Most Frequent)", model_name]
    ).T
    comparison_df["Improvement"] = (
        comparison_df[model_name] - comparison_df["Baseline (Most Frequent)"]
    )

    train_test_df = pd.DataFrame(
        {
            "Train": [
                f1_score(y_train, y_pred_train),
                precision_score(y_train, y_pred_train),
                recall_score(y_train, y_pred_train),
            ],
            "Test": [
                f1_score(y_test, y_pred_test),
                precision_score(y_test, y_pred_test),
                recall_score(y_test, y_pred_test),
            ],
        },
        index=["F1", "Precision", "Recall"],
    )
    train_test_df["Gap"] = train_test_df["Train"] - train_test_df["Test"]

    train_dist = y_train.value_counts(normalize=True)
    test_dist = y_test.value_counts(normalize=True)

    dist_df = pd.DataFrame({"Train": train_dist, "Test": test_dist})
    dist_df.index = ["No Outbreak (0)", "Outbreak (1)"]

    fig = plt.figure(figsize=(16, 12))

    # 1. Confusion Matrix
    ax1 = plt.subplot(3, 3, 1)
    cm = confusion_matrix(y_test, y_pred_test)
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["No Outbreak", "Outbreak"],
        yticklabels=["No Outbreak", "Outbreak"],
    )
    plt.title("Confusion Matrix", fontsize=12, fontweight="bold")
    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")

    # 2. Normalized Confusion Matrix
    ax2 = plt.subplot(3, 3, 2)
    cm_norm = cm.astype("float") / cm.sum(axis=1)[:, np.newaxis]
    sns.heatmap(
        cm_norm,
        annot=True,
        fmt=".2%",
        cmap="Blues",
        xticklabels=["No Outbreak", "Outbreak"],
        yticklabels=["No Outbreak", "Outbreak"],
    )
    plt.title("Normalized Confusion Matrix", fontsize=12, fontweight="bold")
    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")

    # 3. Metrics Comparison Bar Plot
    ax3 = plt.subplot(3, 3, 3)
    comparison_df[model_name].plot(kind="barh", color="steelblue", ax=ax3)
    plt.xlabel("Score")
    plt.title("Model Performance Metrics", fontsize=12, fontweight="bold")
    plt.xlim(0, 1)
    for i, v in enumerate(comparison_df[model_name]):
        plt.text(v + 0.02, i, f"{v:.3f}", va="center")

    # 4. ROC Curve
    ax4 = plt.subplot(3, 3, 4)
    fpr, tpr, _ = roc_curve(y_test, y_proba_test)
    roc_auc = roc_auc_score(y_test, y_proba_test)
    plt.plot(
        fpr, tpr, color="darkorange", lw=2, label=f"ROC curve (AUC = {roc_auc:.3f})"
    )
    plt.plot(
        [0, 1], [0, 1], color="navy", lw=2, linestyle="--", label="Random Classifier"
    )
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve", fontsize=12, fontweight="bold")
    plt.legend(loc="lower right")
    plt.grid(alpha=0.3)

    # 5. Precision-Recall Curve 
    ax5 = plt.subplot(3, 3, 5)
    precision_vals, recall_vals, _ = precision_recall_curve(y_test, y_proba_test)
    avg_precision = average_precision_score(y_test, y_proba_test)
    plt.plot(
        recall_vals,
        precision_vals,
        color="darkgreen",
        lw=2,
        label=f"PR curve (AP = {avg_precision:.3f})",
    )
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title("Precision-Recall Curve", fontsize=12, fontweight="bold")
    plt.legend(loc="best")
    plt.grid(alpha=0.3)

    # 6. F1 Score by Threshold
    ax6 = plt.subplot(3, 3, 6)
    thresholds = np.arange(0.1, 0.9, 0.01)
    f1_scores = []
    for thresh in thresholds:
        y_pred_thresh = (y_proba_test >= thresh).astype(int)
        f1_scores.append(f1_score(y_test, y_pred_thresh))

    plt.plot(thresholds, f1_scores, color="purple", lw=2)
    best_thresh_idx = np.argmax(f1_scores)
    best_thresh = thresholds[best_thresh_idx]
    best_f1 = f1_scores[best_thresh_idx]
    plt.scatter(
        [best_thresh],
        [best_f1],
        color="red",
        s=100,
        zorder=5,
        label=f"Best: {best_f1:.3f} @ {best_thresh:.2f}",
    )
    plt.axvline(0.5, color="gray", linestyle="--", alpha=0.5, label="Default (0.5)")
    plt.xlabel("Threshold")
    plt.ylabel("F1 Score")
    plt.title("F1 Score vs Decision Threshold", fontsize=12, fontweight="bold")
    plt.legend()
    plt.grid(alpha=0.3)

    # 7. Prediction Distribution
    ax7 = plt.subplot(3, 3, 7)
    plt.hist(
        y_proba_test[y_test == 0], bins=30, alpha=0.5, label="No Outbreak", color="blue"
    )
    plt.hist(
        y_proba_test[y_test == 1], bins=30, alpha=0.5, label="Outbreak", color="red"
    )
    plt.axvline(0.5, color="black", linestyle="--", label="Threshold")
    plt.xlabel("Predicted Probability")
    plt.ylabel("Frequency")
    plt.title("Prediction Distribution", fontsize=12, fontweight="bold")
    plt.legend()
    plt.grid(alpha=0.3)

    # 8. Train vs Test Metrics
    ax8 = plt.subplot(3, 3, 8)
    train_test_df[["Train", "Test"]].plot(
        kind="bar", ax=ax8, color=["lightblue", "steelblue"]
    )
    plt.ylabel("Score")
    plt.title("Train vs Test Performance", fontsize=12, fontweight="bold")
    plt.xticks(rotation=0)
    plt.ylim(0, 1)
    plt.legend()
    plt.grid(alpha=0.3, axis="y")

    # 9. Feature Importance (if available)
    ax9 = plt.subplot(3, 3, 9)
    try:
        # For logistic regression in pipeline
        if hasattr(model, "named_steps"):
            lr_model = model.named_steps["logisticregression"]

            if "columntransformer" in model.named_steps:
                transformer = model.named_steps["columntransformer"]
            else:
                transformer = model.named_steps[list(model.named_steps.keys())[0]]

            if hasattr(lr_model, "coef_"):
                coef = lr_model.coef_[0]

                try:
                    feature_names = transformer.get_feature_names_out()
                except:
                    feature_names = X_train.columns.tolist()

                if len(coef) != len(feature_names):
                    feature_names = X_train.columns.tolist()[6:]  # Your numeric_cols

                # Get top 10 features by absolute coefficient
                importance_df = (
                    pd.DataFrame({"Feature": feature_names, "Coefficient": coef})
                    .sort_values("Coefficient", key=abs, ascending=False)
                    .head(10)
                )

                colors = [
                    "red" if x < 0 else "green" for x in importance_df["Coefficient"]
                ]
                importance_df.plot(
                    x="Feature",
                    y="Coefficient",
                    kind="barh",
                    ax=ax9,
                    legend=False,
                    color=colors,
                )
                plt.xlabel("Coefficient")
                plt.title("Top 10 Feature Importance", fontsize=12, fontweight="bold")
                plt.tight_layout()
    except:
        plt.text(
            0.5,
            0.5,
            "Feature importance\nnot available",
            ha="center",
            va="center",
            fontsize=12,
        )
        plt.axis("off")

    plt.tight_layout()
    plt.show()

    return {
        "metrics": comparison_df,
        "train_test": train_test_df,
        "best_threshold": best_thresh,
        "best_f1": best_f1,
    }


results = get_model_metrics(
    final_model,
    X_train,
    X_test,
    y_train,
    y_test,
    model_name="Logistic Regression",
    random_state=RANDOM_STATE,
)
