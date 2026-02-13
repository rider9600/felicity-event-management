import jwt from "jsonwebtoken";
import user from "../models/user.js";
export const protect = async (req, res, next) => {
  try {
    const authheader = req.headers.authorization;
    if (!authheader) {
      return res.status(401).json({ msg: "No token provided" });
    }
    const token = authheader.split(" ")[1];

    // Check if token is blacklisted
    if (global.tokenBlacklist && global.tokenBlacklist.has(token)) {
      return res.status(401).json({ msg: "Token has been invalidated" });
    }

    const decoded = jwt.verify(token, process.env.secretbro);
    const founduser = await user.findById(decoded.id).select("-password");
    if (!founduser) {
      return res.status(401).json({ msg: "User not found" });
    }
    req.user = founduser; // attach user to request
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
};
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Access denied for this role" });
    }
    next();
  };
};
