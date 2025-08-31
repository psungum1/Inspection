# Material Input Feature

## Overview

ฟีเจอร์ Material Input ช่วยให้ผู้ใช้สามารถดูข้อมูลการป้อนวัตถุดิบจาก SQL Server table `MaterialInput` ได้หลังจากค้นหา order แล้ว

## Features

### 1. Material Input Tab
- เพิ่ม tab ใหม่ "Material Input" ในหน้า Test Entry
- แสดงข้อมูลการป้อนวัตถุดิบสำหรับ batch ที่เลือก
- ข้อมูลจะถูกดึงจาก SQL Server table `MaterialInput`

### 2. Data Display
- **Summary Cards**: แสดงสถิติรวม
  - Total Records: จำนวนรายการทั้งหมด
  - Recent Inputs: จำนวนการป้อนล่าสุด (ภายใน 24 ชั่วโมง)
  - Unique Operators: จำนวนผู้ปฏิบัติงานที่ไม่ซ้ำกัน

- **Material Input Table**: แสดงรายละเอียดการป้อนวัตถุดิบ
  - Material Name และ Code
  - Quantity และ Unit
  - Input Date/Time
  - Operator ID
  - Status (Recent/Today/Older)

- **Additional Information**:
  - Batch Information: Lot ID, Campaign ID, Batch Log ID
  - Material Summary: สรุปปริมาณวัตถุดิบแต่ละประเภท

### 3. Status Indicators
- **Recent** (เขียว): ป้อนภายใน 1 ชั่วโมง
- **Today** (เหลือง): ป้อนภายใน 24 ชั่วโมง
- **Older** (เทา): ป้อนมากกว่า 24 ชั่วโมง

## API Endpoints

### Backend (Node.js/Express)

#### 1. Get MaterialInput by Batch ID
```
GET /api/material-inputs/sqlserver/material-inputs/:batchId
```

**Response:**
```json
[
  {
    "Material_Code": "MAT001",
    "Material_Name": "Raw Material A",
    "Batch_Number": "BATCH2024001",
    "Quantity": 100.5,
    "Unit": "kg",
    "Input_Date": "2024-01-15",
    "Input_Time": "14:30:00",
    "Operator_ID": "OP001",
    "Lot_ID": "LOT001",
    "Campaign_ID": "CAM001",
    "Batch_Log_ID": "BL001",
    "Created_Date": "2024-01-15T14:30:00",
    "Modified_Date": "2024-01-15T14:30:00"
  }
]
```

#### 2. Get MaterialInput with Filters
```
GET /api/material-inputs/sqlserver/material-inputs?batchId=BATCH2024001&startDate=2024-01-01&endDate=2024-01-31
```

### Frontend (TypeScript/React)

#### API Service Methods
```typescript
// Get MaterialInput data by batch ID
apiService.getMaterialInputsByBatchId(batchId: string): Promise<ApiResponse<any[]>>

// Get MaterialInput data with filters
apiService.getMaterialInputs(params?: {
  batchId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<any[]>>
```

## Database Schema

### SQL Server Table: MaterialInput
```sql
CREATE TABLE MaterialInput (
  Material_Code VARCHAR(50),
  Material_Name VARCHAR(255),
  Batch_Number VARCHAR(100),
  Quantity DECIMAL(10,3),
  Unit VARCHAR(20),
  Input_Date DATE,
  Input_Time TIME,
  Operator_ID VARCHAR(50),
  Lot_ID VARCHAR(100),
  Campaign_ID VARCHAR(100),
  Batch_Log_ID VARCHAR(100),
  Created_Date DATETIME,
  Modified_Date DATETIME
)
```

## Usage Instructions

### 1. Access Material Input Data
1. ไปที่หน้า **Test Entry**
2. ค้นหา order ที่ต้องการใน **Order Search**
3. เลือก order ที่ต้องการ
4. คลิกที่ tab **"Material Input"**

### 2. View Data
- ข้อมูลจะถูกโหลดอัตโนมัติเมื่อเลือก order
- แสดงสรุปสถิติในส่วนบน
- แสดงตารางรายละเอียดการป้อนวัตถุดิบ
- แสดงข้อมูลเพิ่มเติมด้านล่าง

