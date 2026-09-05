/* =========================================================
   HIRESPHERE — AUTHENTICATION CORE
   File: js/auth/auth.js

   Responsibility:
   - Employee registration
   - Employee login
   - Recruiter registration
   - Recruiter login
   - Session management
   - Role management
   - Logout
   - Authentication checks

   Frontend prototype:
   - Uses localStorage through storage-service.js
   - Uses Web Crypto SHA-256 for prototype password hashing

   Production:
   - Authentication must be moved to a backend.
   ========================================================= */

import {
    get,
    set,
    remove
} from "../services/storage-service.js";


/* =========================================================
   STORAGE KEYS
   ========================================================= */

const STORAGE_KEYS = Object.freeze({
    EMPLOYEES: "employees",
    RECRUITERS: "recruiters",
    SESSION: "session"
});


/* =========================================================
   ROLES
   ========================================================= */

export const ROLES = Object.freeze({
    EMPLOYEE: "employee",
    RECRUITER: "recruiter"
});


/* =========================================================
   ID GENERATOR
   ========================================================= */

function generateId(prefix) {

    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
}


/* =========================================================
   EMAIL NORMALIZATION
   ========================================================= */

function normalizeEmail(email) {

    return String(email || "")
        .trim()
        .toLowerCase();
}


/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function validateEmail(email) {

    const pattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {

        return {
            valid: false,
            message: "Email address is required."
        };
    }

    if (!pattern.test(email)) {

        return {
            valid: false,
            message: "Please enter a valid email address."
        };
    }

    return {
        valid: true
    };
}


/* =========================================================
   PASSWORD VALIDATION
   ========================================================= */

function validatePassword(password) {

    if (!password) {

        return {
            valid: false,
            message: "Password is required."
        };
    }

    if (password.length < 8) {

        return {
            valid: false,
            message: "Password must contain at least 8 characters."
        };
    }

    return {
        valid: true
    };
}


/* =========================================================
   PASSWORD HASH
   ========================================================= */

async function hashPassword(password) {

    const encoder = new TextEncoder();

    const data = encoder.encode(password);

    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return Array
        .from(new Uint8Array(hashBuffer))
        .map(byte =>
            byte.toString(16).padStart(2, "0")
        )
        .join("");
}


/* =========================================================
   SESSION CREATION
   ========================================================= */

function createSession(user, role) {

    const safeUser = {
        ...user
    };

    delete safeUser.passwordHash;

    const session = {

        userId: safeUser.id,

        role,

        user: safeUser,

        authenticatedAt:
            new Date().toISOString()
    };

    const saved =
        set(
            STORAGE_KEYS.SESSION,
            session
        );

    return saved
        ? session
        : null;
}


/* =========================================================
   SESSION ACCESS
   ========================================================= */

export function getCurrentSession() {

    return get(
        STORAGE_KEYS.SESSION,
        null
    );
}


export function getCurrentUser() {

    const session =
        getCurrentSession();

    return session?.user || null;
}


export function getCurrentRole() {

    const session =
        getCurrentSession();

    return session?.role || null;
}


export function isAuthenticated() {

    return Boolean(
        getCurrentSession()
    );
}


export function isEmployee() {

    return getCurrentRole() === ROLES.EMPLOYEE;
}


export function isRecruiter() {

    return getCurrentRole() === ROLES.RECRUITER;
}


/* =========================================================
   EMPLOYEE REGISTRATION
   ========================================================= */

