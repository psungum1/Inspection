import express from 'express';
import { getSqlServerConnection } from '../database/sqlServer.js';

const router = express.Router();

// GET /api/production/RE1_1-PH
router.get('/RE1_1-PH', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const sqlPool = await getSqlServerConnection();

    // Default: last 100 minutes
    const start = startDate || new Date(Date.now() - 100 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    const query = `
      USE runtime;
      SET NOCOUNT ON;
      DECLARE @StartDate DateTime;
      DECLARE @EndDate DateTime;
      SET @StartDate = DateAdd(mi,-100,GetDate())
      SET @EndDate = GetDate()
      SET NOCOUNT OFF;
      SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
        MinRaw = ISNULL(Cast(AnalogTag.MinRaw as VarChar(20)),'N/A'),
        MaxRaw = ISNULL(Cast(AnalogTag.MaxRaw as VarChar(20)),'N/A'),
        MinEU = ISNULL(Cast(AnalogTag.MinEU as VarChar(20)),'N/A'),
        MaxEU = ISNULL(Cast(AnalogTag.MaxEU as VarChar(20)),'N/A'),
        Unit = ISNULL(Cast(EngineeringUnit.Unit as nVarChar(20)),'N/A'),
        Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
      FROM (
        SELECT *
        FROM History
        WHERE History.TagName IN ('RE1_1_PHB.PV')
          AND wwRetrievalMode = 'Cyclic'
          AND wwCycleCount = 100
          AND wwQualityRule = 'Extended'
          AND wwVersion = 'Latest'
          AND DateTime >= @StartDate
          AND DateTime <= @EndDate
      ) temp
      LEFT JOIN AnalogTag ON AnalogTag.TagName = temp.TagName
      LEFT JOIN EngineeringUnit ON AnalogTag.EUKey = EngineeringUnit.EUKey
      LEFT JOIN QualityMap ON QualityMap.QualityDetail = temp.QualityDetail
      WHERE temp.StartDateTime >= @StartDate
    `;

    const request = sqlPool.request();


    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch production rate', details: err.message });
  }
});
router.get('/RE1_2-PH', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const sqlPool = await getSqlServerConnection();
  
      // Default: last 100 minutes
      const start = startDate || new Date(Date.now() - 100 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
  
      const query = `
        USE runtime;
        SET NOCOUNT ON;
        DECLARE @StartDate DateTime;
        DECLARE @EndDate DateTime;
        SET @StartDate = DateAdd(mi,-100,GetDate())
        SET @EndDate = GetDate()
        SET NOCOUNT OFF;
        SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
          MinRaw = ISNULL(Cast(AnalogTag.MinRaw as VarChar(20)),'N/A'),
          MaxRaw = ISNULL(Cast(AnalogTag.MaxRaw as VarChar(20)),'N/A'),
          MinEU = ISNULL(Cast(AnalogTag.MinEU as VarChar(20)),'N/A'),
          MaxEU = ISNULL(Cast(AnalogTag.MaxEU as VarChar(20)),'N/A'),
          Unit = ISNULL(Cast(EngineeringUnit.Unit as nVarChar(20)),'N/A'),
          Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
        FROM (
          SELECT *
          FROM History
          WHERE History.TagName IN ('RE1_2_PHB.PV')
            AND wwRetrievalMode = 'Cyclic'
            AND wwCycleCount = 100
            AND wwQualityRule = 'Extended'
            AND wwVersion = 'Latest'
            AND DateTime >= @StartDate
            AND DateTime <= @EndDate
        ) temp
        LEFT JOIN AnalogTag ON AnalogTag.TagName = temp.TagName
        LEFT JOIN EngineeringUnit ON AnalogTag.EUKey = EngineeringUnit.EUKey
        LEFT JOIN QualityMap ON QualityMap.QualityDetail = temp.QualityDetail
        WHERE temp.StartDateTime >= @StartDate
      `;
  
      const request = sqlPool.request();
  
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch production rate', details: err.message });
    }
  });
