const Attendance = require("./models/Attendance");
const User = require("./models/User");

const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/yourDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    console.log(
      "MongoDB connected, uri:",
      process.env.MONGO_URI || "mongodb://localhost:27017/yourDB",
    ),
  )
  .catch((err) => console.error("MongoDB connection error:", err));

const migrateRegNo = async () => {
  const records = await Attendance.find();
  console.log("Total records:", records.length);

  for (const record of records) {
    const user = await User.findOne({ email: record.email });
    if (user) {
      record.regNo = user.regNo;
      record.time = record.time || "00:00";
      record.status = record.status || "Unknown";
      record.date = record.date || new Date().toISOString().split("T")[0];
      await record.save();

      await record.save();
    }
  }
  console.log("Migration complete!");
  mongoose.disconnect();
};

migrateRegNo();
