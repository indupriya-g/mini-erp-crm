"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = __importDefault(require("../prismaClient"));
const router = (0, express_1.Router)();
// POST /auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // Basic validation: make sure both fields were actually sent
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        // Step 1: find the user by email
        const user = await prismaClient_1.default.user.findUnique({ where: { email } });
        if (!user) {
            // Deliberately vague message — we don't want to reveal
            // whether the email exists or not, for security reasons
            return res.status(401).json({ message: "Invalid email or password" });
        }
        // Step 2: compare submitted password against the stored hash
        const passwordMatches = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        // Step 3: password is correct, create a JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" } // token becomes invalid after 8 hours
        );
        // Step 4: send the token + basic user info back
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong during login" });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map