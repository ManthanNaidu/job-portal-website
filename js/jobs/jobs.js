/* =========================================================
   HireSphere M3 — Jobs Listing Controller

   Handles:
   - Loading jobs
   - Loading categories
   - Searching jobs
   - Filtering jobs
   - Sorting jobs
   - Pagination
   - Saving jobs
   - Applying for jobs
   - Active filter chips
   - Recently viewed jobs
   ========================================================= */

(async function () {

    /* =====================================================
       1. CONFIGURATION
       ===================================================== */

    const state = window.HSJobs;

    const PAGE_SIZE = 8;


    /* =====================================================
       2. PAGE ELEMENTS
       ===================================================== */

    const elements = {

        list: document.getElementById("jobsList"),

        summary: document.getElementById("resultSummary"),

        pagination: document.getElementById("pagination"),

        empty: document.getElementById("emptyState"),

        active: document.getElementById("activeFilters"),

        sort: document.getElementById("sortSelect"),

        desktop: document.getElementById("desktopFilters"),

        mobile: document.getElementById("mobileFilters"),

        keyword: document.getElementById("keywordInput"),

        location: document.getElementById("locationInput"),

        category: document.getElementById("categoryInput"),

        recent: document.getElementById("recentJobs"),

        recentSection: document.getElementById("recentSection")
    };


    /* =====================================================
       3. JOB DATA & FILTER STATE
       ===================================================== */

    let jobs = [];

    let filters = {
        keyword: "",
        location: "",
        category: "",

        workMode: [],
        jobType: [],
        experience: [],
        locationFilter: [],
        skill: [],

        salaryMin: 4
    };

    let page = 1;


    /* =====================================================
       4. LOAD JOB DATA
       ===================================================== */

    try {

        jobs = await fetch("../data/jobs.json")
            .then(response => response.json());

    } catch (error) {

        elements.list.innerHTML = `
            <div class="alert alert-danger">
                Unable to load job data.
            </div>
        `;

        return;
    }


    /* =====================================================
       5. RESTORE SEARCH / FILTER STATE
       ===================================================== */

    Object.assign(
        filters,
        state.readQuery()
    );


    elements.keyword.value = filters.keyword;

    elements.location.value = filters.location;


    /* =====================================================
       6. LOAD JOB CATEGORIES
       ===================================================== */

    const categories = await fetch("../data/categories.json")
        .then(response => response.json())
        .catch(() => []);


    categories.forEach(category => {

        elements.category.insertAdjacentHTML(
            "beforeend",
            `
                <option value="${category.name}">
                    ${category.name}
                </option>
            `
        );

    });


    elements.category.value = filters.category;


    /* =====================================================
       7. INITIAL PAGE RENDER
       ===================================================== */

    renderFilters();

    render();

    renderRecent();


    /* =====================================================
       8. SEARCH FORM
       ===================================================== */

    document
        .getElementById("jobSearchForm")
        .addEventListener("submit", function (event) {

            event.preventDefault();


            filters.keyword =
                elements.keyword.value.trim();

            filters.location =
                elements.location.value.trim();

            filters.category =
                elements.category.value;


            page = 1;


            state.syncQuery(filters);

            render();
        });


    /* =====================================================
       9. POPULAR SEARCH BUTTONS
       ===================================================== */

    document
        .querySelectorAll("[data-popular]")
        .forEach(function (button) {

            button.addEventListener("click", function () {

                elements.keyword.value =
                    button.dataset.popular;

                document
                    .getElementById("jobSearchForm")
                    .requestSubmit();
            });

        });


    /* =====================================================
       10. SORTING
       ===================================================== */

    elements.sort.addEventListener(
        "change",
        function () {

            page = 1;

            render();
        }
    );


    /* =====================================================
       11. CHECKBOX FILTERS
       ===================================================== */

    [
        elements.desktop,
        elements.mobile
    ].forEach(function (container) {

        container.addEventListener(
            "change",
            function (event) {

                if (
                    event.target.matches(
                        "input[data-filter]"
                    )
                ) {

                    syncFilterControls(
                        event.target
                    );

                    page = 1;

                    render();
                }

            }
        );

    });


    /* =====================================================
       12. SALARY RANGE
       ===================================================== */

    [
        elements.desktop,
        elements.mobile
    ].forEach(function (container) {

        container.addEventListener(
            "input",
            function (event) {

                if (
                    event.target.id !== "salaryRange"
                ) {
                    return;
                }


                filters.salaryMin =
                    Number(event.target.value);


                document
                    .querySelectorAll("#salaryValue")
                    .forEach(function (element) {

                        element.textContent =
                            `₹${filters.salaryMin}+ LPA`;

                    });


                render(false);
            }
        );

    });


    /* =====================================================
       13. CLEAR FILTER BUTTONS
       ===================================================== */

    document
        .getElementById("clearFilters")
        .addEventListener("click", clearAll);


    document
        .getElementById("clearFiltersMobile")
        .addEventListener("click", clearAll);


    document
        .getElementById("resetEmpty")
        .addEventListener("click", clearAll);


    /* =====================================================
       14. CLEAR ALL FILTERS
       ===================================================== */

    function clearAll() {

        filters = {

            keyword: "",
            location: "",
            category: "",

            workMode: [],
            jobType: [],
            experience: [],
            locationFilter: [],
            skill: [],

            salaryMin: 4
        };


        elements.keyword.value = "";

        elements.location.value = "";

        elements.category.value = "";


        page = 1;


        state.syncQuery(filters);


        renderFilters();

        render();
    }


    /* =====================================================
       15. SYNC FILTER CONTROLS
       ===================================================== */

    function syncFilterControls(changedElement) {

        const source =
            changedElement.closest(
                "#desktopFilters, #mobileFilters"
            );


        const selected =
            state.collectCheckboxes(source);


        /*
         * Update the current filter state.
         * Desktop and mobile controls are
         * synchronized by re-rendering them.
         */

        Object.keys(selected).forEach(function (key) {

            filters[key] = selected[key];

        });


        renderFilters();
    }


    /* =====================================================
       16. RENDER DESKTOP + MOBILE FILTERS
       ===================================================== */

    function renderFilters() {

        state.renderFilters(
            elements.desktop,
            jobs,
            filters
        );


        state.renderFilters(
            elements.mobile,
            jobs,
            filters
        );
    }


    /* =====================================================
       17. GET FILTERED & SORTED RESULTS
       ===================================================== */

    function getResults() {

        let results =
            state.search(jobs, filters);


        /* ---------------------------------------------
           Apply M3 filters
           --------------------------------------------- */

        results = results.filter(function (job) {

            const matchesWorkMode =
                filters.workMode.length === 0 ||
                filters.workMode.includes(
                    job.workMode
                );


            const matchesJobType =
                filters.jobType.length === 0 ||
                filters.jobType.includes(
                    job.jobType
                );


            const matchesExperience =
                filters.experience.length === 0 ||
                filters.experience.includes(
                    String(job.experienceMin)
                );


            const matchesLocation =
                filters.locationFilter.length === 0 ||
                filters.locationFilter.includes(
                    job.city
                );


            const matchesSkills =
                filters.skill.length === 0 ||
                filters.skill.every(function (skill) {

                    return job.skills.includes(skill);

                });


            const matchesSalary =
                job.salaryMax >= filters.salaryMin;


            return (
                matchesWorkMode &&
                matchesJobType &&
                matchesExperience &&
                matchesLocation &&
                matchesSkills &&
                matchesSalary
            );
        });


        /* ---------------------------------------------
           Sort results
           --------------------------------------------- */

        const sortType = elements.sort.value;


        results.sort(function (first, second) {

            if (sortType === "newest") {

                return (
                    first.postedDaysAgo -
                    second.postedDaysAgo
                );
            }


            if (sortType === "salary-high") {

                return (
                    second.salaryMax -
                    first.salaryMax
                );
            }


            if (sortType === "salary-low") {

                return (
                    first.salaryMin -
                    second.salaryMin
                );
            }


            if (sortType === "match") {

                return (
                    second.match -
                    first.match
                );
            }


            // Default sorting: match score
            return second.match - first.match;
        });


        return results;
    }


    /* =====================================================
       18. RENDER JOB RESULTS
       ===================================================== */

    function render(scroll = true) {

        const results = getResults();

        const total = results.length;


        /* ---------------------------------------------
           Calculate number of pages
           --------------------------------------------- */

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total / PAGE_SIZE
                )
            );


        if (page > totalPages) {
            page = totalPages;
        }


        /* ---------------------------------------------
           Get jobs for current page
           --------------------------------------------- */

        const startIndex =
            (page - 1) * PAGE_SIZE;

        const endIndex =
            page * PAGE_SIZE;


        const currentJobs =
            results.slice(
                startIndex,
                endIndex
            );


        /* ---------------------------------------------
           Results summary
           --------------------------------------------- */

        elements.summary.textContent = total
            ? `${total} jobs found • Showing ${
                startIndex + 1
            }–${Math.min(
                endIndex,
                total
            )}`
            : "0 jobs found";


        /* ---------------------------------------------
           Render job cards
           --------------------------------------------- */

        elements.list.innerHTML =
            currentJobs
                .map(card)
                .join("");


        /* ---------------------------------------------
           Empty state
           --------------------------------------------- */

        elements.empty.classList.toggle(
            "d-none",
            total !== 0
        );


        elements.list.classList.toggle(
            "d-none",
            total === 0
        );


        /* ---------------------------------------------
           Pagination + active filters
           --------------------------------------------- */

        renderPagination(totalPages);

        renderActive();


        /* ---------------------------------------------
           Scroll to results
           --------------------------------------------- */

        if (
            scroll &&
            location.hash === "#results"
        ) {

            window.scrollTo({
                top: 400,
                behavior: "smooth"
            });
        }
    }


    /* =====================================================
       19. JOB CARD
       ===================================================== */

    function card(job) {

        const saved =
            state.isSaved(job.id);


        return `
            <article class="job-card">

                <!-- Job Header -->
                <div class="job-top">

                    <img
                        class="company-logo"
                        src="${job.logo}"
                        alt="${job.company} logo"
                    >


                    <div class="job-main">

                        <div
                            class="d-flex flex-wrap align-items-center gap-2"
                        >

                            <h3 class="job-title">

                                <a
                                    href="job-details.html?id=${encodeURIComponent(job.id)}"
                                    data-view="${job.id}"
                                >
                                    ${job.title}
                                </a>

                            </h3>


                            <span class="match-pill">
                                ${job.match}% Match
                            </span>

                        </div>


                        <div class="company-name">
                            ${job.company}
                        </div>


                        <div class="job-location">

                            <i class="bi bi-geo-alt me-1"></i>

                            ${job.location}

                        </div>

                    </div>


                    <!-- Save Button -->
                    <div class="job-actions">

                        <button
                            class="save-btn ${saved ? "saved" : ""}"
                            data-save="${job.id}"
                            title="${saved ? "Unsave" : "Save"}"
                        >

                            <i
                                class="bi ${
                                    saved
                                        ? "bi-bookmark-fill"
                                        : "bi-bookmark"
                                }"
                            ></i>

                        </button>

                    </div>

                </div>


                <!-- Job Information -->
                <div class="job-meta">

                    <span>
                        <i class="bi bi-briefcase me-1"></i>
                        ${job.experienceLabel}
                    </span>


                    <span>
                        <i class="bi bi-clock me-1"></i>
                        ${job.jobType}
                    </span>


                    <span>
                        <i class="bi bi-laptop me-1"></i>
                        ${job.workMode}
                    </span>


                    <span>
                        <i class="bi bi-cash-stack me-1"></i>
                        ${job.salaryLabel}
                    </span>

                </div>


                <!-- Skills -->
                <div class="job-skills">

                    ${job.skills
                        .slice(0, 5)
                        .map(function (skill) {

                            return `
                                <span class="skill-pill">
                                    ${skill}
                                </span>
                            `;

                        })
                        .join("")}

                </div>


                <!-- Job Footer -->
                <div class="job-bottom">

                    <div>

                        <span class="salary">
                            ${job.salaryLabel}
                        </span>


                        <span class="posted ms-2">

                            Posted ${
                                job.postedDaysAgo === 1
                                    ? "yesterday"
                                    : job.postedDaysAgo +
                                      " days ago"
                            }

                        </span>

                    </div>


                    <div class="d-flex gap-2">

                        <a
                            class="btn btn-light btn-sm"
                            href="job-details.html?id=${encodeURIComponent(job.id)}"
                        >
                            View details
                        </a>


                        <button
                            class="btn btn-primary btn-sm"
                            data-apply="${job.id}"
                        >
                            Apply now
                        </button>

                    </div>

                </div>

            </article>
        `;
    }


    /* =====================================================
       20. PAGINATION
       ===================================================== */

    function renderPagination(totalPages) {

        const startPage =
            Math.max(
                0,
                page - 3
            );


        const endPage =
            Math.min(
                totalPages,
                page + 2
            );


        const pageNumbers =
            Array
                .from(
                    {
                        length: totalPages
                    },
                    function (_, index) {

                        return index + 1;
                    }
                )
                .slice(
                    startPage,
                    endPage
                );


        elements.pagination.innerHTML =
            pageNumbers
                .map(function (number) {

                    return `
                        <li
                            class="page-item ${
                                number === page
                                    ? "active"
                                    : ""
                            }"
                        >

                            <button
                                class="page-link"
                                data-page="${number}"
                            >
                                ${number}
                            </button>

                        </li>
                    `;

                })
                .join("");


        /* ---------------------------------------------
           Previous button
           --------------------------------------------- */

        if (page > 1) {

            elements.pagination.insertAdjacentHTML(
                "afterbegin",
                `
                    <li class="page-item">

                        <button
                            class="page-link"
                            data-page="${page - 1}"
                            aria-label="Previous"
                        >
                            ‹
                        </button>

                    </li>
                `
            );
        }


        /* ---------------------------------------------
           Next button
           --------------------------------------------- */

        if (page < totalPages) {

            elements.pagination.insertAdjacentHTML(
                "beforeend",
                `
                    <li class="page-item">

                        <button
                            class="page-link"
                            data-page="${page + 1}"
                            aria-label="Next"
                        >
                            ›
                        </button>

                    </li>
                `
            );
        }
    }


    /* =====================================================
       21. ACTIVE FILTER CHIPS
       ===================================================== */

    function renderActive() {

        const activeFilters = [];


        /* Keyword */

        if (filters.keyword) {

            activeFilters.push([
                "keyword",
                `Keyword: ${filters.keyword}`
            ]);
        }


        /* Location search */

        if (filters.location) {

            activeFilters.push([
                "location",
                `Location: ${filters.location}`
            ]);
        }


        /* Category */

        if (filters.category) {

            activeFilters.push([
                "category",
                filters.category
            ]);
        }


        /* Work mode */

        filters.workMode.forEach(function (value) {

            activeFilters.push([
                "workMode",
                value
            ]);
        });


        /* Job type */

        filters.jobType.forEach(function (value) {

            activeFilters.push([
                "jobType",
                value
            ]);
        });


        /* Experience */

        filters.experience.forEach(function (value) {

            activeFilters.push([
                "experience",
                value + " years"
            ]);
        });


        /* Location filter */

        filters.locationFilter.forEach(
            function (value) {

                activeFilters.push([
                    "locationFilter",
                    value
                ]);

            }
        );


        /* Skills */

        filters.skill.forEach(function (value) {

            activeFilters.push([
                "skill",
                value
            ]);
        });


        /* Salary */

        if (filters.salaryMin > 4) {

            activeFilters.push([
                "salaryMin",
                `₹${filters.salaryMin}+ LPA`
            ]);
        }


        /* ---------------------------------------------
           Render chips
           --------------------------------------------- */

        elements.active.innerHTML =
            activeFilters
                .map(function ([key, name]) {

                    const value =
                        name.replace(
                            /^[^:]+:\s*/,
                            ""
                        );


                    return `
                        <span class="filter-chip">

                            ${name}

                            <button
                                data-remove="${key}"
                                data-value="${value}"
                            >

                                <i class="bi bi-x"></i>

                            </button>

                        </span>
                    `;

                })
                .join("");
    }


    /* =====================================================
       22. RECENTLY VIEWED JOBS
       ===================================================== */

    function renderRecent() {

        const recentIds =
            state.store.read().recent;


        const recentJobs =
            recentIds
                .map(function (id) {

                    return jobs.find(
                        job => job.id === id
                    );

                })
                .filter(Boolean);


        if (!recentJobs.length) {
            return;
        }


        elements.recentSection
            .classList
            .remove("d-none");


        elements.recent.innerHTML =
            recentJobs
                .slice(0, 4)
                .map(function (job) {

                    return `
                        <div
                            class="col-md-6 col-xl-3"
                        >

                            <a
                                href="job-details.html?id=${job.id}"
                                class="mini-card d-block text-decoration-none"
                            >

                                <div class="d-flex gap-2">

                                    <img
                                        class="company-logo"
                                        src="${job.logo}"
                                        alt=""
                                    >


                                    <div>

                                        <h3>
                                            ${job.title}
                                        </h3>

                                        <p>
                                            ${job.company}
                                            •
                                            ${job.location}
                                        </p>

                                        <span class="mini-salary">
                                            ${job.salaryLabel}
                                        </span>

                                    </div>

                                </div>

                            </a>

                        </div>
                    `;

                })
                .join("");
    }


    /* =====================================================
       23. GLOBAL CLICK HANDLER
       Handles:
       - Save job
       - Apply now
       - Pagination
       - Remove filter
       ===================================================== */

    document.addEventListener(
        "click",
        function (event) {


            /* ---------------------------------------------
               SAVE JOB
               --------------------------------------------- */

            const saveButton =
                event.target.closest(
                    "[data-save]"
                );


            if (saveButton) {

                const saved =
                    state.toggleSaved(
                        saveButton.dataset.save
                    );


                saveButton.classList.toggle(
                    "saved",
                    saved
                );


                saveButton.innerHTML = `
                    <i class="bi ${
                        saved
                            ? "bi-bookmark-fill"
                            : "bi-bookmark"
                    }"></i>
                `;


                saveButton.title =
                    saved
                        ? "Unsave"
                        : "Save";


                state.toast(
                    saved
                        ? "Job saved."
                        : "Job removed from saved jobs."
                );


                return;
            }


            /* ---------------------------------------------
               APPLY NOW
               --------------------------------------------- */

            const applyButton =
                event.target.closest(
                    "[data-apply]"
                );


            if (applyButton) {

                const job =
                    jobs.find(
                        job =>
                            job.id ===
                            applyButton.dataset.apply
                    );


                if (job) {
                    state.openApply(job);
                }


                return;
            }


            /* ---------------------------------------------
               PAGINATION
               --------------------------------------------- */

            const paginationButton =
                event.target.closest(
                    "[data-page]"
                );


            if (paginationButton) {

                page =
                    Number(
                        paginationButton.dataset.page
                    );


                render();


                window.scrollTo({
                    top:
                        document
                            .querySelector(
                                ".results-toolbar"
                            )
                            .offsetTop - 90,

                    behavior: "smooth"
                });


                return;
            }


            /* ---------------------------------------------
               REMOVE ACTIVE FILTER
               --------------------------------------------- */

            const removeButton =
                event.target.closest(
                    "[data-remove]"
                );


            if (!removeButton) {
                return;
            }


            const filterKey =
                removeButton.dataset.remove;

            const filterValue =
                removeButton.dataset.value;


            /* Checkbox-based filters */

            if (
                [
                    "workMode",
                    "jobType",
                    "experience",
                    "locationFilter",
                    "skill"
                ].includes(filterKey)
            ) {

                filters[filterKey] =
                    filters[filterKey].filter(
                        function (value) {

                            return (
                                value !== filterValue &&
                                !(
                                    filterKey ===
                                    "experience" &&
                                    value ===
                                    filterValue.replace(
                                        " years",
                                        ""
                                    )
                                )
                            );

                        }
                    );
            }


            /* Salary */

            else if (
                filterKey === "salaryMin"
            ) {

                filters.salaryMin = 4;
            }


            /* Keyword */

            else if (
                filterKey === "keyword"
            ) {

                filters.keyword = "";

                elements.keyword.value = "";
            }


            /* Location search */

            else if (
                filterKey === "location"
            ) {

                filters.location = "";

                elements.location.value = "";
            }


            /* Category */

            else if (
                filterKey === "category"
            ) {

                filters.category = "";

                elements.category.value = "";
            }


            /* Re-render */

            renderFilters();

            render();
        }
    );

})();