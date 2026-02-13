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

    if (participantType === "iiit" && !email.endsWith("@iiit.ac.in")) {
      return res.status(400).json({ msg: "Invalid IIIT email" });
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
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(400).json({ msg: "No token provided" });
    }

    // Add token to blacklist (simple in-memory approach)
    if (!global.tokenBlacklist) {
      global.tokenBlacklist = new Set();
    }
    global.tokenBlacklist.add(token);

    res.json({ msg: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
