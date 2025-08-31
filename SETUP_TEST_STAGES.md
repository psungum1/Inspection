# การติดตั้ง Test Stages Feature

## ขั้นตอนการติดตั้ง

### 1. รัน Database Migration
```bash
cd server
chmod +x run-migration.sh
./run-migration.sh
```

หรือรันทีละขั้นตอน:
```bash
cd server
node src/database/migrate.js
node src/database/seed.js
```

### 2. ตรวจสอบการติดตั้ง

#### ตรวจสอบตาราง test_stages
```sql
SELECT * FROM test_stages ORDER BY "order";
```

ควรเห็นข้อมูล:
- Slurry (Initial slurry preparation stage)
- Reaction (Main reaction process stage)  
- End Reaction (Final reaction completion stage)

#### ตรวจสอบคอลัมน์ stage ในตาราง test_results
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'test_results' AND column_name = 'stage';
```

### 3. ตรวจสอบ API Endpoints

#### GET /api/test-stages
```bash
curl http://localhost:3001/api/test-stages
```

#### POST /api/test-stages
```bash
curl -X POST http://localhost:3001/api/test-stages \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Stage",
    "description": "Test stage description",
    "order": 4
  }'
```

### 4. ตรวจสอบ Frontend

#### ตรวจสอบ Settings > Test Stages
1. ไปที่หน้า Settings
2. คลิกที่ tab "Test Stages"
3. ควรเห็นหน้า Test Stage Management

#### ตรวจสอบ Test Entry
1. ไปที่หน้า Test Entry
2. เลือก order
3. ควรเห็น dropdown "Stage:" พร้อมตัวเลือก Slurry, Reaction, End Reaction

## การแก้ไขปัญหา

### ปัญหา: Stage ไม่แสดงข้อมูล
**สาเหตุ:** ยังไม่ได้รัน migration หรือ seed
**วิธีแก้:** รัน `./run-migration.sh` อีกครั้ง

### ปัญหา: หน้า Settings ไม่มี Test Stages tab
**สาเหตุ:** Component ไม่ได้ถูก import หรือมี error
**วิธีแก้:** ตรวจสอบ console error และตรวจสอบ import ใน Settings.tsx

### ปัญหา: API error
**สาเหตุ:** Database connection หรือ table ไม่ถูกต้อง
**วิธีแก้:** ตรวจสอบ database connection และรัน migration อีกครั้ง

## การทดสอบ

### 1. สร้าง Stage ใหม่
1. ไปที่ Settings > Test Stages
2. กรอกข้อมูล Stage Name, Description, Order
3. คลิก "Create Stage"
4. ตรวจสอบว่า stage ใหม่ปรากฏในรายการ

### 2. แก้ไข Stage
1. คลิก "Edit" ที่ stage ที่ต้องการแก้ไข
2. แก้ไขข้อมูล
3. คลิก "Save"
4. ตรวจสอบว่าข้อมูลถูกอัปเดต

### 3. ลบ Stage
1. คลิก "Delete" ที่ stage ที่ต้องการลบ
2. ยืนยันการลบ
3. ตรวจสอบว่า stage หายไปจากรายการ

### 4. ทดสอบใน Test Entry
1. ไปที่ Test Entry
2. เลือก order และ stage
3. ใส่ข้อมูลการทดสอบ
4. บันทึกและตรวจสอบว่า stage ถูกบันทึก

## โครงสร้างฐานข้อมูล

### ตาราง test_stages
```sql
CREATE TABLE test_stages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ตาราง test_results (อัปเดต)
```sql
ALTER TABLE test_results ADD COLUMN stage VARCHAR(100);
```

## การใช้งาน

### สำหรับ Admin
- จัดการ test stages ใน Settings > Test Stages
- สร้าง, แก้ไข, ลบ stages
- จัดลำดับการแสดงผล

### สำหรับ Operator
- เลือก stage เมื่อทำการทดสอบ
- ข้อมูล stage จะถูกบันทึกพร้อมกับ test result
- สามารถดูประวัติการทดสอบตาม stage

## การบำรุงรักษา

### การสำรองข้อมูล
```bash
pg_dump -h localhost -U username -d database_name > backup.sql
```

### การกู้คืนข้อมูล
```bash
psql -h localhost -U username -d database_name < backup.sql
```

### การอัปเดต
1. รัน migration ใหม่
2. ตรวจสอบการเปลี่ยนแปลง
3. ทดสอบระบบ
