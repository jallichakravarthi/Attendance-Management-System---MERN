import mongoose from "mongoose";

const invitedUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ["admin", "hod", "prof", "asst.prof", "lab technician", "peon"],
    required: true
  },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  invitedAt: { type: Date, default: Date.now }
});

export default mongoose.model("InvitedUser", invitedUserSchema);
