const { pool } = require('../config/database');

const getPlatformImpact = async (req, res, next) => {
  try {
    const [impact] = await pool.query(`
      SELECT 
        SUM(waste_weight_kg) as total_waste_kg,
        SUM(items_count) as total_items,
        SUM(co2_saved_kg) as total_co2,
        COUNT(DISTINCT user_id) as active_contributors
      FROM impact_records
    `);
    
    const [[ngoCount]] = await pool.query('SELECT COUNT(*) as c FROM ngos WHERE verification_status="approved"');
    const [[dealerCount]] = await pool.query('SELECT COUNT(*) as c FROM scrap_dealers WHERE verification_status="approved"');
    const [[donationCount]] = await pool.query('SELECT COUNT(*) as c FROM donations');
    const [[recyclingCount]] = await pool.query('SELECT COUNT(*) as c FROM recycling_requests');
    const [[completedDonations]] = await pool.query('SELECT COUNT(*) as c FROM donations WHERE status="COMPLETED"');
    const [[completedRecycling]] = await pool.query('SELECT COUNT(*) as c FROM recycling_requests WHERE status="COMPLETED"');

    res.json({
      total_waste_kg: impact[0]?.total_waste_kg || 0,
      total_items: impact[0]?.total_items || 0,
      total_co2: impact[0]?.total_co2 || 0,
      active_contributors: impact[0]?.active_contributors || 0,
      ngos_connected: ngoCount?.c || 0,
      recycling_partners: dealerCount?.c || 0,
      total_donations: donationCount?.c || 0,
      total_recycling: recyclingCount?.c || 0,
      items_recycled: completedRecycling?.c || 0,
      items_donated: completedDonations?.c || 0,
    });
  } catch (error) {
    next(error);
  }
};

const getUserImpact = async (req, res, next) => {
  try {
    const [impact] = await pool.query(`
      SELECT 
        SUM(waste_weight_kg) as total_waste_kg,
        SUM(items_count) as total_items,
        SUM(co2_saved_kg) as total_co2,
        SUM(impact_score) as total_score
      FROM impact_records WHERE user_id = ?
    `, [req.user.id]);
    
    res.json({
      total_waste_kg: impact[0]?.total_waste_kg || 0,
      total_items: impact[0]?.total_items || 0,
      total_co2: impact[0]?.total_co2 || 0,
      total_score: impact[0]?.total_score || 0
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPlatformImpact, getUserImpact };
