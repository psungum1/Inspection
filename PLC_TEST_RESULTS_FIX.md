# PLC Orders Test Results Loading Fix

## ปัญหาที่พบ

1. **ปัญหาหลัก**: หลังจากค้นหาหน้า Search PLC Orders แล้ว ค่าของ "tests completed" ไม่สามารถโหลดข้อมูลที่เคยคีย์ไปจาก database ได้
2. **ปัญหาย่อย**: "Tests Completed: 7/11" แสดงจำนวน test results ทั้งหมด (7) เทียบกับจำนวน parameters ที่กำหนดไว้สำหรับ product นั้น (11) แต่แสดง "Total Tests: 7" ซึ่งไม่ถูกต้อง
3. **ปัญหาการตรวจสอบค่า**: การตรวจสอบค่า test value เทียบกับ range ต่างๆ ไม่ถูกต้อง เช่น ค่า 0.09 ควรจะอยู่ในช่วง "Acceptable Range" (0.090 - 0.100) แต่ระบบแสดงผลเป็น "WARNING"
4. **ปัญหาการบันทึกค่า Critical**: ระบบไม่สามารถบันทึกค่าที่เป็น critical (FAIL) ได้ เนื่องจากมีการตรวจสอบ range ที่เข้มงวดเกินไป

## สาเหตุของปัญหา

1. **PLC Orders** ถูกเก็บในตาราง `plc_orders` โดยใช้ `Batch_ID` เป็น identifier
2. **Test Results** ถูกเก็บในตาราง `test_results` โดยใช้ `order_number` ที่เชื่อมโยงกับตาราง `production_orders`
3. เมื่อค้นหา PLC Orders แล้ว ระบบจะโหลดข้อมูลจาก `plc_orders` แต่ไม่มีการเชื่อมโยงกับ test results ที่เก็บใน `test_results`
4. **การคำนวณจำนวน parameters** ใช้ `testParameters.length` (จำนวน parameters ทั้งหมดในระบบ) แทนที่จะใช้จำนวน parameters ที่กำหนดไว้สำหรับ product นั้นๆ
5. **การตรวจสอบค่า** ในฟังก์ชัน `determineTestStatus` มีลำดับการตรวจสอบที่ไม่ถูกต้อง ทำให้ค่าที่ควรเป็น "PASS" กลับแสดงเป็น "WARNING"
6. **การตรวจสอบค่าในฟังก์ชัน `validateTestValue`** มีการตรวจสอบ range ที่เข้มงวดเกินไป ทำให้ไม่สามารถบันทึกค่าที่เป็น critical ได้

## การแก้ไข

### 1. ปรับปรุง API Endpoint สำหรับ PLC Orders Search

**ไฟล์:** `server/src/routes/orders.js`

- เพิ่ม `LEFT JOIN` กับตาราง `test_results` โดยใช้ `po.Batch_ID = tr.order_number`
- เพิ่ม `COUNT(tr.id) as test_results_count` เพื่อนับจำนวน test results
- เพิ่ม `GROUP BY po.Batch_Log_ID` เพื่อจัดกลุ่มข้อมูล

```sql
SELECT 
  po.*,
  CASE 
    WHEN po.Log_Close_DT_UTC IS NULL THEN 'active'
    ELSE 'completed'
  END as status,
  COUNT(tr.id) as test_results_count
FROM plc_orders po
LEFT JOIN test_results tr ON po.Batch_ID = tr.order_number
```

### 2. เพิ่ม API Endpoint ใหม่สำหรับ PLC Order with Test Results

**ไฟล์:** `server/src/routes/orders.js`

- เพิ่ม endpoint `/plc/:batchId/with-results` เพื่อดึงข้อมูล PLC order พร้อม test results
- ใช้ `Batch_ID` เป็น parameter ในการค้นหา

### 3. เพิ่ม API Method ใน ApiService

**ไฟล์:** `src/utils/api.ts`

- เพิ่ม method `getPlcOrderWithResults(batchId: string)` สำหรับเรียก API ใหม่

### 4. ปรับปรุง OrderSearch Component

**ไฟล์:** `src/components/test-entry/OrderSearch.tsx`

- เพิ่ม `testResultsCount` ในข้อมูลที่ transform จาก API response
- แสดงจำนวน test results ในผลการค้นหา

### 5. ปรับปรุง TestEntry Component

**ไฟล์:** `src/components/test-entry/TestEntry.tsx`

