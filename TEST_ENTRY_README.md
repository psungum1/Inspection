# Test Data Entry Functionality

This document describes the test data entry functionality that allows users to enter and manage quality test results for production orders with full database integration.

## Features

- **Database Integration**: Loads orders and test results from PostgreSQL database
- **Real-time Data**: Saves test results directly to the database
- **Multi-round Testing**: Support for multiple rounds of testing per order
- **Parameter Validation**: Automatic validation based on test parameter specifications
- **Status Tracking**: Real-time status updates and completion tracking
- **Order Management**: Close orders when all tests are completed
- **Error Handling**: Comprehensive error handling and user feedback

## Database Schema

### Production Orders Table
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

### Test Results Table
```sql
CREATE TABLE test_results (
  id VARCHAR(50) PRIMARY KEY,
  order_number VARCHAR(50) REFERENCES production_orders(order_number),
  parameter_id VARCHAR(50) REFERENCES test_parameters(id),
  round INTEGER NOT NULL,
  value DECIMAL(10,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  operator_id VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL,
  comments TEXT,
  attachments TEXT[]
);
```

### Test Parameters Table
```sql
CREATE TABLE test_parameters (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  min_value DECIMAL(10,3) NOT NULL,
  max_value DECIMAL(10,3) NOT NULL,
  warning_min DECIMAL(10,3) NOT NULL,
  warning_max DECIMAL(10,3) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT
);
```

## API Endpoints

### Orders with Test Results
```
GET /api/orders/with-results
GET /api/orders/:orderNumber/with-results
```

### Test Results
```
GET /api/test-results?orderNumber=:orderNumber
GET /api/test-results/order/:orderNumber/round/:round
POST /api/test-results
PUT /api/test-results/:id
DELETE /api/test-results/:id
```

### Test Parameters
```
GET /api/test-parameters
GET /api/test-parameters/:id
POST /api/test-parameters
PUT /api/test-parameters/:id
DELETE /api/test-parameters/:id
```

### Order Status Updates
```
PATCH /api/orders/:orderNumber/status
```

## Frontend Components

### TestEntry Component
Main component that orchestrates the test entry process:
- Loads orders and test parameters from database
- Manages order selection and round management
- Handles test result submission and order closure
- Provides real-time status updates

### TestForm Component
Form component for entering individual test results:
- Parameter selection with validation
- Value input with real-time status preview
- Comments and attachments support
- Duplicate test prevention

### OrderSearch Component
Search and filter component for finding orders:
- Search by order number, line, or operator
- Filter by status and date range
- Real-time search results

### TestHistory Component
Displays test history for selected orders:
- Chronological test result display
- Round-based grouping
- Status indicators and trends

## Data Flow

1. **Component Mount**: Load orders and test parameters from database
2. **Order Selection**: User selects an order to test
3. **Round Management**: User selects or creates a new test round
4. **Test Entry**: User enters test results for each parameter
5. **Validation**: System validates values against parameter specifications
6. **Database Save**: Test results are saved to database
7. **Status Update**: Order status and completion tracking updated
8. **Order Closure**: When all tests complete, order can be closed

## Test Result Status Logic

The system automatically determines test result status based on parameter specifications:

- **Pass**: Value is within normal range (min_value ≤ value ≤ max_value)
- **Warning**: Value is within warning range but outside normal range
- **Fail**: Value is outside acceptable range

## Usage Instructions

### For Operators

1. **Navigate to Test Entry**: Go to the Test Entry page
2. **Select Order**: Search and select a production order to test
3. **Choose Round**: Select existing round or start a new one
4. **Enter Tests**: For each parameter:
   - Select the parameter from dropdown
   - Enter the measured value
   - Add comments if needed
   - Submit the result
5. **Complete Order**: When all parameters are tested, close the order

### For Quality Managers

1. **Monitor Progress**: View real-time completion status
2. **Review Results**: Check test history and trends
3. **Handle Failures**: Review failed tests and take action
4. **Close Orders**: Approve completed orders for closure

## Error Handling

### Common Error Scenarios

1. **Network Errors**: Automatic retry with user notification
2. **Validation Errors**: Real-time feedback on invalid values
3. **Duplicate Tests**: Prevention of duplicate parameter testing in same round
4. **Database Errors**: Graceful error handling with user-friendly messages
5. **Authentication Errors**: Redirect to login if token expires

### Error Recovery

- **Auto-save Drafts**: Test results can be saved as drafts
- **Session Persistence**: Form state preserved during navigation
- **Data Refresh**: Manual refresh option for stale data
- **Offline Support**: Queue operations for when connection restored

## Performance Optimizations

- **Lazy Loading**: Load test results only when needed
- **Caching**: Cache frequently accessed data
- **Batch Operations**: Group database operations where possible
- **Pagination**: Handle large datasets efficiently
- **Real-time Updates**: WebSocket support for live updates

## Security Features

- **Authentication**: JWT-based authentication required
- **Authorization**: Role-based access control
- **Input Validation**: Server-side validation of all inputs
- **SQL Injection Protection**: Parameterized queries
- **XSS Prevention**: Input sanitization and output encoding

## Testing

### Manual Testing
1. Start the server: `cd server && npm run dev`
2. Start the frontend: `npm run dev`
3. Navigate to Test Entry page
4. Test the complete workflow

### Automated Testing
Run the test script: `node test-test-entry.js`

### API Testing
Use the provided test script to verify all endpoints:
- Test result creation
- Test result retrieval
- Order status updates
- Parameter management

## Troubleshooting

### Common Issues

1. **Orders Not Loading**: Check database connection and authentication
2. **Test Results Not Saving**: Verify parameter IDs exist in database
3. **Status Not Updating**: Check order status update permissions
4. **Validation Errors**: Ensure parameter specifications are correct

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in environment variables.

### Database Issues

- Check PostgreSQL connection
- Verify table schemas match expected format
- Ensure foreign key constraints are satisfied
- Check for database locks or connection limits

## Future Enhancements

- **Bulk Test Entry**: Enter multiple test results at once
- **Mobile Support**: Responsive design for mobile devices
- **Offline Mode**: Full offline functionality with sync
- **Advanced Analytics**: Statistical analysis of test results
- **Integration**: Connect with external quality management systems
- **Notifications**: Real-time notifications for test completion
- **Audit Trail**: Comprehensive logging of all test activities 