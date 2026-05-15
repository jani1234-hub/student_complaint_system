const Complaint = require('../../models/Complaint');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const complaint = Complaint.getComplaintById(id);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found'
        });
      }
      res.json({ success: true, data: complaint });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
};
