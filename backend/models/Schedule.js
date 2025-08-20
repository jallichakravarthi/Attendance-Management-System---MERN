import mongoose from "mongoose";

const scheduleSlotSchema = new mongoose.Schema({
  courseTitle: { type: String, required: true },
  courseCode: { type: String, required: true },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  weekday: {
    type: String,
    required: true,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
  }, // optionally, enum: ["Monday","Tuesday",...]
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
  },
  description: { type: String }, // admin-set description
});

const scheduleSchema = new mongoose.Schema(
  {
    semester: { type: String, required: true },
    venue: { type: String, default: "" }, // moved out of semester
    regulation: { type: String, required: true }, // e.g., "pvp20"
    section: { type: Number, required: true },
    batch: { type: Number, required: true },
    department: { type: String, required: true },
    year: { type: Number, required: true }, // e.g., 1,2,3,4 (B.Tech)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    slots: [scheduleSlotSchema],
  },
  { timestamps: true }
);

scheduleSchema.index(
  { semester: 1, section: 1, year: 1, batch: 1 },
  { unique: true }
);

export default mongoose.model("Schedule", scheduleSchema);
