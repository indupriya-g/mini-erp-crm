import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient";

const router = Router();

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation: make sure both fields were actually sent
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Step 1: find the user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Deliberately vague message — we don't want to reveal
      // whether the email exists or not, for security reasons
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Step 2: compare submitted password against the stored hash
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Step 3: password is correct, create a JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "8h" } // token becomes invalid after 8 hours
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong during login" });
  }
});

export default router;