# Test Results Chart Component

## ภาพรวม

`TestResultsChart` เป็น component ที่ใช้สำหรับแสดงกราฟแนวโน้มของผลการทดสอบตาม parameter และช่วงวันที่ที่เลือก

## คุณสมบัติ

### 1. การ Filter ข้อมูล
- **Parameter Filter**: เลือก parameter ที่ต้องการวิเคราะห์
- **Date Range Filter**: กำหนดช่วงวันที่ที่ต้องการดูข้อมูล
- **Clear Filters**: ล้าง filter ทั้งหมด

### 2. ประเภทกราฟ
- **Line Chart**: แสดงแนวโน้มแบบเส้น
- **Bar Chart**: แสดงข้อมูลแบบแท่ง

### 3. การจัดกลุ่มข้อมูล (Group By)
- **Date**: จัดกลุ่มตามวันที่
- **Order**: จัดกลุ่มตาม order number
- **Individual**: แสดงข้อมูลแต่ละจุด

### 4. เส้นอ้างอิง (Reference Lines)
แสดงเส้นอ้างอิงจาก product_parameters:
- **Acceptable Min/Max**: เส้นสีเขียว (เส้นประ)
- **Warning Min/Max**: เส้นสีส้ม (เส้นประ)
- **Critical Min/Max**: เส้นสีแดง (เส้นประ)

### 5. สถิติสรุป
แสดงสถิติของข้อมูลที่ filter:
- Total Tests
- Pass Count
- Warning Count
- Fail Count

## การใช้งาน

### 1. Import Component
```tsx
import TestResultsChart from './components/reports/TestResultsChart';
```

### 2. ใช้งานใน Component
```tsx
function TestResultsReport() {
  return (
    <div>
      <TestResultsChart />
    </div>
  );
}
```

### 3. ใช้งานพร้อม Custom Styling
```tsx
<TestResultsChart className="my-custom-class" />
```

## โครงสร้างข้อมูลที่ต้องการ

Component นี้ต้องการข้อมูลจาก API `/api/test-results` ที่มี field ต่อไปนี้:

```typescript
interface TestResultData {
  id: string;
  order_number: string;
  parameter_id: string;
  parameter_name: string;
  round: number;
  value: number;
  unit: string;
  status: 'pass' | 'warning' | 'fail';
  operator_id: string;
  timestamp: string;
  acceptable_min?: number;
  acceptable_max?: number;
  warning_min?: number;
  warning_max?: number;
  critical_min?: number;
  critical_max?: number;
  product_name?: string;
}
```

## การทำงาน

### 1. การโหลดข้อมูล
- โหลดข้อมูลจาก API เมื่อ component mount
- แยก parameter ที่มีอยู่เพื่อแสดงใน dropdown
- เลือก parameter แรกเป็นค่าเริ่มต้น

### 2. การ Filter
- Filter ตาม parameter ที่เลือก
- Filter ตามช่วงวันที่
- เรียงลำดับตาม timestamp

### 3. การสร้างกราฟ
- สร้างข้อมูลสำหรับ Chart.js
- เพิ่มเส้นอ้างอิงตาม range values
- แยกข้อมูลตาม status (เมื่อ group by date)

### 4. การแสดงผล
- แสดงกราฟตามประเภทที่เลือก
- แสดงสถิติสรุป
- แสดง loading และ error states

## Dependencies

### Required Packages
```json
{
  "chart.js": "^4.5.0",
  "react-chartjs-2": "^5.3.0",
  "date-fns": "^3.0.0",
  "lucide-react": "^0.344.0"
}
```

### Chart.js Components
```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
```

## การปรับแต่ง

### 1. เปลี่ยนสีของกราฟ
แก้ไขใน `getChartData()` function:

```typescript
{
  label: 'Average Value',
  data: values,
  borderColor: 'rgb(59, 130, 246)', // เปลี่ยนสีเส้น
  backgroundColor: 'rgba(59, 130, 246, 0.1)', // เปลี่ยนสีพื้นหลัง
}
```

### 2. เปลี่ยนขนาดกราฟ
แก้ไขใน JSX:

```tsx
<div className="h-96"> {/* เปลี่ยนความสูง */}
  <Line data={getChartData()!} options={getChartOptions()} />
</div>
```

### 3. เพิ่ม Filter เพิ่มเติม
เพิ่ม state และ logic ใน component:

```typescript
const [additionalFilter, setAdditionalFilter] = useState<string>('');

// ใน applyFilters function
if (additionalFilter) {
  filtered = filtered.filter(result => 
    // logic การ filter
  );
}
```

## ตัวอย่างการใช้งานใน TestResultsReport

```tsx
import TestResultsChart from './TestResultsChart';

const TestResultsReport: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* ... statistics cards ... */}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        {/* ... filters ... */}
      </div>

      {/* Chart Section */}
      <div className="mb-8">
        <TestResultsChart />
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* ... table ... */}
      </div>
    </div>
  );
};
```

## ข้อควรระวัง

1. **API Response**: ต้องแน่ใจว่า API ส่งข้อมูลที่มี field ที่จำเป็นครบถ้วน
2. **Performance**: กราฟอาจช้าถ้าข้อมูลมีจำนวนมาก ควรใช้ pagination หรือ limit
3. **Date Format**: ข้อมูล timestamp ต้องอยู่ในรูปแบบที่ JavaScript Date constructor รองรับ
4. **Chart.js Version**: ต้องใช้ version ที่ compatible กับ react-chartjs-2

## การแก้ไขปัญหา

### กราฟไม่แสดง
1. ตรวจสอบว่า API ส่งข้อมูลมาถูกต้อง
2. ตรวจสอบ console errors
3. ตรวจสอบว่า parameter ถูกเลือกแล้ว

### กราฟแสดงไม่ถูกต้อง
1. ตรวจสอบรูปแบบข้อมูล timestamp
2. ตรวจสอบค่า value ว่าเป็น number
3. ตรวจสอบการ filter logic

### เส้นอ้างอิงไม่แสดง
1. ตรวจสอบว่า product_parameters มีข้อมูล range values
2. ตรวจสอบการ JOIN ระหว่าง test_results และ product_parameters
