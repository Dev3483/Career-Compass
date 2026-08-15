// Simple utility for app parameters without Base44 dependencies

const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
    if (isNode) {
        return defaultValue;
    }
    const storageKey = `careerai_${toSnakeCase(paramName)}`;
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get(paramName);

    if (removeFromUrl) {
        urlParams.delete(paramName);
        const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
            }${window.location.hash}`;
        window.history.replaceState({}, document.title, newUrl);
    }

    if (searchParam) {
        try {
            storage.setItem(storageKey, searchParam);
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
        return searchParam;
    }

    if (defaultValue !== undefined) {
        try {
            storage.setItem(storageKey, defaultValue);
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
        return defaultValue;
    }

    try {
        const storedValue = storage.getItem(storageKey);
        if (storedValue) {
            return storedValue;
        }
    } catch (e) {
        console.warn('Failed to read from localStorage:', e);
    }

    return null;
}

const getAppParams = () => {
    // Clear token if requested
    if (getAppParamValue("clear_access_token") === 'true') {
        try {
            storage.removeItem('careerai_access_token');
            storage.removeItem('token');
        } catch (e) {
            console.warn('Failed to clear tokens:', e);
        }
    }

    return {
        appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_APP_ID || 'default-app-id' }),
        token: getAppParamValue("access_token", { removeFromUrl: true }),
        fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
        functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_FUNCTIONS_VERSION || 'v1' }),
        appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_APP_BASE_URL || window.location.origin }),
    }
}

export const appParams = {
    ...getAppParams()
}