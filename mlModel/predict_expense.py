import pandas as pd
import numpy as np
import joblib
import os

MODEL_PATH = 'expense_forecast_universal.pkl'

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f'Could not find {MODEL_PATH}. Train and save the model first.')

model_package = joblib.load(MODEL_PATH)
model = model_package['model']
FEATURES = model_package['features']

def detect_user_type_and_budget(df):
    df_exp = df[df['Type'].str.lower() == 'expense'].copy()
    
    if len(df_exp) == 0:
        return 'young_professional', 8000
    
    df_exp['Date'] = pd.to_datetime(df_exp['Date'])
    monthly_totals = (
        df_exp.groupby(df_exp['Date'].dt.to_period('M'))['Amount']
        .sum()
        .reset_index()
    )
    
    avg_monthly_spending = monthly_totals['Amount'].mean()
    
    category_breakdown = df_exp.groupby('Category')['Amount'].sum()
    total_spending = category_breakdown.sum()
    
    if total_spending == 0:
        return 'young_professional', 8000
    
    food_pct = category_breakdown.get('Food and Drink', 0) / total_spending
    rent_pct = category_breakdown.get('Rent', 0) / total_spending
    
    if avg_monthly_spending < 5000:
        if food_pct > 0.35:
            return 'college_student', min(avg_monthly_spending, 3000)
        else:
            return 'young_professional', min(avg_monthly_spending, 8000)
    elif avg_monthly_spending < 12000:
        return 'young_professional', avg_monthly_spending
    elif avg_monthly_spending < 25000:
        if rent_pct < 0.1:
            return 'senior_retired', avg_monthly_spending
        else:
            return 'family_moderate', avg_monthly_spending
    elif avg_monthly_spending < 45000:
        return 'family_high', avg_monthly_spending
    else:
        return 'luxury_lifestyle', avg_monthly_spending

def create_universal_features(monthly_data, user_type, total_budget):
    df = monthly_data.copy()
    
    df['UserType'] = user_type
    df['TotalBudget'] = total_budget
    df['log_total_budget'] = np.log1p(total_budget)
    
    if total_budget <= 5000:
        budget_cat = 'low'
    elif total_budget <= 10000:
        budget_cat = 'moderate'
    elif total_budget <= 20000:
        budget_cat = 'high'
    elif total_budget <= 40000:
        budget_cat = 'very_high'
    else:
        budget_cat = 'luxury'
    
    df['budget_category'] = budget_cat
    df['log_amount'] = np.log1p(df['total_amount'])
    df['month_num'] = df['Date'].dt.month
    df['month_sin'] = np.sin(2 * np.pi * df['month_num'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month_num'] / 12)
    df['spend_ratio'] = df['log_amount'] / df['log_total_budget']
    
    df['lag_1'] = df.groupby('Category')['log_amount'].shift(1)
    df['lag_2'] = df.groupby('Category')['log_amount'].shift(2)
    df['lag_3'] = df.groupby('Category')['log_amount'].shift(3)
    df['lag_12'] = df.groupby('Category')['log_amount'].shift(12)
    
    df['Rolling3'] = (
        df.groupby('Category')['log_amount']
        .transform(lambda x: x.shift(1).rolling(3, min_periods=1).mean())
    )
    df['Rolling6'] = (
        df.groupby('Category')['log_amount']
        .transform(lambda x: x.shift(1).rolling(6, min_periods=1).mean())
    )
    df['Rolling12'] = (
        df.groupby('Category')['log_amount']
        .transform(lambda x: x.shift(1).rolling(12, min_periods=1).mean())
    )
    
    df['trend_3'] = df.groupby('Category')['log_amount'].transform(lambda x: x.diff(3))
    df['pct_change'] = df.groupby('Category')['log_amount'].pct_change().fillna(0)
    
    df['month_total'] = df.groupby('Date')['log_amount'].transform('sum')
    df['category_ratio'] = df['log_amount'] / df['month_total']
    
    df = pd.get_dummies(df, columns=['Category', 'UserType', 'budget_category'], drop_first=False)
    
    for col in FEATURES:
        if col not in df.columns:
            df[col] = 0
    
    return df[FEATURES]

def forecast_expense(df):
    user_type, total_budget = detect_user_type_and_budget(df)
    print(f'Detected user profile: {user_type} with budget Rs{total_budget:,.0f}/month')
    
    df = df.copy()
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df['Type'] = df['Type'].astype(str).str.strip().str.lower()
    df_exp = df[df['Type'] == 'expense']
    
    if len(df_exp) == 0:
        return {'predicted_expense': int(total_budget * 0.8)}
    
    monthly = (
        df_exp.groupby([df_exp['Date'].dt.to_period('M'), 'Category'])
        .agg(total_amount=('Amount', 'sum'))
        .reset_index()
    )
    monthly['Date'] = monthly['Date'].dt.to_timestamp()
    
    if len(monthly) == 0:
        return {'predicted_expense': int(total_budget * 0.8)}
    
    monthly = monthly.sort_values(['Category', 'Date'])
    
    try:
        feature_data = create_universal_features(monthly, user_type, total_budget)
        
        if len(feature_data) == 0:
            raise ValueError('No feature data available')
        
        X_latest = feature_data.iloc[[-1]]
        log_prediction = model.predict(X_latest)
        
        if hasattr(log_prediction, '__getitem__'):
            log_prediction = log_prediction[0]
        
        predicted_expense = int(round(np.expm1(log_prediction)))
        return {'predicted_expense': predicted_expense}
        
    except Exception as e:
        print(f'ML prediction failed: {e}. Using statistical fallback.')
        recent_avg = monthly.groupby('Category')['total_amount'].tail(3).mean().sum()
        
        if pd.isna(recent_avg) or recent_avg == 0:
            predicted_expense = int(total_budget * 0.8)
        else:
            predicted_expense = int(recent_avg * 1.05)
        
        return {'predicted_expense': predicted_expense}

if __name__ == '__main__':
    sample_data = pd.DataFrame({
        'Date': pd.date_range('2024-01-01', periods=60, freq='D'),
        'Category': np.random.choice(['Food and Drink', 'Transportation', 'Entertainment'], 60),
        'Amount': np.random.randint(100, 1000, 60),
        'Type': 'expense'
    })
    
    result = forecast_expense(sample_data)
    print('Next month forecast:', result)
