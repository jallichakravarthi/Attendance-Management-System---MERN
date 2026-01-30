const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    email: { type: String }, // legacy only, optional

    regNo: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["present", "late", "absent"],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "attendance",
  }
);


module.exports = mongoose.model("Attendance", AttendanceSchema);
