Product Requirements Document (PRD)

1. User Personas
   Super Admin

Role: System owner managing platform-wide configuration, tenants, and subscription plans.

Key responsibilities: Create and manage subscription plans, monitor tenant usage, oversee system health and security.

Main goals: Ensure stable multi-tenant operations, control billing and limits, get visibility into all tenants.

Pain points: Detecting abuse or misconfiguration early, handling failing tenants, maintaining uptime at scale.​

Tenant Admin

Role: CEO/Manager or organization administrator for a single company.

Key responsibilities: Manage users, assign roles, create and manage projects, ensure team productivity within plan limits.

Main goals: Quickly onboard team members, keep projects organized, stay within subscription limits.

Pain points: Hitting user/project limits, managing permissions correctly, preventing accidental data exposure.​

End User

Role: Employee or regular team member working on tasks.

Key responsibilities: View assigned projects and tasks, update task status, collaborate with team members.

Main goals: Clearly see what to work on, update progress easily, avoid confusion about ownership and deadlines.

Pain points: Lack of clarity on priorities, slow or confusing UI, difficulty tracking task status.​

2. Functional Requirements
   Auth
   FR-001 (Auth): The system shall allow tenants to register with a unique subdomain.​

FR-002 (Auth): The system shall authenticate users via JWT with 24h expiry.​

Tenant
FR-003 (Tenant): The system shall limit the number of users and projects per tenant based on the tenant’s Subscription Plan.​

FR-004 (Tenant): The system shall isolate data so that Tenant A cannot access Tenant B’s data, even via API manipulation.​

User
FR-005 (User): The system shall allow Tenant Admins to add and delete users within their tenant.​

Project
FR-006 (Project): The system shall allow authenticated users to create projects within their tenant.​

Task
FR-007 (Task): The system shall allow users to assign tasks to team members within the same tenant.​

FR-008 (Task): The system shall allow users to update task status (Todo, In Progress, Done).​

Audit
FR-009 (Audit): The system shall log critical actions (such as login, user creation, user deletion, project deletion) into Audit Logs.​

Admin
FR-010 (Admin): The system shall allow the Super Admin to view all tenants and their key stats.​

API
FR-011 (API): The system shall return all API responses in a standard JSON format: { success, message, data }.​

UI
FR-012 (UI): The frontend shall hide “Admin” buttons and admin-only features for regular End Users.​

FR-013 (UI): The dashboard shall display basic statistics such as Total Users and Total Projects for the current tenant.​

System / Data Management
FR-014 (System): The system shall support either soft delete or cascade delete for related records, as per the database design.​

Search
FR-015 (Search): The system shall allow users to search for tasks by title within their tenant.​

3. Non-Functional Requirements
   NFR-001 (Security): The system shall hash all user passwords using bcrypt before storing them in the database.​

NFR-002 (Performance): The system shall keep average API response time under 200ms for typical workloads.​

NFR-003 (Scalability): The system shall support at least 100 concurrent users via Node.js asynchronous architecture and efficient database queries.​

NFR-004 (Availability): The system shall ensure dockerized services (database, backend, frontend) restart automatically on failure.​

NFR-005 (Portability/Usability): The entire stack shall run with a single docker-compose up command, and the web UI shall be usable on both desktop and mobile devices.​
