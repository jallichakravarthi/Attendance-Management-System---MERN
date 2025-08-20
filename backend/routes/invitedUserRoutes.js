import express from "express";
import { inviteUser, getInvitedUsers, deleteInvitedUser, updateInvitedUser } from "../controllers/invitedUserController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const invitedUserRouter = express.Router();

invitedUserRouter.post("/invite", authMiddleware, roleMiddleware(["admin"]), inviteUser);
invitedUserRouter.get("/get-invited-users", authMiddleware, roleMiddleware(["admin"]), getInvitedUsers);
invitedUserRouter.delete("/delete-invited-user/:id", authMiddleware, roleMiddleware(["admin"]), deleteInvitedUser);
invitedUserRouter.put("/update-invited-user/:id", authMiddleware, roleMiddleware(["admin"]), updateInvitedUser);

export default invitedUserRouter;
