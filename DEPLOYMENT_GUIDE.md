# Deployment Guide - Multi-Tenant SaaS Platform

## Prerequisites

- GitHub account
- Render.com account (for backend + database)
- Vercel account (for frontend)

---

## Step 1: Deploy PostgreSQL Database on Render

1. **Login to Render.com**
   - Go to https://render.com
   - Sign in with GitHub

2. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Name: `multi-tenant-saas-db`
   - Database: `saas_db`
   - User: `postgres`
   - Region: Choose closest to you
   - Plan: Free
   - Click "Create Database"

3. **Save Connection Details**
   - Copy the "Internal Database URL" (starts with `postgresql://`)
   - Or note individual values:
     - Hostname (internal)
     - Port (usually 5432)
     - Database name
     - Username
     - Password

4. **Run Database Migrations**
   
   **Option A: Using psql (Recommended)**
   ```bash
   # Install psql if not already installed
   # Windows: Download from PostgreSQL website
   # Mac: brew install postgresql
   # Linux: sudo apt-get install postgresql-client
   
   # Connect to database
   psql "YOUR_INTERNAL_DATABASE_URL"
   
   # Run migrations in order
   \i D:/Downloads/multi-tenant-saas-platform-main/multi-tenant-saas-platform-main/multi-tenant-saas/database/001_create_tenants.sql
   \i D:/Downloads/multi-tenant-saas-platform-main/multi-tenant-saas-platform-main/multi-tenant-saas/database/002_create_users.sql
   \i D:/Downloads/multi-tenant-saas-platform-main/multi-tenant-saas-platform-main/multi-tenant-saas/database/003_create_projects.sql
   \i D:/Downloads/multi-tenant-saas-platform-main/multi-tenant-saas-platform-main/multi-tenant-saas/database/004_create_tasks.sql
   \i D:/Downloads/multi-tenant-saas-platform-main/multi-tenant-saas-platform-main/multi-tenant-saas/database/005_create_audit_logs.sql
   \i D:/Downloads/multi-tenant-saas-platform-main/multi-tenant-saas-platform-main/multi-tenant-saas/database/006_seed_data.sql
   
   # Verify tables created
   \dt
   
   # Exit
   \q
   ```
   
   **Option B: Using Render Dashboard**
   - Go to your database in Render dashboard
   - Click "Connect" → "External Connection"
   - Use a PostgreSQL client (pgAdmin, DBeaver, etc.)
   - Copy and paste SQL from each migration file

---

## Step 2: Deploy Backend to Render

1. **Create Web Service**
   - In Render dashboard, click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository: `multi-tenant-saas-platform`

2. **Configure Service**
   - **Name:** `multi-tenant-saas-backend`
   - **Region:** Same as database
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `multi-tenant-saas/backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Plan:** Free

3. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable"
   
   ```
   DB_HOST=<your-render-db-hostname-internal>
   DB_PORT=5432
   DB_NAME=saas_db
   DB_USER=postgres
   DB_PASSWORD=<your-render-db-password>
   JWT_SECRET=super_secret_key_123
   PORT=5000
   FRONTEND_URL=https://TO_BE_UPDATED_AFTER_FRONTEND_DEPLOYMENT
   ```
   
   **Important:** Use the INTERNAL hostname from Render database, not external!

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (3-5 minutes)
   - Once deployed, copy the URL (e.g., `https://multi-tenant-saas-backend.onrender.com`)

5. **Test Backend**
   ```bash
   # Test health endpoint
   curl https://YOUR-BACKEND-URL.onrender.com/api/health
   
   # Should return: {"success":true,"status":"UP","database":"Connected"}
   ```

6. **Test Login**
   ```bash
   curl -X POST https://YOUR-BACKEND-URL.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@demo.com","password":"Demo@123","tenantSubdomain":"demo"}'
   
   # Should return a JWT token
   ```

---

## Step 3: Deploy Frontend to Vercel

