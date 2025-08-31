# Production Quality Management System - Backend

This is the backend server for the Production Quality Management System, built with Node.js, Express, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### 1. Install PostgreSQL

#### Windows
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. Add PostgreSQL to your system PATH

#### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Or using the official installer
# Download from postgresql.org
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Setup Database

1. **Connect to PostgreSQL:**
   ```bash
   # Windows/Linux
   sudo -u postgres psql
   
   # macOS (if installed via Homebrew)
   psql postgres
   ```

2. **Create Database and User:**
   ```sql
   -- Create database
   CREATE DATABASE pqms_db;
   
   -- Create user
   CREATE USER pqms_user WITH PASSWORD 'your_secure_password';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE pqms_db TO pqms_user;
   
   -- Connect to the database
   \c pqms_db
   
   -- Grant schema privileges
   GRANT ALL ON SCHEMA public TO pqms_user;
   
   -- Exit
   \q
   ```

### 3. Setup Backend

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   # Copy the example file
   cp env.example .env
   
   # Edit the file with your database credentials
   nano .env
   ```

4. **Update `.env` file:**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=pqms_db
   DB_USER=pqms_user
   DB_PASSWORD=your_secure_password
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=24h
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

### 4. Run Database Migrations

```bash
# Create tables
npm run db:migrate

# Seed with initial data
npm run db:seed
```

### 5. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## 📊 Database Schema

### Tables

1. **users** - User authentication and roles
2. **test_parameters** - Quality test parameters and thresholds
3. **production_orders** - Production orders and status
4. **test_results** - Individual test results
5. **dashboard_metrics** - Aggregated dashboard data

### Key Features

- **Foreign Key Constraints** - Maintains data integrity
- **Indexes** - Optimized for performance
- **Triggers** - Automatic timestamp updates
- **Check Constraints** - Data validation

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/register` - Register new user

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/recent-activity` - Get recent activity
- `GET /api/dashboard/production-chart` - Get production chart data
- `GET /api/dashboard/trend/:lineNumber/:parameterId` - Get trend data

### Health Check
- `GET /health` - Server and database health status

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt for password security
- **CORS Protection** - Cross-origin request control
- **Rate Limiting** - Prevent abuse
- **Helmet** - Security headers
- **Input Validation** - Request validation

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm start           # Start production server
npm run db:migrate  # Run database migrations
npm run db:seed     # Seed database with sample data
npm run db:reset    # Reset database (drop and recreate)
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `pqms_db` |
| `DB_USER` | Database user | `pqms_user` |
| `DB_PASSWORD` | Database password | - |
| `PORT` | Server port | `3001` |
| `JWT_SECRET` | JWT signing secret | - |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

## 📝 Sample Data

The seed script creates:

- **3 Users** (Admin, Quality Manager, Operator)
- **4 Test Parameters** (Moisture, pH, Viscosity, Density)
- **5 Production Orders** (3 active, 2 completed)
- **14 Test Results** (various statuses)
- **Dashboard Metrics** (initial values)

### Demo Credentials

- **Admin:** `admin@company.com` / `admin123`
- **Quality Manager:** `sarah.johnson@company.com` / `password123`
- **Operator:** `john.smith@company.com` / `password123`

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database and user exist

2. **Port Already in Use**
   - Change `PORT` in `.env`
   - Or kill process using port 3001

3. **Migration Errors**
   - Drop and recreate database
   - Check PostgreSQL version compatibility

### Logs

Check server logs for detailed error information:
```bash
npm run dev
```

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/docs/) 