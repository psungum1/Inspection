# Deployment Guide สำหรับ Ubuntu Desktop 24

## 1. การเตรียม Server Ubuntu Desktop 24

### 1.1 อัพเดทระบบ
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 ติดตั้ง Node.js และ npm
```bash
# ติดตั้ง Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# ตรวจสอบเวอร์ชัน
node --version
npm --version
```

### 1.3 ติดตั้ง PostgreSQL
```bash
# ติดตั้ง PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# เริ่มต้น service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# สร้าง database และ user
sudo -u postgres psql -c "CREATE DATABASE pqms_db;"
sudo -u postgres psql -c "CREATE USER pqms_a WITH PASSWORD 'Kumair00P@ssw0rd';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pqms_db TO pqms_a;"
sudo -u postgres psql -c "ALTER USER pqms_a CREATEDB;"
```

### 1.4 ติดตั้ง Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.5 ติดตั้ง PM2 สำหรับ Process Management
```bash
sudo npm install -g pm2
```

## 2. การ Deploy โปรเจค

### 2.1 Clone โปรเจค
```bash
# สร้าง directory สำหรับโปรเจค
sudo mkdir -p /var/www/pqms
sudo chown $USER:$USER /var/www/pqms

# Clone โปรเจค (แทนที่ด้วย URL ของ repository ของคุณ)
git clone <your-repository-url> /var/www/pqms
cd /var/www/pqms
```

### 2.2 ติดตั้ง Dependencies และ Build Frontend
```bash
# ติดตั้ง frontend dependencies
npm install

# Build frontend
npm run build
```

### 2.3 ติดตั้ง Backend Dependencies
```bash
cd server
npm install
```

### 2.4 สร้าง Environment File
```bash
# สร้าง .env file สำหรับ backend
cp env.example .env
nano .env
```

แก้ไข `.env` file:
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

# CORS Configuration
CORS_ORIGIN=http://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# SQL Server config (ถ้าจำเป็น)
SQLSERVER_USER=your_user
SQLSERVER_PASSWORD=your_password
SQLSERVER_HOST=localhost
SQLSERVER_DB=your_db
SQLSERVER_PORT=1433
```

### 2.5 รัน Database Migration
```bash
npm run db:migrate
npm run db:seed
```

## 3. การตั้งค่า PM2

### 3.1 สร้าง PM2 Ecosystem File
```bash
cd /var/www/pqms
nano ecosystem.config.js
```

เพิ่มเนื้อหาต่อไปนี้:
```javascript
module.exports = {
  apps: [
    {
      name: 'pqms-backend',
      cwd: '/var/www/pqms/server',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/pqms-backend-error.log',
      out_file: '/var/log/pm2/pqms-backend-out.log',
      log_file: '/var/log/pm2/pqms-backend-combined.log',
      time: true
    }
  ]
};
```

### 3.2 สร้าง Log Directory
```bash
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2
```

### 3.3 เริ่มต้น PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 4. การตั้งค่า Nginx

### 4.1 สร้าง Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/pqms
```

เพิ่มเนื้อหาต่อไปนี้:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend static files
    location / {
        root /var/www/pqms/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 4.2 Enable Site และ Restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/pqms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. การตั้งค่า Firewall

```bash
# เปิด port ที่จำเป็น
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 6. การตั้งค่า SSL (Let's Encrypt)

### 6.1 ติดตั้ง Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 ขอ SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 7. การตั้งค่า Auto-deployment Script

### 7.1 สร้าง Deployment Script
```bash
nano /var/www/pqms/deploy.sh
```

เพิ่มเนื้อหาต่อไปนี้:
```bash
#!/bin/bash

echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Install frontend dependencies
npm install

# Build frontend
npm run build

# Install backend dependencies
cd server
npm install
cd ..

# Restart PM2
pm2 restart pqms-backend

# Reload Nginx
sudo systemctl reload nginx

echo "Deployment completed!"
```

### 7.2 ทำให้ Script Executable
```bash
chmod +x /var/www/pqms/deploy.sh
```

## 8. การตั้งค่า Backup

### 8.1 สร้าง Backup Script
```bash
nano /var/www/pqms/backup.sh
```

เพิ่มเนื้อหาต่อไปนี้:
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/pqms"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h localhost -U pqms_a pqms_db > $BACKUP_DIR/db_backup_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /var/www/pqms

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 8.2 ตั้งค่า Cron Job สำหรับ Auto Backup
```bash
chmod +x /var/www/pqms/backup.sh
crontab -e
```

เพิ่มบรรทัดนี้:
```
0 2 * * * /var/www/pqms/backup.sh
```

## 9. การตรวจสอบและ Monitoring

### 9.1 ตรวจสอบ Status
```bash
# ตรวจสอบ PM2
pm2 status
pm2 logs pqms-backend

# ตรวจสอบ Nginx
sudo systemctl status nginx

# ตรวจสอบ PostgreSQL
sudo systemctl status postgresql

# ตรวจสอบ Application
curl http://localhost:3001/health
```

### 9.2 ตั้งค่า Log Rotation
```bash
sudo nano /etc/logrotate.d/pqms
```

เพิ่มเนื้อหาต่อไปนี้:
```
/var/log/pm2/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

## 10. การแก้ไขปัญหา (Troubleshooting)

### 10.1 ตรวจสอบ Logs
```bash
# PM2 logs
pm2 logs pqms-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### 10.2 ตรวจสอบ Ports
```bash
sudo netstat -tlnp | grep :3001
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### 10.3 ตรวจสอบ Permissions
```bash
sudo chown -R $USER:$USER /var/www/pqms
sudo chmod -R 755 /var/www/pqms
```

## 11. การอัพเดท Application

เมื่อต้องการอัพเดท application:
```bash
cd /var/www/pqms
./deploy.sh
```

## หมายเหตุสำคัญ

1. **เปลี่ยน Domain**: แทนที่ `your-domain.com` ด้วย domain จริงของคุณ
2. **Security**: เปลี่ยน JWT_SECRET และ database password ให้ปลอดภัย
3. **Monitoring**: ตั้งค่า monitoring tools เช่น UptimeRobot สำหรับตรวจสอบ uptime
4. **Backup**: ทดสอบ backup และ restore process
5. **SSL**: ตั้งค่า auto-renewal สำหรับ SSL certificate

## คำสั่งที่ใช้บ่อย

```bash
# Restart application
pm2 restart pqms-backend

# View logs
pm2 logs pqms-backend

# Update application
cd /var/www/pqms && ./deploy.sh

# Check status
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
``` 