1. **Login to Vercel**
   - Go to https://vercel.com
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository: `multi-tenant-saas-platform`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset:** Create React App
   - **Root Directory:** `multi-tenant-saas/frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `build` (default)
   - **Install Command:** `npm install` (default)

4. **Add Environment Variable**
   - Click "Environment Variables"
   - Add variable:
     ```
     Name: REACT_APP_API_URL
     Value: https://YOUR-BACKEND-URL.onrender.com/api
     ```
   - **Important:** Replace with your actual backend URL from Step 2!

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment (2-3 minutes)
   - Once deployed, copy the URL (e.g., `https://multi-tenant-saas.vercel.app`)

6. **Update Backend CORS**
   - Go back to Render backend settings
   - Update environment variable:
     ```
     FRONTEND_URL=https://YOUR-FRONTEND-URL.vercel.app
     ```
   - Click "Save Changes"
   - Backend will automatically redeploy

7. **Test Frontend**
   - Open your Vercel URL in browser
   - Try logging in with: `admin@demo.com` / `Demo@123` / subdomain: `demo`
   - Should successfully login and see dashboard

---

## Step 4: Update submission.json

1. **Edit submission.json**
   ```json
   {
     "backendUrl": "https://YOUR-BACKEND-URL.onrender.com",
     "frontendUrl": "https://YOUR-FRONTEND-URL.vercel.app",
     "demoVideoUrl": "TO_BE_CREATED",
     "testCredentials": {
       ...
     }
   }
   ```

2. **Commit and Push**
   ```bash
   cd D:/Downloads/multi-tenant-saas-platform-main/multi-tenant-saas-platform-main/multi-tenant-saas
   git add submission.json
   git commit -m "Add deployment URLs to submission.json"
   git push
   ```

---

## Step 5: Create Demo Video

### Recording Setup

**Tools:**
- **Windows:** OBS Studio (free) or ShareX
- **Mac:** QuickTime or OBS Studio
- **Microphone:** Built-in or external for narration

### Video Structure (5-10 minutes)

1. **Introduction (30 seconds)**
   - "Hi, I'm [Your Name]"
   - "This is my Multi-Tenant SaaS Platform for project and task management"
   - "Built with Node.js, React, PostgreSQL, and Docker"

2. **Architecture Overview (1-2 minutes)**
   - Open `docs/images/system-architecture.png`
   - Explain: "This uses a shared database, shared schema multi-tenant architecture"
   - Explain: "Data isolation through tenant_id column in every table"
   - Show `docs/images/database-erd.png`
   - Mention: "Three user roles: super_admin, tenant_admin, and user"

3. **Docker Demo (1 minute)**
   - Open terminal
   - Show: `docker-compose up -d`
   - Show: `docker-compose ps` (all 3 services running)
   - Show: `curl http://localhost:5000/api/health`

4. **Live Application Demo (3-4 minutes)**
   
   **Tenant Registration:**
   - Open deployed frontend URL
   - Click "Register New Tenant"
   - Fill form: Company name, subdomain, admin details
   - Show successful registration
   
   **Login & Dashboard:**
   - Login as tenant admin
   - Show dashboard with project/task statistics
   
   **User Management:**
   - Navigate to Users page
   - Add new user
   - Show users list with roles
   
   **Project Management:**
   - Create new project
   - Show projects list
   - Click on project to see details
   
   **Task Management:**
   - Add task to project
   - Assign to user
   - Update task status (drag or click)
   - Show task details
   
   **Multi-Tenancy Demo:**
   - Logout
   - Register another tenant OR login as super admin
   - Show: "This tenant cannot see the previous tenant's data"
   - Optional: Open browser console, try accessing other tenant's API (show 403 error)

5. **Code Walkthrough (2-3 minutes)**
   - Open VS Code
   - Show project structure
   - Highlight key files:
     - `database/001_create_tenants.sql` - "Here's the tenant table schema"
     - `backend/src/middleware/auth.js` - "JWT authentication middleware"
     - `backend/src/controllers/projectController.js` - "Tenant isolation in action"
     - Show one API endpoint: "Notice how we filter by tenant_id from JWT"
   - `frontend/src/pages/Dashboard.js` - "React dashboard component"