export async function registerEmployee(
    employeeData
) {

    const firstName =
        String(
            employeeData?.firstName || ""
        ).trim();

    const lastName =
        String(
            employeeData?.lastName || ""
        ).trim();

    const email =
        normalizeEmail(
            employeeData?.email
        );

    const password =
        String(
            employeeData?.password || ""
        );

    const confirmPassword =
        String(
            employeeData?.confirmPassword || ""
        );


    /* Validation */

    if (!firstName) {

        return {
            success: false,
            message: "First name is required."
        };
    }


    if (!lastName) {

        return {
            success: false,
            message: "Last name is required."
        };
    }


    const emailValidation =
        validateEmail(email);

    if (!emailValidation.valid) {

        return {
            success: false,
            message: emailValidation.message
        };
    }


    const passwordValidation =
        validatePassword(password);

    if (!passwordValidation.valid) {

        return {
            success: false,
            message: passwordValidation.message
        };
    }


    if (password !== confirmPassword) {

        return {
            success: false,
            message: "Passwords do not match."
        };
    }


    /* Existing accounts */

    const employees =
        get(
            STORAGE_KEYS.EMPLOYEES,
            []
        );

    const recruiters =
        get(
            STORAGE_KEYS.RECRUITERS,
            []
        );


    const emailExists =
        employees.some(
            user => user.email === email
        ) ||
        recruiters.some(
            user => user.email === email
        );


    if (emailExists) {

        return {
            success: false,
            message:
                "An account with this email already exists."
        };
    }


    /* Hash password */

    const passwordHash =
        await hashPassword(password);


    /* Create employee */

    const employee = {

        id: generateId("EMP"),

        role: ROLES.EMPLOYEE,

        firstName,

        lastName,

        email,

        phone:
            String(
                employeeData?.phone || ""
            ).trim(),

        location:
            String(
                employeeData?.location || ""
            ).trim(),

        experienceLevel:
            employeeData?.experienceLevel ||
            "Fresher",

        primaryRole:
            String(
                employeeData?.primaryRole || ""
            ).trim(),

        skills:
            Array.isArray(
                employeeData?.skills
            )
                ? employeeData.skills
                : [],

        passwordHash,

        createdAt:
            new Date().toISOString()
    };


    employees.push(employee);


    const saved =
        set(
            STORAGE_KEYS.EMPLOYEES,
            employees
        );


    if (!saved) {

        return {
            success: false,
            message:
                "Unable to create employee account."
        };
    }


    return {

        success: true,

        message:
            "Employee account created successfully.",

        user: {

            id: employee.id,

            role: employee.role,

            firstName: employee.firstName,

            lastName: employee.lastName,

            email: employee.email
        }
    };
}


/* =========================================================
   RECRUITER REGISTRATION
   ========================================================= */

export async function registerRecruiter(
    recruiterData
) {

    const name =
        String(
            recruiterData?.name || ""
        ).trim();

    const email =
        normalizeEmail(
            recruiterData?.email
        );

    const password =
        String(
            recruiterData?.password || ""
        );

    const confirmPassword =
        String(
            recruiterData?.confirmPassword || ""
        );

    const companyName =
        String(
            recruiterData?.companyName || ""
        ).trim();


    /* Validation */

    if (!name) {

        return {
            success: false,
            message:
                "Recruiter name is required."
        };
    }


    const emailValidation =
        validateEmail(email);

    if (!emailValidation.valid) {

        return {
            success: false,
            message: emailValidation.message
        };
    }


    const passwordValidation =
        validatePassword(password);

    if (!passwordValidation.valid) {

        return {
            success: false,
            message: passwordValidation.message
        };
    }


    if (password !== confirmPassword) {

        return {
            success: false,
            message: "Passwords do not match."
        };
    }


    if (!companyName) {

        return {
            success: false,
            message:
                "Company name is required."
        };
    }


    /* Existing accounts */

    const employees =
        get(
            STORAGE_KEYS.EMPLOYEES,
            []
        );

    const recruiters =
        get(
            STORAGE_KEYS.RECRUITERS,
            []
        );


    const emailExists =
        employees.some(
            user => user.email === email
        ) ||
        recruiters.some(
            user => user.email === email
        );


    if (emailExists) {

        return {
            success: false,
            message:
                "An account with this email already exists."
        };
    }


    /* Hash password */

    const passwordHash =
        await hashPassword(password);


    /* Create recruiter */

    const recruiter = {

        id: generateId("REC"),

        role: ROLES.RECRUITER,

        name,

        email,

        companyName,

        companyWebsite:
            String(
                recruiterData?.companyWebsite || ""
            ).trim(),

        industry:
            String(
                recruiterData?.industry || ""
            ).trim(),

        companySize:
            String(
                recruiterData?.companySize || ""
            ).trim(),

        designation:
            String(
                recruiterData?.designation || ""
            ).trim(),

        passwordHash,

        createdAt:
            new Date().toISOString()
    };


    recruiters.push(recruiter);


    const saved =
        set(
            STORAGE_KEYS.RECRUITERS,
            recruiters
        );


    if (!saved) {

        return {
            success: false,
            message:
                "Unable to create recruiter account."
        };
    }


    return {

        success: true,

        message:
            "Recruiter account created successfully.",

        user: {

            id: recruiter.id,

            role: recruiter.role,

            name: recruiter.name,

            email: recruiter.email,

            companyName:
                recruiter.companyName
        }
    };
}


