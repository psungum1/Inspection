# 🚀 Ubuntu Desktop 24 Deployment Guide

## Overview
This guide will help you deploy your Inspection System to Ubuntu Desktop 24 using Git. The system includes a React frontend and Node.js backend with PostgreSQL database.

## 📋 Prerequisites
- Ubuntu Desktop 24 (or Ubuntu Server 24.04 LTS)
- User account with sudo privileges
- Internet connection
- GitHub repository access

## 🛠️ Step 1: System Setup

### Option A: Automated Setup (Recommended)
```bash
# Download the setup script
wget https://raw.githubusercontent.com/psungum1/Inspection/master/setup-ubuntu-24.sh

# Make it executable
chmod +x setup-ubuntu-24.sh

# Run the setup script
./setup-ubuntu-24.sh
```

### Option B: Manual Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

## 🗄️ Step 2: Database Setup
```bash
# Create database and user
sudo -u postgres psql -c "CREATE DATABASE pqms_db;"
sudo -u postgres psql -c "CREATE USER pqms_a WITH PASSWORD 'Kumair00P@ssw0rd';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pqms_db TO pqms_a;"
sudo -u postgres psql -c "ALTER USER pqms_a CREATEDB;"
```

## 📥 Step 3: Clone Repository
```bash
# Create project directory
sudo mkdir -p /var/www/inspection
sudo chown $USER:$USER /var/www/inspection

# Clone your repository
cd /var/www/inspection
git clone https://github.com/psungum1/Inspection.git .
```

## 🚀 Step 4: Deploy Application

### Option A: Automated Deployment (Recommended)
```bash
# Download the deployment script
wget https://raw.githubusercontent.com/psungum1/Inspection/master/deploy-ubuntu.sh

# Make it executable
chmod +x deploy-ubuntu.sh

# Run the deployment script
./deploy-ubuntu.sh
```

### Option B: Manual Deployment
```bash
# Install frontend dependencies
npm install

# Build frontend
npm run build

# Install backend dependencies
cd server
npm install
cd ..

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Step 5: Configure Nginx
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/inspection > /dev/null <<EOF
server {
    listen 80;
    server_name localhost;
    
    # Frontend static files
    location / {
        root /var/www/inspection/dist;
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/inspection /etc/nginx/sites-enabled/

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Step 6: Environment Configuration
```bash
# Copy environment example
cp server/env.example server/.env

# Edit environment file
nano server/.env
```

Update the `.env` file with your database credentials:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pqms_db
DB_USER=pqms_a
DB_PASSWORD=Kumair00P@ssw0rd

# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1h
```

## ✅ Step 7: Verify Deployment
```bash
# Check PM2 status
pm2 list

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql

# View application logs
pm2 logs pqms-backend
```

## 🌐 Access Your Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost/ws

## 📝 Useful Commands

### PM2 Process Management
```bash
# View all processes
pm2 list

# Monitor processes
pm2 monit

# View logs
pm2 logs pqms-backend

# Restart process
pm2 restart pqms-backend

# Stop process
pm2 stop pqms-backend
```

### Nginx Management
```bash
# Check status
sudo systemctl status nginx

# Reload configuration
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Database Management
```bash
# Connect to database
psql -h localhost -U pqms_a -d pqms_db

# Check database status
sudo systemctl status postgresql
```

## 🔄 Updating Your Application
```bash
# Navigate to project directory
cd /var/www/inspection

# Pull latest changes
git pull origin master

# Run deployment script
./deploy-ubuntu.sh
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using port 3001
sudo netstat -tlnp | grep :3001

# Kill the process if needed
sudo kill -9 <PID>
```

#### 2. Permission Denied
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/inspection
sudo chown -R $USER:$USER /var/log/pm2
```

#### 3. Nginx Configuration Error
```bash
# Test configuration
sudo nginx -t

# Check syntax
sudo nginx -T
```

#### 4. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
sudo -u postgres psql -c "\l"
```

### Log Locations
- **PM2 Logs**: `/var/log/pm2/`
- **Nginx Logs**: `/var/log/nginx/`
- **PostgreSQL Logs**: `/var/log/postgresql/`

## 🔒 Security Considerations
- Change default database passwords
- Configure firewall rules
- Use HTTPS in production
- Regular security updates
- Monitor system logs

## 📞 Support
If you encounter issues:
1. Check the logs: `pm2 logs pqms-backend`
2. Verify service status: `sudo systemctl status <service>`
3. Check GitHub issues: [https://github.com/psungum1/Inspection/issues](https://github.com/psungum1/Inspection/issues)

---

**🎉 Congratulations!** Your Inspection System is now deployed on Ubuntu Desktop 24!
