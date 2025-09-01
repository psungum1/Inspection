# ระบบจัดการคุณภาพการผลิต (Production Quality Management System - PQMS)
## Flow การใช้งานของระบบทั้งหมด

---

## 📋 ภาพรวมของระบบ

ระบบ PQMS เป็นระบบจัดการคุณภาพการผลิตที่ครอบคลุมการทำงานตั้งแต่การนำเข้าข้อมูล การทดสอบ การวิเคราะห์ และการรายงานผล โดยมีฟีเจอร์หลักดังนี้:

### 🏗️ สถาปัตยกรรมระบบ
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + SQL Server
- **Database**: Microsoft SQL Server
- **Real-time**: WebSocket สำหรับข้อมูลแบบ Real-time

---

## 🔐 ระบบการยืนยันตัวตน (Authentication Flow)

### 1. การเข้าสู่ระบบ
```
User → Login Page → Enter Credentials → Server Validation → JWT Token → Dashboard
```

**ขั้นตอน:**
1. ผู้ใช้เปิดระบบและเข้าสู่หน้า Login
2. กรอก Username และ Password
3. ระบบตรวจสอบข้อมูลกับฐานข้อมูล
4. หากถูกต้อง ระบบจะสร้าง JWT Token และส่งกลับ
5. ผู้ใช้เข้าสู่ระบบและไปยังหน้า Dashboard

### 2. ระดับสิทธิ์ผู้ใช้
- **Admin**: เข้าถึงทุกฟีเจอร์
- **Quality Manager**: จัดการคุณภาพและดูรายงาน
- **Operator**: ป้อนข้อมูลการทดสอบ
- **Viewer**: ดูข้อมูลและรายงานเท่านั้น

---

## 🏠 Dashboard (หน้าหลัก)

### 1. การแสดงข้อมูล
```
Database → API → Dashboard Components → Real-time Updates
```

**ข้อมูลที่แสดง:**
- จำนวน Order ที่กำลังดำเนินการ
- จำนวน Order ที่เสร็จสิ้นวันนี้
- จำนวนการทดสอบที่รอดำเนินการ
- อัตราการปฏิบัติตามมาตรฐานคุณภาพ
- การใช้งานสายการผลิตแต่ละสาย

### 2. การอัปเดตข้อมูล
- **Real-time**: ข้อมูลอัปเดตทุก 5 วินาที
- **Manual Refresh**: ผู้ใช้สามารถรีเฟรชข้อมูลได้เอง
- **Auto-refresh**: ระบบรีเฟรชอัตโนมัติทุก 1 นาที

---

## 📊 การนำเข้าข้อมูล (Data Import)

### 1. การนำเข้าข้อมูลจากไฟล์ CSV
```
CSV File → File Upload → Validation → Database Insert → Success/Error Report
```

**ขั้นตอน:**
1. เลือกไฟล์ CSV ที่มีข้อมูลการผลิต
2. ระบบตรวจสอบรูปแบบไฟล์
3. ตรวจสอบความถูกต้องของข้อมูล
4. นำเข้าข้อมูลลงฐานข้อมูล
5. แสดงรายงานผลการนำเข้า

### 2. การนำเข้าข้อมูลจาก SQL Server
```
SQL Server → Connection → Query Data → Transform → Database Insert
```

**ขั้นตอน:**
1. กำหนดค่าการเชื่อมต่อ SQL Server
2. เลือกตารางและข้อมูลที่ต้องการ
3. ระบบดึงข้อมูลและแปลงรูปแบบ
4. นำเข้าข้อมูลลงฐานข้อมูลหลัก

---

## 🧪 การป้อนข้อมูลการทดสอบ (Test Entry)

### 1. การค้นหา Order
```
Search Criteria → Database Query → Order List → Select Order
```

**วิธีการค้นหา:**
- Order Number
- Line Number
- Production Date
- Product Name
- Status

### 2. การป้อนผลการทดสอบ
```
Order Selection → Parameter List → Input Values → Validation → Save
```

