# Smart Expense Tracker with Predictive Analytics

A full-stack personal finance application that helps users track expenses, visualize spending patterns, and leverage machine learning to predict future monthly expenses across categories. Built with React, Node.js, MongoDB, and XGBoost.

## Overview

Smart Expense Tracker combines traditional expense management with predictive analytics to provide users with actionable insights about their spending behavior. The platform automatically categorizes transactions, generates visual analytics, and uses a universal XGBoost model to forecast future spending based on historical patterns, budget context, and user profile.

## Technologies Used

- **Frontend:** React (Vite), React Router, Recharts, Lucide Icons, React Hot Toast, TailwindCSS, DaisyUI
- **Backend:** Node.js, Express.js, JWT authentication, Zod validation, bcrypt
- **Database:** MongoDB with Mongoose ODM
- **Machine Learning:** Python, XGBoost, FastAPI, Optuna (hyperparameter tuning), scikit-learn, pandas, numpy
- **Development:** Nodemon (backend), Vite dev server (frontend), Uvicorn (ML API)

## Project Structure

```
├── backend/           # Express API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── server.js
│   └── package.json
├── frontend/          # React + Vite application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── styles/
│   │   └── main.jsx
│   └── package.json
├── mlModel/           # Python ML service
│   ├── ml_api.py
│   ├── train_model.py
│   ├── predict_expense.py
│   ├── training_data.csv
│   └── requirements.txt
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.9+)
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SumeetDUTTA/Smart-Expense-Tracker-with-Predictive-Analytics.git
   cd Smart-Expense-Tracker-with-Predictive-Analytics
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in `backend/` with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```
   Create a `.env` file in `frontend/` with:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_ML_API_URL=http://localhost:8000
   ```

4. **ML Model Setup:**
   ```bash
   cd mlModel
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

### Running the Application

Start all three services in separate terminals:

1. **Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **ML API:**
   ```bash
   cd mlModel
   python ml_api.py
   ```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- ML API: `http://localhost:8000`

## Core Features

### User Management
- **Secure Authentication:** JWT-based signup/login with bcrypt password hashing
- **User Profiles:** Customizable profiles with monthly budget settings and user type selection
- **Theme Support:** Light and dark mode with persistent preferences

### Expense Management
- **CRUD Operations:** Add, view, edit, and delete expenses with amount, category, date, and notes
- **Category Organization:** Pre-defined categories (Food & Drink, Travel, Utilities, Entertainment, Health & Fitness, Shopping, Rent, etc.)
- **Search & Filter:** Real-time search and category-based filtering
- **Responsive Design:** Mobile-first UI with adaptive layouts

### Data Visualization
- **Dashboard Analytics:**
  - Monthly spending overview with vs. previous month comparison
  - Daily average spending calculation
  - Category distribution pie chart
  - 6-month spending trend line chart
  - Top spending categories with progress bars
- **Expense History:**
  - Time-series line chart with interactive brush/zoom
  - Aggregation modes: daily, weekly, monthly
  - Custom date range selection
  - Period breakdown tables

### Predictive Analytics
- **Expense Forecasting:** Multi-month predictions (1-12 months) using XGBoost regression
- **Category-Level Predictions:** Individual forecasts per expense category
- **Budget-Aware Models:** Predictions adapt to user's monthly budget and spending profile
- **User Archetypes:** Model trained on 6 user types (college student, young professional, family moderate/high, luxury lifestyle, senior retired)
- **Confidence Bounds:** Visual indicators for prediction reliability

## Machine Learning Details

The prediction engine uses a universal XGBoost model trained on synthetic transaction data covering multiple user profiles and budget ranges (₹3,000 - ₹60,000/month).

**Features:**
- Time-series signals: 1/2/3/12-month lags, 3/6/12-month rolling averages
- Trend indicators: 3-month trend, percentage change
- Calendar features: month number, sine/cosine seasonality
- Budget context: log budget, budget category buckets, spend-to-budget ratio
- Behavioral mix: category one-hot encodings, user type encodings, category share of total spend

**Performance:** 
- Test MAE: ~₹200-400 depending on user profile
- Handles diverse spending patterns across user types
- Stable multi-step forecasts with drift correction

See `mlModel/README.md` for detailed ML documentation.

## API Endpoints

### Backend (Express)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/expenses` - Get all user expenses
- `POST /api/expenses` - Create new expense
- `PATCH /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update profile/budget

### ML API (FastAPI)
- `POST /predict` - Batch category forecast
- `POST /predict_timeseries` - Single series forecast

## Development

### Code Quality
- Frontend: ESLint, Prettier (configured)
- Backend: Zod schema validation, error middleware
- Consistent design tokens across CSS modules
- Accessible UI with ARIA labels and keyboard navigation

### Testing
Run frontend dev server with hot reload:
```bash
cd frontend
npm run dev
```

Build for production:
```bash
npm run build
```

## Contributing

This is a completed academic project. For any questions or issues, please contact the repository owner.

## License

This project is for educational purposes. All rights reserved.

## Acknowledgments

- Built as a 5th semester project
- ML model inspired by time-series forecasting best practices
- UI/UX design follows modern dashboard patterns

---

**Author:** Sumeet Dutta  
**Repository:** [Smart-Expense-Tracker-with-Predictive-Analytics](https://github.com/SumeetDUTTA/Smart-Expense-Tracker-with-Predictive-Analytics)

