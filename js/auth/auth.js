/**
 * HireSphere Authentication Service
 * ----------------------------------
 * Handles:
 * - Employee registration
 * - Recruiter registration
 * - Employee login
 * - Recruiter login
 * - Session management
 * - Role detection
 * - Authentication guards
 * - Logout
 *
 * Prototype authentication uses localStorage through storage-service.js.
 *
 * IMPORTANT:
 * This is suitable for a frontend-only prototype/demo.
 * In production, authentication must be handled by a backend.
 */

import {
  get,
  set,
  remove
} from "../services/storage-service.js";

/* =========================================================
   CONSTANTS
========================================================= */

export const ROLES = Object.freeze({
  EMPLOYEE: "employee",
  RECRUITER: "recruiter"
});

const STORAGE_KEYS = Object.freeze({
  EMPLOYEES: "employees",
  RECRUITERS: "recruiters",
  SESSION: "session"
});

/* =========================================================
   PASSWORD HASHING
========================================================= */

/**
 * Hash a password using SHA-256.
 *
 * NOTE:
 * This is only for prototype purposes.
 * Production applications should use server-side password
 * hashing such as Argon2id, bcrypt, or scrypt.
 *
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  if (!password || typeof password !== "string") {
    throw new Error("Invalid password.");
  }

  if (!window.crypto?.subtle) {
    throw new Error("Secure password hashing is not supported in this browser.");
  }

  const encoder = new TextEncoder();

  const data = encoder.encode(password);

  const hashBuffer = await window.crypto.subtle.digest(
    "SHA-256",
    data
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/* =========================================================
   HELPERS
========================================================= */

/**
 * Generate a unique user ID.
 *
 * @param {string} role
 * @returns {string}
 */
function generateUserId(role) {
  const prefix = role === ROLES.RECRUITER ? "REC" : "EMP";

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
}

/**
 * Normalize email address.
 *
 * @param {string} email
 * @returns {string}
 */
function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

/**
 * Check whether an email is valid.
 *
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password.
 *
 * @param {string} password
 * @returns {boolean}
 */
function isValidPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8
  );
}

/**
 * Check whether email already exists in a user collection.
 *
 * @param {Array} users
 * @param {string} email
 * @returns {boolean}
 */
function emailExists(users, email) {
  return users.some(
    (user) => normalizeEmail(user.email) === normalizeEmail(email)
  );
}

/**
 * Create a session object.
 *
 * @param {Object} user
 * @param {string} role
 * @returns {Object}
 */
function createSession(user, role) {
  return {
    userId: user.id,
    role,
    email: user.email,
    name:
      user.name ||
      user.fullName ||
      user.companyName ||
      "",
    loginAt: new Date().toISOString()
  };
}

/**
 * Sanitize user object before storing in session.
 * Never store the password or password hash in session.
 *
 * @param {Object} user
 * @returns {Object}
 */
function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const {
    password,
    passwordHash,
    ...safeUser
  } = user;

  return safeUser;
}

/* =========================================================
   EMPLOYEE REGISTRATION
========================================================= */

/**
 * Register a new employee.
 *
 * @param {Object} userData
 * @returns {Promise<Object>}
 */