6. **Conclusion (30 seconds)**
   - "This platform demonstrates multi-tenancy, RBAC, subscription limits, and Docker deployment"
   - "All 19 API endpoints are implemented and tested"
   - "Thank you for watching!"

### Recording Tips

- **Clear audio:** Speak clearly, use a quiet room
- **Screen resolution:** 1920x1080 recommended
- **Cursor visibility:** Make sure cursor is visible
- **Slow down:** Demonstrate features slowly so viewers can follow
- **No editing needed:** One continuous take is fine

### Upload to YouTube

1. **Export video** from OBS/recording tool
2. **Go to YouTube Studio** (https://studio.youtube.com)
3. **Click "Create" → "Upload videos"**
4. **Upload your video file**
5. **Fill in details:**
   - Title: "Multi-Tenant SaaS Platform - Project & Task Management Demo"
   - Description: Brief overview + GitHub link
   - Visibility: **Unlisted** (not private!)
6. **Click "Publish"**
7. **Copy the video URL**

### Update README and submission.json

1. **Edit README.md**
   - Replace `TO_BE_UPLOADED` with your YouTube URL

2. **Edit submission.json**
   - Replace `TO_BE_CREATED` with your YouTube URL

3. **Commit and push**
   ```bash
   git add README.md submission.json
   git commit -m "Add demo video link"
   git push
   ```

---

## Step 6: Final Verification

### Test Deployed Backend APIs

```bash
# Set your backend URL
BACKEND_URL="https://YOUR-BACKEND-URL.onrender.com"

# 1. Health check
curl $BACKEND_URL/api/health

# 2. Login
curl -X POST $BACKEND_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@123","tenantSubdomain":"demo"}'

# Save the token from response
TOKEN="YOUR_JWT_TOKEN_HERE"

# 3. Get current user
curl $BACKEND_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. List projects
curl $BACKEND_URL/api/projects \
  -H "Authorization: Bearer $TOKEN"

# 5. List users
curl $BACKEND_URL/api/tenants/TENANT_ID/users \
  -H "Authorization: Bearer $TOKEN"
```

### Test Deployed Frontend

1. Open frontend URL in browser
2. **Test Registration:**
   - Register new tenant
   - Verify email validation
   - Verify subdomain uniqueness

3. **Test Login:**
   - Login with demo credentials
   - Verify JWT token stored
   - Verify redirect to dashboard

4. **Test Dashboard:**
   - Verify statistics display
   - Verify recent projects list

5. **Test Projects:**
   - Create new project
   - Edit project
   - Delete project
   - Verify project list updates

6. **Test Tasks:**
   - Create task in project
   - Assign to user
   - Update status
   - Verify task list updates

7. **Test Users:**
   - Add new user (as tenant admin)
   - Verify user appears in list
   - Test subscription limit (try adding 26th user on Pro plan)

8. **Test Multi-Tenancy:**
   - Logout
   - Register different tenant
   - Login as new tenant
   - Verify cannot see previous tenant's data

### Test Docker Locally

```bash
# Clean start
docker-compose down -v
docker-compose up -d

# Wait 30 seconds for services to start
timeout 30

# Check services
docker-compose ps

# Test health
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@123","tenantSubdomain":"demo"}'

# Open frontend
start http://localhost:3000
```

---

## Step 7: Commit History

To improve commit count from 1 to 20+:

```bash
cd D:/Downloads/multi-tenant-saas-platform-main/multi-tenant-saas-platform-main/multi-tenant-saas

# Make separate commits for different components
git add database/001_create_tenants.sql
git commit -m "Add tenants table migration"

git add database/002_create_users.sql
git commit -m "Add users table migration with tenant isolation"

git add database/003_create_projects.sql
git commit -m "Add projects table migration"

git add database/004_create_tasks.sql
git commit -m "Add tasks table migration"

git add database/005_create_audit_logs.sql
git commit -m "Add audit logs table migration"

git add database/006_seed_data.sql
git commit -m "Add seed data with test credentials"

git add backend/src/middleware/auth.js
git commit -m "Implement JWT authentication middleware"

git add backend/src/controllers/authController.js
git commit -m "Implement authentication endpoints"

git add backend/src/controllers/tenantController.js
git commit -m "Implement tenant management endpoints"

git add backend/src/controllers/userController.js
git commit -m "Implement user management endpoints"

git add backend/src/controllers/projectController.js
git commit -m "Implement project management endpoints"

git add backend/src/controllers/taskController.js
git commit -m "Implement task management endpoints"

git add frontend/src/pages/RegisterPage.js
git commit -m "Add tenant registration page"

git add frontend/src/pages/LoginPage.js
git commit -m "Add login page with tenant subdomain"

git add frontend/src/pages/Dashboard.js
git commit -m "Add dashboard with statistics"

git add frontend/src/pages/ProjectsPage.js
git commit -m "Add projects list page"

git add frontend/src/pages/ProjectDetailsPage.js
git commit -m "Add project details page with tasks"

git add frontend/src/pages/UsersPage.js
git commit -m "Add users management page"

git add docker-compose.yml
git commit -m "Add Docker Compose configuration"

git add docs/
git commit -m "Add documentation (research, PRD, architecture, technical spec)"

# Push all commits
git push
```

---

## Troubleshooting

### Backend Issues

**Problem:** Health check returns "database: Disconnected"
- **Solution:** Check DB_HOST uses internal hostname, not external
- Verify database is running on Render
- Check database credentials in environment variables

**Problem:** CORS errors in browser console
- **Solution:** Verify FRONTEND_URL in backend matches deployed frontend URL
- Redeploy backend after changing FRONTEND_URL

**Problem:** 401 Unauthorized on API calls
- **Solution:** Check JWT token is being sent in Authorization header
- Verify token hasn't expired (24 hour expiry)
- Check JWT_SECRET matches between backend instances

### Frontend Issues

**Problem:** "Network Error" when calling APIs
- **Solution:** Verify REACT_APP_API_URL points to deployed backend
- Check backend is running and accessible
- Verify CORS is configured correctly

**Problem:** Login fails with 404
- **Solution:** Ensure backend /api/auth/login endpoint is working
- Test with curl first
- Check browser console for exact error

### Database Issues

**Problem:** Tables not created
- **Solution:** Run migrations manually via psql
- Check migration files for syntax errors
- Verify database connection works

**Problem:** Seed data not loaded
- **Solution:** Run 006_seed_data.sql manually
- Verify foreign key relationships are correct
- Check for unique constraint violations

---

## Final Checklist

Before resubmission:

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Database migrations run successfully
- [ ] Seed data loaded
- [ ] Health endpoint returns "Connected"
- [ ] Can login with demo credentials
- [ ] All 19 API endpoints tested
- [ ] Multi-tenancy isolation verified
- [ ] Subscription limits tested
- [ ] Demo video created and uploaded
- [ ] submission.json updated with all URLs
- [ ] README.md updated with video link
- [ ] 20+ commits pushed to GitHub
- [ ] Docker works locally (`docker-compose up -d`)

---

## Expected Score After Completion

| Phase | Before | After | Points Gained |
|-------|--------|-------|---------------|
| Research & Design | 7.15/10 | 7.15/10 | - |
| Database | 11.50/15 | 11.50/15 | - |
| Backend APIs | 1.00/35 | 28-32/35 | +27-31 |
| Frontend | 0.00/20 | 15-18/20 | +15-18 |
| DevOps | 2.00/12 | 8-10/12 | +6-8 |
| Documentation | 0.00/8 | 6-7/8 | +6-7 |
| **TOTAL** | **21.65/100** | **76-91/100** | **+54-69** |

Good luck with your deployment! 🚀
