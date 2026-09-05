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
   - Password hashing

   IMPORTANT:
   This is a frontend-only prototype.
   Production authentication must be handled server-side.
   ========================================================= */


/* =========================================================
   STORAGE KEYS
   ========================================================= */

const STORAGE_KEYS = Object.freeze({

    EMPLOYEES: "hiresphere_employees",

    RECRUITERS: "hiresphere_recruiters",

    SESSION: "hiresphere_session"

});


/* =========================================================
   ROLES
   ========================================================= */

export const ROLES = Object.freeze({

    EMPLOYEE: "employee",

    RECRUITER: "recruiter"

});


/* =========================================================
   INTERNAL STORAGE HELPERS
   ========================================================= */

function readStorage(key, fallback = []) {

    try {

        const rawData = localStorage.getItem(key);

        if (!rawData) {
            return fallback;
        }

        const parsedData = JSON.parse(rawData);

        return parsedData;

    } catch (error) {

        console.error(
            `HireSphere storage read failed: ${key}`,
            error
        );

        return fallback;
    }
}


function writeStorage(key, data) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(data)
        );

        return true;

    } catch (error) {

        console.error(
            `HireSphere storage write failed: ${key}`,
            error
        );

        return false;
    }
}


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
   PASSWORD HASHING
   ========================================================= */

/*
 * Frontend prototype only.
 *
 * Web Crypto SHA-256 is used so passwords are not stored
 * as plain text in localStorage.
 *
 * Production:
 * Use backend authentication with a password hashing
 * algorithm such as Argon2id/bcrypt/scrypt.
 */

