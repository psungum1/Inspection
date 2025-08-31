# Material Input Troubleshooting Guide

## ปัญหาที่พบ: แสดงค่า N/A

### สาเหตุของปัญหา

1. **Interface ไม่ตรงกับข้อมูลจริง**: TypeScript interface ไม่ตรงกับข้อมูลที่ return มาจาก SQL Server
2. **SQL Query ไม่ได้ return ข้อมูลครบ**: ข้อมูลที่ return ไม่มี fields ที่ frontend คาดหวัง
3. **Data Structure เปลี่ยน**: โครงสร้างข้อมูลใน SQL Server table เปลี่ยนจากที่คาดหวัง

### การแก้ไขที่ทำแล้ว

#### 1. แก้ไข TypeScript Interface
```typescript
// เก่า
interface MaterialInput {
  Material_Code: string;
  Material_Name: string;
  Batch_Number: string;
  Quantity: number;
  Unit: string;
  Input_Date: string;
  Input_Time: string;
  Operator_ID: string;
  Lot_ID: string;
  Campaign_ID: string;
  Batch_Log_ID: string;
  Created_Date: string;
  Modified_Date: string;
}

// ใหม่
interface MaterialInput {
  Batch_Log_ID: string;
  Batch_ID: string;
  UnitOrConnection: string;
  Material_ID: string;
  Material_Name: string;
  Actual_Qty: number;
  UnitOfMeasure: string;
  DateTimeUTC: string;
}
```

#### 2. แก้ไข SQL Query
```sql
-- เก่า
SELECT 
  mi.Material_Code,
  mi.Material_Name,
  mi.Batch_Number,
  mi.Quantity,
  mi.Unit,
  mi.Input_Date,
  mi.Input_Time,
  mi.Operator_ID,
  mi.Lot_ID,
  mi.Campaign_ID,
  mi.Batch_Log_ID,
  mi.Created_Date,
  mi.Modified_Date
FROM MaterialInput mi
WHERE mi.Batch_Number = @batchId

-- ใหม่
SELECT 
  mi.Batch_Log_ID,
  bi.Batch_ID,
  mi.UnitOrConnection,
  mi.Material_ID,
  mi.Material_Name,
  mi.Actual_Qty,
  mi.UnitOfMeasure,
  mi.DateTimeUTC
FROM MaterialInput mi
LEFT JOIN BatchIdLog bi ON mi.Batch_Log_ID = bi.Batch_Log_ID
WHERE bi.Batch_ID = @batchId
```

#### 3. แก้ไข Frontend Display
```typescript
// เก่า
<div>Lot ID: {materialInputs[0]?.Lot_ID || 'N/A'}</div>
<div>Campaign ID: {materialInputs[0]?.Campaign_ID || 'N/A'}</div>

// ใหม่
<div>Batch ID: {materialInputs[0]?.Batch_ID || 'N/A'}</div>
<div>Unit/Connection: {materialInputs[0]?.UnitOrConnection || 'N/A'}</div>
```

### การ Debug

#### 1. ตรวจสอบ Backend Logs
```bash
# ดู logs ใน backend server
cd server
npm run dev
```

Backend จะ log ข้อมูลดังนี้:
```
MaterialInput query result for batchId: BATCH2024001 {
  recordCount: 5,
  sampleRecord: {
    Batch_Log_ID: "BL001",
    Batch_ID: "BATCH2024001",
    UnitOrConnection: "UNIT1",
    Material_ID: "MAT001",
    Material_Name: "Raw Material A",
    Actual_Qty: 100.5,
    UnitOfMeasure: "kg",
    DateTimeUTC: "2024-01-15T14:30:00"
  }
}
```

#### 2. ตรวจสอบ Frontend Console
เปิด Browser Developer Tools และดู Console logs:
```javascript
MaterialInput data received: [
  {
    Batch_Log_ID: "BL001",
    Batch_ID: "BATCH2024001",
    UnitOrConnection: "UNIT1",
    Material_ID: "MAT001",
    Material_Name: "Raw Material A",
    Actual_Qty: 100.5,
    UnitOfMeasure: "kg",
    DateTimeUTC: "2024-01-15T14:30:00"
  }
]
```