**ขั้นตอน:**
1. เลือก Order ที่ต้องการป้อนข้อมูล
2. ระบบแสดงรายการพารามิเตอร์ที่ต้องทดสอบ
3. ป้อนค่าผลการทดสอบ
4. ระบบตรวจสอบค่าที่ป้อนกับเกณฑ์ที่กำหนด
5. บันทึกข้อมูลลงฐานข้อมูล

### 3. ระบบ Multi-Stage Testing
```
Stage 1 → Stage 2 → Stage 3 → Final Result
```

**การทำงาน:**
- แต่ละ Stage มีพารามิเตอร์ที่ต้องทดสอบ
- ผลการทดสอบแต่ละ Stage จะถูกบันทึกแยกกัน
- ระบบจะแสดงความคืบหน้าการทดสอบ

---

## 📈 การวิเคราะห์ข้อมูล (Analytics)

### 1. การวิเคราะห์แนวโน้ม
```
Historical Data → Statistical Analysis → Trend Charts → Insights
```

**ประเภทการวิเคราะห์:**
- แนวโน้มคุณภาพตามเวลา
- การเปรียบเทียบระหว่างสายการผลิต
- การวิเคราะห์ความแปรปรวนของพารามิเตอร์

### 2. การวิเคราะห์ Order
```
Order Data → Filtering → Aggregation → Order Analysis
```

**ข้อมูลที่วิเคราะห์:**
- สถิติการผลิตแต่ละ Order
- เวลาที่ใช้ในการผลิต
- อัตราการผ่านการทดสอบ

### 3. การวิเคราะห์การผลิต
```
Production Data → Performance Metrics → Production Analysis
```

**เมตริกที่วิเคราะห์:**
- อัตราการใช้งานสายการผลิต
- ประสิทธิภาพการผลิต
- การวิเคราะห์ Bottleneck

---

## 📋 การรายงาน (Reports)

### 1. รายงานผลการทดสอบ
```
Test Results → Filtering → Aggregation → Report Generation → Export
```

**ประเภทรายงาน:**
- รายงานผลการทดสอบรายวัน
- รายงานผลการทดสอบรายสัปดาห์
- รายงานผลการทดสอบรายเดือน
- รายงานเฉพาะ Order

### 2. การส่งออกรายงาน
```
Report Data → Format Selection → Export → Download
```

**รูปแบบการส่งออก:**
- PDF
- Excel
- CSV

---

## ⚙️ การตั้งค่าระบบ (Settings)

### 1. การจัดการพารามิเตอร์ผลิตภัณฑ์
```
Product Selection → Parameter List → Edit Parameters → Save Changes
```

**การตั้งค่า:**
- ชื่อพารามิเตอร์
- ค่าขีดจำกัด (Min/Max)
- ค่าเตือน (Warning)
- ค่าวิกฤต (Critical)
- หน่วยวัด

### 2. การจัดการ Test Stages
```
Stage Configuration → Parameter Assignment → Stage Order → Save
```

**การตั้งค่า:**
- ชื่อ Stage
- รายการพารามิเตอร์ในแต่ละ Stage
- ลำดับการทดสอบ
- เงื่อนไขการผ่าน Stage

### 3. การตั้งค่าการแจ้งเตือน
```
Alert Configuration → Threshold Setting → Notification Method → Save
```

**ประเภทการแจ้งเตือน:**
- การแจ้งเตือนเมื่อค่าผ่านเกณฑ์
- การแจ้งเตือนเมื่อ Order เสร็จสิ้น
- การแจ้งเตือนเมื่อมีปัญหาในระบบ

---

## 🔄 การทำงานแบบ Real-time

### 1. การอัปเดตข้อมูลแบบ Real-time
```
Database Changes → WebSocket → Frontend Update → UI Refresh
```

**ข้อมูลที่อัปเดต Real-time:**
- สถานะ Order
- ผลการทดสอบใหม่
- การแจ้งเตือน
- สถิติ Dashboard

### 2. การแจ้งเตือนแบบ Real-time
```
System Events → Notification Service → User Notification → UI Display
```

**ประเภทการแจ้งเตือน:**
- การแจ้งเตือนผ่าน Toast
- การแจ้งเตือนในหน้า Dashboard
- การแจ้งเตือนผ่าน Email (ถ้าตั้งค่า)

---

