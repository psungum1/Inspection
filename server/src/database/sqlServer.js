import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const sqlConfig = {
  user: process.env.SQLSERVER_USER || 'your_user',
  password: process.env.SQLSERVER_PASSWORD || 'your_password',
  server: process.env.SQLSERVER_HOST || 'localhost',
  database: process.env.SQLSERVER_DB || 'your_db',
  port: parseInt(process.env.SQLSERVER_PORT) || 1433,
  options: {
    encrypt: false, // true ถ้าใช้ Azure หรือจำเป็นต้องเข้ารหัส
    trustServerCertificate: true // สำหรับ local dev
  }
};

// Fallback data for testing when SQL Server is not available
const generateFallbackData = (tagName) => {
  const now = new Date();
  const baseValue = tagName.includes('TCC') ? 0.5 : 7.0; // TCC around 0.5%, PH around 7.0
  const variation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
  
  return {
    TagName: tagName,
    DateTime: now.toISOString().slice(0, 19).replace('T', ' '),
    Value: (baseValue + variation).toFixed(3),
    vValue: (baseValue + variation).toFixed(3),
    Quality: 'Good',
    QualityDetail: 'Good',
    QualityString: 'Good',
    Unit: tagName.includes('TCC') ? '%' : '',
    MinRaw: '0',
    MaxRaw: '100',
    MinEU: '0',
    MaxEU: '100'
  };
};

let connectionPool = null;
let connectionError = null;

export async function getSqlServerConnection() {
  try {
    // If we already have a connection pool, return it
    if (connectionPool) {
      return connectionPool;
    }

    // Try to connect to SQL Server
    connectionPool = await sql.connect(sqlConfig);
    connectionError = null;
    console.log('✅ SQL Server connected successfully');
    return connectionPool;
  } catch (err) {
    connectionError = err;
    console.warn('⚠️ SQL Server connection failed, using fallback data:', err.message);
    
    // Return a mock pool that provides fallback data
    return {
      request: () => ({
        query: async (queryString) => {
          console.log('📊 Using fallback data for query:', queryString.substring(0, 100) + '...');
          
          // Extract tag names from query if possible
          const tagMatch = queryString.match(/TagName\s*=\s*['"]([^'"]+)['"]/);
          const tagName = tagMatch ? tagMatch[1] : 'RE1_1_TCC.PV';
          
          // Generate multiple data points for realistic simulation
          const records = [];
          const now = new Date();
          
          for (let i = 0; i < 10; i++) {
            const timeOffset = i * 2 * 60 * 1000; // 2 minutes apart
            const dataPoint = generateFallbackData(tagName);
            dataPoint.DateTime = new Date(now.getTime() - timeOffset).toISOString().slice(0, 19).replace('T', ' ');
            records.push(dataPoint);
          }
          
          return {
            recordset: records,
            rowsAffected: [records.length]
          };
        }
      }),
      close: () => {
        console.log('🔌 Mock SQL Server connection closed');
      }
    };
  }
}

// Function to check if SQL Server is available
export function isSqlServerAvailable() {
  return connectionError === null;
}

// Function to get connection status
export function getConnectionStatus() {
  if (connectionError) {
    return {
      status: 'disconnected',
      error: connectionError.message,
      usingFallback: true
    };
  }
  return {
    status: 'connected',
    usingFallback: false
  };
}

export { sql }; 