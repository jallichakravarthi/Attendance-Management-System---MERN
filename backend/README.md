```md
# 🎓 Attendance Management Backend (MERN)

A role-based backend system for managing users and attendance in an academic environment.  
Built with **Node.js, Express, MongoDB, JWT**, and **bcrypt**.

---

## 🚀 Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcrypt
- dotenv
- cors

---

## 📁 Project Structure

```

backend/
│
├── controllers/
│   └── userController.js
│
├── middleware/
│   └── authMiddleware.js
│
├── models/
│   ├── User.js
│   └── Attendance.js
│
├── routes/
│   └── userRoutes.js
│
├── server.js
├── .env
└── README.md

```

---

## 👥 User Roles

- **Admin**
- **Faculty**
- **Student**

---

## 🔐 Authentication

All protected routes require a JWT token in the header:

```

Authorization: Bearer <JWT_TOKEN>

````

JWT payload:
```json
{
  "userId": "string",
  "role": "Admin | Faculty | Student",
  "email": "string"
}
````

---

## 🧠 Data Models

### User Model

```js
{
  email: String,                // unique, lowercase
  username: String,
  password: String,             // bcrypt hashed
  role: "Admin" | "Faculty" | "Student",
  isValid: Boolean,             // true after registration
  proctor: ObjectId | null,     // Faculty (for Student)
  assignedStudents: [ObjectId], // Students (for Faculty)
  faceprint: Array,             // reserved
  createdAt: Date,
  updatedAt: Date
}
```

---

### Attendance Model

```js
{
  email: String,        // student email
  date: Date,
  status: String       // Present / Absent
}
```

---

## 🌐 API Routes

Base path:

```
/api/users
```

---

## 🔓 Public Routes

### Register User

**POST** `/register`

Email must already exist (added by Admin or Faculty).

**Request Body**

```json
{
  "email": "student@example.com",
  "password": "password123",
  "username": "student01"
}
```

**Response**

```json
{
  "status": "success",
  "token": "jwt_token",
  "user": {
    "_id": "string",
    "email": "string",
    "username": "string",
    "role": "Student",
    "isValid": true
  }
}
```

---

### Login

**POST** `/login`

**Request Body**

```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response**

```json
{
  "status": "success",
  "token": "jwt_token",
  "user": {
    "_id": "string",
    "email": "string",
    "username": "string",
    "role": "Student"
  }
}
```

---

## 🔐 Authenticated Routes

### Get Current User

**GET** `/me`

**Response**

```json
{
  "status": "success",
  "user": {
    "_id": "string",
    "email": "string",
    "username": "string",
    "role": "Student",
    "proctor": {
      "_id": "string",
      "email": "string",
      "username": "string"
    },
    "assignedStudents": []
  }
}
```

---

### Update Own Profile

**PUT** `/me`

User can update **username, email, password only**.

**Request Body**

```json
{
  "username": "newname",
  "email": "new@example.com",
  "password": "newpassword123"
}
```

**Response**

```json
{
  "status": "success",
  "user": {
    "_id": "string",
    "email": "string",
    "username": "string",
    "role": "Student"
  }
}
```

---

### Get Own Attendance

**GET** `/attendance`

**Response**

```json
{
  "status": "success",
  "attendance": [
    {
      "_id": "string",
      "email": "student@example.com",
      "date": "2026-01-19",
      "status": "Present"
    }
  ]
}
```

---

## 🛡️ Admin Only Routes

### Admin Update User

**PUT** `/admin/update-user`

Admin can update:

* username
* email
* password
* role
* proctor (Student only)

Relations are synced automatically.

**Request Body**

```json
{
  "userId": "USER_ID",
  "username": "updated",
  "email": "updated@example.com",
  "role": "Student",
  "proctor": "FACULTY_ID"
}
```

**Response**

```json
{
  "status": "success",
  "user": {
    "_id": "string",
    "email": "string",
    "username": "string",
    "role": "Student",
    "proctor": "FACULTY_ID"
  }
}
```

---

## 🧑‍🏫 Admin / Faculty Routes

### Add Users (Bulk)

**POST** `/users`

#### Admin

Can add **Faculty & Students**, optionally assign a proctor.

**Request Body**

```json
{
  "proctorId": "FACULTY_ID",
  "users": [
    {
      "email": "student@example.com",
      "username": "student1",
      "role": "Student"
    }
  ]
}
```

#### Faculty

Can add **Students only**.
Faculty becomes proctor automatically.

**Response**

```json
{
  "status": "success",
  "createdCount": 1,
  "skippedCount": 0,
  "createdUsers": [
    {
      "_id": "string",
      "email": "student@example.com",
      "role": "Student",
      "proctor": "FACULTY_ID"
    }
  ],
  "skippedUsers": []
}
```

---

### Get Users List

**GET** `/users`

* Admin → all users
* Faculty → only assigned students

**Response**

```json
{
  "status": "success",
  "users": [
    {
      "_id": "string",
      "email": "string",
      "username": "string",
      "role": "Student"
    }
  ]
}
```

---

### Get User By ID

**GET** `/users/:userId`

Faculty can access only their own students.

**Response**

```json
{
  "status": "success",
  "user": {
    "_id": "string",
    "email": "string",
    "username": "string",
    "role": "Student"
  }
}
```

---

## 🛠 Environment Variables

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster/db
JWT_SECRET=your_jwt_secret
```

---

## ▶️ Running the Server

```bash
npm install
node server.js
```

Server runs at:

```
http://localhost:PORT
```

---

## 🔒 Security Notes

* Passwords are hashed using bcrypt
* JWT required for all protected routes
* Faculty cannot manage other faculty or admins
* Students have no access to admin/faculty routes

---

## ✅ Status

* Role-safe
* Relation-safe
* Production-ready
* Frontend compatible
