const express = require("express");
const router = express.Router();

const {
  addUser,
  registerUser,
  loginUser,
  getMe,
  updateUser,
  adminUpdateUser,
  getUsers,
  getUserById,
  checkFaceprint,
  getAttendanceByUser,
  getFullAttendance,
  getStudentAttendanceByFaculty,

} = require("../controllers/userController");

const {
  authMiddleware,
  allowRoles
} = require("../middleware/authMiddleware");

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Register (email must already exist in DB)
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

// Get logged-in user profile
router.get("/me", authMiddleware, getMe);

// Update own profile (cannot update role, faceprint, password)
router.put("/me", authMiddleware, updateUser);

// Get own attendance
router.get("/attendance", authMiddleware, getAttendanceByUser);

// Check faceprint
router.post("/check-faceprint", authMiddleware, checkFaceprint);

/*
|--------------------------------------------------------------------------
| Admin Only Routes
|--------------------------------------------------------------------------
*/

// Admin Update user
router.put(
  "/admin/update-user",
  authMiddleware,
  allowRoles("Admin"),
  adminUpdateUser
);

/*
|--------------------------------------------------------------------------
| Admin / Faculty Routes
|--------------------------------------------------------------------------
*/

// Add users (bulk)
// Admin → Faculty + Students
// Faculty → Students only (auto-proctor)
router.post(
  "/users",
  authMiddleware,
  allowRoles("Admin", "Faculty"),
  addUser
);

// Get users list
// Admin → all users
// Faculty → only assigned students
router.get(
  "/users",
  authMiddleware,
  allowRoles("Admin", "Faculty"),
  getUsers
);

// Get specific user
router.get(
  "/users/:userId",
  authMiddleware,
  allowRoles("Admin", "Faculty"),
  getUserById
);

/* =========================================================
   GET FULL ATTENDANCE (ADMIN)
========================================================= */
router.get(
  "/attendance/full",
  authMiddleware,        // ensure user is authenticated
  allowRoles("Admin"),  // ensure user is admin
  getFullAttendance      // call your controller
);

/* =========================================================
   GET STUDENT ATTENDANCE BY FACULTY
========================================================= */
router.get(
  "/attendance/faculty",
  authMiddleware,          // ensure user is authenticated
  getStudentAttendanceByFaculty
);

module.exports = router;
