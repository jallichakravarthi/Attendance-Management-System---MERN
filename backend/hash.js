import bcrypt from "bcryptjs";

const log = await bcrypt.hash("pvpsit1234",10);
console.log(log);