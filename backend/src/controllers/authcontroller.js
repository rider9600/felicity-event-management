import user from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { firstname, lastname, email, password, participantType } = req.body;

    // Prevent admin registration via public routes
    if (email === process.env.admin_email || req.body.role === "admin") {
      return res
        .status(403)
        .json({ msg: "Admin registration not allowed via public endpoint" });
    }

    const hashedpassword = await bcrypt.hash(password, 10);
    const role = "participant";

    if (
      participantType === "iiit" &&
      !email.endsWith("@students.iiit.ac.in") &&
      !email.endsWith("@research.iiit.ac.in")
    ) {
      return res.status(400).json({
        msg: "IIIT participants must use @students.iiit.ac.in or @research.iiit.ac.in email",
      });
    }

    const newuser = await user.create({
      firstname,
      lastname,
      email,
      password: hashedpassword,
      role,
      participantType,
    });

    const { password: _, ...safeusing } = newuser._doc;
    res.json(safeusing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const newuser = await user.findOne({ email });
    if (!newuser) {
      return res.status(400).json({
        msg: " U not existed in my world   (There is no member registered with the given email)",
      });
    }

    // Block archived / removed accounts from logging in
    if (newuser.isArchived) {
      return res.status(403).json({
        msg: "This account has been disabled. Please contact the admin.",
      });
    }

    const userexisted = await bcrypt.compare(password, newuser.password);
    if (!userexisted) {
      return res
        .status(400)
        .json({ msg: "Hacking the Wrong password:better luck next time " });
    }
    // Access token (short-lived)
    const token = jwt.sign(
      {
        id: newuser._id,
        role: newuser.role,
      },
      process.env.secretbro,
      { expiresIn: "15m" },
    );
    // Refresh token (longer-lived)
    const refreshToken = jwt.sign(
      {
        id: newuser._id,
        role: newuser.role,
      },
      process.env.secretbro,
      { expiresIn: "7d" },
    );
    const { password: _, ...safeuser } = newuser._doc;
    res.json({
      token,
      refreshToken,
      user: safeuser,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Refresh JWT token
export const refreshToken = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ msg: "No refresh token provided" });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.secretbro);
    const token = jwt.sign(
      {
        id: decoded.id,
        role: decoded.role,
      },
      process.env.secretbro,
      { expiresIn: "15m" },
    );
    res.json({ token });
  } catch (err) {
    res.status(401).json({ msg: "Invalid or expired refresh token" });
  }
};
// Logout and blacklist token
export const logout = async (req, res) => {
  try {
    // Expect Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({
        success: false,
        error: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Initialize blacklist if not exists
    if (!global.tokenBlacklist) {
      global.tokenBlacklist = new Set();
    }

    global.tokenBlacklist.add(token);

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Logout Error:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};