router.get('/RE1_3-PH', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const sqlPool = await getSqlServerConnection();
  
      // Default: last 100 minutes
      const start = startDate || new Date(Date.now() - 100 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
  
      const query = `
        USE runtime;
        SET NOCOUNT ON;
        DECLARE @StartDate DateTime;
        DECLARE @EndDate DateTime;
        SET @StartDate = DateAdd(mi,-100,GetDate())
        SET @EndDate = GetDate()
        SET NOCOUNT OFF;
        SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
          MinRaw = ISNULL(Cast(AnalogTag.MinRaw as VarChar(20)),'N/A'),
          MaxRaw = ISNULL(Cast(AnalogTag.MaxRaw as VarChar(20)),'N/A'),
          MinEU = ISNULL(Cast(AnalogTag.MinEU as VarChar(20)),'N/A'),
          MaxEU = ISNULL(Cast(AnalogTag.MaxEU as VarChar(20)),'N/A'),
          Unit = ISNULL(Cast(EngineeringUnit.Unit as nVarChar(20)),'N/A'),
          Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
        FROM (
          SELECT *
          FROM History
          WHERE History.TagName IN ('RE1_3_PHB.PV')
            AND wwRetrievalMode = 'Cyclic'
            AND wwCycleCount = 100
            AND wwQualityRule = 'Extended'
            AND wwVersion = 'Latest'
            AND DateTime >= @StartDate
            AND DateTime <= @EndDate
        ) temp
        LEFT JOIN AnalogTag ON AnalogTag.TagName = temp.TagName
        LEFT JOIN EngineeringUnit ON AnalogTag.EUKey = EngineeringUnit.EUKey
        LEFT JOIN QualityMap ON QualityMap.QualityDetail = temp.QualityDetail
        WHERE temp.StartDateTime >= @StartDate
      `;
  
      const request = sqlPool.request();
  
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch production rate', details: err.message });
    }
  });
router.get('/RE1_4-PH', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const sqlPool = await getSqlServerConnection();
  
      // Default: last 100 minutes
      const start = startDate || new Date(Date.now() - 100 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
  
      const query = `
        USE runtime;
        SET NOCOUNT ON;
        DECLARE @StartDate DateTime;
        DECLARE @EndDate DateTime;
        SET @StartDate = DateAdd(mi,-100,GetDate())
        SET @EndDate = GetDate()
        SET NOCOUNT OFF;
        SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
          MinRaw = ISNULL(Cast(AnalogTag.MinRaw as VarChar(20)),'N/A'),
          MaxRaw = ISNULL(Cast(AnalogTag.MaxRaw as VarChar(20)),'N/A'),
          MinEU = ISNULL(Cast(AnalogTag.MinEU as VarChar(20)),'N/A'),
          MaxEU = ISNULL(Cast(AnalogTag.MaxEU as VarChar(20)),'N/A'),
          Unit = ISNULL(Cast(EngineeringUnit.Unit as nVarChar(20)),'N/A'),
          Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
        FROM (
          SELECT *
          FROM History
          WHERE History.TagName IN ('RE1_4_PHB.PV')
            AND wwRetrievalMode = 'Cyclic'
            AND wwCycleCount = 100
            AND wwQualityRule = 'Extended'
            AND wwVersion = 'Latest'
            AND DateTime >= @StartDate
            AND DateTime <= @EndDate
        ) temp
        LEFT JOIN AnalogTag ON AnalogTag.TagName = temp.TagName
        LEFT JOIN EngineeringUnit ON AnalogTag.EUKey = EngineeringUnit.EUKey
        LEFT JOIN QualityMap ON QualityMap.QualityDetail = temp.QualityDetail
        WHERE temp.StartDateTime >= @StartDate
      `;
  
      const request = sqlPool.request();
  
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch production rate', details: err.message });
    }
  });
