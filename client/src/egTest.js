export const add = (a, b) => a + b;

export const multiply = (a, b) => a * b;

export const greetUser = (name) => {
  if (!name) {
    throw new Error('Name is required');
  }
  return `Hello, ${name}!`;
};