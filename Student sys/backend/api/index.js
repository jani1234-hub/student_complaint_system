module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.json({
    success: true,
    message: 'Student Complaint Management System API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      login: 'POST /api/admin/login',
      createComplaint: 'POST /api/complaints',
      getComplaint: 'GET /api/complaints/:id',
      getAllComplaints: 'GET /api/admin/complaints',
      updateComplaint: 'PUT /api/admin/complaints/:id',
      deleteComplaint: 'DELETE /api/admin/complaints/:id',
      getStats: 'GET /api/admin/stats'
    }
  });
};