#### 3. ทดสอบ API โดยตรง
```bash
# ใช้ curl หรือ Postman
curl http://localhost:3001/api/material-inputs/sqlserver/material-inputs/BATCH2024001
```

#### 4. ใช้ Test Script
```bash
# รัน test script
node test-material-input.js
```

### สาเหตุที่เป็นไปได้ของค่า N/A

#### 1. ไม่มีข้อมูลใน SQL Server
- ตรวจสอบว่า batch ID ที่ใช้มีข้อมูลใน MaterialInput table
- ตรวจสอบ JOIN กับ BatchIdLog table

#### 2. SQL Server Connection Failed
- ตรวจสอบ SQL Server credentials
- ตรวจสอบ network connectivity
- ดู error logs ใน backend

#### 3. Wrong Batch ID
- ตรวจสอบว่า batch ID ที่ส่งไปถูกต้อง
- ตรวจสอบ format ของ batch ID

#### 4. Table Structure Mismatch
- ตรวจสอบว่า MaterialInput table มี columns ที่ถูกต้อง
- ตรวจสอบ data types ของ columns

### การตรวจสอบ SQL Server Table

#### 1. ตรวจสอบ Table Structure
```sql
-- ตรวจสอบ columns ใน MaterialInput table
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'MaterialInput'
ORDER BY ORDINAL_POSITION;
```

#### 2. ตรวจสอบ Sample Data
```sql
-- ดูข้อมูลตัวอย่าง
SELECT TOP 5 *
FROM MaterialInput
ORDER BY DateTimeUTC DESC;
```

#### 3. ตรวจสอบ JOIN
```sql
-- ทดสอบ JOIN กับ BatchIdLog
SELECT 
  mi.Batch_Log_ID,
  bi.Batch_ID,
  mi.Material_ID,
  mi.Material_Name
FROM MaterialInput mi
LEFT JOIN BatchIdLog bi ON mi.Batch_Log_ID = bi.Batch_Log_ID
WHERE bi.Batch_ID = 'BATCH2024001';
```

### การแก้ไขเพิ่มเติม

#### 1. เพิ่ม Error Handling
```typescript
if (response.data && response.data.length > 0) {
  setMaterialInputs(response.data);
} else {
  setError('No material input data found for this batch');
  setMaterialInputs([]);
}
```

#### 2. เพิ่ม Loading State
```typescript
const [isLoading, setIsLoading] = useState(false);

// ใน loadMaterialInputs function
setIsLoading(true);
try {
  // ... API call
} finally {
  setIsLoading(false);
}
```

#### 3. เพิ่ม Fallback Data
```typescript
// หากไม่มีข้อมูลจริง ให้แสดงข้อมูลตัวอย่าง
const fallbackData = [
  {
    Batch_Log_ID: "BL001",
    Batch_ID: batchId,
    UnitOrConnection: "UNIT1",
    Material_ID: "MAT001",
    Material_Name: "Sample Material",
    Actual_Qty: 100,
    UnitOfMeasure: "kg",
    DateTimeUTC: new Date().toISOString()
  }
];
```

### คำแนะนำ

1. **ตรวจสอบ SQL Server Connection**: ตรวจสอบว่า SQL Server ทำงานและเชื่อมต่อได้
2. **ตรวจสอบ Data**: ตรวจสอบว่ามีข้อมูลใน MaterialInput table
3. **ตรวจสอบ Batch ID**: ตรวจสอบว่า batch ID ที่ใช้ถูกต้อง
4. **ดู Logs**: ตรวจสอบ backend และ frontend logs
5. **Test API**: ทดสอบ API โดยตรงก่อนใช้งานใน frontend

### การป้องกันปัญหาในอนาคต

1. **Type Safety**: ใช้ TypeScript interfaces ที่ตรงกับข้อมูลจริง
2. **Error Handling**: เพิ่ม error handling ที่ครอบคลุม
3. **Logging**: เพิ่ม logging เพื่อ debug
4. **Testing**: สร้าง unit tests สำหรับ API
5. **Documentation**: อัปเดต documentation เมื่อโครงสร้างข้อมูลเปลี่ยน 