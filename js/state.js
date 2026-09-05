/* =========================================================
   HIRESPHERE — GLOBAL APPLICATION STATE
   File: js/state.js

   Responsibility:
   - Maintain shared client-side application state
   - Keep authentication state in sync
   - Store current user information
   - Store jobs, saved jobs and applications
   - Provide controlled state updates
   ========================================================= */


/* =========================================================
   INITIAL STATE
   ========================================================= */

const initialState = {
    auth: {
        isAuthenticated: false,
        role: null,
        user: null
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
   CREATE APPLICATION STATE
   ========================================================= */

export const AppState = structuredClone(initialState);


/* =========================================================
   AUTH STATE
   ========================================================= */

export function setAuthState({
    isAuthenticated,
    role = null,
    user = null
}) {

    AppState.auth.isAuthenticated =
        Boolean(isAuthenticated);

    AppState.auth.role =
        role;

    AppState.auth.user =
        user;
}


/* =========================================================
   CLEAR AUTH STATE
   ========================================================= */

export function clearAuthState() {

    AppState.auth.isAuthenticated = false;

    AppState.auth.role = null;

    AppState.auth.user = null;
}


/* =========================================================
   JOB STATE
   ========================================================= */

export function setJobs(jobs = []) {

    AppState.jobs = Array.isArray(jobs)
        ? jobs
        : [];
}


export function getJobs() {

    return AppState.jobs;
}


/* =========================================================
   COMPANY STATE
   ========================================================= */

export function setCompanies(companies = []) {

    AppState.companies =
        Array.isArray(companies)
            ? companies
            : [];
}


export function getCompanies() {

    return AppState.companies;
}


/* =========================================================
   SAVED JOBS
   ========================================================= */

export function setSavedJobs(jobs = []) {

    AppState.savedJobs =
        Array.isArray(jobs)
            ? jobs
            : [];
}


export function addSavedJob(jobId) {

    if (!jobId) {
        return;
    }

    if (
        !AppState.savedJobs.includes(jobId)
    ) {
        AppState.savedJobs.push(jobId);
    }
}


export function removeSavedJob(jobId) {

    AppState.savedJobs =
        AppState.savedJobs.filter(
            id => id !== jobId
        );
}


export function isJobSaved(jobId) {

    return AppState.savedJobs.includes(jobId);
}


/* =========================================================
   APPLICATIONS
   ========================================================= */

export function setApplications(
    applications = []
) {

    AppState.applications =
        Array.isArray(applications)
            ? applications
            : [];
}


export function addApplication(application) {

    if (!application) {
        return;
    }

    AppState.applications.push(application);
}


/* =========================================================
   JOB ALERTS
   ========================================================= */

export function setJobAlerts(alerts = []) {

    AppState.jobAlerts =
        Array.isArray(alerts)
            ? alerts
            : [];
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

export function setNotifications(
    notifications = []
) {

    AppState.notifications =
        Array.isArray(notifications)
            ? notifications
            : [];
}


/* =========================================================
   CAREER STATE
   ========================================================= */

export function updateCareerState(
    careerData = {}
) {

    AppState.career = {
        ...AppState.career,
        ...careerData
    };
}


/* =========================================================
   RESET APPLICATION STATE
   ========================================================= */

export function resetAppState() {

    AppState.auth = {
        ...initialState.auth
    };

    AppState.jobs = [];

    AppState.companies = [];

    AppState.savedJobs = [];

    AppState.applications = [];

    AppState.jobAlerts = [];

    AppState.notifications = [];

    AppState.career = {
        ...initialState.career
    };
}


/* =========================================================
   AUTH STATE SYNC
   ========================================================= */

export function syncAuthState(session) {

    if (!session) {

        clearAuthState();

        return;
    }

    setAuthState({

        isAuthenticated: true,

        role: session.role,

        user: session.user
    });
}
