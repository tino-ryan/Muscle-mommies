import { add, multiply, greetUser } from '../egTest';

describe('Math utilities', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(add(1, 2)).toBe(3);
  });

  test('multiplies 3 * 4 to equal 12', () => {
    expect(multiply(3, 4)).toBe(12);
  });
});

describe('User utilities', () => {
  test('greets user with name', () => {
    expect(greetUser('John')).toBe('Hello, John!');
  });

  test('throws error when name is not provided', () => {
    expect(() => greetUser()).toThrow('Name is required');
  });
});