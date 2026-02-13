// Role-based access control middleware

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ msg: "Access denied. Admins only." });
};

export const organizerOnly = (req, res, next) => {
  if (req.user && req.user.role === "organizer") {
    return next();
  }
  return res.status(403).json({ msg: "Access denied. Organizers only." });
};

export const participantOnly = (req, res, next) => {
  if (req.user && req.user.role === "participant") {
    return next();
  }
  return res.status(403).json({ msg: "Access denied. Participants only." });
};

export const organizerOrAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "organizer" || req.user.role === "admin")
  ) {
    return next();
  }
  return res
    .status(403)
    .json({ msg: "Access denied. Organizers or Admins only." });
};
