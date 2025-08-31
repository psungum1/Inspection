# Multi-Stage Round System

## ภาพรวม

ระบบ Multi-Stage Round System เป็นการปรับปรุงระบบการทดสอบให้สามารถจัดการ stage และ round ได้อย่างยืดหยุ่น โดยแต่ละ stage สามารถมีได้หลายรอบ เช่น:

- **Slurry Round 1**, **Slurry Round 2**
- **Reaction Round 1**, **Reaction Round 2**  
- **Bleaching Round 1**, **Bleaching Round 2**

## คุณสมบัติใหม่

### 1. การจัดการ Stage และ Round แยกกัน
- **Stage Selection**: ผู้ใช้สามารถเลือก stage ที่ต้องการทดสอบ
- **Round Management**: แต่ละ stage สามารถมีได้หลายรอบ
- **Independent Progress**: ความคืบหน้าของแต่ละ stage และ round แยกกัน

### 2. UI ที่ปรับปรุงใหม่
- **Stage Overview**: แสดงภาพรวมของทุก stage พร้อมความคืบหน้า
- **Round Progress**: แสดงความคืบหน้าของแต่ละ round ใน stage ที่เลือก
- **Interactive Stage Selection**: คลิกที่ stage เพื่อเปลี่ยน stage ปัจจุบัน

### 3. การแสดงผลที่ชัดเจน
- **Current Stage Indicator**: แสดง stage และ round ปัจจุบัน
- **Progress Bars**: แสดงความคืบหน้าของแต่ละ stage
- **Status Summary**: สรุปสถานะของแต่ละ stage และ round

## การใช้งาน

### สำหรับ Operator

#### 1. เลือก Stage และ Round
```
Stage: [Slurry ▼]  Round: [Round 1 ▼]
```

#### 2. เริ่ม Round ใหม่
- คลิกปุ่ม "Start New Round" เพื่อเริ่ม round ใหม่ใน stage ปัจจุบัน
- ระบบจะสร้าง round ใหม่โดยอัตโนมัติ

#### 3. เปลี่ยน Stage
- คลิกที่ stage ในส่วน "All Stages Progress" เพื่อเปลี่ยน stage
- แต่ละ stage จะมี round แยกกัน

### สำหรับ Admin

#### 1. จัดการ Test Stages
- ไปที่ Settings > Test Stages
- สร้าง, แก้ไข, ลบ stages
- จัดลำดับการแสดงผล

#### 2. ดูความคืบหน้า
- ดูความคืบหน้าของแต่ละ stage
- ติดตามจำนวน round ในแต่ละ stage
- วิเคราะห์ประสิทธิภาพของแต่ละ stage

## ตัวอย่างการใช้งาน

### ตัวอย่างที่ 1: Slurry Stage
```
Slurry Round 1: 6/6 parameters completed ✓
Slurry Round 2: 3/6 parameters completed (in progress)
Slurry Round 3: New round available
```

### ตัวอย่างที่ 2: Reaction Stage
```
Reaction Round 1: 6/6 parameters completed ✓
Reaction Round 2: 0/6 parameters completed (not started)
```

### ตัวอย่างที่ 3: Bleaching Stage
```
Bleaching Round 1: 4/6 parameters completed (in progress)
```

## ข้อดีของระบบใหม่

### 1. ความยืดหยุ่น
- แต่ละ stage สามารถมีได้หลายรอบตามความต้องการ
- ไม่จำเป็นต้องทำทุก stage ในลำดับเดียวกัน

### 2. การติดตามที่ดีขึ้น
- เห็นความคืบหน้าของแต่ละ stage แยกกัน
- ติดตามจำนวน round ในแต่ละ stage

### 3. การจัดการข้อมูลที่ดีขึ้น
- ข้อมูลถูกจัดกลุ่มตาม stage และ round
- ง่ายต่อการวิเคราะห์และรายงาน

### 4. ประสบการณ์ผู้ใช้ที่ดีขึ้น
- UI ที่ชัดเจนและใช้งานง่าย
- การนำทางระหว่าง stage และ round ที่สะดวก

## การเปลี่ยนแปลงในฐานข้อมูล

### ตาราง test_results
```sql
CREATE TABLE test_results (
  id VARCHAR(50) PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL,
  parameter_id VARCHAR(50) NOT NULL,
  round INTEGER NOT NULL,
  stage VARCHAR(100),  -- เพิ่มคอลัมน์ stage
  value DECIMAL(10,3) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  operator_id VARCHAR(50) NOT NULL,
  comments TEXT,
  attachments TEXT[],
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

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

## การอัปเดตระบบ

### 1. รัน Database Migration
```bash
cd server
node src/database/migrate.js
```

### 2. รัน Seed Data
```bash
cd server
node src/database/seed.js
```

### 3. ตรวจสอบการติดตั้ง
- ตรวจสอบว่าตาราง test_stages ถูกสร้าง
- ตรวจสอบว่าคอลัมน์ stage ใน test_results ถูกเพิ่ม
- ตรวจสอบว่า default stages ถูกสร้าง

## การแก้ไขปัญหา

### ปัญหา: Stage ไม่แสดง
**สาเหตุ:** ยังไม่ได้รัน migration หรือ seed
**วิธีแก้:** รัน migration และ seed ตามขั้นตอนข้างต้น

### ปัญหา: Round ไม่ถูกต้อง
**สาเหตุ:** การคำนวณ round ผิดพลาด
**วิธีแก้:** ตรวจสอบฟังก์ชัน getAvailableRounds และ getNextRound

### ปัญหา: ข้อมูลไม่แสดงใน TestHistory
**สาเหตุ:** การจัดกลุ่มข้อมูลผิดพลาด
**วิธีแก้:** ตรวจสอบฟังก์ชัน resultsByStageAndRound

## การพัฒนาต่อ

### 1. Stage-specific Parameters
- แต่ละ stage อาจมี parameter ที่แตกต่างกัน
- กำหนด parameter ที่จำเป็นสำหรับแต่ละ stage

### 2. Stage Workflow
- กำหนดลำดับการทำงานระหว่าง stage
- การตรวจสอบความสมบูรณ์ของ stage ก่อน

### 3. Stage Analytics
- วิเคราะห์ประสิทธิภาพของแต่ละ stage
- รายงานความคืบหน้าของแต่ละ stage

### 4. Stage Notifications
- แจ้งเตือนเมื่อ stage ใดเสร็จสิ้น
- แจ้งเตือนเมื่อมีปัญหาใน stage ใด

## สรุป

ระบบ Multi-Stage Round System ใหม่นี้ให้ความยืดหยุ่นในการจัดการการทดสอบ โดยแต่ละ stage สามารถมีได้หลายรอบตามความต้องการ ทำให้ระบบสามารถรองรับกระบวนการผลิตที่ซับซ้อนได้ดีขึ้น และให้ข้อมูลที่ชัดเจนสำหรับการติดตามและวิเคราะห์



