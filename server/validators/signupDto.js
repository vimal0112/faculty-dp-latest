const { body, validationResult } = require('express-validator');

// TCE email domains - @tce.edu and @student.tce.edu allowed
const TCE_EMAIL_DOMAINS = ['@tce.edu', '@student.tce.edu'];

const isTceEmail = (value) => {
  const normalized = (value || '').toLowerCase().trim();
  return TCE_EMAIL_DOMAINS.some(domain => normalized.endsWith(domain));
};

// Validation rules for login - TCE email only
const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('please fill out this field')
    .custom((value) => {
      if (!isTceEmail(value)) {
        throw new Error('Only TCE college faculty/students (@tce.edu or @student.tce.edu) can login');
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('please fill out this field'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('please fill out this field'),
];

const handleLoginValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fieldErrors = {};
    errors.array().forEach((err) => {
      if (!fieldErrors[err.path]) fieldErrors[err.path] = err.msg;
    });
    return res.status(400).json({ error: 'Validation failed', fieldErrors });
  }
  next();
};

// Validation rules for signup - returns "please fill out this field" for blank fields
const signupValidationRules = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('please fill out this field')
    .isLength({ min: 3 })
    .withMessage('username must be greater than or equal to 3 characters'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('please fill out this field'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('please fill out this field')
    .isEmail()
    .withMessage('please fill out this field')
    .custom((value) => {
      if (!isTceEmail(value)) {
        throw new Error('Only TCE college email addresses (@tce.edu or @student.tce.edu) are allowed to register');
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('please fill out this field')
    .isLength({ min: 8 })
    .withMessage('password must contain 8 characters long (having combination of alphanumeric)')
    .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
    .withMessage('password must contain 8 characters long (having combination of alphanumeric)'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('please fill out this field')
    .isIn(['admin', 'faculty', 'hod'])
    .withMessage('please fill out this field'),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('please fill out this field'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('please fill out this field')
    .matches(/^\d{10}$/)
    .withMessage('phone number must contain 10 digits'),
];

// Middleware to format validation errors - returns field-specific messages
const handleSignupValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const fieldErrors = {};
    errors.array().forEach((err) => {
      if (!fieldErrors[err.path]) {
        fieldErrors[err.path] = err.msg;
      }
    });
    return res.status(400).json({
      error: 'Validation failed',
      fieldErrors
    });
  }
  next();
};

module.exports = {
  signupValidationRules,
  handleSignupValidation,
  loginValidationRules,
  handleLoginValidation,
  isTceEmail,
};
