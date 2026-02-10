# My Multi-Tenant SaaS Platform Project 🚀

## Project Story
Hi! This is my final project for the SaaS development module. I wanted to build something that solves a real-world problem: how to manage projects for different companies without their data getting mixed up. 

This platform allows many organizations (tenants) to sign up separately. Each one gets its own space, its own users, and its own projects. It was a huge challenge to make sure that a user from "Company A" could never accidentally see a task from "Company B," but I'm really proud of how the tenant isolation turned out!

## 🧠 What I Learned
During this project, I learned a lot of things that were totally new to me:
- **Multi-Tenancy**: I spent a lot of time researching how to use a single database while keeping data isolated. I went with the "Shared Database, Shared Schema" approach using a `tenant_id` column.
- **RESTful API Design**: I implemented 19 different endpoints and learned how to structure them logically (like nesting tasks under projects).
- **JWT & RBAC**: Figuring out how to embed the `tenantId` inside a JWT so the backend always knows who is asking for what was a "Eureka!" moment for me.
- **Docker Compose**: Learning how to spin up a frontend, backend, and database all at once with one command made development so much easier.

## 🛠️ Tech Stack I Chose
- **Backend**: Node.js & Express (because they're fast and I love JavaScript)
- **Database**: PostgreSQL (for robust relational data)
- **Frontend**: React (used Context API for global state management)
- **DevOps**: Docker & Docker Compose (to make it run exactly the same for everyone)

## 🏗️ How it's Built
The app follows a 3-tier structure:
1.  **Frontend**: A React single-page app that looks clean and professional.
2.  **Backend**: A Node.js API that handles all the business logic and security.
3.  **Database**: A Postgres instance that keeps everything organized.

Check out the [Architecture Diagram](docs/images/system-architecture.png) in the docs folder for a visual look!

## 🚀 How to Run it Yourself
I've made it super easy to get started with Docker:

1.  Make sure you have **Docker** and **Git** installed.
2.  Clone this repo and go into the folder.
3.  Just run:
    ```bash
    docker-compose up -d
    ```
4.  Open your browser to:
    - **App**: [http://localhost:3000](http://localhost:3000)
    - **API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 🔑 Credentials to Test
I've pre-loaded some data so you don't have to start from scratch:
- **Super Admin**: `superadmin@system.com` / `Admin@123`
- **Tenant Admin**: `admin@demo.com` / `Demo@123`
- **User**: `user1@demo.com` / `User@123`

## 🧪 Testing the APIs
I wrote a PowerShell script to prove everything works:
```powershell
./test-all-apis.ps1
```
It tests everything from logging in to creating projects and tasks.

## 📄 Documentation
I've included more details if you're interested:
- [API Documentation](docs/API.md) - Every endpoint explained.
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - How to put this in the cloud.
- [Technical Spec](docs/technical-spec.md) - How I handled the tricky parts.

Hope you like it! It was a great learning experience. 🎓