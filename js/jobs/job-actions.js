/* =========================================================
   HireSphere M3 — Job Actions
   Handles:
   - Saved jobs
   - Applications
   - Sharing
   - Recently viewed jobs
   - Apply modal
   - Toast notifications
   ========================================================= */

window.HSJobs = window.HSJobs || {};

(function () {

    /* =====================================================
       1. STORAGE
       ===================================================== */

    const STORAGE_KEY = "hiresphere_m3";

    function read() {
        try {
            return (
                JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
                    saved: [],
                    applied: [],
                    recent: []
                }
            );
        } catch (error) {
            return {
                saved: [],
                applied: [],
                recent: []
            };
        }
    }

    function write(data) {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );
    }


    /* =====================================================
       2. JOB STATE
       ===================================================== */

    const state = window.HSJobs;

    state.store = {
        read,
        write
    };


    /* =====================================================
       3. SAVED JOBS
       ===================================================== */

    state.isSaved = function (id) {
        const data = read();

        return data.saved.includes(id);
    };


    state.toggleSaved = function (id) {
        const data = read();

        const index = data.saved.indexOf(id);

        if (index >= 0) {
            // Remove from saved jobs
            data.saved.splice(index, 1);
        } else {
            // Add to the beginning of saved jobs
            data.saved.unshift(id);
        }

        write(data);

        return index < 0;
    };


    /* =====================================================
       4. RECENTLY VIEWED JOBS
       ===================================================== */

    state.markViewed = function (id) {
        const data = read();

        data.recent = [
            id,
            ...data.recent.filter(jobId => jobId !== id)
        ].slice(0, 8);

        write(data);
    };


    /* =====================================================
       5. APPLICATIONS
       ===================================================== */

    state.isApplied = function (id) {
        const data = read();

        return data.applied.includes(id);
    };


    state.apply = function (id) {
        const data = read();

        if (!data.applied.includes(id)) {
            data.applied.unshift(id);
        }

        write(data);
    };


    /* =====================================================
       6. TOAST NOTIFICATION
       ===================================================== */

    state.toast = function (message) {

        const toastElement = document.getElementById("hsToast");

        if (!toastElement) {
            return;
        }

        const toastText = document.getElementById("toastText");

        if (toastText) {
            toastText.textContent = message;
        }

        bootstrap.Toast
            .getOrCreateInstance(
                toastElement,
                {
                    delay: 2200
                }
            )
            .show();
    };


    /* =====================================================
       7. SHARE JOB
       ===================================================== */

    state.share = function (job) {

        const url = location.href;

        // Use native sharing when available
        if (navigator.share) {

            navigator
                .share({
                    title: `${job.title} at ${job.company}`,
                    text: `${job.title} at ${job.company} — ${job.location}`,
                    url: url
                })
                .catch(() => {});

            return;
        }


        // Copy URL to clipboard
        if (navigator.clipboard) {

            navigator.clipboard
                .writeText(url)
                .then(() => {
                    state.toast(
                        "Job link copied to clipboard."
                    );
                });

            return;
        }


        // Fallback message
        state.toast(
            "Copy the page URL to share this job."
        );
    };


    /* =====================================================
       8. OPEN APPLY MODAL
       ===================================================== */

    state.openApply = function (job) {

        const modal = document.getElementById("applyModal");

        if (!modal) {
            return;
        }


        const preview =
            document.getElementById("applyJobName") ||
            document.getElementById("applyPreview");


        if (preview) {

            preview.innerHTML = `
                <strong>${job.title}</strong>
                <br>
                <span>
                    ${job.company} • ${job.location}
                </span>
            `;
        }


        // Store the selected job ID on the modal
        modal.dataset.jobId = job.id;


        // Open Bootstrap modal
        bootstrap.Modal
            .getOrCreateInstance(modal)
            .show();
    };


    /* =====================================================
       9. APPLICATION FORM SUBMISSION
       ===================================================== */

    document.addEventListener("submit", function (event) {

        const form = event.target;

        // Only handle the M3 application form
        if (form.id !== "applyForm") {
            return;
        }

        event.preventDefault();


        const modal = form.closest(".modal");

        const jobId = modal?.dataset.jobId;


        if (jobId) {
            state.apply(jobId);
        }


        // Close modal
        if (modal) {

            bootstrap.Modal
                .getOrCreateInstance(modal)
                .hide();
        }


        // Reset form
        form.reset();


        // Show confirmation
        state.toast(
            "Application submitted successfully."
        );
    });

})();