### 3. Error Handling
- หากไม่สามารถเชื่อมต่อ SQL Server ได้ จะแสดงข้อความ error
- มีปุ่ม "Retry" สำหรับลองโหลดข้อมูลใหม่
- หากไม่มีข้อมูลจะแสดงข้อความ "No Material Input Data"

## Technical Implementation

### Components
- `MaterialInputView.tsx`: Component หลักสำหรับแสดงข้อมูล MaterialInput
- `TestEntry.tsx`: เพิ่ม tab navigation และ integration

### State Management
- ใช้ React hooks (useState, useEffect) สำหรับจัดการ state
- API calls ผ่าน apiService
- Error handling และ loading states

### Styling
- ใช้ Tailwind CSS สำหรับ styling
- Responsive design สำหรับ mobile และ desktop
- Consistent design กับ components อื่นๆ

## Error Scenarios

### 1. SQL Server Connection Failed
- แสดงข้อความ error พร้อมปุ่ม Retry
- ใช้ fallback data หากมี

### 2. No Data Found
- แสดงข้อความ "No Material Input Data"
- แสดง batch ID ที่ค้นหา

### 3. Network Error
- แสดงข้อความ error พร้อมรายละเอียด
- มีปุ่ม Retry สำหรับลองใหม่

## Future Enhancements

### 1. Data Export
- Export ข้อมูลเป็น CSV/Excel
- Print functionality

### 2. Advanced Filtering
- Filter ตาม Material Code
- Filter ตาม Operator ID
- Date range picker

### 3. Real-time Updates
- WebSocket connection สำหรับ real-time data
- Auto-refresh functionality

### 4. Charts and Analytics
- Material consumption charts
- Trend analysis
- Performance metrics

## Dependencies

### Backend
- `express`: Web framework
- `mssql`: SQL Server driver
- `cors`: Cross-origin resource sharing

### Frontend
- `react`: UI library
- `lucide-react`: Icons
- `tailwindcss`: Styling framework

## Configuration

### Environment Variables
```env
# SQL Server Configuration
SQLSERVER_USER=your_username
SQLSERVER_PASSWORD=your_password
SQLSERVER_HOST=your_host
SQLSERVER_DB=your_database
SQLSERVER_PORT=1433
```

### API Base URL
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

## Testing

### Manual Testing
1. Start backend server: `cd server && npm run dev`
2. Start frontend server: `npm run dev`
3. Navigate to Test Entry page
4. Search for an order
5. Click on "Material Input" tab
6. Verify data display and functionality

### API Testing
```bash
# Test MaterialInput API
curl http://localhost:3001/api/material-inputs/sqlserver/material-inputs/BATCH2024001

# Test with filters
curl "http://localhost:3001/api/material-inputs/sqlserver/material-inputs?batchId=BATCH2024001&startDate=2024-01-01"
```

## Troubleshooting

### Common Issues

#### 1. SQL Server Connection Failed
- ตรวจสอบ SQL Server credentials ใน .env file
- ตรวจสอบ SQL Server service ว่าทำงานอยู่
- ตรวจสอบ network connectivity

#### 2. No Data Displayed
- ตรวจสอบ batch ID ว่ามีข้อมูลใน MaterialInput table
- ตรวจสอบ SQL query ใน backend
- ตรวจสอบ browser console สำหรับ errors

#### 3. API Errors
- ตรวจสอบ backend server logs
- ตรวจสอบ API endpoint URLs
- ตรวจสอบ CORS configuration

### Debug Steps
1. Check browser console for JavaScript errors
2. Check network tab for API call failures
3. Check backend server logs
4. Verify SQL Server connection
5. Test API endpoints directly

## Security Considerations

### 1. SQL Injection Prevention
- ใช้ parameterized queries
- Validate input parameters
- Sanitize user inputs

### 2. Authentication
- ใช้ JWT tokens สำหรับ API authentication
- Validate user permissions
- Log API access

### 3. Data Privacy
- จำกัดการเข้าถึงข้อมูลตาม user roles
- Encrypt sensitive data
- Audit data access

## Performance Optimization

### 1. Database Queries
- ใช้ indexes สำหรับ frequently queried columns
- Optimize SQL queries
- Implement query caching

### 2. Frontend
- Implement data pagination
- Use React.memo สำหรับ component optimization
- Lazy load components

### 3. API
- Implement response caching
- Use compression
- Optimize JSON response size 