router.get('/RE1_5-PH', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const sqlPool = await getSqlServerConnection();
  
      // Default: last 100 minutes
      const start = startDate || new Date(Date.now() - 100 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
  
      const query = `
        USE runtime;
        SET NOCOUNT ON;
        DECLARE @StartDate DateTime;
        DECLARE @EndDate DateTime;
        SET @StartDate = DateAdd(mi,-100,GetDate())
        SET @EndDate = GetDate()
        SET NOCOUNT OFF;
        SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
          MinRaw = ISNULL(Cast(AnalogTag.MinRaw as VarChar(20)),'N/A'),
          MaxRaw = ISNULL(Cast(AnalogTag.MaxRaw as VarChar(20)),'N/A'),
          MinEU = ISNULL(Cast(AnalogTag.MinEU as VarChar(20)),'N/A'),
          MaxEU = ISNULL(Cast(AnalogTag.MaxEU as VarChar(20)),'N/A'),
          Unit = ISNULL(Cast(EngineeringUnit.Unit as nVarChar(20)),'N/A'),
          Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
        FROM (
          SELECT *
          FROM History
          WHERE History.TagName IN ('RE1_5_PHB.PV')
            AND wwRetrievalMode = 'Cyclic'
            AND wwCycleCount = 100
            AND wwQualityRule = 'Extended'
            AND wwVersion = 'Latest'
            AND DateTime >= @StartDate
            AND DateTime <= @EndDate
        ) temp
        LEFT JOIN AnalogTag ON AnalogTag.TagName = temp.TagName
        LEFT JOIN EngineeringUnit ON AnalogTag.EUKey = EngineeringUnit.EUKey
        LEFT JOIN QualityMap ON QualityMap.QualityDetail = temp.QualityDetail
        WHERE temp.StartDateTime >= @StartDate
      `;
  
      const request = sqlPool.request();
  
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch production rate', details: err.message });
    }
  });
router.get('/RE1_6-PH', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const sqlPool = await getSqlServerConnection();
  
      // Default: last 100 minutes
      const start = startDate || new Date(Date.now() - 100 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
  
      const query = `
        USE runtime;
        SET NOCOUNT ON;
        DECLARE @StartDate DateTime;
        DECLARE @EndDate DateTime;
        SET @StartDate = DateAdd(mi,-100,GetDate())
        SET @EndDate = GetDate()
        SET NOCOUNT OFF;
        SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
          MinRaw = ISNULL(Cast(AnalogTag.MinRaw as VarChar(20)),'N/A'),
          MaxRaw = ISNULL(Cast(AnalogTag.MaxRaw as VarChar(20)),'N/A'),
          MinEU = ISNULL(Cast(AnalogTag.MinEU as VarChar(20)),'N/A'),
          MaxEU = ISNULL(Cast(AnalogTag.MaxEU as VarChar(20)),'N/A'),
          Unit = ISNULL(Cast(EngineeringUnit.Unit as nVarChar(20)),'N/A'),
          Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
        FROM (
          SELECT *
          FROM History
          WHERE History.TagName IN ('RE1_6_PHB.PV')
            AND wwRetrievalMode = 'Cyclic'
            AND wwCycleCount = 100
            AND wwQualityRule = 'Extended'
            AND wwVersion = 'Latest'
            AND DateTime >= @StartDate
            AND DateTime <= @EndDate
        ) temp
        LEFT JOIN AnalogTag ON AnalogTag.TagName = temp.TagName
        LEFT JOIN EngineeringUnit ON AnalogTag.EUKey = EngineeringUnit.EUKey
        LEFT JOIN QualityMap ON QualityMap.QualityDetail = temp.QualityDetail
        WHERE temp.StartDateTime >= @StartDate
      `;
  
      const request = sqlPool.request();
  
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch production rate', details: err.message });
    }
  });

