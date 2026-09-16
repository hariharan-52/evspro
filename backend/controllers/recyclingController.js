const { pool } = require('../config/database');
const crypto = require('crypto');

const generateId = (prefix) => `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const createRecycling = async (req, res, next) => {
  try {
    const waste_category = req.body.waste_category || req.body.category;
    const description = req.body.description || null;
    const quantity = parseFloat(req.body.quantity) || 1.0;
    const quantity_unit = req.body.quantity_unit || req.body.unit || 'kg';
    const address = req.body.address;
    const city = req.body.city;
    const pincode = req.body.pincode;
    const pickup_date = req.body.pickup_date || req.body.pickupDate || null;
    const ai_prediction = req.body.ai_prediction || null;
    let image = req.body.image_url || req.body.image || null;
    if (req.file) {
      try {
        const fs = require('fs');
        const path = require('path');
        const fileBuffer = fs.readFileSync(req.file.path);
        const ext = path.extname(req.file.originalname).replace('.', '') || 'jpeg';
        const mime = req.file.mimetype || `image/${ext}`;
        image = `data:${mime};base64,${fileBuffer.toString('base64')}`;
      } catch (e) {
        image = req.file.filename;
      }
    }
    const request_id = generateId('REC');
    
    if (!waste_category || !address || !city || !pincode) {
      return res.status(400).json({ message: 'Waste category, address, city, and pincode are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO recycling_requests (request_id, user_id, waste_category, description, quantity, quantity_unit, image, address, city, pincode, pickup_date, ai_prediction, ai_confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [request_id, req.user.id, waste_category, description, quantity, quantity_unit, image, address, city, pincode, pickup_date, ai_prediction, ai_confidence]
    );

    await pool.query(
      `INSERT INTO request_status_history (request_type, request_db_id, status, updated_by, notes) VALUES (?, ?, ?, ?, ?)`,
      ['recycling', result.insertId, 'PENDING', req.user.id, 'Recycling requested']
    );

    try {
      const [dealers] = await pool.query(`SELECT user_id FROM scrap_dealers sd JOIN users u ON sd.user_id = u.id WHERE sd.verification_status = 'approved' AND u.city = ?`, [city]);
      for (const d of dealers) {
        await pool.query(`INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
        [d.user_id, 'New Recycling Request', `A new recycling request for ${waste_category} is available.`, 'recycling_alert', result.insertId, 'recycling']);
      }
    } catch (notifErr) {
      console.warn('Could not send notification:', notifErr.message);
    }

    res.status(201).json({ message: 'Request created successfully', id: result.insertId, request_id });
  } catch (error) {
    next(error);
  }
};

const getRecyclingRequests = async (req, res, next) => {
  try {
    const { status, category, history } = req.query;
    let query = 'SELECT r.*, u.name as user_name, u.phone as user_phone, u.email as user_email, sd.business_name as dealer_name FROM recycling_requests r JOIN users u ON r.user_id = u.id LEFT JOIN scrap_dealers sd ON r.scrap_dealer_id = sd.id WHERE 1=1';
    const params = [];

    if (req.user.role === 'user') {
      query += ' AND r.user_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'scrapdealer') {
      const [sd] = await pool.query('SELECT id FROM scrap_dealers WHERE user_id = ?', [req.user.id]);
      const dealerId = sd && sd.length > 0 ? sd[0].id : -1;
      
      if (history === 'true' || history === '1') {
        // Only return collected / completed recycling requests for this dealer
        query += ' AND r.scrap_dealer_id = ? AND (r.status = "COLLECTED" OR r.status = "COMPLETED")';
        params.push(dealerId);
      } else {
        query += ' AND (r.status = "PENDING" OR r.scrap_dealer_id = ?)';
        params.push(dealerId);
      }
    }

    if (status && status !== 'all' && status !== 'ALL') {
      query += ' AND r.status = ?';
      params.push(status);
    }
    if (category && category !== 'all' && category !== 'ALL') {
      query += ' AND r.waste_category = ?';
      params.push(category);
    }

    query += ' ORDER BY r.created_at DESC';
    const [requests] = await pool.query(query, params);
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

const getRecyclingById = async (req, res, next) => {
  try {
    const [requests] = await pool.query(
      'SELECT r.*, u.name as user_name, u.phone as user_phone, u.email as user_email FROM recycling_requests r JOIN users u ON r.user_id = u.id WHERE r.id = ?',
      [req.params.id]
    );
    if (requests.length === 0) return res.status(404).json({ message: 'Not found' });
    
    let reqData = requests[0];
    if (reqData.scrap_dealer_id) {
      const [sds] = await pool.query('SELECT * FROM scrap_dealers WHERE id = ?', [reqData.scrap_dealer_id]);
      reqData.scrap_dealer_details = sds[0];
    }

    const [history] = await pool.query(
      'SELECT rsh.*, u.name as updated_by_name, u.role as updated_by_role FROM request_status_history rsh LEFT JOIN users u ON rsh.updated_by = u.id WHERE rsh.request_type = "recycling" AND rsh.request_db_id = ? ORDER BY rsh.created_at ASC',
      [reqData.id]
    );
    reqData.history = history || [];

    res.json(reqData);
  } catch (error) {
    next(error);
  }
};

const updateRecyclingStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;
    
    const [request] = await pool.query('SELECT * FROM recycling_requests WHERE id = ?', [id]);
    if (request.length === 0) return res.status(404).json({ message: 'Not found' });
    
    let updateQuery = 'UPDATE recycling_requests SET status = ?';
    const updateParams = [status];
    
    if (req.user.role === 'scrapdealer') {
      const [sd] = await pool.query('SELECT id FROM scrap_dealers WHERE user_id = ?', [req.user.id]);
      if (sd.length > 0 && !request[0].scrap_dealer_id) {
        updateQuery += ', scrap_dealer_id = ?';
        updateParams.push(sd[0].id);
      }
    }
    
    updateQuery += ' WHERE id = ?';
    updateParams.push(id);
    
    await pool.query(updateQuery, updateParams);
    
    const defaultNote = status === 'COLLECTED' 
      ? (notes || 'Recyclable scrap materials collected and weighed at facility.')
      : status === 'COMPLETED'
      ? (notes || 'Materials processed, sorted, and sent for eco-friendly recycling.')
      : (notes || `Status updated to ${status}`);

    await pool.query(
      `INSERT INTO request_status_history (request_type, request_db_id, status, updated_by, notes) VALUES (?, ?, ?, ?, ?)`,
      ['recycling', id, status, req.user.id, defaultNote]
    );

    await pool.query(`INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
      [request[0].user_id, 'Recycling Update', `Your request ${request[0].request_id} is now ${status}`, 'recycling_status', id, 'recycling']);

    if (status === 'COMPLETED' || status === 'COLLECTED') {
      const [existingImpact] = await pool.query('SELECT id FROM impact_records WHERE request_type = "recycling" AND request_db_id = ?', [id]);
      const q = parseFloat(request[0].quantity) || 1;
      if (existingImpact.length === 0) {
        await pool.query(
          `INSERT INTO impact_records (user_id, request_type, request_db_id, waste_weight_kg, impact_score, co2_saved_kg) VALUES (?, ?, ?, ?, ?, ?)`,
          [request[0].user_id, 'recycling', id, q, q * 2, q * 1.5]
        );
      }
    }
    res.json({ message: `Recycling job marked as ${status} successfully`, status });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRecycling, getRecyclingRequests, getRecyclingById, updateRecyclingStatus };
