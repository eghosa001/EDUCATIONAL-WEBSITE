export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

export const validateName = (name: string, fieldName: string): string | null => {
  if (!name) return `${fieldName} is required`;
  if (name.length < 2) return `${fieldName} must be at least 2 characters`;
  return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === '') return `${fieldName} is required`;
  return null;
};

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  email?: { required?: boolean; minLength?: number };
  password?: { required?: boolean; minLength?: number };
  name?: { required?: boolean; minLength?: number };
}

export const getValidationMessages = (field: string, rules: ValidationRules): string[] => {
  const messages: string[] = [];
  if (rules.required) messages.push(`${field} is required`);
  if (rules.minLength) messages.push(`${field} must be at least ${rules.minLength} characters`);
  return messages;
};