async function hashPassword(password) {

    const encoder = new TextEncoder();

    const data = encoder.encode(password);

    const hashBuffer =
        await crypto.subtle.digest("SHA-256", data);

    const hashArray =
        Array.from(new Uint8Array(hashBuffer));

    return hashArray
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
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
   EMAIL VALIDATION
   ========================================================= */

function validateEmail(email) {

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {

        return {
            valid: false,
            message: "Email address is required."
        };

    }

    if (!emailPattern.test(email)) {

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
   SESSION
   ========================================================= */

function createSession(user, role) {

    const safeUser = {
        ...user
    };

    /*
     * Never expose/store the password hash
     * inside the active user session.
     */

    delete safeUser.passwordHash;


    const session = {

        userId: safeUser.id,

        role,

        user: safeUser,

        authenticatedAt:
            new Date().toISOString()

    };


    const saved = writeStorage(
        STORAGE_KEYS.SESSION,
        session
    );


    if (!saved) {
        return null;
    }


    return session;
}


/* =========================================================
   GET CURRENT SESSION
   ========================================================= */

export function getCurrentSession() {

    return readStorage(
        STORAGE_KEYS.SESSION,
        null
    );
}


/* =========================================================
   GET CURRENT USER
   ========================================================= */

export function getCurrentUser() {

    const session =
        getCurrentSession();

    return session?.user || null;
}


/* =========================================================
   GET CURRENT ROLE
   ========================================================= */

export function getCurrentRole() {

    const session =
        getCurrentSession();

    return session?.role || null;
}


/* =========================================================
   AUTHENTICATION STATUS
   ========================================================= */

export function isAuthenticated() {

    return Boolean(
        getCurrentSession()
    );
}


/* =========================================================
   ROLE CHECKS
   ========================================================= */

export function isEmployee() {

    return getCurrentRole() === ROLES.EMPLOYEE;
}


export function isRecruiter() {

    return getCurrentRole() === ROLES.RECRUITER;
}


/* =========================================================
   REGISTER EMPLOYEE
   ========================================================= */

export async function registerEmployee(employeeData) {

    const firstName =
        String(employeeData?.firstName || "").trim();

    const lastName =
        String(employeeData?.lastName || "").trim();

    const email =
        normalizeEmail(employeeData?.email);

    const password =
        String(employeeData?.password || "");

    const confirmPassword =
        String(employeeData?.confirmPassword || "");


    /* -------------------------
       Basic validation
    -------------------------- */

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


    /* -------------------------
       Check duplicate email
    -------------------------- */

    const employees =
        readStorage(
            STORAGE_KEYS.EMPLOYEES
        );

    const recruiters =
        readStorage(
            STORAGE_KEYS.RECRUITERS
        );


    const employeeExists =
        employees.some(
            employee =>
                employee.email === email
        );


    const recruiterExists =
        recruiters.some(
            recruiter =>
                recruiter.email === email
        );


    if (employeeExists || recruiterExists) {

        return {
            success: false,
            message: "An account with this email already exists."
        };
    }


    /* -------------------------
       Hash password
    -------------------------- */

    const passwordHash =
        await hashPassword(password);


    /* -------------------------
       Create employee
    -------------------------- */

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
            Array.isArray(employeeData?.skills)
                ? employeeData.skills
                : [],

        passwordHash,

        createdAt:
            new Date().toISOString()
    };


    employees.push(employee);


    const saved =
        writeStorage(
            STORAGE_KEYS.EMPLOYEES,
            employees
        );


    if (!saved) {

        return {
            success: false,
            message: "Unable to create employee account."
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
   REGISTER RECRUITER
   ========================================================= */

export async function registerRecruiter(recruiterData) {

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


    /* -------------------------
       Basic validation
    -------------------------- */

    if (!name) {

        return {
            success: false,
            message: "Recruiter name is required."
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
            message: "Company name is required."
        };
    }


    /* -------------------------
       Check duplicate email
    -------------------------- */

    const employees =
        readStorage(
            STORAGE_KEYS.EMPLOYEES
        );

    const recruiters =
        readStorage(
            STORAGE_KEYS.RECRUITERS
        );


    const employeeExists =
        employees.some(
            employee =>
                employee.email === email
        );


    const recruiterExists =
        recruiters.some(
            recruiter =>
                recruiter.email === email
        );


    if (employeeExists || recruiterExists) {

        return {
            success: false,
            message: "An account with this email already exists."
        };
    }


    /* -------------------------
       Hash password
    -------------------------- */

    const passwordHash =
        await hashPassword(password);


    /* -------------------------
       Create recruiter
    -------------------------- */

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
        writeStorage(
            STORAGE_KEYS.RECRUITERS,
            recruiters
        );


    if (!saved) {

        return {
            success: false,
            message: "Unable to create recruiter account."
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

            companyName: recruiter.companyName
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
        readStorage(
            STORAGE_KEYS.EMPLOYEES
        );


    const employee =
        employees.find(
            user =>
                user.email === normalizedEmail
        );


    if (!employee) {

        return {
            success: false,
            message: "Invalid employee email or password."
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
            message: "Invalid employee email or password."
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
            message: "Unable to create login session."
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
        readStorage(
            STORAGE_KEYS.RECRUITERS
        );


    const recruiter =
        recruiters.find(
            user =>
                user.email === normalizedEmail
        );


    if (!recruiter) {

        return {
            success: false,
            message: "Invalid recruiter email or password."
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
            message: "Invalid recruiter email or password."
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
            message: "Unable to create login session."
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

    localStorage.removeItem(
        STORAGE_KEYS.SESSION
    );
}


/* =========================================================
   DASHBOARD REDIRECTION
   ========================================================= */

export function getDashboardPath(role) {

    switch (role) {

        case ROLES.EMPLOYEE:

            return "../index.html";


        case ROLES.RECRUITER:

            return "../recruiter/dashboard.html";


        default:

            return "../auth/employee-login.html";
    }
}


/* =========================================================
   ROLE-BASED ACCESS
   ========================================================= */

export function requireAuth(requiredRole = null) {

    const session =
        getCurrentSession();


    if (!session) {

        return {
            allowed: false,
            reason: "NOT_AUTHENTICATED",
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
            reason: "INVALID_ROLE",
            role: session.role,
            user: session.user
        };
    }


    return {

        allowed: true,

        reason: "AUTHORIZED",

        role: session.role,

        user: session.user
    };
}
