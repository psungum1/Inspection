export interface CSVRow {
  Order_Number: string;
  Line_Number: string;
  Production_DateTime: string;
  Operator_ID: string;
}

export interface ParsedOrder {
  orderNumber: string;
  lineNumber: number;
  productionDateTime: string;
  operatorId: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  row?: number;
}

export interface ParseResult {
  success: boolean;
  orders: ParsedOrder[];
  errors: ValidationError[];
  totalRows: number;
  successfulRows: number;
}

export const parseCSV = (csvText: string): ParseResult => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Validate headers
  const requiredHeaders = ['Order_Number', 'Line_Number', 'Production_DateTime', 'Operator_ID'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    return {
      success: false,
      orders: [],
      errors: [{
        field: 'headers',
        message: `Missing required headers: ${missingHeaders.join(', ')}`,
        code: 'MISSING_HEADERS'
      }],
      totalRows: 0,
      successfulRows: 0
    };
  }
  
  const orders: ParsedOrder[] = [];
  const errors: ValidationError[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.trim());
    const row: CSVRow = {
      Order_Number: values[0] || '',
      Line_Number: values[1] || '',
      Production_DateTime: values[2] || '',
      Operator_ID: values[3] || ''
    };
    
    // Validate row data
    const rowErrors: ValidationError[] = [];
    
    if (!row.Order_Number) {
      rowErrors.push({
        field: 'Order_Number',
        message: 'Order number is required',
        code: 'REQUIRED_FIELD',
        row: i + 1
      });
    }
    
    if (!row.Line_Number || isNaN(Number(row.Line_Number))) {
      rowErrors.push({
        field: 'Line_Number',
        message: 'Line number must be a valid number',
        code: 'INVALID_NUMBER',
        row: i + 1
      });
    }
    
    if (!row.Production_DateTime) {
      rowErrors.push({
        field: 'Production_DateTime',
        message: 'Production date time is required',
        code: 'REQUIRED_FIELD',
        row: i + 1
      });
    } else {
      const date = new Date(row.Production_DateTime);
      if (isNaN(date.getTime())) {
        rowErrors.push({
          field: 'Production_DateTime',
          message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)',
          code: 'INVALID_DATE',
          row: i + 1
        });
      }
    }
    
    if (!row.Operator_ID) {
      rowErrors.push({
        field: 'Operator_ID',
        message: 'Operator ID is required',
        code: 'REQUIRED_FIELD',
        row: i + 1
      });
    }
    
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }
    
    // Convert to ParsedOrder
    orders.push({
      orderNumber: row.Order_Number,
      lineNumber: parseInt(row.Line_Number),
      productionDateTime: row.Production_DateTime,
      operatorId: row.Operator_ID
    });
  }
  
  return {
    success: errors.length === 0,
    orders,
    errors,
    totalRows: lines.length - 1,
    successfulRows: orders.length
  };
};

export const validateOrders = (orders: ParsedOrder[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  const orderNumbers = new Set<string>();
  
  orders.forEach((order, index) => {
    // Check for duplicate order numbers within the file
    if (orderNumbers.has(order.orderNumber)) {
      errors.push({
        field: 'Order_Number',
        message: `Duplicate order number: ${order.orderNumber}`,
        code: 'DUPLICATE_ORDER',
        row: index + 2 // +2 because index starts at 0 and we skip header row
      });
    } else {
      orderNumbers.add(order.orderNumber);
    }
    
    // Validate line number range
    if (order.lineNumber < 1 || order.lineNumber > 10) {
      errors.push({
        field: 'Line_Number',
        message: `Line number must be between 1 and 10, got: ${order.lineNumber}`,
        code: 'OUT_OF_RANGE',
        row: index + 2
      });
    }
    
    // Validate operator ID format
    if (!/^OP\d{3}$/.test(order.operatorId)) {
      errors.push({
        field: 'Operator_ID',
        message: `Operator ID must be in format OP###, got: ${order.operatorId}`,
        code: 'INVALID_FORMAT',
        row: index + 2
      });
    }
  });
  
  return errors;
}; 