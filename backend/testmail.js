import nodemailer from "nodemailer";
import sgTransport from "nodemailer-sendgrid-transport";
import dotenv from "dotenv";
dotenv.config();

// Create transport
const sgMail = nodemailer.createTransport(
  sgTransport({ auth: { api_key: process.env.SENDGRID_API_KEY } })
);

async function sendTestEmail() {
  const msg = {
    from: "22501a1240@pvpsit.ac.in", // verified sender
    to: "22501a1240@pvpsit.ac.in",
    subject: "OTP Test",
    text: `Your OTP is ${Math.floor(100000 + Math.random() * 900000)}`, // random 6-digit OTP
  };

  sgMail.sendMail(msg, (err, info) => {
    if (err) {
      console.error("Error sending email:", err);
    } else {
      console.log("Email sent successfully!", info);
    }
  });
}

sendTestEmail();
