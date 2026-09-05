/**
 * HireSphere Employee Login
 */

import {
  loginEmployee,
  isAuthenticated,
  getCurrentRole,
  ROLES
} from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("employeeLoginForm");

  if (!form) {
    return;
  }

  const message = document.getElementById("loginMessage");

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const passwordToggle =
    document.getElementById("passwordToggle");

  const submitButton =
    form.querySelector("[type='submit']");

  /* =======================================================
     MESSAGE
  ======================================================= */

  function showMessage(text, type = "error") {
    if (!message) {
      return;
    }

    message.textContent = text;
    message.className =
      `auth-message ${type} is-visible`;
  }

  function clearMessage() {
    if (!message) {
      return;
    }

    message.textContent = "";
    message.className = "auth-message";
  }

  /* =======================================================
     PASSWORD TOGGLE
  ======================================================= */

  passwordToggle?.addEventListener("click", () => {
    if (!passwordInput) {
      return;
    }

    const isPassword =
      passwordInput.type === "password";

    passwordInput.type = isPassword
      ? "text"
      : "password";

    passwordToggle.setAttribute(
      "aria-label",
      isPassword
        ? "Hide password"
        : "Show password"
    );
  });

  /* =======================================================
     FORM SUBMISSION
  ======================================================= */

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearMessage();

    const email =
      emailInput?.value.trim();

    const password =
      passwordInput?.value;

    if (!email || !password) {
      showMessage(
        "Please enter your email and password."
      );
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Signing in...";
    }

    try {
      const result =
        await loginEmployee(
          email,
          password
        );

      if (
        !result ||
        result.role !== ROLES.EMPLOYEE
      ) {
        throw new Error(
          "Unable to create employee session."
        );
      }

      showMessage(
        "Login successful. Redirecting...",
        "success"
      );

      /*
       * The employee dashboard currently maps
       * to the main HireSphere experience.
       */
      setTimeout(() => {
        window.location.href =
          "../../index.html";
      }, 500);

    } catch (error) {
      showMessage(
        error?.message ||
        "Login failed. Please check your credentials."
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Sign In";
      }
    }
  });

  /* =======================================================
     OPTIONAL: REDIRECT EXISTING EMPLOYEE
  ======================================================= */

  if (
    isAuthenticated() &&
    getCurrentRole() === ROLES.EMPLOYEE
  ) {
    // Existing logged-in employee remains on login page
    // only if they manually navigate here.
    // Do not automatically redirect to avoid unexpected
    // navigation during development/testing.
  }
});
