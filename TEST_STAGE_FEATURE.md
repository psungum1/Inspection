# Test Stage Feature

## Overview
Test Stage Feature เป็นระบบที่เพิ่มความสามารถในการจัดการขั้นตอนการทดสอบ (Test Stages) สำหรับการควบคุมคุณภาพ โดยแต่ละ Test Round จะมี Stage ที่ชัดเจน เช่น Slurry, Reaction, End Reaction

## Features

### 1. Test Stage Management
- **เพิ่ม Stage ใหม่**: สามารถสร้าง stage ใหม่พร้อมคำอธิบายและลำดับ
- **แก้ไข Stage**: แก้ไขชื่อ, คำอธิบาย, ลำดับ และสถานะการใช้งาน
- **ลบ Stage**: ลบ stage ที่ไม่ได้ใช้งานแล้ว (ต้องไม่มี test results ที่ใช้ stage นั้น)
- **จัดการลำดับ**: จัดลำดับการแสดงผลของ stage

### 2. Default Stages
ระบบมาพร้อมกับ stage เริ่มต้น 3 ตัว:
- **Slurry**: ขั้นตอนการเตรียม slurry เริ่มต้น
- **Reaction**: ขั้นตอนการทำปฏิกิริยาหลัก
- **End Reaction**: ขั้นตอนการเสร็จสิ้นปฏิกิริยา

### 3. Integration with Test Entry
- **Stage Selection**: ผู้ใช้สามารถเลือก stage ที่ต้องการทดสอบ
- **Round + Stage**: แต่ละ test round จะมี stage ที่ชัดเจน
- **Data Storage**: ข้อมูล stage จะถูกบันทึกพร้อมกับ test result

## Database Schema

### test_stages Table
```sql
CREATE TABLE test_stages (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL UNIQUE,
  description NVARCHAR(500),
  [order] INT NOT NULL DEFAULT 1,
  is_active BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);
```

### Updated test_results Table
```sql
-- เพิ่มคอลัมน์ stage ในตาราง test_results
ALTER TABLE test_results ADD stage NVARCHAR(100);
```

## API Endpoints

### GET /api/test-stages
ดึงรายการ test stages ทั้งหมด

### POST /api/test-stages
สร้าง test stage ใหม่
```json
{
  "name": "Stage Name",
  "description": "Stage Description",
  "order": 1
}
```

### PUT /api/test-stages/:id
อัปเดต test stage
```json
{
  "name": "Updated Name",
  "description": "Updated Description",
  "order": 2,
  "isActive": true
}
```

### DELETE /api/test-stages/:id
ลบ test stage (เฉพาะที่ไม่ได้ใช้งาน)

## Frontend Components

### 1. TestStageManager
หน้า admin สำหรับจัดการ test stages ตั้งอยู่ใน Settings > Test Stages

### 2. TestEntry Component
- เพิ่ม dropdown สำหรับเลือก stage
- แสดง stage ปัจจุบันในส่วน test round
- ส่ง stage ไปยัง TestForm

### 3. TestForm Component
- แสดง stage ปัจจุบันในส่วน header
- ส่ง stage ไปพร้อมกับ test result

## Usage

### สำหรับ Admin
1. ไปที่ Settings > Test Stages
2. สร้าง stage ใหม่หรือแก้ไข stage ที่มีอยู่
3. จัดลำดับการแสดงผลของ stage
4. เปิด/ปิดการใช้งาน stage

### สำหรับ Operator
1. เลือก order ที่ต้องการทดสอบ
2. เลือก stage ที่เหมาะสม (Slurry, Reaction, End Reaction)
3. เลือก round ที่ต้องการทดสอบ
4. ใส่ข้อมูลการทดสอบและบันทึก

## Benefits

1. **Process Clarity**: ทำให้เห็นขั้นตอนการทดสอบที่ชัดเจน
2. **Quality Control**: ควบคุมคุณภาพในแต่ละขั้นตอน
3. **Data Organization**: จัดระเบียบข้อมูลการทดสอบตาม stage
4. **Flexibility**: สามารถปรับแต่ง stage ตามความต้องการของกระบวนการผลิต

## Future Enhancements

1. **Stage-specific Parameters**: แต่ละ stage อาจมี parameter ที่แตกต่างกัน
2. **Stage Workflow**: กำหนดลำดับการทำงานระหว่าง stage
3. **Stage Analytics**: วิเคราะห์ประสิทธิภาพของแต่ละ stage
4. **Stage Notifications**: แจ้งเตือนเมื่อ stage ใดเสร็จสิ้นหรือมีปัญหา

## Technical Notes

- Stage จะถูก validate ว่าไม่ซ้ำกัน
- ไม่สามารถลบ stage ที่มีการใช้งานใน test results
- Stage จะถูกเรียงลำดับตาม field `order`
- มีการ track วันที่สร้างและอัปเดต
