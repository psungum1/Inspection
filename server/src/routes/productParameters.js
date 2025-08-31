// server/src/routes/productParameters.js
import express from 'express';
import pool from '../database/config.js';

const router = express.Router();

// GET: ดึง parameter ตาม product_name
router.get('/', async (req, res) => {
  const { product_name } = req.query;
  try {
    let result;
    if (product_name) {
      result = await pool.query(
        'SELECT * FROM product_parameters WHERE product_name = $1 ORDER BY parameter_order',
        [product_name]
      );
    } else {
      result = await pool.query(
        'SELECT * FROM product_parameters ORDER BY product_name, parameter_order'
      );
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: เพิ่ม mapping
router.post('/', async (req, res) => {
  const { product_name, parameter_name, parameter_order, unit,
    acceptable_min, acceptable_max, warning_min, warning_max, critical_min, critical_max } = req.body;
  try {
    await pool.query(
      `INSERT INTO product_parameters 
        (product_name, parameter_name, parameter_order, unit, acceptable_min, acceptable_max, warning_min, warning_max, critical_min, critical_max)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [product_name, parameter_name, parameter_order, unit, acceptable_min, acceptable_max, warning_min, warning_max, critical_min, critical_max]
    );
    res.status(201).json({ message: 'Created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: แก้ไข mapping
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { product_name, parameter_name, parameter_order, unit,
    acceptable_min, acceptable_max, warning_min, warning_max, critical_min, critical_max } = req.body;
  try {
    await pool.query(
      `UPDATE product_parameters SET 
        product_name=$1, parameter_name=$2, parameter_order=$3, unit=$4,
        acceptable_min=$5, acceptable_max=$6, warning_min=$7, warning_max=$8, critical_min=$9, critical_max=$10
       WHERE id=$11`,
      [product_name, parameter_name, parameter_order, unit, acceptable_min, acceptable_max, warning_min, warning_max, critical_min, critical_max, id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: ลบ mapping
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM product_parameters WHERE id=$1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;