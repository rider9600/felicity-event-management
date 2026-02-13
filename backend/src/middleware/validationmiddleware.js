// Generic validation middleware for required fields
export const validateFields = (fields) => {
  return (req, res, next) => {
    for (const field of fields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }
    next();
  };
};

// Example usage: app.post('/route', validateFields(['email', 'password']), handler)
