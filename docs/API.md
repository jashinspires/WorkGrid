# API Documentation

## Authentication
### Register Tenant
- **Endpoint**: `POST /api/auth/register-tenant`
- **Description**: Registers a new tenant and admin user.
- **Body**:
  ```json
  {
    "tenantName": "Acme Corp",
    "subdomain": "acme",
    "adminEmail": "admin@acme.com",
    "adminPassword": "Password123",
    "adminFullName": "Admin User",
    "plan": "pro"
  }
  ```

### Login
- **Endpoint**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "email": "admin@acme.com",
    "password": "Password123",
    "tenantSubdomain": "acme"
  }
  ```

### Get Current User
- **Endpoint**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`

### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Headers**: `Authorization: Bearer <token>`

## Tenant Management
### Get Tenant Details
- **Endpoint**: `GET /api/tenants/:tenantId`
- **Headers**: `Authorization: Bearer <token>`

### Update Tenant
- **Endpoint**: `PUT /api/tenants/:tenantId`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{"name": "New Name"}`

### List All Tenants (Super Admin)
- **Endpoint**: `GET /api/tenants`
- **Headers**: `Authorization: Bearer <token>`

## User Management
### Add User
- **Endpoint**: `POST /api/tenants/:tenantId/users`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "email": "user@acme.com",
    "password": "Password123",
    "fullName": "User Name",
    "role": "user"
  }
  ```

### List Users
- **Endpoint**: `GET /api/tenants/:tenantId/users`
- **Headers**: `Authorization: Bearer <token>`

### Update User
- **Endpoint**: `PUT /api/users/:userId`
- **Headers**: `Authorization: Bearer <token>`

### Delete User
- **Endpoint**: `DELETE /api/users/:userId`
- **Headers**: `Authorization: Bearer <token>`

## Project Management
### Create Project
- **Endpoint**: `POST /api/projects`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{"name": "New Project", "description": "Desc"}`

### List Projects
- **Endpoint**: `GET /api/projects`
- **Headers**: `Authorization: Bearer <token>`

### Update Project
- **Endpoint**: `PUT /api/projects/:projectId`
- **Headers**: `Authorization: Bearer <token>`

### Delete Project
- **Endpoint**: `DELETE /api/projects/:projectId`
- **Headers**: `Authorization: Bearer <token>`

## Task Management
### Create Task
- **Endpoint**: `POST /api/projects/:projectId/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Task 1",
    "description": "Do something",
    "priority": "high",
    "assignedTo": "uuid-optional",
    "dueDate": "2023-12-31"
  }
  ```

### List Tasks
- **Endpoint**: `GET /api/projects/:projectId/tasks`
- **Headers**: `Authorization: Bearer <token>`

### Update Task Status
- **Endpoint**: `PATCH /api/tasks/:taskId/status`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{"status": "in_progress"}`

### Update Task
- **Endpoint**: `PUT /api/tasks/:taskId`
- **Headers**: `Authorization: Bearer <token>`

### Delete Task
- **Endpoint**: `DELETE /api/tasks/:taskId`
- **Headers**: `Authorization: Bearer <token>`
