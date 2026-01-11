import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.compose import make_column_transformer
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report,
    accuracy_score,
    roc_auc_score,
    confusion_matrix,
)
from scipy.stats import loguniform
import joblib


# config
SCRIPT_ROOT = Path(__file__).parent
DF_PATH = (
    SCRIPT_ROOT / "data" / "processed" / "test_dataset.csv"
)  # Path("data/processed/test_dataset.csv")
MODEL_PATH = (
    SCRIPT_ROOT / "models" / "logistic_model.pkl"
)  # Path("ml/models/logistic_model.pkl")
SCALER_PATH = SCRIPT_ROOT / "models" / "scaler.pkl"  # Path("ml/models/scaler.pkl")


# reading file, splitting data
df = pd.read_csv(DF_PATH)

y = df["FUTURE_OUTBREAK"]
X = df.drop("FUTURE_OUTBREAK", axis=1)

X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, random_state=67)


# data preprocessing
numeric_transformer = StandardScaler()
numeric_cols = X_train.columns.tolist()[6:]
preprocessor = make_column_transformer((numeric_transformer, numeric_cols))


# making model, hyperparamter optimization
lr = LogisticRegression(max_iter=1000, random_state=67, class_weight="balanced")
pipe = make_pipeline(preprocessor, lr)
param_choices = {"logisticregression__C": loguniform(1e-3, 1e3)}

random_search = RandomizedSearchCV(
    pipe, param_choices, random_state=67, scoring="f1", n_iter=50, n_jobs=-1
)
random_search.fit(X_train, y_train)
final_model = random_search.best_estimator_








print("\n" + "=" * 70)
print("MODEL PERFORMANCE - TRAINING")
print("=" * 70)
print(f"Accuracy: {accuracy_score(y_train, y_train_pred):.4f}")
print(f"ROC-AUC: {roc_auc_score(y_train, y_train_pred_proba):.4f}")
print("\nConfusion Matrix:")
print(confusion_matrix(y_train, y_train_pred))
print("\nClassification Report:")
print(
    classification_report(
        y_train, y_train_pred, target_names=["No Outbreak", "Outbreak"]
    )
)

print("\n" + "=" * 70)
print("MODEL PERFORMANCE - TESTING")
print("=" * 70)
print(f"Accuracy: {accuracy_score(y_test, y_test_pred):.4f}")
print(f"ROC-AUC: {roc_auc_score(y_test, y_test_pred_proba):.4f}")
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_test_pred))
print("\nClassification Report:")
print(
    classification_report(y_test, y_test_pred, target_names=["No Outbreak", "Outbreak"])
)


joblib.dump(model, MODEL_PATH)
joblib.dump(scaler, SCALER_PATH)
