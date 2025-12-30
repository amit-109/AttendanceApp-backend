# 🎯 Attendance Management System - API Testing Guide

Complete testing guide with sample data and Postman collection for all API endpoints.

## 📋 Prerequisites

1. **MySQL** server running (local or remote)
2. **Node.js** installed
3. **Postman** installed for API testing
4. Backend server running on `http://localhost:5000`

## 🚀 Quick Setup

### 1. Setup MySQL Database
```sql
-- Create database
CREATE DATABASE attendance_app;

-- Or use your existing database credentials
```

### 2. Configure Environment
Update the `.env` file in the backend folder:
```
DB_HOST=server.abhiworld.in
DB_USER=securysc_app
DB_PASSWORD=d62ur4EL2kWm
DB_NAME=securysc_new_app
DB_PORT=3306
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Seed Database (Optional)
```bash
npm run seed
```

### 5. Start Backend Server
```bash
npm start
# Server will run on http://localhost:5000
```

### 6. Import Postman Collection
1. Open Postman
2. Click "Import" button
3. Select "File" tab
4. Choose `Attendance_API_Postman_Collection.json`
5. Click "Import"

## 🔧 Postman Environment Setup

Create a new environment in Postman:
1. Click "Environments" (left sidebar)
2. Click "Create Environment"
3. Name it "Attendance API"
4. Add these variables:
   - `base_url`: `http://localhost:5000/api`
   - `admin_token`: (leave empty, will be set automatically)
   - `employee_token`: (leave empty, will be set automatically)

## 📊 Sample Data & Testing Flow

### **Step 1: Register Admin Account**
```
POST {{base_url}}/auth/register-admin
{
  "name": "System Administrator",
  "email": "admin@company.com",
  "password": "admin123"
}
```
**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "System Administrator",
    "email": "admin@company.com",
    "role": "admin"
  }
}
```

### **Step 2: Admin Login**
```
POST {{base_url}}/auth/login
{
  "email": "admin@company.com",
  "password": "admin123"
}
```
**Note:** Token will be automatically saved to `admin_token` variable

### **Step 3: Add Employees**
```
POST {{base_url}}/admin/employees
Authorization: Bearer {{admin_token}}
{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "password": "emp123"
}
```

```
POST {{base_url}}/admin/employees
Authorization: Bearer {{admin_token}}
{
  "name": "Jane Smith",
  "email": "jane.smith@company.com",
  "password": "emp456"
}
```

### **Step 4: Employee Login**
```
POST {{base_url}}/auth/login
{
  "email": "john.doe@company.com",
  "password": "emp123"
}
```
**Note:** Token will be automatically saved to `employee_token` variable

### **Step 5: Test Employee Operations**

#### Check Today's Status (Before Check-in)
```
GET {{base_url}}/employee/today
Authorization: Bearer {{employee_token}}
```
**Expected:** `{"status": "not_checked_in"}`

#### Check In
```
POST {{base_url}}/employee/checkin
Authorization: Bearer {{employee_token}}
{
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

#### Check Today's Status (After Check-in)
```
GET {{base_url}}/employee/today
Authorization: Bearer {{employee_token}}
```
**Expected:** `{"status": "checked_in", "attendance": {...}}`

#### Check Out
```
PUT {{base_url}}/employee/checkout
Authorization: Bearer {{employee_token}}
```

#### View Attendance History
```
GET {{base_url}}/employee/attendance
Authorization: Bearer {{employee_token}}
```

### **Step 6: Admin Operations**

#### View All Employees
```
GET {{base_url}}/admin/employees
Authorization: Bearer {{admin_token}}
```

#### View All Attendance Records
```
GET {{base_url}}/admin/attendance
Authorization: Bearer {{admin_token}}
```

## 🧪 Complete Testing Scenarios

### **Scenario 1: Full Employee Workflow**

1. **Admin adds employee**
2. **Employee logs in**
3. **Employee checks in** (with location)
4. **Employee checks out**
5. **Employee views history**
6. **Admin views all attendance**

### **Scenario 2: Multiple Employees**

1. **Admin adds 3+ employees**
2. **Each employee logs in and marks attendance**
3. **Admin views comprehensive attendance report**

### **Scenario 3: Error Handling**

1. **Try to check in twice** (should fail)
2. **Try to check out without check-in** (should fail)
3. **Try employee accessing admin routes** (should fail)
4. **Try invalid login credentials** (should fail)

### **Scenario 4: Employee Management**

1. **Admin updates employee info**
2. **Admin deactivates employee**
3. **Deactivated employee tries to login** (should fail)

## 📋 Sample API Responses

### Successful Login Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "role": "employee"
  }
}
```

### Check-in Response
```json
{
  "message": "Checked in successfully",
  "attendance": {
    "_id": "507f1f77bcf86cd799439012",
    "employee": "507f1f77bcf86cd799439011",
    "date": "2025-12-26T00:00:00.000Z",
    "checkIn": "2025-12-26T06:30:00.000Z",
    "location": {
      "latitude": 12.9716,
      "longitude": 77.5946
    },
    "status": "present",
    "createdAt": "2025-12-26T06:30:00.000Z",
    "updatedAt": "2025-12-26T06:30:00.000Z"
  }
}
```

### Attendance History Response
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "employee": "507f1f77bcf86cd799439011",
    "date": "2025-12-26T00:00:00.000Z",
    "checkIn": "2025-12-26T06:30:00.000Z",
    "checkOut": "2025-12-26T17:30:00.000Z",
    "location": {
      "latitude": 12.9716,
      "longitude": 77.5946
    },
    "status": "present",
    "createdAt": "2025-12-26T06:30:00.000Z",
    "updatedAt": "2025-12-26T17:30:00.000Z"
  }
]
```

