import joblib
import json
import numpy as np

# Load the existing trained model
MODEL_PATH = 'expense_forecast_universal.pkl'
model_package = joblib.load(MODEL_PATH)

# Extract XGBoost model
xgb_model = model_package['model']

# Save the model in XGBoost's native JSON format
xgb_model.save_model('expense_forecast_model.json')

# Save metadata separately
metadata = {
    'features': model_package['features'],
    'best_params': model_package['best_params'],
    'mae_log': float(model_package['mae_log']),
    'rmse_log': float(model_package['rmse_log']),
    'mae_rupees': float(model_package['mae_rupees']),
    'rmse_rupees': float(model_package['rmse_rupees']),
    'training_info': model_package['training_info'],
    'user_types': model_package['user_types'],
    'budget_range': model_package['budget_range']
}

with open('model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print("✅ Model converted successfully!")
print("   - Model saved as: expense_forecast_model.json")
print("   - Metadata saved as: model_metadata.json")
print("\nTo load the model later:")
print("   model = XGBRegressor()")
print("   model.load_model('expense_forecast_model.json')")