// GET /api/production/RE1_1-TCC
router.get('/RE1_1-TCC', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const sqlPool = await getSqlServerConnection();

    // Default: last 100 minutes
    const start = startDate || new Date(Date.now() - 100 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    const query = `
      USE runtime;
      SET NOCOUNT ON;
      DECLARE @StartDate DateTime;
      DECLARE @EndDate DateTime;
      SET @StartDate = DateAdd(mi,-100,GetDate())
      SET @EndDate = GetDate()
      SET NOCOUNT OFF;
      SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
        MinRaw = ISNULL(Cast(AnalogTag.MinRaw as VarChar(20)),'N/A'),
        MaxRaw = ISNULL(Cast(AnalogTag.MaxRaw as VarChar(20)),'N/A'),
        MinEU = ISNULL(Cast(AnalogTag.MinEU as VarChar(20)),'N/A'),
        MaxEU = ISNULL(Cast(AnalogTag.MaxEU as VarChar(20)),'N/A'),
        Unit = ISNULL(Cast(EngineeringUnit.Unit as nVarChar(20)),'N/A'),
        Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
      FROM (
        SELECT *
        FROM History
        WHERE History.TagName IN ('RE1_1_TCC.PV')
          AND wwRetrievalMode = 'Cyclic'
          AND wwCycleCount = 100
          AND wwQualityRule = 'Extended'
          AND wwVersion = 'Latest'
          AND DateTime >= @StartDate
          AND DateTime <= @EndDate
      ) temp
      LEFT JOIN AnalogTag ON AnalogTag.TagName = temp.TagName
      LEFT JOIN EngineeringUnit ON AnalogTag.EUKey = EngineeringUnit.EUKey
      LEFT JOIN QualityMap ON QualityMap.QualityDetail = temp.QualityDetail
      WHERE temp.StartDateTime >= @StartDate
    `;

    const request = sqlPool.request();


    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch production rate', details: err.message });
  }
});
router.get('/RE1_2-TCC', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const sqlPool = await getSqlServerConnection();
  
      // Default: last 100 minutes
      const start = startDate || new Date(Date.now() - 100 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
  
      const query = `
        USE runtime;
        SET NOCOUNT ON;
        DECLARE @StartDate DateTime;
        DECLARE @EndDate DateTime;
        SET @StartDate = DateAdd(mi,-100,GetDate())
        SET @EndDate = GetDate()
        SET NOCOUNT OFF;
        SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
          MinRaw = ISNULL(Cast(AnalogTag.MinRaw as VarChar(20)),'N/A'),
          MaxRaw = ISNULL(Cast(AnalogTag.MaxRaw as VarChar(20)),'N/A'),
          MinEU = ISNULL(Cast(AnalogTag.MinEU as VarChar(20)),'N/A'),
          MaxEU = ISNULL(Cast(AnalogTag.MaxEU as VarChar(20)),'N/A'),
          Unit = ISNULL(Cast(EngineeringUnit.Unit as nVarChar(20)),'N/A'),
          Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
        FROM (
          SELECT *
          FROM History
          WHERE History.TagName IN ('RE1_2_TCC.PV')
            AND wwRetrievalMode = 'Cyclic'
            AND wwCycleCount = 100
            AND wwQualityRule = 'Extended'
            AND wwVersion = 'Latest'
            AND DateTime >= @StartDate
            AND DateTime <= @EndDate
        ) temp
        LEFT JOIN AnalogTag ON AnalogTag.TagName = temp.TagName
        LEFT JOIN EngineeringUnit ON AnalogTag.EUKey = EngineeringUnit.EUKey
        LEFT JOIN QualityMap ON QualityMap.QualityDetail = temp.QualityDetail
        WHERE temp.StartDateTime >= @StartDate
      `;
  
      const request = sqlPool.request();
  
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch production rate', details: err.message });
    }
  });