## 📱 การใช้งานบนอุปกรณ์ต่างๆ

### 1. Desktop Application
- **หน้าจอขนาดใหญ่**: แสดงข้อมูลครบถ้วน
- **การใช้งานเต็มรูปแบบ**: ทุกฟีเจอร์พร้อมใช้งาน
- **การพิมพ์รายงาน**: รองรับการพิมพ์

### 2. Tablet Application
- **การปรับขนาด**: UI ปรับตามขนาดหน้าจอ
- **การใช้งานแบบ Touch**: ปุ่มและฟอร์มเหมาะสำหรับการสัมผัส
- **การทำงานแบบ Offline**: รองรับการทำงานแบบ Offline

### 3. Mobile Application
- **การปรับขนาด**: UI ปรับตามขนาดหน้าจอ
- **การใช้งานแบบ Touch**: ปุ่มและฟอร์มเหมาะสำหรับการสัมผัส
- **การทำงานแบบ Offline**: รองรับการทำงานแบบ Offline

---

## 🔒 ความปลอดภัยของระบบ

### 1. การยืนยันตัวตน
- **JWT Token**: ใช้สำหรับการยืนยันตัวตน
- **Session Management**: จัดการ Session ของผู้ใช้
- **Password Encryption**: เข้ารหัส Password

### 2. การควบคุมการเข้าถึง
- **Role-based Access Control**: ควบคุมการเข้าถึงตามบทบาท
- **Permission System**: ระบบสิทธิ์ที่ละเอียด
- **API Security**: การป้องกัน API

### 3. การบันทึกข้อมูล
- **Audit Log**: บันทึกการทำงานของผู้ใช้
- **Data Backup**: การสำรองข้อมูล
- **Data Recovery**: การกู้คืนข้อมูล

---

## 🚀 การติดตั้งและใช้งาน

### 1. การติดตั้งระบบ
```bash
# Clone repository
git clone [repository-url]

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start development server
npm run dev
```

### 2. การตั้งค่าฐานข้อมูล
```bash
# Setup SQL Server
# Run migration scripts
npm run migrate

# Seed initial data
npm run seed
```

### 3. การ Deploy
```bash
# Build production version
npm run build

# Start production server
npm start
```

---

## 📞 การสนับสนุนและแก้ไขปัญหา

### 1. การแก้ไขปัญหาทั่วไป
- **ปัญหาการเชื่อมต่อฐานข้อมูล**: ตรวจสอบการตั้งค่า connection string
- **ปัญหาการนำเข้าข้อมูล**: ตรวจสอบรูปแบบไฟล์และข้อมูล
- **ปัญหาการแสดงผล**: ตรวจสอบ browser compatibility

### 2. การติดต่อผู้พัฒนา
- **Email**: [developer-email]
- **Phone**: [phone-number]
- **Documentation**: [documentation-url]

---

## 🔮 แผนการพัฒนาอนาคต

### 1. ฟีเจอร์ใหม่
- **Mobile App**: แอปพลิเคชันมือถือ
- **AI Analytics**: การวิเคราะห์ด้วย AI
- **Predictive Maintenance**: การบำรุงรักษาแบบคาดการณ์

### 2. การปรับปรุงประสิทธิภาพ
- **Database Optimization**: การปรับปรุงฐานข้อมูล
- **Caching System**: ระบบ Cache
- **Load Balancing**: การกระจายโหลด

---

## 📝 สรุป

ระบบ PQMS เป็นระบบที่ครอบคลุมการจัดการคุณภาพการผลิตอย่างครบถ้วน ตั้งแต่การนำเข้าข้อมูล การทดสอบ การวิเคราะห์ และการรายงานผล โดยมีฟีเจอร์ที่ทันสมัยและใช้งานง่าย เหมาะสำหรับโรงงานอุตสาหกรรมที่ต้องการระบบจัดการคุณภาพที่มีประสิทธิภาพ

ระบบนี้สามารถปรับแต่งและขยายได้ตามความต้องการของแต่ละโรงงาน และรองรับการใช้งานแบบ Real-time เพื่อให้ผู้ใช้สามารถติดตามสถานะการผลิตได้อย่างทันท่วงที




