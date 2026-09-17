/* =========================================================
   HireSphere M3 — Filter Controls

   Handles:
   - Work mode
   - Job type
   - Experience
   - Location
   - Minimum salary
   - Skills
   ========================================================= */

window.HSJobs = window.HSJobs || {};

(function () {

    const state = window.HSJobs;


    /* =====================================================
       CREATE CHECKBOX OPTION
       ===================================================== */

    function createOption(type, label, value, count, checked) {

        return `
            <div class="filter-check">

                <label>
                    <input
                        type="checkbox"
                        data-filter="${type}"
                        value="${value}"
                        ${checked ? "checked" : ""}
                    >

                    ${label}
                </label>

                <span class="count">
                    ${count || ""}
                </span>

            </div>
        `;
    }


    /* =====================================================
       RENDER ALL FILTERS
       ===================================================== */

    state.renderFilters = function (container, jobs, filters) {


        /* -------------------------
           Locations
           ------------------------- */

        const locations = [
            ...new Set(
                jobs.map(job => job.city)
            )
        ]
            .filter(Boolean)
            .sort();


        /* -------------------------
           Work Modes
           ------------------------- */

        const modes = [
            "On-site",
            "Hybrid",
            "Remote"
        ];


        /* -------------------------
           Job Types
           ------------------------- */

        const types = [
            "Full-time",
            "Contract",
            "Part-time"
        ];


        /* -------------------------
           Experience Levels
           ------------------------- */

        const experiences = [
            ["0–2 years", "0"],
            ["1–3 years", "1"],
            ["2–5 years", "2"],
            ["3–6 years", "3"],
            ["5–9 years", "5"],
            ["8–12 years", "8"]
        ];


        /* -------------------------
           Skills
           ------------------------- */

        const skills = [
            ...new Set(
                jobs.flatMap(job => job.skills)
            )
        ]
            .sort()
            .slice(0, 18);


        /* -------------------------
           Maximum Salary
           ------------------------- */

        const maxSalary = Math.max(
            ...jobs.map(job => job.salaryMax)
        );


        /* -------------------------
           Check Selected Filter
           ------------------------- */

        function isChecked(type, value) {

            return (
                filters[type] || []
            ).includes(value);
        }


        /* =================================================
           FILTER SIDEBAR HTML
           ================================================= */

        container.innerHTML = `


            <!-- =========================
                 WORK MODE
                 ========================= -->

            <div class="filter-group">

                <div class="filter-label">
                    Work mode
                </div>

                <div class="filter-options">

                    ${modes.map(function (mode) {

                        const count = jobs.filter(function (job) {
                            return job.workMode === mode;
                        }).length;


                        return createOption(
                            "workMode",
                            mode,
                            mode,
                            count,
                            isChecked("workMode", mode)
                        );

                    }).join("")}

                </div>

            </div>



            <!-- =========================
                 JOB TYPE
                 ========================= -->

            <div class="filter-group">

                <div class="filter-label">
                    Job type
                </div>

                <div class="filter-options">

                    ${types.map(function (type) {

                        const count = jobs.filter(function (job) {
                            return job.jobType === type;
                        }).length;


                        return createOption(
                            "jobType",
                            type,
                            type,
                            count,
                            isChecked("jobType", type)
                        );

                    }).join("")}

                </div>

            </div>



            <!-- =========================
                 EXPERIENCE
                 ========================= -->

            <div class="filter-group">

                <div class="filter-label">
                    Experience
                </div>

                <div class="filter-options">

                    ${experiences.map(function (experience) {

                        const label = experience[0];
                        const value = experience[1];


                        const count = jobs.filter(function (job) {

                            return (
                                job.experienceMin === Number(value)
                            );

                        }).length;


                        return createOption(
                            "experience",
                            label,
                            value,
                            count,
                            isChecked("experience", value)
                        );

                    }).join("")}

                </div>

            </div>



            <!-- =========================
                 LOCATION
                 ========================= -->

            <div class="filter-group">

                <div class="filter-label">
                    Location
                </div>

                <div class="filter-options">

                    ${locations
                        .slice(0, 12)
                        .map(function (location) {

                            const count = jobs.filter(function (job) {
                                return job.city === location;
                            }).length;


                            return createOption(
                                "locationFilter",
                                location,
                                location,
                                count,
                                isChecked(
                                    "locationFilter",
                                    location
                                )
                            );

                        })
                        .join("")
                    }

                </div>

            </div>



            <!-- =========================
                 MINIMUM SALARY
                 ========================= -->

            <div class="filter-group">

                <div class="filter-label">
                    Minimum salary
                </div>


                <div class="range-values">

                    <span>
                        ₹4 LPA
                    </span>

                    <span id="salaryValue">
                        ₹${filters.salaryMin || 4}+ LPA
                    </span>

                </div>


                <input
                    id="salaryRange"
                    class="form-range"
                    type="range"
                    min="4"
                    max="${Math.ceil(maxSalary)}"
                    step="1"
                    value="${filters.salaryMin || 4}"
                >

            </div>



            <!-- =========================
                 SKILLS
                 ========================= -->

            <div class="filter-group">

                <div class="filter-label">
                    Skills
                </div>

                <div class="filter-options">

                    ${skills.map(function (skill) {

                        const count = jobs.filter(function (job) {

                            return job.skills.includes(skill);

                        }).length;


                        return createOption(
                            "skill",
                            skill,
                            skill,
                            count,
                            isChecked("skill", skill)
                        );

                    }).join("")}

                </div>

            </div>
        `;
    };


    /* =====================================================
       COLLECT SELECTED CHECKBOX FILTERS
       ===================================================== */

    state.collectCheckboxes = function (container) {

        const selectedFilters = {

            workMode: [],

            jobType: [],

            experience: [],

            locationFilter: [],

            skill: []

        };


        const checkedInputs = container.querySelectorAll(
            "input[data-filter]:checked"
        );


        checkedInputs.forEach(function (input) {

            const filterType = input.dataset.filter;

            const filterValue = input.value;


            selectedFilters[filterType].push(
                filterValue
            );

        });


        return selectedFilters;
    };

})();