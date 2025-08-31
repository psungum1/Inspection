# Database Management Guide สำหรับ PQMS

## ภาพรวม

ระบบ PQMS ใช้ PostgreSQL เป็นฐานข้อมูลหลัก โดยมีโครงสร้างตารางที่ออกแบบมาเพื่อรองรับการจัดการคุณภาพการผลิต

## การติดตั้งและตั้งค่า

### 1. ติดตั้ง PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# เริ่มต้น service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. สร้าง Database และ User

```bash
# เข้าไปใน PostgreSQL
sudo -u postgres psql

# สร้าง database
CREATE DATABASE pqms_db;

# สร้าง user
CREATE USER pqms_a WITH PASSWORD 'Kumair00P@ssw0rd';

# ให้สิทธิ์
GRANT ALL PRIVILEGES ON DATABASE pqms_db TO pqms_a;
ALTER USER pqms_a CREATEDB;

# ออกจาก PostgreSQL
\q
```

## การ Restore Database

### วิธีที่ 1: Restore ใหม่ (Fresh Install)

```bash
# ทำให้ script executable
chmod +x restore-database.sh

# รัน script
./restore-database.sh
```

### วิธีที่ 2: Restore จาก Backup

```bash
# ทำให้ script executable
chmod +x restore-from-backup.sh

# รัน script พร้อมระบุไฟล์ backup
./restore-from-backup.sh /path/to/backup.sql
```

### วิธีที่ 3: Manual Restore

```bash
# 1. สร้าง database ใหม่
dropdb -h localhost -p 5432 -U pqms_a pqms_db
createdb -h localhost -p 5432 -U pqms_a pqms_db

# 2. รัน migration
cd server
npm run db:migrate

# 3. รัน seed data
npm run db:seed
```

## การตรวจสอบสถานะ Database

```bash
# ทำให้ script executable
chmod +x check-database.sh

# รัน script
./check-database.sh
```

## โครงสร้าง Database

### ตารางหลัก

1. **users** - ข้อมูลผู้ใช้ระบบ
2. **test_parameters** - พารามิเตอร์การทดสอบ
3. **production_orders** - คำสั่งการผลิต
4. **test_results** - ผลการทดสอบ
5. **dashboard_metrics** - ข้อมูล dashboard
6. **plc_orders** - ข้อมูลจาก PLC
7. **product_parameters** - พารามิเตอร์ผลิตภัณฑ์
8. **material_inputs** - ข้อมูลวัตถุดิบ

### ข้อมูลเริ่มต้น

ระบบจะสร้างข้อมูลเริ่มต้นดังนี้:

#### ผู้ใช้ระบบ
- **Quality Manager**: sarah.johnson@company.com (password: password123)
- **Operator**: john.smith@company.com (password: password123)
- **Admin**: admin@company.com (password: admin123)

#### พารามิเตอร์การทดสอบ
- Moisture Content (10.0-15.0%)
- pH Level (5.0-8.0)
- Viscosity (500-1000 cP)
- Density (1.0-1.5 g/cm³)

## การ Backup Database

### วิธีที่ 1: ใช้ Backup Script

```bash
# ทำให้ script executable
chmod +x backup.sh

# รัน backup
./backup.sh
```

### วิธีที่ 2: Manual Backup

```bash
# Backup database
pg_dump -h localhost -U pqms_a pqms_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup แบบ compressed
pg_dump -h localhost -U pqms_a pqms_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

## การตั้งค่า Auto Backup

```bash
# ตั้งค่า cron job สำหรับ backup ทุกวันเวลา 02:00
crontab -e

# เพิ่มบรรทัดนี้
0 2 * * * /path/to/pqms/backup.sh
```

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Connection Refused**
   ```bash
   # ตรวจสอบ PostgreSQL service
   sudo systemctl status postgresql
   
   # เริ่มต้น service
   sudo systemctl start postgresql
   ```

2. **Permission Denied**
   ```bash
   # ตรวจสอบสิทธิ์ user
   sudo -u postgres psql -c "\du"
   
   # ให้สิทธิ์ใหม่
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pqms_db TO pqms_a;"
   ```

3. **Database Not Found**
   ```bash
   # สร้าง database ใหม่
   createdb -h localhost -p 5432 -U pqms_a pqms_db
   ```

### การตรวจสอบ Logs

```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Application logs (ถ้าใช้ PM2)
pm2 logs pqms-backend
```

## คำสั่งที่มีประโยชน์

### การจัดการ Database

```bash
# เข้าไปใน PostgreSQL
psql -h localhost -p 5432 -U pqms_a -d pqms_db

# ดูรายการ database
psql -h localhost -p 5432 -U pqms_a -l

# ดูรายการตาราง
psql -h localhost -p 5432 -U pqms_a -d pqms_db -c "\dt"

# ดูโครงสร้างตาราง
psql -h localhost -p 5432 -U pqms_a -d pqms_db -c "\d table_name"
```

### การจัดการ User

```bash
# สร้าง user ใหม่
sudo -u postgres psql -c "CREATE USER new_user WITH PASSWORD 'password';"

# เปลี่ยน password
sudo -u postgres psql -c "ALTER USER pqms_a WITH PASSWORD 'new_password';"

# ลบ user
sudo -u postgres psql -c "DROP USER username;"
```

## การ Migration และ Seed

### รัน Migration

```bash
cd server
npm run db:migrate
```

### รัน Seed Data

```bash
cd server
npm run db:seed
```

### Reset Database

```bash
cd server
npm run db:reset
```

## การตั้งค่า Environment

ตรวจสอบไฟล์ `.env` ในโฟลเดอร์ `server/`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pqms_db
DB_USER=pqms_a
DB_PASSWORD=Kumair00P@ssw0rd
```

## การ Monitor Performance

```bash
# ดูการใช้งาน database
psql -h localhost -p 5432 -U pqms_a -d pqms_db -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;
"
```

## การตั้งค่า Replication (ถ้าจำเป็น)

สำหรับ production environment ที่ต้องการ high availability:

```bash
# ตั้งค่า streaming replication
# ดู PostgreSQL documentation สำหรับรายละเอียด
```

## หมายเหตุสำคัญ

1. **Backup**: ทำ backup อย่างสม่ำเสมอ
2. **Security**: เปลี่ยน password เริ่มต้น
3. **Monitoring**: ตั้งค่า monitoring สำหรับ database performance
4. **Updates**: อัพเดท PostgreSQL เป็นประจำ
5. **Testing**: ทดสอบ backup และ restore process 