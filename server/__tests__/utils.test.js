const { validateEmail, calculateBMI, formatResponse } = require('../utils');

describe('Email validation', () => {
  test('validates correct email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  test('invalidates incorrect email', () => {
    expect(validateEmail('invalid-email')).toBe(false);
  });
});

describe('BMI calculation', () => {
  test('calculates BMI correctly', () => {
    expect(calculateBMI(70, 1.75)).toBeCloseTo(22.86, 2);
  });

  test('throws error for invalid inputs', () => {
    expect(() => calculateBMI(0, 1.75)).toThrow(
      'Weight and height must be positive numbers'
    );
  });
});

describe('Response formatting', () => {
  test('formats response with default message', () => {
    const result = formatResponse({ id: 1, name: 'Test' });
    expect(result).toEqual({
      success: true,
      message: 'Success',
      data: { id: 1, name: 'Test' },
    });
  });

  test('formats response with custom message', () => {
    const result = formatResponse({ id: 1 }, 'User created');
    expect(result.message).toBe('User created');
  });
});
