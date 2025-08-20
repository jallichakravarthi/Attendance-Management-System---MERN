import InvitedUser from "../models/InvitedUser.js";

export const inviteUser = async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email || !role)
            return res.status(400).json({ message: "All fields are required" });

        const existingUser = await InvitedUser.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "User already invited" });

        const newUser = await InvitedUser.create({ email, role, invitedBy: req.user.id });
        res.status(201).json({ user: newUser });
    } catch (err) {
        console.error("InviteUser error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getInvitedUsers = async (req, res) => {
    try {
        const users = await InvitedUser.find();
        res.status(200).json({ users });
    } catch (err) {
        console.error("GetInvitedUsers error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteInvitedUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await InvitedUser.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User deleted" });
    } catch (err) {
        console.error("DeleteInvitedUser error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateInvitedUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await InvitedUser.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;
        await user.save();

        res.status(200).json({ user });
    } catch (err) {
        console.error("UpdateInvitedUser error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
