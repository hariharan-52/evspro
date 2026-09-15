const { pool } = require('../config/database');

const getDashboardStats = async (req, res, next) => {
  try {
    const [[users]] = await pool.query('SELECT COUNT(*) as c FROM users WHERE role="user"');
    const [[ngos]] = await pool.query('SELECT COUNT(*) as c FROM ngos');
    const [[dealers]] = await pool.query('SELECT COUNT(*) as c FROM scrap_dealers');
    const [[donations]] = await pool.query('SELECT COUNT(*) as c FROM donations');
    const [[recycling]] = await pool.query('SELECT COUNT(*) as c FROM recycling_requests');
    const [[completed]] = await pool.query('SELECT COUNT(*) as c FROM donations WHERE status="COMPLETED"');
    const [[waste]] = await pool.query('SELECT SUM(quantity) as total FROM recycling_requests WHERE status IN ("ACCEPTED","COLLECTED","COMPLETED")');
    const [[pendingNgos]] = await pool.query('SELECT COUNT(*) as c FROM ngos WHERE verification_status="pending"');
    const [[pendingDealers]] = await pool.query('SELECT COUNT(*) as c FROM scrap_dealers WHERE verification_status="pending"');

    res.json({
      users: users?.c || 0,
      ngos: ngos?.c || 0,
      dealers: dealers?.c || 0,
      donations: donations?.c || 0,
      recycling: recycling?.c || 0,
      completed_donations: completed?.c || 0,
      waste_diverted_kg: parseFloat((waste?.total || 0).toFixed(1)),
      pending_verifications: (pendingNgos?.c || 0) + (pendingDealers?.c || 0),
      pending_ngos: pendingNgos?.c || 0,
      pending_dealers: pendingDealers?.c || 0
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyStats = async (req, res, next) => {
  try {
    const [donations] = await pool.query('SELECT created_at FROM donations');
    const [recycling] = await pool.query('SELECT created_at, quantity FROM recycling_requests');

    // Generate last 6 months bucket
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      months.push({
        key,
        name: monthNames[monthIdx],
        year,
        donations: 0,
        recycling: 0,
        recycling_weight: 0
      });
    }

    donations.forEach(d => {
      if (!d.created_at) return;
      const date = new Date(d.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = months.find(m => m.key === key);
      if (bucket) {
        bucket.donations += 1;
      }
    });

    recycling.forEach(r => {
      if (!r.created_at) return;
      const date = new Date(r.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = months.find(m => m.key === key);
      if (bucket) {
        bucket.recycling += 1;
        bucket.recycling_weight += parseFloat(r.quantity) || 0;
      }
    });

    res.json(months);
  } catch (error) {
    next(error);
  }
};

const getWasteCategoryStats = async (req, res, next) => {
  try {
    const [stats] = await pool.query(
      'SELECT waste_category as name, COUNT(*) as count, COALESCE(SUM(quantity), 0) as value FROM recycling_requests GROUP BY waste_category'
    );
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

const getUserRoleStats = async (req, res, next) => {
  try {
    const [stats] = await pool.query('SELECT role as name, COUNT(*) as count FROM users GROUP BY role');
    const roleLabels = {
      'user': 'Donors / Users',
      'ngo': 'NGOs',
      'scrapdealer': 'Scrap Dealers',
      'admin': 'Administrators'
    };
    const formatted = stats.map(s => ({
      roleKey: s.name,
      name: roleLabels[s.name] || s.name,
      count: s.count
    }));
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

const getPendingVerifications = async (req, res, next) => {
  try {
    const [ngos] = await pool.query(`
      SELECT n.*, u.name as user_name, u.email, u.phone, u.city, u.address, u.state, u.pincode, u.status as user_status
      FROM ngos n 
      JOIN users u ON n.user_id = u.id 
      WHERE n.verification_status = "pending"
      ORDER BY n.created_at DESC
    `);
    const [dealers] = await pool.query(`
      SELECT s.*, u.name as user_name, u.email, u.phone, u.city, u.address, u.state, u.pincode, u.status as user_status
      FROM scrap_dealers s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.verification_status = "pending"
      ORDER BY s.created_at DESC
    `);
    res.json({ ngos, scrapDealers: dealers });
  } catch (error) {
    next(error);
  }
};

const getPlatformReports = async (req, res, next) => {
  try {
    // 1. Overall counts
    const [[userCount]] = await pool.query('SELECT COUNT(*) as c FROM users WHERE role="user"');
    const [[ngoCount]] = await pool.query('SELECT COUNT(*) as c FROM ngos');
    const [[dealerCount]] = await pool.query('SELECT COUNT(*) as c FROM scrap_dealers');
    const [[adminCount]] = await pool.query('SELECT COUNT(*) as c FROM users WHERE role="admin"');
    const [[totalUsersCount]] = await pool.query('SELECT COUNT(*) as c FROM users');

    const [[totalDonations]] = await pool.query('SELECT COUNT(*) as c FROM donations');
    const [[totalDonationItems]] = await pool.query('SELECT COALESCE(SUM(quantity), 0) as total FROM donations');
    const [[completedDonations]] = await pool.query('SELECT COUNT(*) as c FROM donations WHERE status="COMPLETED"');
    const [[receivedDonations]] = await pool.query('SELECT COUNT(*) as c FROM donations WHERE status="RECEIVED"');

    const [[totalRecycling]] = await pool.query('SELECT COUNT(*) as c FROM recycling_requests');
    const [[totalRecyclingWeight]] = await pool.query('SELECT COALESCE(SUM(quantity), 0) as total FROM recycling_requests');
    const [[completedRecycling]] = await pool.query('SELECT COUNT(*) as c FROM recycling_requests WHERE status="COMPLETED"');
    const [[collectedRecycling]] = await pool.query('SELECT COUNT(*) as c FROM recycling_requests WHERE status="COLLECTED"');

    // 2. Impact metrics
    const [[impactFromDb]] = await pool.query(
      'SELECT COALESCE(SUM(waste_weight_kg), 0) as waste_kg, COALESCE(SUM(co2_saved_kg), 0) as co2_kg, COALESCE(SUM(impact_score), 0) as score, COALESCE(SUM(items_count), 0) as items FROM impact_records'
    );

    // Calculated realistic totals based on all processed donations & recycling
    const wasteWeight = totalRecyclingWeight?.total || impactFromDb?.waste_kg || 0;
    const itemsCount = totalDonationItems?.total || impactFromDb?.items || 0;
    const co2Saved = (wasteWeight * 2.0) + (itemsCount * 2.5);
    const impactScore = (wasteWeight * 1.5) + (itemsCount * 5.0);

    // 3. Category Breakdown for Donations
    const [donationCategories] = await pool.query(
      'SELECT category as name, COUNT(*) as count, COALESCE(SUM(quantity), 0) as value FROM donations GROUP BY category ORDER BY count DESC'
    );

    // 4. Material Breakdown for Recycling
    const [wasteCategories] = await pool.query(
      'SELECT waste_category as name, COUNT(*) as count, COALESCE(SUM(quantity), 0) as value FROM recycling_requests GROUP BY waste_category ORDER BY count DESC'
    );

    // 5. User Roles Breakdown
    const [roles] = await pool.query('SELECT role as name, COUNT(*) as count FROM users GROUP BY role');
    const roleLabels = {
      'user': 'Donors / Users',
      'ngo': 'Verified NGOs',
      'scrapdealer': 'Scrap Dealers',
      'admin': 'Administrators'
    };
    const roleData = roles.map(r => ({
      name: roleLabels[r.name] || r.name,
      count: r.count,
      roleKey: r.name
    }));

    // 6. Geographic Distribution (Top Cities)
    const [cityDonations] = await pool.query('SELECT city FROM donations WHERE city IS NOT NULL AND city != ""');
    const [cityRecycling] = await pool.query('SELECT city FROM recycling_requests WHERE city IS NOT NULL AND city != ""');
    const cityMap = {};
    [...cityDonations, ...cityRecycling].forEach(c => {
      const city = c.city?.trim() || 'Other';
      cityMap[city] = (cityMap[city] || 0) + 1;
    });
    const cityData = Object.entries(cityMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 7. Status Fulfillment Pipeline
    const [donationStatuses] = await pool.query('SELECT status as name, COUNT(*) as count FROM donations GROUP BY status');
    const [recyclingStatuses] = await pool.query('SELECT status as name, COUNT(*) as count FROM recycling_requests GROUP BY status');

    // 8. 6-Month Timeline
    const [allDonations] = await pool.query('SELECT created_at FROM donations');
    const [allRecycling] = await pool.query('SELECT created_at, quantity FROM recycling_requests');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      monthlyData.push({
        key,
        name: monthNames[monthIdx],
        year,
        donations: 0,
        recycling: 0,
        recycling_weight: 0
      });
    }

    allDonations.forEach(d => {
      if (!d.created_at) return;
      const date = new Date(d.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthlyData.find(m => m.key === key);
      if (bucket) bucket.donations += 1;
    });

    allRecycling.forEach(r => {
      if (!r.created_at) return;
      const date = new Date(r.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthlyData.find(m => m.key === key);
      if (bucket) {
        bucket.recycling += 1;
        bucket.recycling_weight += parseFloat(r.quantity) || 0;
      }
    });

    res.json({
      summary: {
        total_donations: totalDonations?.c || 0,
        total_donation_items: totalDonationItems?.total || 0,
        completed_donations: completedDonations?.c || 0,
        received_donations: receivedDonations?.c || 0,
        total_recycling: totalRecycling?.c || 0,
        total_recycling_weight: parseFloat((totalRecyclingWeight?.total || 0).toFixed(1)),
        completed_recycling: completedRecycling?.c || 0,
        collected_recycling: collectedRecycling?.c || 0,
        waste_diverted_kg: parseFloat(wasteWeight.toFixed(1)),
        co2_saved_kg: parseFloat(co2Saved.toFixed(1)),
        impact_score: Math.round(impactScore),
        total_users: totalUsersCount?.c || 0,
        donors_count: userCount?.c || 0,
        ngos_count: ngoCount?.c || 0,
        dealers_count: dealerCount?.c || 0,
        admins_count: adminCount?.c || 0
      },
      monthlyData,
      donationCategories,
      wasteCategories,
      roleData,
      cityData,
      donationStatuses,
      recyclingStatuses
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getDashboardStats, 
  getMonthlyStats, 
  getWasteCategoryStats, 
  getUserRoleStats, 
  getPendingVerifications,
  getPlatformReports
};