export async function registerEmployee(userData = {}) {
  const {
    name,
    email,
    password,
    phone = "",
    location = "",
    skills = []
  } = userData;

  const normalizedEmail = normalizeEmail(email);

  if (!name?.trim()) {
    throw new Error("Full name is required.");
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!isValidPassword(password)) {
    throw new Error("Password must contain at least 8 characters.");
  }

  const employees = get(
    STORAGE_KEYS.EMPLOYEES,
    []
  );

  if (!Array.isArray(employees)) {
    throw new Error("Employee data is corrupted.");
  }

  if (emailExists(employees, normalizedEmail)) {
    throw new Error("An employee account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);

  const employee = {
    id: generateUserId(ROLES.EMPLOYEE),
    role: ROLES.EMPLOYEE,

    name: name.trim(),
    email: normalizedEmail,

    passwordHash,

    phone: String(phone).trim(),
    location: String(location).trim(),

    skills: Array.isArray(skills) ? skills : [],

    profileScore: 0,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  employees.push(employee);

  set(
    STORAGE_KEYS.EMPLOYEES,
    employees
  );

  return sanitizeUser(employee);
}

/* =========================================================
   RECRUITER REGISTRATION
========================================================= */

/**
 * Register a new recruiter.
 *
 * @param {Object} recruiterData
 * @returns {Promise<Object>}
 */
export async function registerRecruiter(recruiterData = {}) {
  const {
    name,
    email,
    password,
    companyName,
    designation = "",
    phone = ""
  } = recruiterData;

  const normalizedEmail = normalizeEmail(email);

  if (!name?.trim()) {
    throw new Error("Recruiter name is required.");
  }

  if (!companyName?.trim()) {
    throw new Error("Company name is required.");
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!isValidPassword(password)) {
    throw new Error("Password must contain at least 8 characters.");
  }

  const recruiters = get(
    STORAGE_KEYS.RECRUITERS,
    []
  );

  if (!Array.isArray(recruiters)) {
    throw new Error("Recruiter data is corrupted.");
  }

  if (emailExists(recruiters, normalizedEmail)) {
    throw new Error("A recruiter account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);

  const recruiter = {
    id: generateUserId(ROLES.RECRUITER),
    role: ROLES.RECRUITER,

    name: name.trim(),
    email: normalizedEmail,

    companyName: companyName.trim(),
    designation: designation.trim(),
    phone: phone.trim(),

    passwordHash,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  recruiters.push(recruiter);

  set(
    STORAGE_KEYS.RECRUITERS,
    recruiters
  );

  return sanitizeUser(recruiter);
}

/* =========================================================
   EMPLOYEE LOGIN
========================================================= */

/**
 * Login an employee.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>}
 */
export async function loginEmployee(email, password) {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  const employees = get(
    STORAGE_KEYS.EMPLOYEES,
    []
  );

  if (!Array.isArray(employees)) {
    throw new Error("Employee data is corrupted.");
  }

  const employee = employees.find(
    (user) =>
      normalizeEmail(user.email) === normalizedEmail
  );

  if (!employee) {
    throw new Error("Invalid email or password.");
  }

  const passwordHash = await hashPassword(password);

  if (employee.passwordHash !== passwordHash) {
    throw new Error("Invalid email or password.");
  }

  const session = createSession(
    employee,
    ROLES.EMPLOYEE
  );

  set(
    STORAGE_KEYS.SESSION,
    session
  );

  return {
    success: true,
    role: ROLES.EMPLOYEE,
    user: sanitizeUser(employee),
    session
  };
}

/* =========================================================
   RECRUITER LOGIN
========================================================= */

/**
 * Login a recruiter.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>}
 */
export async function loginRecruiter(email, password) {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  const recruiters = get(
    STORAGE_KEYS.RECRUITERS,
    []
  );

  if (!Array.isArray(recruiters)) {
    throw new Error("Recruiter data is corrupted.");
  }

  const recruiter = recruiters.find(
    (user) =>
      normalizeEmail(user.email) === normalizedEmail
  );

  if (!recruiter) {
    throw new Error("Invalid email or password.");
  }

  const passwordHash = await hashPassword(password);

  if (recruiter.passwordHash !== passwordHash) {
    throw new Error("Invalid email or password.");
  }

  const session = createSession(
    recruiter,
    ROLES.RECRUITER
  );

  set(
    STORAGE_KEYS.SESSION,
    session
  );

  return {
    success: true,
    role: ROLES.RECRUITER,
    user: sanitizeUser(recruiter),
    session
  };
}

/* =========================================================
   SESSION MANAGEMENT
========================================================= */

/**
 * Get the current authentication session.
 *
 * @returns {Object|null}
 */
export function getCurrentSession() {
  const session = get(
    STORAGE_KEYS.SESSION,
    null
  );

  if (!session || !session.userId || !session.role) {
    return null;
  }

  return session;
}

/**
 * Get current logged-in user.
 *
 * @returns {Object|null}
 */
export function getCurrentUser() {
  const session = getCurrentSession();

  if (!session) {
    return null;
  }

  const collectionKey =
    session.role === ROLES.RECRUITER
      ? STORAGE_KEYS.RECRUITERS
      : STORAGE_KEYS.EMPLOYEES;

  const users = get(
    collectionKey,
    []
  );

  if (!Array.isArray(users)) {
    return null;
  }

  const user = users.find(
    (item) => item.id === session.userId
  );

  return sanitizeUser(user);
}

/**
 * Get current role.
 *
 * @returns {string|null}
 */
export function getCurrentRole() {
  const session = getCurrentSession();

  return session?.role || null;
}

/**
 * Check whether someone is authenticated.
 *
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getCurrentSession() !== null;
}

/**
 * Check whether current user is an employee.
 *
 * @returns {boolean}
 */
export function isEmployee() {
  return getCurrentRole() === ROLES.EMPLOYEE;
}

/**
 * Check whether current user is a recruiter.
 *
 * @returns {boolean}
 */
export function isRecruiter() {
  return getCurrentRole() === ROLES.RECRUITER;
}

/* =========================================================
   LOGOUT
========================================================= */

/**
 * Logout current user.
 */
export function logout() {
  remove(STORAGE_KEYS.SESSION);

  // Redirect to main landing page.
  window.location.href = "../../index.html";
}

/* =========================================================
   ROUTING
========================================================= */

/**
 * Get dashboard path based on role.
 *
 * These paths are relative to the authentication pages:
 *
 * pages/auth/employee-login.html
 * pages/auth/recruiter-login.html
 *
 * @param {string} role
 * @returns {string}
 */
export function getDashboardPath(role) {
  switch (role) {
    case ROLES.EMPLOYEE:
      return "../../index.html";

    case ROLES.RECRUITER:
      return "../recruiter/dashboard.html";

    default:
      return "../../index.html";
  }
}

/* =========================================================
   AUTH GUARDS
========================================================= */

/**
 * Require authentication.
 *
 * Redirects unauthenticated users to employee login.
 *
 * @param {Object} options
 * @param {string|null} options.role
 * @returns {Object|null}
 */
export function requireAuth({
  role = null
} = {}) {
  const session = getCurrentSession();

  if (!session) {
    window.location.href =
      "../auth/employee-login.html";

    return null;
  }

  if (role && session.role !== role) {
    window.location.href =
      getDashboardPath(session.role);

    return null;
  }

  return session;
}

/**
 * Require employee authentication.
 *
 * @returns {Object|null}
 */
export function requireEmployee() {
  return requireAuth({
    role: ROLES.EMPLOYEE
  });
}

/**
 * Require recruiter authentication.
 *
 * @returns {Object|null}
 */
export function requireRecruiter() {
  return requireAuth({
    role: ROLES.RECRUITER
  });
}

/* =========================================================
   INITIALIZATION
========================================================= */

/**
 * Validate existing session when application starts.
 *
 * @returns {Object|null}
 */
export function initializeAuth() {
  const session = getCurrentSession();

  if (!session) {
    return null;
  }

  const user = getCurrentUser();

  // Session points to a user that no longer exists.
  if (!user) {
    remove(STORAGE_KEYS.SESSION);
    return null;
  }

  return {
    session,
    user,
    role: session.role,
    isAuthenticated: true
  };
}
