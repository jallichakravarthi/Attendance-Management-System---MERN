import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["present", "absent", "on-leave"], default: "absent" },
  leaveType: {
    type: String,
    enum: ["sick", "paid", "unpaid", null],
    default: null
  },
  method: { type: String, enum: ["face-recognition", "manual"], default: "face-recognition" }
}, { timestamps: true });

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
