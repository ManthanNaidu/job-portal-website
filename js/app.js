/**
 * HireSphere Application Bootstrap
 */

import { initializeAuth } from "./auth/auth.js";
import { syncAuthState } from "./state.js";

/* =========================================================
   APPLICATION INITIALIZATION
========================================================= */

function initializeApp() {
  try {
    const auth = initializeAuth();

    syncAuthState();

    document.documentElement.dataset.appReady = "true";

    console.log("HireSphere initialized successfully.");

    if (auth) {
      console.log(
        `Authenticated as ${auth.role}: ${auth.user?.name || auth.user?.email}`
      );
    } else {
      console.log("No active session.");
    }
  } catch (error) {
    console.error(
      "HireSphere initialization failed:",
      error
    );
  }
}

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);
