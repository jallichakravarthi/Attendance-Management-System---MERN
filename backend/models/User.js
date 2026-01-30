const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    username: {
      type: String,
      trim: true
    },

    // 🔑 College Registration Number
    regNo: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password: { type: String }, // bcrypt hash
    faceprint: { type: [Number], default: [] },

    role: {
      type: String,
      enum: ["Admin", "Faculty", "Student"],
      required: true
    },

    isValid: { type: Boolean, default: false },

    // 🎓 Only meaningful for students
    expectedGraduationYear: {
      type: Number
    },

    // For students → who is their proctor
    proctor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // For faculty → which students are assigned
    assignedStudents: [
      { type: Schema.Types.ObjectId, ref: "User" }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