- ปรับปรุง `loadOrderTestResults` function ให้รองรับทั้ง PLC orders และ production orders
- ตรวจสอบว่าเป็น PLC order หรือไม่โดยดูจาก localStorage cache
- ใช้ API ที่เหมาะสมสำหรับแต่ละประเภท
- **แก้ไขการคำนวณจำนวน parameters** ให้ใช้ `productParameters.length` แทน `testParameters.length`

#### การแก้ไขการคำนวณจำนวน Parameters

**ก่อนแก้ไข:**
```typescript
Tests Completed: {orderTestResults.length}/{testParameters.length}
```

**หลังแก้ไข:**
```typescript
Tests Completed: {orderTestResults.length}/{productParameters.length}
```

### 6. แก้ไขการตรวจสอบค่าใน Validation Logic

**ไฟล์:** `src/utils/validation.ts`

- แก้ไขฟังก์ชัน `determineTestStatus` ให้ตรวจสอบค่าในลำดับที่ถูกต้อง
- **แก้ไขฟังก์ชัน `validateTestValue`** ให้ไม่ตรวจสอบ range เพื่อให้สามารถบันทึกค่า critical ได้

#### การแก้ไขการตรวจสอบค่า

**ก่อนแก้ไข:**
```typescript
export const determineTestStatus = (value: number, min: number, max: number, warningMin: number, warningMax: number): 'pass' | 'warning' | 'fail' => {
  if (value < min || value > max) {
    return 'fail';
  } else if (value < warningMin || value > warningMax) {
    return 'warning';
  }
  return 'pass';
};

export const validateTestValue = (value: number, min: number, max: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (value === null || value === undefined) {
    errors.push({
      field: 'value',
      message: 'Test value is required',
      code: 'REQUIRED'
    });
  } else if (isNaN(value)) {
    errors.push({
      field: 'value',
      message: 'Test value must be a valid number',
      code: 'INVALID_TYPE'
    });
  } else if (value < min || value > max) {
    errors.push({
      field: 'value',
      message: `Test value must be between ${min} and ${max}`,
      code: 'OUT_OF_RANGE'
    });
  }
  
  return errors;
};
```

**หลังแก้ไข:**
```typescript
export const determineTestStatus = (value: number, acceptableMin: number, acceptableMax: number, warningMin: number, warningMax: number): 'pass' | 'warning' | 'fail' => {
  // First check if value is within acceptable range (PASS)
  if (value >= acceptableMin && value <= acceptableMax) {
    return 'pass';
  }
  
  // Then check if value is within warning range (WARNING)
  if (value >= warningMin && value <= warningMax) {
    return 'warning';
  }
  
  // If not in acceptable or warning range, it's FAIL
  return 'fail';
};

export const validateTestValue = (value: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (value === null || value === undefined) {
    errors.push({
      field: 'value',
      message: 'Test value is required',
      code: 'REQUIRED'
    });
  } else if (isNaN(value)) {
    errors.push({
      field: 'value',
      message: 'Test value must be a valid number',
      code: 'INVALID_TYPE'
    });
  }
  // Removed the range validation to allow saving critical values
  // The status will be determined by determineTestStatus function instead
  
  return errors;
};
```

### 7. อัปเดต TypeScript Interface

**ไฟล์:** `src/types/index.ts`

- เพิ่ม `testResultsCount?: number` ใน `ProductionOrder` interface

## การทดสอบ

### 1. เพิ่มข้อมูลทดสอบ

รัน script `add-plc-test-data.js` เพื่อเพิ่มข้อมูลทดสอบ:

```bash
node add-plc-test-data.js
```

### 2. เพิ่มข้อมูล Product Parameters

รัน script `add-product-parameters.js` เพื่อเพิ่มข้อมูล product parameters:

```bash
node add-product-parameters.js
```

### 3. ทดสอบ API

รัน script `test-plc-test-results.js` เพื่อทดสอบ API:

```bash
node test-plc-test-results.js
```

### 4. ทดสอบ Product Parameters Count

รัน script `test-product-parameters-count.js` เพื่อทดสอบการคำนวณจำนวน parameters:

```bash
node test-product-parameters-count.js
```

### 5. ทดสอบ Validation Logic

รัน script `test-validation-logic.js` เพื่อทดสอบการตรวจสอบค่า:

```bash
node test-validation-logic.js
```