router.get('/RE1_3-TCC', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const sqlPool = await getSqlServerConnection();
  
      // Default: last 100 minutes
      const start = startDate || new Date(Date.now() - 100 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
  
      const query = `
        USE runtime;
        SET NOCOUNT ON;
        DECLARE @StartDate DateTime;
        DECLARE @EndDate DateTime;
        SET @StartDate = DateAdd(mi,-100,GetDate())
        SET @EndDate = GetDate()
        SET NOCOUNT OFF;
        SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
          MinRaw = ISNULL(Cast(AnalogTag.MinRaw as VarChar(20)),'N/A'),
          MaxRaw = ISNULL(Cast(AnalogTag.MaxRaw as VarChar(20)),'N/A'),
          MinEU = ISNULL(Cast(AnalogTag.MinEU as VarChar(20)),'N/A'),
          MaxEU = ISNULL(Cast(AnalogTag.MaxEU as VarChar(20)),'N/A'),
          Unit = ISNULL(Cast(EngineeringUnit.Unit as nVarChar(20)),'N/A'),
          Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
        FROM (
          SELECT *
          FROM History
          WHERE History.TagName IN ('RE1_3_TCC.PV')
            AND wwRetrievalMode = 'Cyclic'
            AND wwCycleCount = 100
            AND wwQualityRule = 'Extended'
            AND wwVersion = 'Latest'
            AND DateTime >= @StartDate
            AND DateTime <= @EndDate
        ) temp
        LEFT JOIN AnalogTag ON AnalogTag.TagName = temp.TagName
        LEFT JOIN EngineeringUnit ON AnalogTag.EUKey = EngineeringUnit.EUKey
        LEFT JOIN QualityMap ON QualityMap.QualityDetail = temp.QualityDetail
        WHERE temp.StartDateTime >= @StartDate
      `;
  
      const request = sqlPool.request();
  
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch production rate', details: err.message });
    }
  });
router.get('/RE1_4-TCC', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const sqlPool = await getSqlServerConnection();
  
      // Default: last 100 minutes
      const start = startDate || new Date(Date.now() - 100 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
  
      const query = `
        USE runtime;
        SET NOCOUNT ON;
        DECLARE @StartDate DateTime;
        DECLARE @EndDate DateTime;
        SET @StartDate = DateAdd(mi,-100,GetDate())
        SET @EndDate = GetDate()
        SET NOCOUNT OFF;
        SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
          MinRaw = ISNULL(Cast(AnalogTag.MinRaw as VarChar(20)),'N/A'),
          MaxRaw = ISNULL(Cast(AnalogTag.MaxRaw as VarChar(20)),'N/A'),
          MinEU = ISNULL(Cast(AnalogTag.MinEU as VarChar(20)),'N/A'),
          MaxEU = ISNULL(Cast(AnalogTag.MaxEU as VarChar(20)),'N/A'),
          Unit = ISNULL(Cast(EngineeringUnit.Unit as nVarChar(20)),'N/A'),
          Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
        FROM (
          SELECT *
          FROM History
          WHERE History.TagName IN ('RE1_4_TCC.PV')
            AND wwRetrievalMode = 'Cyclic'
            AND wwCycleCount = 100
            AND wwQualityRule = 'Extended'
            AND wwVersion = 'Latest'
            AND DateTime >= @StartDate
            AND DateTime <= @EndDate
        ) temp
        LEFT JOIN AnalogTag ON AnalogTag.TagName = temp.TagName
        LEFT JOIN EngineeringUnit ON AnalogTag.EUKey = EngineeringUnit.EUKey
        LEFT JOIN QualityMap ON QualityMap.QualityDetail = temp.QualityDetail
        WHERE temp.StartDateTime >= @StartDate
      `;
  
      const request = sqlPool.request();
  
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch production rate', details: err.message });
    }
  });
