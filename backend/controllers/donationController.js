const { pool } = require('../config/database');
const crypto = require('crypto');

const generateId = (prefix) => `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const createDonation = async (req, res, next) => {
  try {
    const item_name = req.body.item_name || req.body.itemName;
    const category = req.body.category;
    const description = req.body.description;
    const condition_state = req.body.condition_state || req.body.condition || 'Good';
    const quantity = parseInt(req.body.quantity, 10) || 1;
    const address = req.body.address;
    const city = req.body.city;
    const pincode = req.body.pincode;
    const pickup_date = req.body.pickup_date || req.body.pickupDate || null;
    const additional_notes = req.body.additional_notes || req.body.additionalNotes || req.body.notes || null;
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
    const request_id = generateId('DON');
    
    if (!item_name || !category || !address || !city || !pincode) {
      return res.status(400).json({ message: 'Item name, category, address, city, and pincode are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO donations (request_id, user_id, item_name, category, description, condition_state, quantity, image, address, city, pincode, pickup_date, additional_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [request_id, req.user.id, item_name, category, description, condition_state, quantity, image, address, city, pincode, pickup_date, additional_notes]
    );

    await pool.query(
      `INSERT INTO request_status_history (request_type, request_db_id, status, updated_by, notes) VALUES (?, ?, ?, ?, ?)`,
      ['donation', result.insertId, 'PENDING', req.user.id, 'Donation requested']
    );

    // Get all approved NGOs in the same city to notify them (simplification)
    try {
      const [ngos] = await pool.query(`SELECT user_id FROM ngos n JOIN users u ON n.user_id = u.id WHERE n.verification_status = 'approved' AND u.city = ?`, [city]);
      for (const ngo of ngos) {
        await pool.query(`INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
        [ngo.user_id, 'New Donation Available', `A new donation for ${category} is available in your city.`, 'donation_alert', result.insertId, 'donation']);
      }
    } catch (notifErr) {
      console.warn('Could not send notification:', notifErr.message);
    }

    res.status(201).json({ message: 'Donation created successfully', id: result.insertId, request_id });
  } catch (error) {
    next(error);
  }
};

const getDonations = async (req, res, next) => {
  try {
    const { status, category, history } = req.query;
    let query = 'SELECT d.*, u.name as donor_name, u.phone as donor_phone, u.email as donor_email, n.ngo_name FROM donations d JOIN users u ON d.user_id = u.id LEFT JOIN ngos n ON d.ngo_id = n.id WHERE 1=1';
    const params = [];

    if (req.user.role === 'user') {
      query += ' AND d.user_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'ngo') {
      const [ngo] = await pool.query('SELECT id FROM ngos WHERE user_id = ?', [req.user.id]);
      const ngoId = ngo && ngo.length > 0 ? ngo[0].id : -1;
      
      if (history === 'true' || history === '1') {
        // Only return received/completed donations for this NGO
        query += ' AND d.ngo_id = ? AND (d.status = "RECEIVED" OR d.status = "COMPLETED")';
        params.push(ngoId);
      } else {
        query += ' AND (d.status = "PENDING" OR d.ngo_id = ?)';
        params.push(ngoId);
      }
    }

    if (status && status !== 'all' && status !== 'ALL') {
      query += ' AND d.status = ?';
      params.push(status);
    }
    if (category && category !== 'all' && category !== 'ALL') {
      query += ' AND d.category = ?';
      params.push(category);
    }

    query += ' ORDER BY d.created_at DESC';
    const [donations] = await pool.query(query, params);
    res.json(donations);
  } catch (error) {
    next(error);
  }
};

const getDonationById = async (req, res, next) => {
  try {
    const [donations] = await pool.query('SELECT d.*, u.name as donor_name, u.phone as donor_phone, u.email as donor_email FROM donations d JOIN users u ON d.user_id = u.id WHERE d.id = ?', [req.params.id]);
    if (donations.length === 0) return res.status(404).json({ message: 'Donation not found' });
    
    let donation = donations[0];
    if (donation.ngo_id) {
      const [ngos] = await pool.query('SELECT * FROM ngos WHERE id = ?', [donation.ngo_id]);
      donation.ngo_details = ngos[0];
    }

    const [history] = await pool.query(
      'SELECT rsh.*, u.name as updated_by_name, u.role as updated_by_role FROM request_status_history rsh LEFT JOIN users u ON rsh.updated_by = u.id WHERE rsh.request_type = "donation" AND rsh.request_db_id = ? ORDER BY rsh.created_at ASC',
      [donation.id]
    );
    donation.history = history || [];

    res.json(donation);
  } catch (error) {
    next(error);
  }
};

const updateDonationStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;
    
    const [donation] = await pool.query('SELECT * FROM donations WHERE id = ?', [id]);
    if (donation.length === 0) return res.status(404).json({ message: 'Not found' });
    
    let updateQuery = 'UPDATE donations SET status = ?';
    const updateParams = [status];
    
    if (req.user.role === 'ngo') {
      const [ngo] = await pool.query('SELECT id FROM ngos WHERE user_id = ?', [req.user.id]);
      if (ngo.length > 0 && !donation[0].ngo_id) {
        updateQuery += ', ngo_id = ?';
        updateParams.push(ngo[0].id);
      }
    }
    
    updateQuery += ' WHERE id = ?';
    updateParams.push(id);
    
    await pool.query(updateQuery, updateParams);
    
    const defaultNote = status === 'RECEIVED' 
      ? (notes || 'Item received and verified by NGO.')
      : status === 'COMPLETED'
      ? (notes || 'Donation completed and distributed.')
      : (notes || `Status updated to ${status}`);

    await pool.query(
      `INSERT INTO request_status_history (request_type, request_db_id, status, updated_by, notes) VALUES (?, ?, ?, ?, ?)`,
      ['donation', id, status, req.user.id, defaultNote]
    );

    // Notify donor user
    await pool.query(`INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
      [donation[0].user_id, 'Donation Update', `Your donation ${donation[0].request_id} is now ${status}`, 'donation_status', id, 'donation']);

    if (status === 'COMPLETED' || status === 'RECEIVED') {
      const [existingImpact] = await pool.query('SELECT id FROM impact_records WHERE request_type = "donation" AND request_db_id = ?', [id]);
      if (existingImpact.length === 0) {
        await pool.query(
          `INSERT INTO impact_records (user_id, request_type, request_db_id, items_count, impact_score, co2_saved_kg) VALUES (?, ?, ?, ?, ?, ?)`,
          [donation[0].user_id, 'donation', id, donation[0].quantity || 1, (donation[0].quantity || 1) * 5, (donation[0].quantity || 1) * 2.5]
        );
      }
    }

    res.json({ message: `Donation marked as ${status} successfully`, status });
  } catch (error) {
    next(error);
  }
};

const getMyDonations = async (req, res, next) => {
  try {
    const [donations] = await pool.query(
      'SELECT d.*, n.ngo_name FROM donations d LEFT JOIN ngos n ON d.ngo_id = n.id WHERE d.user_id = ? ORDER BY d.created_at DESC',
      [req.user.id]
    );
    res.json(donations);
  } catch (error) {
    next(error);
  }
};

module.exports = { createDonation, getDonations, getDonationById, updateDonationStatus, getMyDonations };
