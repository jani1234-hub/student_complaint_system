const Complaint = require('../../../models/Complaint');
const { verifyToken } = require('../../../middleware/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check admin auth
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { category, status, search } = req.query;
      let complaints = Complaint.getAllComplaints();

      if (category) {
        complaints = complaints.filter(c => c.category === category);
      }
      if (status) {
        complaints = complaints.filter(c => c.status === status);
      }
      if (search) {
        const query = search.toLowerCase();
        complaints = complaints.filter(c =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.subject.toLowerCase().includes(query) ||
          c.target.toLowerCase().includes(query) ||
          c.rollno.toLowerCase().includes(query)
        );
      }

      complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'Pending').length,
        inProgress: complaints.filter(c => c.status === 'In Progress').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length
      };

      res.json({
        success: true,
        data: complaints,
        stats
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
};
