# Product Parameters Database Integration

## Overview

This update modifies the TestForm component to use data from the `product_parameters` database table instead of the `test_parameters` table. This allows for product-specific parameter configurations with proper validation ranges and units.

## Changes Made

### 1. Database Schema Updates

#### Added Unit Column to product_parameters Table
```sql
ALTER TABLE product_parameters
ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
```

The `product_parameters` table now includes:
- `id` (SERIAL PRIMARY KEY)
- `product_name` (VARCHAR(255))
- `parameter_name` (VARCHAR(255))
- `parameter_order` (INTEGER)
- `unit` (VARCHAR(50)) - **NEW**
- `acceptable_min` (DECIMAL(10,3))
- `acceptable_max` (DECIMAL(10,3))
- `warning_min` (DECIMAL(10,3))
- `warning_max` (DECIMAL(10,3))
- `critical_min` (DECIMAL(10,3))
- `critical_max` (DECIMAL(10,3))

### 2. TypeScript Interface Updates

#### Updated ProductParameterMapping Interface
```typescript
export interface ProductParameterMapping {
  id: number;
  product_name: string;
  parameter_name: string;
  parameter_order: number;
  unit?: string; // NEW
  acceptable_min?: number;
  acceptable_max?: number;
  warning_min?: number;
  warning_max?: number;
  critical_min?: number;
  critical_max?: number;
}
```

### 3. Component Updates

#### TestForm Component
- **Interface Change**: Now accepts `ProductParameterMapping[]` instead of `TestParameter[]`
- **Parameter Selection**: Uses `parameter_name` as the identifier instead of `id`
- **Validation**: Uses `acceptable_min/max` and `warning_min/max` from database
- **Unit Handling**: Automatically sets unit from selected parameter
- **Status Preview**: Uses database ranges for status determination

#### TestEntry Component
- **Data Loading**: Loads product parameters based on selected order's product name
- **Parameter Passing**: Passes `ProductParameterMapping[]` to TestForm
- **Status Calculation**: Uses product parameter ranges for test status
- **History Display**: Updated to work with new parameter structure

#### TestHistory Component
- **Interface Update**: Now accepts `ProductParameterMapping[]` instead of `TestParameter[]`
- **Parameter Lookup**: Uses `parameter_name` for finding parameter details

#### ProductParameterManager Component
- **Form Enhancement**: Added unit input field
- **Table Display**: Added unit column to parameter table
- **API Integration**: Updated to handle unit field in create/update operations

### 4. API Updates

#### Product Parameters Routes
- **POST /api/product-parameters**: Now accepts and stores `unit` field
- **PUT /api/product-parameters/:id**: Updated to handle `unit` field updates
- **Database Queries**: Updated to include unit column in all operations

### 5. Data Flow Changes

#### Before (TestParameters)
```
TestForm → TestParameter (id, name, unit, minValue, maxValue, etc.)
```

#### After (ProductParameters)
```
TestForm → ProductParameterMapping (id, parameter_name, unit, acceptable_min/max, etc.)
```

## Benefits

1. **Product-Specific Configuration**: Each product can have its own parameter settings
2. **Flexible Validation**: Different acceptable ranges per product
3. **Proper Unit Management**: Units are stored with parameters
4. **Database-Driven**: All validation logic uses database values
5. **Scalable**: Easy to add new products and parameters

## Usage

### Setting Up Product Parameters

1. Navigate to Settings → Product Parameter Manager
2. Add product parameters with:
   - Product Name
   - Parameter Name
   - Unit
   - Acceptable Range (min/max)
   - Warning Range (min/max)
   - Critical Range (min/max)

### Using in Test Entry

1. Select a production order
2. The system automatically loads product-specific parameters
3. Select parameters from the dropdown (shows parameter name and unit)
4. Enter test values
5. System validates against product-specific ranges
6. Status is determined based on product parameter settings

## Migration Notes

- Existing `test_parameters` table remains unchanged
- New `product_parameters` table is used for test entry
- Unit field is optional (shows as 'N/A' if not set)
- Existing data in `product_parameters` may have null units (can be updated via ProductParameterManager)
- **API Compatibility**: The test results API now accepts both `test_parameters.id` and `parameter_name` for the `parameterId` field
- **Automatic Mapping**: Missing test parameters are automatically created when needed

## Testing

Run the test script to verify functionality:
```bash
node test-product-parameters.js
```

This will:
- Create sample product parameters
- Test API endpoints
- Verify database integration
- Confirm proper data flow

## Files Modified

1. `server/src/database/migrate.js` - Added unit column
2. `src/types/index.ts` - Updated interface
3. `src/components/test-entry/TestForm.tsx` - Complete refactor
4. `src/components/test-entry/TestEntry.tsx` - Updated data flow
5. `src/components/test-entry/TestHistory.tsx` - Updated interface
6. `src/components/settings/ProductParameterManager.tsx` - Added unit support
7. `server/src/routes/productParameters.js` - Updated API endpoints
8. `server/src/routes/testResults.js` - Added parameter name to ID mapping
9. `test-product-parameters.js` - Test script (new)
10. `check-test-parameters.js` - Database sync script (new)
11. `test-test-results-api.js` - API test script (new)

## Future Enhancements

1. **Bulk Import**: Add CSV import for product parameters
2. **Parameter Templates**: Create reusable parameter templates
3. **Advanced Validation**: Add custom validation rules per parameter
4. **Unit Conversion**: Support for unit conversions
5. **Parameter Dependencies**: Link parameters that depend on each other 