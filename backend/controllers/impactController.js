const { pool } = require('../config/database');

const getPlatformImpact = async (req, res, next) => {
  try {
    // 1. Live aggregations from donations table (excluding rejected/cancelled)
    const [donationsAgg] = await pool.query(`
      SELECT 
        COALESCE(SUM(quantity), 0) as total_items,
        COUNT(*) as total_donations
      FROM donations 
      WHERE status NOT IN ('REJECTED', 'CANCELLED')
    `);

    const [completedDonationsAgg] = await pool.query(`
      SELECT 
        COALESCE(SUM(quantity), 0) as completed_items,
        COUNT(*) as completed_donations
      FROM donations 
      WHERE status IN ('COMPLETED', 'RECEIVED')
    `);

    // 2. Live aggregations from recycling_requests table (excluding rejected/cancelled)
    const [recyclingAgg] = await pool.query(`
      SELECT 
        COALESCE(SUM(quantity), 0) as total_waste_kg,
        COUNT(*) as total_recycling
      FROM recycling_requests 
      WHERE status NOT IN ('REJECTED', 'CANCELLED')
    `);

    const [completedRecyclingAgg] = await pool.query(`
      SELECT 
        COALESCE(SUM(quantity), 0) as completed_waste_kg,
        COUNT(*) as completed_recycling
      FROM recycling_requests 
      WHERE status IN ('COMPLETED', 'COLLECTED')
    `);

    // 3. NGOs and Scrap Dealers count
    const [ngoRows] = await pool.query('SELECT COUNT(*) as c FROM ngos WHERE verification_status = "approved"');
    const [allNgoRows] = await pool.query('SELECT COUNT(*) as c FROM ngos');
    const [dealerRows] = await pool.query('SELECT COUNT(*) as c FROM scrap_dealers WHERE verification_status = "approved"');
    const [allDealerRows] = await pool.query('SELECT COUNT(*) as c FROM scrap_dealers');

    // 4. Baseline / logged impact records
    const [impactAgg] = await pool.query(`
      SELECT 
        COALESCE(SUM(waste_weight_kg), 0) as impact_waste,
        COALESCE(SUM(items_count), 0) as impact_items,
        COALESCE(SUM(co2_saved_kg), 0) as impact_co2,
        COUNT(DISTINCT user_id) as active_contributors
      FROM impact_records
    `);

    // Compute live values
    const totalDonatedItems = Number(donationsAgg[0]?.total_items || 0);
    const totalRecycledWasteKg = Math.round(Number(recyclingAgg[0]?.total_waste_kg || 0) * 10) / 10;

    // Environmental emission diversion formula:
    // ~2.5 kg CO2 saved per donated item reused
    // ~1.5 kg CO2 saved per kg waste recycled
    const calculatedCo2 = Math.round(((totalDonatedItems * 2.5) + (totalRecycledWasteKg * 1.5)) * 10) / 10;
    const impactCo2 = Math.round(Number(impactAgg[0]?.impact_co2 || 0) * 10) / 10;
    const totalCo2 = Math.max(calculatedCo2, impactCo2);

    const approvedNgos = Number(ngoRows[0]?.c || 0);
    const totalNgos = Number(allNgoRows[0]?.c || 0);
    const ngoCount = approvedNgos > 0 ? approvedNgos : totalNgos;

    const approvedDealers = Number(dealerRows[0]?.c || 0);
    const totalDealers = Number(allDealerRows[0]?.c || 0);
    const dealerCount = approvedDealers > 0 ? approvedDealers : totalDealers;

    // Distinct contributors
    const [donors] = await pool.query('SELECT DISTINCT user_id FROM donations WHERE status NOT IN ("REJECTED", "CANCELLED")');
    const [recyclers] = await pool.query('SELECT DISTINCT user_id FROM recycling_requests WHERE status NOT IN ("REJECTED", "CANCELLED")');
    const contributorIds = new Set([
      ...(donors || []).map(d => d.user_id),
      ...(recyclers || []).map(r => r.user_id)
    ]);
    const activeContributors = Math.max(contributorIds.size, Number(impactAgg[0]?.active_contributors || 0));

    res.json({
      // Homepage mapped fields
      donations: totalDonatedItems,
      recycled: totalRecycledWasteKg,
      diverted: totalCo2,
      ngos: ngoCount,
      partners: dealerCount,

      // Platform impact standard fields
      total_items: totalDonatedItems,
      total_waste_kg: totalRecycledWasteKg,
      total_co2: totalCo2,
      active_contributors: activeContributors,
      ngos_connected: ngoCount,
      recycling_partners: dealerCount,
      total_donations: Number(donationsAgg[0]?.total_donations || 0),
      total_recycling: Number(recyclingAgg[0]?.total_recycling || 0),
      items_donated: Number(completedDonationsAgg[0]?.completed_items || 0),
      items_recycled: Math.round(Number(completedRecyclingAgg[0]?.completed_waste_kg || 0) * 10) / 10,
    });
  } catch (error) {
    next(error);
  }
};

const getUserImpact = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [userDonations] = await pool.query(
      'SELECT COALESCE(SUM(quantity), 0) as items, COUNT(*) as c FROM donations WHERE user_id = ? AND status NOT IN ("REJECTED", "CANCELLED")',
      [userId]
    );
    const [userRecycling] = await pool.query(
      'SELECT COALESCE(SUM(quantity), 0) as waste_kg, COUNT(*) as c FROM recycling_requests WHERE user_id = ? AND status NOT IN ("REJECTED", "CANCELLED")',
      [userId]
    );
    const [impact] = await pool.query(`
      SELECT 
        COALESCE(SUM(waste_weight_kg), 0) as total_waste_kg,
        COALESCE(SUM(items_count), 0) as total_items,
        COALESCE(SUM(co2_saved_kg), 0) as total_co2,
        COALESCE(SUM(impact_score), 0) as total_score
      FROM impact_records WHERE user_id = ?
    `, [userId]);

    const totalItems = Math.max(Number(userDonations[0]?.items || 0), Number(impact[0]?.total_items || 0));
    const totalWasteKg = Math.round(Math.max(Number(userRecycling[0]?.waste_kg || 0), Number(impact[0]?.total_waste_kg || 0)) * 10) / 10;
    const calcCo2 = Math.round(((totalItems * 2.5) + (totalWasteKg * 1.5)) * 10) / 10;
    const totalCo2 = Math.max(calcCo2, Math.round(Number(impact[0]?.total_co2 || 0) * 10) / 10);
    const calcScore = Math.round((totalItems * 5) + (totalWasteKg * 2));
    const totalScore = Math.max(calcScore, Number(impact[0]?.total_score || 0));

    res.json({
      total_waste_kg: totalWasteKg,
      total_items: totalItems,
      total_co2: totalCo2,
      total_score: totalScore
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPlatformImpact, getUserImpact };
