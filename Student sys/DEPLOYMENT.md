# Vercel Full-Stack Deployment Guide

## 📋 Prerequisites
1. GitHub repository (already done ✓)
2. MongoDB Atlas account (free tier)
3. Vercel account

## 🚀 Step 1: Setup MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free)
3. Create a cluster
4. Click "Connect" → "Drivers" → Copy connection string
5. Replace `username`, `password`, and `cluster` in your URL
6. Create a user and get your connection string like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/complaint_system
   ```

## 🌐 Step 2: Deploy to Vercel

### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# From project root
vercel
# Follow prompts, connect GitHub repo
```

### Option B: Using GitHub Integration
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Connect your GitHub repo
4. Add environment variable:
   - Name: `MONGODB_URI`
   - Value: Your MongoDB Atlas connection string

5. Deploy

## 📝 Environment Variables to Add in Vercel

Go to Project Settings → Environment Variables and add:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/complaint_system
JWT_SECRET=defgrhjkhgfdddedf
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@@@
```

## 🔗 API Routes (After Deployment)

Your API will be available at: `https://your-vercel-domain.vercel.app/api/`

Routes:
- POST `/api/admin/login` - Admin login
- POST `/api/complaints` - Create complaint
- GET `/api/complaints/:id` - Get complaint by ID
- GET `/api/admin/complaints` - Get all complaints (protected)
- PUT `/api/admin/complaints/:id` - Update status (protected)
- DELETE `/api/admin/complaints/:id` - Delete complaint (protected)
- GET `/api/admin/stats` - Get statistics (protected)

## 🔐 Admin Credentials

Username: `admin`
Password: `Admin@@@`

(Change these in .env for security!)

## ✅ Verification

Test deployment:
- Frontend: https://your-vercel-domain.vercel.app
- Health check: https://your-vercel-domain.vercel.app/api/health (if implemented)

## ⚠️ Important Notes

1. **MongoDB Atlas IP Whitelist**: Add Vercel's IP or "0.0.0.0/0" to allow all IPs
2. **Free Tier Limits**: MongoDB Atlas free tier has 512MB storage
3. **CORS**: Already configured in Vercel functions
4. **Frontend API URL**: Automatically uses `/api` for production deployments

## 🛠️ Troubleshooting

If APIs don't work:
1. Check environment variables in Vercel dashboard
2. Verify MongoDB connection string
3. Check Vercel logs: `vercel logs`
4. Ensure MongoDB Atlas network access is enabled
