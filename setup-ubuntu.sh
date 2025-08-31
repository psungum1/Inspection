#!/bin/bash

echo "=== PQMS Ubuntu Desktop 24 Setup Script ==="
echo "This script will set up your Ubuntu Desktop 24 for PQMS deployment"
echo ""

# Update system
echo "1. Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
echo "2. Installing Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
echo "3. Installing PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Nginx
echo "4. Installing Nginx..."
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2
echo "5. Installing PM2..."
sudo npm install -g pm2

# Create database and user
echo "6. Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE pqms_db;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER pqms_a WITH PASSWORD 'Kumair00P@ssw0rd';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pqms_db TO pqms_a;" 2>/dev/null || echo "Privileges already granted"
sudo -u postgres psql -c "ALTER USER pqms_a CREATEDB;" 2>/dev/null || echo "User already has CREATEDB"

# Create application directory
echo "7. Creating application directory..."
sudo mkdir -p /var/www/pqms
sudo chown $USER:$USER /var/www/pqms

# Create log directory
echo "8. Creating log directory..."
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Create backup directory
echo "9. Creating backup directory..."
sudo mkdir -p /var/backups/pqms
sudo chown $USER:$USER /var/backups/pqms

# Setup firewall
echo "10. Setting up firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Install Certbot for SSL
echo "11. Installing Certbot..."
sudo apt install certbot python3-certbot-nginx -y

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Copy your project files to /var/www/pqms"
echo "2. Run: cd /var/www/pqms && npm install"
echo "3. Run: npm run build"
echo "4. Run: cd server && npm install"
echo "5. Copy server/env.example to server/.env and configure it"
echo "6. Run: npm run db:migrate && npm run db:seed"
echo "7. Run: pm2 start ecosystem.config.js"
echo "8. Copy nginx-pqms.conf to /etc/nginx/sites-available/pqms"
echo "9. Run: sudo ln -s /etc/nginx/sites-available/pqms /etc/nginx/sites-enabled/"
echo "10. Run: sudo nginx -t && sudo systemctl restart nginx"
echo ""
echo "For SSL certificate:"
echo "sudo certbot --nginx -d your-domain.com"
echo ""
echo "Check status with:"
echo "pm2 status"
echo "sudo systemctl status nginx"
echo "sudo systemctl status postgresql" 