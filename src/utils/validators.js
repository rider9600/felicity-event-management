// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// IIIT email validation - must be @students.iiit.ac.in or @research.iiit.ac.in
export const isIIITEmail = (email) => {
  return (
    email.endsWith("@students.iiit.ac.in") ||
    email.endsWith("@research.iiit.ac.in")
  );
};

// Password validation (minimum 6 characters)
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Phone number validation (10 digits)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// Check if date is in future
export const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

// Check if date1 is before date2
export const isDateBefore = (date1, date2) => {
  return new Date(date1) < new Date(date2);
};