/* =========================================================
   EMPLOYEE LOGIN
   ========================================================= */

export async function loginEmployee(
    email,
    password
) {

    const normalizedEmail =
        normalizeEmail(email);


    const emailValidation =
        validateEmail(normalizedEmail);

    if (!emailValidation.valid) {

        return {
            success: false,
            message: emailValidation.message
        };
    }


    if (!password) {

        return {
            success: false,
            message: "Password is required."
        };
    }


    const employees =
        get(
            STORAGE_KEYS.EMPLOYEES,
            []
        );


    const employee =
        employees.find(
            user =>
                user.email ===
                normalizedEmail
        );


    if (!employee) {

        return {
            success: false,
            message:
                "Invalid employee email or password."
        };
    }


    const passwordHash =
        await hashPassword(password);


    if (
        employee.passwordHash !==
        passwordHash
    ) {

        return {
            success: false,
            message:
                "Invalid employee email or password."
        };
    }


    const session =
        createSession(
            employee,
            ROLES.EMPLOYEE
        );


    if (!session) {

        return {
            success: false,
            message:
                "Unable to create login session."
        };
    }


    return {

        success: true,

        message:
            "Employee login successful.",

        session
    };
}


/* =========================================================
   RECRUITER LOGIN
   ========================================================= */

export async function loginRecruiter(
    email,
    password
) {

    const normalizedEmail =
        normalizeEmail(email);


    const emailValidation =
        validateEmail(normalizedEmail);

    if (!emailValidation.valid) {

        return {
            success: false,
            message: emailValidation.message
        };
    }


    if (!password) {

        return {
            success: false,
            message: "Password is required."
        };
    }


    const recruiters =
        get(
            STORAGE_KEYS.RECRUITERS,
            []
        );


    const recruiter =
        recruiters.find(
            user =>
                user.email ===
                normalizedEmail
        );


    if (!recruiter) {

        return {
            success: false,
            message:
                "Invalid recruiter email or password."
        };
    }


    const passwordHash =
        await hashPassword(password);


    if (
        recruiter.passwordHash !==
        passwordHash
    ) {

        return {
            success: false,
            message:
                "Invalid recruiter email or password."
        };
    }


    const session =
        createSession(
            recruiter,
            ROLES.RECRUITER
        );


    if (!session) {

        return {
            success: false,
            message:
                "Unable to create login session."
        };
    }


    return {

        success: true,

        message:
            "Recruiter login successful.",

        session
    };
}


/* =========================================================
   LOGOUT
   ========================================================= */

export function logout() {

    return remove(
        STORAGE_KEYS.SESSION
    );
}


/* =========================================================
   ROLE-BASED ROUTING
   ========================================================= */

export function getDashboardPath(role) {

    switch (role) {

        case ROLES.EMPLOYEE:
            return "../../index.html";

        case ROLES.RECRUITER:
            return "../recruiter/dashboard.html";

        default:
            return "../auth/employee-login.html";
    }
}


/* =========================================================
   ROUTE PROTECTION
   ========================================================= */

export function requireAuth(
    requiredRole = null
) {

    const session =
        getCurrentSession();


    if (!session) {

        return {

            allowed: false,

            reason:
                "NOT_AUTHENTICATED",

            role: null,

            user: null
        };
    }


    if (
        requiredRole &&
        session.role !== requiredRole
    ) {

        return {

            allowed: false,

            reason:
                "INVALID_ROLE",

            role: session.role,

            user: session.user
        };
    }


    return {

        allowed: true,

        reason:
            "AUTHORIZED",

        role: session.role,

        user: session.user
    };
}