router.get('/RE1_5-TCC', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const sqlPool = await getSqlServerConnection();
  
      // Default: last 100 minutes
      const start = startDate || new Date(Date.now() - 100 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
  
      const query = `
        USE runtime;
        SET NOCOUNT ON;
        DECLARE @StartDate DateTime;
        DECLARE @EndDate DateTime;
        SET @StartDate = DateAdd(mi,-100,GetDate())
        SET @EndDate = GetDate()
        SET NOCOUNT OFF;
        SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
          MinRaw = ISNULL(Cast(AnalogTag.MinRaw as VarChar(20)),'N/A'),
          MaxRaw = ISNULL(Cast(AnalogTag.MaxRaw as VarChar(20)),'N/A'),
          MinEU = ISNULL(Cast(AnalogTag.MinEU as VarChar(20)),'N/A'),
          MaxEU = ISNULL(Cast(AnalogTag.MaxEU as VarChar(20)),'N/A'),
          Unit = ISNULL(Cast(EngineeringUnit.Unit as nVarChar(20)),'N/A'),
          Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
        FROM (
          SELECT *
          FROM History
          WHERE History.TagName IN ('RE1_5_TCC.PV')
            AND wwRetrievalMode = 'Cyclic'
            AND wwCycleCount = 100
            AND wwQualityRule = 'Extended'
            AND wwVersion = 'Latest'
            AND DateTime >= @StartDate
            AND DateTime <= @EndDate
        ) temp
        LEFT JOIN AnalogTag ON AnalogTag.TagName = temp.TagName
        LEFT JOIN EngineeringUnit ON AnalogTag.EUKey = EngineeringUnit.EUKey
        LEFT JOIN QualityMap ON QualityMap.QualityDetail = temp.QualityDetail
        WHERE temp.StartDateTime >= @StartDate
      `;
  
      const request = sqlPool.request();
  
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch production rate', details: err.message });
    }
  });
router.get('/RE1_6-TCC', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const sqlPool = await getSqlServerConnection();
  
      // Default: last 100 minutes
      const start = startDate || new Date(Date.now() - 100 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
  
      const query = `
        USE runtime;
        SET NOCOUNT ON;
        DECLARE @StartDate DateTime;
        DECLARE @EndDate DateTime;
        SET @StartDate = DateAdd(mi,-100,GetDate())
        SET @EndDate = GetDate()
        SET NOCOUNT OFF;
        SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
          MinRaw = ISNULL(Cast(AnalogTag.MinRaw as VarChar(20)),'N/A'),
          MaxRaw = ISNULL(Cast(AnalogTag.MaxRaw as VarChar(20)),'N/A'),
          MinEU = ISNULL(Cast(AnalogTag.MinEU as VarChar(20)),'N/A'),
          MaxEU = ISNULL(Cast(AnalogTag.MaxEU as VarChar(20)),'N/A'),
          Unit = ISNULL(Cast(EngineeringUnit.Unit as nVarChar(20)),'N/A'),
          Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
        FROM (
          SELECT *
          FROM History
          WHERE History.TagName IN ('RE1_6_TCC.PV')
            AND wwRetrievalMode = 'Cyclic'
            AND wwCycleCount = 100
            AND wwQualityRule = 'Extended'
            AND wwVersion = 'Latest'
            AND DateTime >= @StartDate
            AND DateTime <= @EndDate
        ) temp
        LEFT JOIN AnalogTag ON AnalogTag.TagName = temp.TagName
        LEFT JOIN EngineeringUnit ON AnalogTag.EUKey = EngineeringUnit.EUKey
        LEFT JOIN QualityMap ON QualityMap.QualityDetail = temp.QualityDetail
        WHERE temp.StartDateTime >= @StartDate
      `;
  
      const request = sqlPool.request();
  
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch production rate', details: err.message });
    }
  });

