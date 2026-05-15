const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const { adminAuth, generateToken } = require('../middleware/auth');

// ============ PUBLIC ROUTES ============

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD) {
      const token = generateToken();
      res.json({
        success: true,
        token,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new complaint
router.post('/complaints', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('rollno').trim().notEmpty().withMessage('Roll number is required'),
  body('category').isIn(['Department', 'Teacher', 'Administration', 'Hostel']).withMessage('Invalid category'),
  body('target').trim().notEmpty().withMessage('Target is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('complaint').trim().isLength({ min: 20 }).withMessage('Complaint must be at least 20 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const complaint = Complaint.createComplaint(req.body);

    res.status(201).json({
      success: true,
      data: complaint,
      message: 'Complaint submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get complaint by ID (public)
router.get('/complaints/:id', async (req, res) => {
  try {
    const complaint = Complaint.getComplaintById(req.params.id);
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
});

// ============ PROTECTED ADMIN ROUTES ============

// Get all complaints with filters
router.get('/admin/complaints', adminAuth, async (req, res) => {
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
});

// Update complaint status
router.put('/admin/complaints/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }

    const complaint = Complaint.updateComplaint(req.params.id, { status });

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
});

// Delete complaint
router.delete('/admin/complaints/:id', adminAuth, async (req, res) => {
  try {
    const complaint = Complaint.deleteComplaint(req.params.id);

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
});

// Get stats only
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    const complaints = Complaint.getAllComplaints();
    const stats = {
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'Pending').length,
      inProgress: complaints.filter(c => c.status === 'In Progress').length,
      resolved: complaints.filter(c => c.status === 'Resolved').length
    };
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;