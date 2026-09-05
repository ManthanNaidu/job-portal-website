/**
 * HireSphere Global Application State
 * ------------------------------------
 * Shared client-side state for:
 * - Authentication
 * - Jobs
 * - Companies
 * - Saved jobs
 * - Applications
 * - Alerts
 * - Notifications
 * - Career intelligence
 */

import {
  getCurrentSession,
  getCurrentUser,
  getCurrentRole,
  isAuthenticated
} from "./auth/auth.js";

/* =========================================================
   INITIAL STATE
========================================================= */

const initialState = {
  auth: {
    isAuthenticated: false,
    role: null,
    user: null,
    session: null
  },

  jobs: [],

  companies: [],

  savedJobs: [],

  applications: [],

  jobAlerts: [],

  notifications: [],

  career: {
    score: 0,
    matchScore: 0,
    skillGaps: [],
    recommendations: []
  }
};

/* =========================================================
   GLOBAL STATE
========================================================= */

export const AppState = structuredClone(initialState);

/* =========================================================
   AUTH STATE
========================================================= */

/**
 * Synchronize authentication state from auth.js.
 */
export function syncAuthState() {
  const authenticated = isAuthenticated();

  if (!authenticated) {
    clearAuthState();
    return AppState.auth;
  }

  AppState.auth = {
    isAuthenticated: true,
    role: getCurrentRole(),
    user: getCurrentUser(),
    session: getCurrentSession()
  };

  return AppState.auth;
}

/**
 * Set authentication state manually.
 *
 * @param {Object} authData
 */
export function setAuthState(authData = {}) {
  AppState.auth = {
    isAuthenticated: Boolean(authData.isAuthenticated),
    role: authData.role || null,
    user: authData.user || null,
    session: authData.session || null
  };
}

/**
 * Clear authentication state.
 */
export function clearAuthState() {
  AppState.auth = {
    isAuthenticated: false,
    role: null,
    user: null,
    session: null
  };
}

/* =========================================================
   JOBS
========================================================= */

export function setJobs(jobs = []) {
  AppState.jobs = Array.isArray(jobs) ? jobs : [];
}

export function getJobs() {
  return AppState.jobs;
}

/* =========================================================
   COMPANIES
========================================================= */

export function setCompanies(companies = []) {
  AppState.companies = Array.isArray(companies)
    ? companies
    : [];
}

export function getCompanies() {
  return AppState.companies;
}

/* =========================================================
   SAVED JOBS
========================================================= */

export function setSavedJobs(savedJobs = []) {
  AppState.savedJobs = Array.isArray(savedJobs)
    ? savedJobs
    : [];
}

export function getSavedJobs() {
  return AppState.savedJobs;
}

export function addSavedJob(jobId) {
  if (!jobId) {
    return;
  }

  if (!AppState.savedJobs.includes(jobId)) {
    AppState.savedJobs.push(jobId);
  }
}

export function removeSavedJob(jobId) {
  AppState.savedJobs = AppState.savedJobs.filter(
    (id) => id !== jobId
  );
}

/* =========================================================
   APPLICATIONS
========================================================= */

export function setApplications(applications = []) {
  AppState.applications = Array.isArray(applications)
    ? applications
    : [];
}

export function getApplications() {
  return AppState.applications;
}

/* =========================================================
   JOB ALERTS
========================================================= */

export function setJobAlerts(alerts = []) {
  AppState.jobAlerts = Array.isArray(alerts)
    ? alerts
    : [];
}

export function getJobAlerts() {
  return AppState.jobAlerts;
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

export function setNotifications(notifications = []) {
  AppState.notifications = Array.isArray(notifications)
    ? notifications
    : [];
}

export function getNotifications() {
  return AppState.notifications;
}

/* =========================================================
   CAREER INTELLIGENCE
========================================================= */

export function updateCareerState(careerData = {}) {
  AppState.career = {
    ...AppState.career,
    ...careerData
  };
}

export function getCareerState() {
  return AppState.career;
}

/* =========================================================
   RESET
========================================================= */

export function resetAppState() {
  Object.assign(
    AppState,
    structuredClone(initialState)
  );
}

/* =========================================================
   INITIAL SYNC
========================================================= */

syncAuthState();