// Generic API for PH and TCC data by lot pattern and time range
router.get('/data/ph-tcc', async (req, res) => {
  try {
    const { lotPattern, startDate, endDate, dataType } = req.query;
    console.log(startDate);
    console.log(endDate);
    if (!lotPattern || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'lotPattern, startDate, and endDate are required' 
      });
    }

    if (!['1', '2', '3', '4', '5', '6'].includes(lotPattern)) {
      return res.status(400).json({ 
        error: 'lotPattern must be 1, 2, 3, 4, 5, or 6' 
      });
    }

    const sqlPool = await getSqlServerConnection();
    
    // Shift provided times to UTC+7 and format for SQL Server (YYYY-MM-DD HH:mm:ss)
    const parseStart = new Date(startDate);
    const parseEnd = new Date(endDate);
    if (isNaN(parseStart.getTime()) || isNaN(parseEnd.getTime())) {
      return res.status(400).json({ error: 'Invalid startDate or endDate' });
    }
    const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);
    const formatForSql = (date) => date.toISOString().slice(0, 19).replace('T', ' ');
    const startDatePlus7 = formatForSql(addHours(parseStart, 7));
    const endDatePlus7 = formatForSql(addHours(parseEnd, 7));
    
    // Determine tag name based on lot pattern and data type
    let tagName;
    if (dataType === 'tcc') {
      tagName = `RE1_${lotPattern}_TCC.PV`;
    } else {
      // Default to PH
      tagName = `RE1_${lotPattern}_PHB.PV`;
    }

    console.log(`Fetching ${dataType || 'PH'} data for lot pattern ${lotPattern}, tag: ${tagName}`);
    console.log(`Date range (original): ${startDate} to ${endDate}`);
    console.log(`Date range (UTC+7): ${startDatePlus7} to ${endDatePlus7}`);

    const query = `
      USE runtime;
      SET NOCOUNT ON;
      DECLARE @StartDate DateTime;
      DECLARE @EndDate DateTime;
      SET @StartDate = '${startDatePlus7}';
      SET @EndDate = '${endDatePlus7}';
      SET NOCOUNT OFF;
      SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
        MinRaw = ISNULL(Cast(AnalogTag.MinRaw as VarChar(20)),'N/A'),
        MaxRaw = ISNULL(Cast(AnalogTag.MaxRaw as VarChar(20)),'N/A'),
        MinEU = ISNULL(Cast(AnalogTag.MinEU as VarChar(20)),'N/A'),
        MaxEU = ISNULL(Cast(AnalogTag.MaxEU as VarChar(20)),'N/A'),
        Unit = ISNULL(Cast(EngineeringUnit.Unit as nVarChar(20)),'N/A'),
        Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
      FROM (
        SELECT *
        FROM History
        WHERE History.TagName IN ('${tagName}')
          AND wwRetrievalMode = 'Cyclic'
          AND wwCycleCount = 100
          AND wwQualityRule = 'Extended'
          AND wwVersion = 'Latest'
          AND DateTime >= @StartDate
          AND DateTime <= @EndDate
      ) temp
      LEFT JOIN AnalogTag ON AnalogTag.TagName = temp.TagName
      LEFT JOIN EngineeringUnit ON AnalogTag.EUKey = EngineeringUnit.EUKey
      LEFT JOIN QualityMap ON QualityMap.QualityDetail = temp.QualityDetail
      WHERE temp.StartDateTime >= @StartDate
      ORDER BY DateTime ASC
    `;

    console.log('Executing SQL query:', query);

    const request = sqlPool.request();
    const result = await request.query(query);
    
    console.log(`Query returned ${result.recordset.length} records`);
    
    res.json({
      success: true,
      data: result.recordset,
      metadata: {
        lotPattern,
        dataType: dataType || 'ph',
        tagName,
        startDate,
        endDate,
        recordCount: result.recordset.length
      }
    });

  } catch (err) {
    console.error('Error fetching PH/TCC data:', err);
    res.status(500).json({ 
      error: 'Failed to fetch PH/TCC data', 
      details: err.message 
    });
  }
});

// Check available tags in SQL Server
router.get('/data/available-tags', async (req, res) => {
  try {
    const sqlPool = await getSqlServerConnection();
    
    const query = `
      USE runtime;
      SELECT DISTINCT TagName 
      FROM History 
      WHERE TagName LIKE 'RE1_%_PHB.PV' OR TagName LIKE 'RE1_%_TCC.PV'
      ORDER BY TagName
    `;

    const request = sqlPool.request();
    const result = await request.query(query);
    
    res.json({
      success: true,
      tags: result.recordset.map(row => row.TagName)
    });

  } catch (err) {
    console.error('Error fetching available tags:', err);
    res.status(500).json({ 
      error: 'Failed to fetch available tags', 
      details: err.message 
    });
  }
});

export default router; 