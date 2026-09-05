/* =========================================================
   HIRESPHERE — STORAGE SERVICE
   File: js/services/storage-service.js

   Responsibility:
   - Centralized localStorage access
   - Safe read/write operations
   - JSON serialization/deserialization
   - Remove and clear operations
   - Prevent storage-related code duplication
   ========================================================= */


/* =========================================================
   STORAGE PREFIX
   ========================================================= */

const STORAGE_PREFIX = "hiresphere_";


/* =========================================================
   INTERNAL KEY BUILDER
   ========================================================= */

function buildKey(key) {

    return `${STORAGE_PREFIX}${key}`;
}


/* =========================================================
   GET DATA
   ========================================================= */

export function get(key, fallback = null) {

    try {

        const storageKey =
            buildKey(key);

        const rawData =
            localStorage.getItem(storageKey);

        if (rawData === null) {
            return fallback;
        }

        return JSON.parse(rawData);

    } catch (error) {

        console.error(
            `HireSphere storage read failed: ${key}`,
            error
        );

        return fallback;
    }
}


/* =========================================================
   SET DATA
   ========================================================= */

export function set(key, value) {

    try {

        const storageKey =
            buildKey(key);

        localStorage.setItem(
            storageKey,
            JSON.stringify(value)
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
   REMOVE DATA
   ========================================================= */

export function remove(key) {

    try {

        const storageKey =
            buildKey(key);

        localStorage.removeItem(storageKey);

        return true;

    } catch (error) {

        console.error(
            `HireSphere storage remove failed: ${key}`,
            error
        );

        return false;
    }
}


/* =========================================================
   CHECK EXISTENCE
   ========================================================= */

export function has(key) {

    try {

        return (
            localStorage.getItem(
                buildKey(key)
            ) !== null
        );

    } catch (error) {

        console.error(
            `HireSphere storage check failed: ${key}`,
            error
        );

        return false;
    }
}


/* =========================================================
   CLEAR HIRESHERE STORAGE
   ========================================================= */

export function clearAll() {

    try {

        const keysToRemove = [];

        for (
            let index = 0;
            index < localStorage.length;
            index++
        ) {

            const key =
                localStorage.key(index);

            if (
                key &&
                key.startsWith(STORAGE_PREFIX)
            ) {
                keysToRemove.push(key);
            }
        }


        keysToRemove.forEach(
            key => localStorage.removeItem(key)
        );


        return true;

    } catch (error) {

        console.error(
            "HireSphere storage clear failed.",
            error
        );

        return false;
    }
}


/* =========================================================
   GET ALL HIRESPHERE STORAGE
   ========================================================= */

export function getAll() {

    const data = {};

    try {

        for (
            let index = 0;
            index < localStorage.length;
            index++
        ) {

            const storageKey =
                localStorage.key(index);

            if (
                !storageKey ||
                !storageKey.startsWith(STORAGE_PREFIX)
            ) {
                continue;
            }


            const key =
                storageKey.replace(
                    STORAGE_PREFIX,
                    ""
                );


            data[key] = get(key);
        }

    } catch (error) {

        console.error(
            "HireSphere storage collection failed.",
            error
        );
    }

    return data;
}


/* =========================================================
   ARRAY HELPERS
   ========================================================= */

export function getArray(key) {

    const value =
        get(key, []);

    return Array.isArray(value)
        ? value
        : [];
}


export function pushToArray(key, item) {

    const items =
        getArray(key);

    items.push(item);

    return set(key, items);
}


export function removeFromArray(
    key,
    predicate
) {

    const items =
        getArray(key);

    const filteredItems =
        items.filter(
            item => !predicate(item)
        );

    return set(
        key,
        filteredItems
    );
}
