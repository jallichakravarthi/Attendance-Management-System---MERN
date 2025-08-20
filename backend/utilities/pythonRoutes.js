import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const PY_SERVER = process.env.PYTHON_PATH || "http://localhost:5050";

export const registerFaceToDB = async ({ email, token }) => {
  try {
    // Send POST request to Python server
    const response = await axios.post(`${PY_SERVER}/register`, { email, token });
    return response.data;
  } catch (error) {
    console.error("Error registering face:", error.message);
    throw new Error("Face registration failed");
  }
};