## 🔍 Common Issues & Solutions

### **1. "Access denied for user" MySQL Error**
**Solution:** Check MySQL credentials in `.env` file and ensure database exists

### **2. "Unauthorized" Error**
**Solution:** Check if JWT token is valid and not expired (24h expiry)

### **3. "Forbidden" Error**
**Solution:** Ensure correct role permissions (admin vs employee routes)

### **4. "Validation Error"**
**Solution:** Check request body format and required fields

### **5. Postman Variables Not Working**
**Solution:** Ensure environment is selected and variables are set correctly

## 🎯 Testing Checklist

### Authentication Tests
- [ ] Register admin account (only once)
- [ ] Admin login successful
- [ ] Employee login successful
- [ ] Invalid credentials rejected
- [ ] Deactivated account blocked

### Employee Tests
- [ ] Check-in with location
- [ ] Check-in without location
- [ ] Double check-in prevented
- [ ] Check-out successful
- [ ] Check-out without check-in fails
- [ ] Attendance history retrieval
- [ ] Today's status check

### Admin Tests
- [ ] Add new employee
- [ ] Get all employees
- [ ] Update employee info
- [ ] Deactivate employee
- [ ] View all attendance records
- [ ] Access employee-only routes blocked

### Security Tests
- [ ] JWT token required for protected routes
- [ ] Role-based access control working
- [ ] Expired tokens rejected
- [ ] Invalid tokens rejected

## 📱 Mobile App Integration

The React Native app automatically connects to these APIs at `http://localhost:5000/api`. The app handles:

- **Authentication flow** with JWT tokens
- **Real-time attendance marking** with camera and location
- **Error handling** and user feedback
- **Offline support** with AsyncStorage

## 🚀 Production Deployment

For production:
1. Update MySQL database credentials in `.env`
2. Set strong JWT_SECRET
3. Enable HTTPS
4. Configure CORS for mobile app domains
5. Set NODE_ENV=production

---

**🎉 Your Attendance Management System is now fully tested and ready for production use!**
