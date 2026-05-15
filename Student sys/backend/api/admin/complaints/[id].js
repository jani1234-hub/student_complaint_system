const Complaint = require('../../../models/Complaint');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check admin auth
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { status } = req.body;

      if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }

      const complaint = Complaint.updateComplaint(id, { status });

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found'
        });
      }

      res.json({
        success: true,
        data: complaint,
        message: 'Status updated successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const complaint = Complaint.deleteComplaint(id);

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found'
        });
      }

      res.json({
        success: true,
        message: 'Complaint deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
};
