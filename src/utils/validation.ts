import { ValidationError, ProductionOrder, TestResult } from '../types';

export const validateOrderNumber = (orderNumber: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!orderNumber) {
    errors.push({
      field: 'orderNumber',
      message: 'Order number is required',
      code: 'REQUIRED'
    });
  } else if (!/^[A-Z0-9]{6,12}$/.test(orderNumber)) {
    errors.push({
      field: 'orderNumber',
      message: 'Order number must be 6-12 alphanumeric characters',
      code: 'INVALID_FORMAT'
    });
  }
  
  return errors;
};

export const validateLineNumber = (lineNumber: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!lineNumber) {
    errors.push({
      field: 'lineNumber',
      message: 'Line number is required',
      code: 'REQUIRED'
    });
  } else if (lineNumber < 1 || lineNumber > 999) {
    errors.push({
      field: 'lineNumber',
      message: 'Line number must be between 1 and 999',
      code: 'OUT_OF_RANGE'
    });
  }
  
  return errors;
};

export const validateDateTime = (dateTime: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!dateTime) {
    errors.push({
      field: 'productionDateTime',
      message: 'Production date/time is required',
      code: 'REQUIRED'
    });
  } else {
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) {
      errors.push({
        field: 'productionDateTime',
        message: 'Invalid date/time format. Use ISO 8601 format',
        code: 'INVALID_FORMAT'
      });
    } else if (date > new Date()) {
      errors.push({
        field: 'productionDateTime',
        message: 'Production date/time cannot be in the future',
        code: 'FUTURE_DATE'
      });
    }
  }
  
  return errors;
};

export const validateOperatorId = (operatorId: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!operatorId) {
    errors.push({
      field: 'operatorId',
      message: 'Operator ID is required',
      code: 'REQUIRED'
    });
  } else if (!/^[A-Z0-9]{3,8}$/.test(operatorId)) {
    errors.push({
      field: 'operatorId',
      message: 'Operator ID must be 3-8 alphanumeric characters',
      code: 'INVALID_FORMAT'
    });
  }
  
  return errors;
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

export const validateProductionOrder = (order: Partial<ProductionOrder>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  errors.push(...validateOrderNumber(order.orderNumber || ''));
  errors.push(...validateLineNumber(order.lineNumber || 0));
  errors.push(...validateDateTime(order.productionDateTime || ''));
  errors.push(...validateOperatorId(order.operatorId || ''));
  
  return errors;
};

export const checkDuplicateOrder = (orderNumber: string, existingOrders: ProductionOrder[]): boolean => {
  return existingOrders.some(order => order.orderNumber === orderNumber);
};

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

export const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors.map(error => `${error.field}: ${error.message}`).join('; ');
};

export const generateOrderId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORD${timestamp}${random}`;
};