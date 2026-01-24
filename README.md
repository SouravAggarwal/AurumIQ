# AurumIQ - Trading & Analysis Platform

A production-ready, institutional-grade trading and analysis web application built with React/MUI frontend and Django REST backend.

![Platform Overview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.2-blue)
![Django](https://img.shields.io/badge/Django-4.2-green)
![MUI](https://img.shields.io/badge/MUI-5.15-purple)

## 🚀 Features

- **Portfolio Analysis Dashboard**
  - Real-time summary cards (Total Trades, PnL stats)
  - Interactive PnL over time chart
  - Trade status distribution (Open vs Closed)

- **Trade Management**
  - Full CRUD operations for trades
  - Multi-leg trade support (spreads, straddles, etc.)
  - Pagination and sorting
  - Detailed trade view with leg breakdown

- **Professional UI/UX**
  - Clean, minimal Material UI design
  - Responsive layout (mobile/tablet/desktop)
  - Smooth animations and transitions
  - Premium color palette with Inter typography

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework
- **Material UI (MUI) 5** - Component library
- **React Router 6** - Navigation
- **Axios** - HTTP client
- **Recharts** - Charts and visualizations
- **Vite** - Build tool

### Backend
- **Django 4.2** - Web framework
- **Django REST Framework** - API toolkit
- **PostgreSQL** - Database
- **django-cors-headers** - CORS handling

## 📁 Project Structure

```
AurumIQ/
├── backend/                    # Django Backend
│   ├── aurumiq/               # Django Project Config
│   │   ├── settings.py        # Settings with PostgreSQL, DRF
│   │   ├── urls.py            # Root URL configuration
│   │   └── wsgi.py            # WSGI configuration
│   ├── trades/                # Trades App
│   │   ├── models.py          # TradeLeg model
│   │   ├── serializers.py     # API serializers
│   │   ├── views.py           # ViewSets and API views
│   │   ├── urls.py            # API URL routing
│   │   └── management/        # Custom management commands
│   │       └── commands/
│   │           └── seed_data.py
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable Components
│   │   │   ├── Layout/        # App shell with sidebar
│   │   │   └── TradeForm/     # Create/Edit trade dialog
│   │   ├── pages/             # Page Components
│   │   │   ├── Analysis/      # Dashboard with analytics
│   │   │   ├── Trades/        # Trade list with table
│   │   │   └── TradeDetails/  # Single trade view
│   │   ├── services/          # API Layer
│   │   │   └── api.js         # Axios client
│   │   ├── theme/             # MUI Theme
│   │   │   └── index.js       # Custom theme configuration
│   │   ├── App.jsx            # Main app with routing
│   │   └── main.jsx           # Entry point
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 🚦 Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 14+**

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
cd /Users/sourav/Personal/Projects/Learning/Trading/AurumIQ
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE aurumiq;

# Exit
\q
```

### 3. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from example)
cp .env.example .env

# Edit .env with your database credentials
# DB_NAME=aurumiq
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=5432

# Run migrations
python manage.py migrate

# Seed sample data
python manage.py seed_data

# Start the development server
python manage.py runserver
```

The backend will be running at `http://localhost:8000`

### 4. Frontend Setup

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be running at `http://localhost:5173`

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/trades/` | List trades (paginated, grouped by trade_id) |
| `POST` | `/api/trades/` | Create a new trade with legs |
| `GET` | `/api/trades/{trade_id}/` | Get trade details with all legs |
| `PUT` | `/api/trades/{trade_id}/` | Update trade and its legs |
| `DELETE` | `/api/trades/{trade_id}/` | Delete trade and all legs |
| `GET` | `/api/analytics/summary/` | Get analytics summary |

### Example: Create a Trade

```bash
curl -X POST http://localhost:8000/api/trades/ \
  -H "Content-Type: application/json" \
  -d '{
    "legs": [
      {
        "name": "GoldM Long Position",
        "ticker": "AAPL",
        "is_open": true,
        "entry_date": "2025-01-15",
        "entry_price": 185.50,
        "quantity": 100
      }
    ]
  }'
```

## 📊 Database Schema

### TradeLeg Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | AutoField | Primary key |
| `trade_id` | IntegerField | Groups legs of same trade |
| `name` | CharField(100) | Trade name/description |
| `is_open` | BooleanField | Whether leg is still open |
| `ticker` | CharField(20) | Stock ticker symbol |
| `entry_date` | DateField | Entry date |
| `exit_date` | DateField (null) | Exit date |
| `entry_price` | DecimalField | Entry price |
| `exit_price` | DecimalField (null) | Exit price |
| `quantity` | IntegerField | Quantity (negative for shorts) |
| `created_at` | DateTimeField | Created timestamp |
| `updated_at` | DateTimeField | Updated timestamp |

## 🎨 Design System

### Color Palette

| Usage | Color | Hex |
|-------|-------|-----|
| Primary | Deep Indigo | `#1a237e` |
| Secondary | Teal | `#00796b` |
| Success | Forest Green | `#2e7d32` |
| Error | Deep Red | `#c62828` |
| Background | Off-white | `#fafafa` |

### Typography

- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

## 🧪 Development

### Running Tests

```bash
# Backend tests
cd backend
python manage.py test

# Frontend lint
cd frontend
npm run lint
```

### Building for Production

```bash
# Frontend build
cd frontend
npm run build

# Backend - collect static files
cd backend
python manage.py collectstatic
```

## 📝 Environment Variables

### Backend (.env)

```env
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=aurumiq
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend

Create a `.env` file in frontend directory if you need custom API URL:

```env
VITE_API_URL=http://localhost:8000/api
```

## 🔒 Security Notes

- Change `DJANGO_SECRET_KEY` in production
- Set `DEBUG=False` in production
- Configure proper `ALLOWED_HOSTS`
- Use environment variables for sensitive data
- Enable HTTPS in production

## 📈 Future Enhancements

- [ ] User authentication & multi-user support
- [ ] Advanced analytics (drawdown, win rate, expectancy)
- [ ] Real-time market data integration
- [ ] Trade journal with notes
- [ ] Export to CSV/PDF
- [ ] Dark mode theme

---

Built with ❤️ for traders who demand professional-grade tools.
