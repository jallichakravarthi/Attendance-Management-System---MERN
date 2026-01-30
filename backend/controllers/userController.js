const User = require("../models/User");
const Attendance = require("../models/Attendance");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* =========================================================
   ADMIN / FACULTY: ADD USERS (BULK)
========================================================= */
const addUser = async (req, res) => {
  console.log("Add user request by:", req.user);

  console.log("RAW BODY:", req.body);
  console.log("USERS:", req.body?.users);

  try {
    if (!["Admin", "Faculty"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { users, proctorId } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "Users list is required" });
    }

    let validProctor = null;
    if (req.user.role === "Admin" && proctorId) {
      validProctor = await User.findOne({ _id: proctorId, role: "Faculty" });
      if (!validProctor) {
        return res.status(400).json({ error: "Invalid proctorId" });
      }
    }

    if (req.user.role === "Faculty" && proctorId) {
      return res.status(400).json({
        error: "Faculty cannot assign proctorId explicitly",
      });
    }

    const createdUsers = [];
    const skippedUsers = [];

    for (const u of users) {
      let { email, username, role, regNo } = u;

      if (!email || !username || !role || !regNo) {
        skippedUsers.push({
          email,
          reason: "Missing required fields (email, username, regno, role)",
        });
        continue;
      }

      email = email.toLowerCase().trim();
      username = username.trim();
      const regNumber = regNo.toUpperCase().trim();

      if (req.user.role === "Faculty" && role !== "Student") {
        skippedUsers.push({ email, reason: "Faculty can add only students" });
        continue;
      }

      if (req.user.role === "Admin" && !["Faculty", "Student"].includes(role)) {
        skippedUsers.push({ email, reason: "Invalid role" });
        continue;
      }

      // 🔍 Check existing by email OR regNo
      const existing = await User.findOne({
        $or: [{ email }, { regNo: regNumber }],
      });

      if (existing) {
        // Faculty assigning existing student
        if (req.user.role === "Faculty" && existing.role === "Student") {
          if (existing.proctor?.toString() === req.user._id.toString()) {
            skippedUsers.push({
              email,
              reason: "Student already assigned to this faculty",
            });
            continue;
          }

          if (
            existing.proctor &&
            existing.proctor.toString() !== req.user._id.toString()
          ) {
            skippedUsers.push({
              email,
              reason: "Student already assigned to another faculty",
            });
            continue;
          }

          // Fix relationship
          await User.findByIdAndUpdate(existing._id, {
            proctor: req.user._id,
          });

          await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { assignedStudents: existing._id },
          });

          createdUsers.push({
            _id: existing._id,
            email: existing.email,
            regNo: existing.regNo,
            role: existing.role,
            proctor: req.user._id,
            reassigned: true,
          });

          continue;
        }

        skippedUsers.push({
          email,
          reason: "User already exists (email or regNo)",
        });
        continue;
      }

      let finalProctor = null;
      if (role === "Student") {
        if (req.user.role === "Faculty") finalProctor = req.user._id;
        if (req.user.role === "Admin") finalProctor = validProctor?._id || null;
      }

      const newUser = await User.create({
        email,
        username,
        regNo: regNumber,
        role,
        isValid: false,
        proctor: finalProctor,
      });

      if (role === "Student" && finalProctor) {
        await User.findByIdAndUpdate(finalProctor, {
          $addToSet: { assignedStudents: newUser._id },
        });
      }

      createdUsers.push({
        _id: newUser._id,
        email,
        regNo: regNumber,
        role,
        proctor: finalProctor,
      });
    }

    res.status(201).json({
      status: "success",
      createdCount: createdUsers.length,
      skippedCount: skippedUsers.length,
      createdUsers,
      skippedUsers,
    });
  } catch (err) {
    console.error("Add user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================================================
   REGISTER USER
========================================================= */
const registerUser = async (req, res) => {
  console.log("Register user request:", req.body);
  try {
    const password = req.body.password;
    const regNo = req.body.regNo.trim().toUpperCase();
    const username = req.body.username;

    if (!password || !regNo) {
      return res.status(400).json({
        error: "Password and registration number are required",
      });
    }

    // 🔍 Find user by email + regNo
    const user = await User.findOne({
      regNo: regNo.trim().toUpperCase(),
    });

    console.log("Registering user:", regNo, "Found:", user);

    if (!user) {
      return res.status(403).json({
        error: "Registration Number not authorized",
      });
    }

    // 🚫 Already registered
    if (user.password) {
      return res.status(400).json({
        error: "User already registered",
      });
    }

    // 🔐 Set credentials
    user.password = await bcrypt.hash(password, 10);

    if (username) {
      user.username = username.trim();
    }

    user.isValid = true;

    await user.save();

    // 🎟️ JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        regNo: user.regNo,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const responseUser = await User.findById(user._id).select(
      "-password -faceprint",
    );

    res.json({
      status: "success",
      token,
      user: responseUser,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================================================
   LOGIN USER (Email OR RegNo)
========================================================= */
const loginUser = async (req, res) => {
  try {
    const { email, regno, password } = req.body;

    console.log("Login attempt:", req.body);

    if ((!email && !regno) || !password) {
      return res.status(400).json({
        error: "Email or RegNo and password are required",
      });
    }

    const query = email
      ? { email: email.toLowerCase() }
      : { regNo: regno.toUpperCase() };

    const user = await User.findOne(query);

    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        regNo: user.regNo,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const safeUser = await User.findById(user._id).select(
      "-password -faceprint",
    );

    res.json({
      status: "success",
      token,
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================================================
   GET CURRENT USER
========================================================= */
const getMe = async (req, res) => {
  console.log("GetMe request for user:", req.user);
  const user = await User.findById(req.user._id)
    .select("-password -faceprint")
    .populate("proctor", "regNo email username")
    .populate(
      "assignedStudents",
      "regNo email username regNo expectedGraduationYear",
    );

  res.json({ status: "success", user });
};

/* =========================================================
   UPDATE OWN PROFILE (USERNAME / EMAIL / PASSWORD / REGNO)
========================================================= */
const updateUser = async (req, res) => {
  console.log("Update user request for:", req.user);
  try {
    const { username, email, password, regNo } = req.body;
    const updates = {};

    console.log("Starting profile update for:", req.user.email);
    console.log("Incoming body:", req.body);

    // ✅ username
    if (typeof username === "string" && username.trim() !== "") {
      updates.username = username.trim();
    }

    // ✅ email
    if (typeof email === "string" && email.trim() !== "") {
      const normalizedEmail = email.toLowerCase().trim();

      const exists = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: req.user._id },
      });

      if (exists) {
        return res.status(409).json({ error: "Email already in use" });
      }

      updates.email = normalizedEmail;
    }

    // ✅ regNo
    if (typeof regNo === "string" && regNo.trim() !== "") {
      return res
        .status(400)
        .json({ error: "Registration Number cannot be changed" });
    }

    // ✅ password
    if (typeof password === "string" && password.length > 0) {
      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }

      updates.password = await bcrypt.hash(password, 10);
    }

    console.log("Final update object:", updates);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    console.log("Mongo updated user:", updatedUser);

    res.json({
      status: "success",
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        regNo: updatedUser.regNo,
        role: updatedUser.role,
        proctor: updatedUser.proctor,
        assignedStudents: updatedUser.assignedStudents,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================================================
   ADMIN UPDATE USER (FULLY SAFE)
========================================================= */
const adminUpdateUser = async (req, res) => {
  console.log("Admin update user request:", req.user);

  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const {
      userId,
      username,
      email,
      role,
      password,
      proctor,
      regno
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    /* =========================
       EMAIL
    ========================= */
    if (email && email !== user.email) {
      const exists = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId },
      });

      if (exists) {
        return res.status(400).json({ error: "Email already in use" });
      }

      user.email = email.toLowerCase().trim();
    }

    /* =========================
       REGISTRATION NUMBER
    ========================= */
    if (regno && regno !== user.regNo) {
      const normalizedRegNo = regno.toUpperCase().trim();

      const exists = await User.findOne({
        regNo: normalizedRegNo,
        _id: { $ne: userId },
      });

      if (exists) {
        return res.status(400).json({ error: "RegNo already in use" });
      }

      user.regNo = normalizedRegNo;
    }

    /* =========================
       USERNAME
    ========================= */
    if (username) {
      user.username = username.trim();
    }

    /* =========================
       PASSWORD
    ========================= */
    if (password) {
      user.password = await bcrypt.hash(password, 10);
      user.isValid = true;
    }

    /* =========================
       ROLE CHANGE (cleanup first)
    ========================= */
    if (role && role !== user.role) {
      // Student → something else
      if (user.role === "Student" && user.proctor) {
        await User.findByIdAndUpdate(user.proctor, {
          $pull: { assignedStudents: user._id },
        });
        user.proctor = null;
      }

      // Faculty → something else
      if (user.role === "Faculty") {
        await User.updateMany(
          { proctor: user._id },
          { $set: { proctor: null } }
        );
        user.assignedStudents = [];
      }

      user.role = role;
    }

    /* =========================
       PROCTOR (ONLY if Student)
    ========================= */
    if (user.role === "Student" && proctor !== undefined) {
      if (user.proctor) {
        await User.findByIdAndUpdate(user.proctor, {
          $pull: { assignedStudents: user._id },
        });
      }

      if (proctor) {
        const faculty = await User.findOne({
          _id: proctor,
          role: "Faculty",
        });

        if (!faculty) {
          return res.status(400).json({ error: "Invalid proctor" });
        }

        await User.findByIdAndUpdate(proctor, {
          $addToSet: { assignedStudents: user._id },
        });

        user.proctor = proctor;
      } else {
        user.proctor = null;
      }
    }

    await user.save();

    const sanitized = user.toObject();
    delete sanitized.password;
    delete sanitized.faceprint;

    res.json({ status: "success", user: sanitized });

  } catch (err) {
    console.error("Admin update user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


/* =========================================================
   GET ATTENDANCE BY USER
========================================================= */
const getAttendanceByUser = async (req, res) => {
  console.log("Get attendance request for user:", req.user);
  try {
    const records = await Attendance.find({ regNo: req.user.regNo });
    res.json({ status: "success", attendance: records });
  } catch (err) {
    console.error("Get attendance error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================================================
   GET USERS LIST
========================================================= */
const getUsers = async (req, res) => {
  console.log("Get users request by:", req.user);
  let users;
  if (req.user.role === "Admin") {
    users = await User.find()
      .select("-password -faceprint")
      .populate("proctor", "regNo email username");
  } else if (req.user.role === "Faculty") {
    users = await User.find({
      proctor: req.user._id,
      role: "Student",
    })
      .select("-password -faceprint")
      .populate("proctor", "regNo email username");
  } else {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json({ status: "success", users });
};

/* =========================================================
   GET USER BY ID
========================================================= */
const getUserById = async (req, res) => {
  console.log("Get user by ID request by:", req.user);
  console.log("req.user: at getUserById", req.user);
  const user = await User.findById(req.params.userId)
    .select("-password -faceprint")
    .populate("proctor", "regNo username email");
  if (!user) return res.status(404).json({ error: "User not found" });

  if (
    req.user.role === "Faculty" &&
    user.proctor?._id.toString() !== req.user._id.toString()
  ) {
    console.log("Faculty:", req.user, "\nunauthorized access to user:", user);
    return res.status(403).json({ error: "Forbidden" });
  }

  res.json({ status: "success", user });
};

/* =========================================================
   FACEPRINT CHECK - true/false
========================================================= */
const checkFaceprint = async (req, res) => {
  console.log("Check faceprint request for user:", req.user);
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("faceprint");

    if (!user) {
      return res.status(404).json({
        status: "Not Found",
        hasFaceprint: false,
      });
    }

    const hasFaceprint =
      Array.isArray(user.faceprint) && user.faceprint.length > 0;

    return res.json({
      status: "success",
      hasFaceprint,
    });
  } catch (err) {
    console.error("Check faceprint error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================================================
   GET FULL ATTENDANCE LIST (ADMIN)
========================================================= */
const getFullAttendance = async (req, res) => {
  console.log("Get full attendance request by:", req.user);
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // No changes needed here, regNo is already stored in attendance
    const records = await Attendance.find();
    res.json({ status: "success", attendance: records });
  } catch (err) {
    console.error("Get full attendance error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================================================
   GET STUDENT ATTENDANCE BY FACULTY
========================================================= */
const getStudentAttendanceByFaculty = async (req, res) => {
  console.log("Get student attendance by faculty request by:", req.user);
  try {
    if (req.user.role !== "Faculty") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const assignedStudents = await User.find({
      proctor: req.user._id,
      role: "Student",
    }).select("_id regNo"); // <-- fetch regNo instead of email

    const studentRegNos = assignedStudents.map((s) => s.regNo);

    const records = await Attendance.find({
      regNo: { $in: studentRegNos }, // <-- query by regNo
    });

    console.log(
      `Faculty ${req.user.email} fetched attendance for students:`,
      records,
    );

    res.json({ status: "success", attendance: records });
  } catch (err) {
    console.error("Get student attendance by faculty error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
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
};
