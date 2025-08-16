const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const calculateBMI = (weight, height) => {
  if (weight <= 0 || height <= 0) {
    throw new Error('Weight and height must be positive numbers');
  }
  return weight / (height * height);
};

const formatResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

module.exports = {
  validateEmail,
  calculateBMI,
  formatResponse,
};
