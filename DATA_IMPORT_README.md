# Data Import Functionality

This document describes the data import functionality that allows users to import production orders from CSV files into the database.

## Features

- **CSV File Upload**: Upload CSV files with production order data
- **Automatic Validation**: Validates data format and business rules
- **Database Integration**: Inserts validated data directly into the PostgreSQL database
- **Error Handling**: Comprehensive error reporting for failed imports
- **Duplicate Detection**: Identifies and reports duplicate order numbers
- **Real-time Progress**: Shows import progress and results

## CSV Format

The CSV file must have the following columns in the exact order:

```csv
Order_Number,Line_Number,Production_DateTime,Operator_ID
ORD20250102001,1,2025-01-02T10:30:00Z,OP001
ORD20250102002,2,2025-01-02T11:00:00Z,OP002
```

### Column Requirements

- **Order_Number**: Unique identifier for the production order (required)
- **Line_Number**: Production line number (1-10, required)
- **Production_DateTime**: ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ, required)
- **Operator_ID**: Operator identifier in format OP### (required)

## Validation Rules

1. **Headers**: Must contain all required column headers
2. **Order Numbers**: Must be unique within the file and database
3. **Line Numbers**: Must be between 1 and 10
4. **Dates**: Must be valid ISO 8601 format
5. **Operator IDs**: Must follow the pattern OP### (e.g., OP001, OP002)

## API Endpoints

### Bulk Import Orders
```
POST /api/orders/bulk-import
Content-Type: application/json
Authorization: Bearer <token>

{
  "orders": [
    {
      "orderNumber": "ORD20250102001",
      "lineNumber": 1,
      "productionDateTime": "2025-01-02T10:30:00Z",
      "operatorId": "OP001"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "totalRows": 5,
  "successfulRows": 4,
  "errors": [
    {
      "row": 3,
      "orderNumber": "ORD20250102003",
      "field": "Order_Number",
      "message": "Order number already exists",
      "code": "DUPLICATE_ORDER"
    }
  ],
  "duplicates": ["ORD20250102003"],
  "importedOrders": [...]
}
```

## Usage Instructions

1. **Navigate to Data Import**: Go to the Data Import page in the application
2. **Download Template**: Click "Download CSV Template" to get a sample file
3. **Prepare Data**: Fill in your production order data following the template format
4. **Upload File**: Drag and drop or click to upload your CSV file
5. **Review Results**: Check the validation results and import summary
6. **Handle Errors**: Fix any validation errors and re-upload if necessary

## Error Codes

- `MISSING_HEADERS`: Required column headers are missing
- `REQUIRED_FIELD`: A required field is empty
- `INVALID_NUMBER`: Line number is not a valid number
- `INVALID_DATE`: Date format is invalid
- `OUT_OF_RANGE`: Line number is outside valid range (1-10)
- `INVALID_FORMAT`: Operator ID doesn't match required format
- `DUPLICATE_ORDER`: Order number already exists in file or database
- `INSERT_ERROR`: Database insertion failed
- `API_ERROR`: API communication error
- `PROCESSING_ERROR`: File processing failed

## Database Schema

The imported data is stored in the `production_orders` table:

```sql
CREATE TABLE production_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  line_number INTEGER NOT NULL,
  production_date_time TIMESTAMP NOT NULL,
  operator_id VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security

- All API endpoints require authentication via JWT token
- File uploads are validated for size and format
- SQL injection protection through parameterized queries
- Rate limiting to prevent abuse

## Troubleshooting

### Common Issues

1. **File not uploading**: Check file size (max 10MB) and format (CSV only)
2. **Validation errors**: Review the error messages and fix data format issues
3. **Database errors**: Ensure database is running and accessible
4. **Authentication errors**: Make sure you're logged in and token is valid

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Performance

- Bulk import processes orders in batches
- Database transactions ensure data consistency
- Progress tracking for large files
- Optimized for files up to 10MB with thousands of records 