### 6. ทดสอบ Critical Values

รัน script `test-critical-values.js` เพื่อทดสอบการบันทึกค่า critical:

```bash
node test-critical-values.js
```

## ผลลัพธ์ที่คาดหวัง

1. **หน้า Search PLC Orders** จะแสดงจำนวน test results สำหรับแต่ละ order
2. **เมื่อเลือก PLC order** จะสามารถโหลดและแสดง test results ที่เคยคีย์ไว้ได้
3. **ข้อมูล "tests completed"** จะแสดงค่าที่ถูกต้องตามข้อมูลใน database
4. **การคำนวณจำนวน parameters** จะใช้จำนวน parameters ที่กำหนดไว้สำหรับแต่ละ product แทนที่จะใช้จำนวน parameters ทั้งหมดในระบบ
5. **การตรวจสอบค่า** จะทำงานถูกต้องตาม range ที่กำหนดไว้
6. **การบันทึกค่า critical** จะสามารถบันทึกได้โดยไม่มีข้อผิดพลาด

### ตัวอย่างผลลัพธ์

- **Product A** (4 parameters): "Tests Completed: 3/4"
- **Product B** (6 parameters): "Tests Completed: 5/6"  
- **Product C** (3 parameters): "Tests Completed: 2/3"

### ตัวอย่างการตรวจสอบค่า

- **DSmax**: ค่า 0.09 ในช่วง Acceptable (0.090-0.100) จะแสดงเป็น "PASS"
- **pH**: ค่า 7.8 ในช่วง Warning (5.5-7.5) จะแสดงเป็น "WARNING"
- **Moisture**: ค่า 16.0 นอกช่วง Acceptable (10-15) จะแสดงเป็น "FAIL"

### ตัวอย่างการบันทึกค่า Critical

- **DSmax**: ค่า 0.025 (critical) สามารถบันทึกได้และจะแสดงเป็น "FAIL"
- **pH**: ค่า 9.0 (critical) สามารถบันทึกได้และจะแสดงเป็น "FAIL"
- **Moisture**: ค่า 20.0 (critical) สามารถบันทึกได้และจะแสดงเป็น "FAIL"

## ไฟล์ที่แก้ไข

1. `server/src/routes/orders.js` - เพิ่ม API endpoints
2. `src/utils/api.ts` - เพิ่ม API method
3. `src/components/test-entry/OrderSearch.tsx` - แสดง test results count
4. `src/components/test-entry/TestEntry.tsx` - โหลด test results และแก้ไขการคำนวณจำนวน parameters
5. `src/utils/validation.ts` - แก้ไขการตรวจสอบค่าและอนุญาตให้บันทึกค่า critical
6. `src/components/test-entry/TestForm.tsx` - อัปเดตการเรียกใช้ validateTestValue
7. `src/types/index.ts` - อัปเดต interface

## ไฟล์ใหม่

1. `test-plc-test-results.js` - Script ทดสอบ API
2. `add-plc-test-data.js` - Script เพิ่มข้อมูลทดสอบ
3. `add-product-parameters.js` - Script เพิ่มข้อมูล product parameters
4. `test-product-parameters-count.js` - Script ทดสอบการคำนวณจำนวน parameters
5. `test-validation-logic.js` - Script ทดสอบการตรวจสอบค่า
6. `test-critical-values.js` - Script ทดสอบการบันทึกค่า critical
7. `PLC_TEST_RESULTS_FIX.md` - เอกสารนี้

## หมายเหตุ

- การแก้ไขนี้ใช้ `Batch_ID` จาก PLC orders เป็น `order_number` ใน test results
- ระบบจะตรวจสอบว่าเป็น PLC order หรือ production order โดยดูจาก localStorage cache
- หากไม่มีข้อมูลใน cache จะใช้ API สำหรับ production orders เป็นค่าเริ่มต้น
- **การคำนวณจำนวน parameters** ตอนนี้จะใช้ข้อมูลจากตาราง `product_parameters` ที่กำหนดไว้สำหรับแต่ละ product
- ระบบจะโหลด product parameters ตาม `product_name` ของ order ที่เลือก
- **การตรวจสอบค่า** ตอนนี้จะตรวจสอบในลำดับที่ถูกต้อง: Acceptable Range → Warning Range → Fail
- **การบันทึกค่า critical** ตอนนี้สามารถบันทึกได้โดยไม่มีข้อผิดพลาด validation 