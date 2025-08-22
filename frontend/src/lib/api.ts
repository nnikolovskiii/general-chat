// Path: frontend/src/lib/api.ts

// Centralized API configuration

// First, try to get the URL from the runtime environment injected by Docker
const runtimeApiUrl = window.ENV?.VITE_API_BASE_URL;

export const API_CONFIG = {
    // Priority:
    // 1. Runtime environment (window.ENV) for Docker.
    // 2. Build-time environment (.env file) for local development.
    // 3. Hardcoded default as a fallback.
    URL: runtimeApiUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',

    ENDPOINTS: {
        // Authentication endpoints
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout',
            ME: '/auth/me',
            GET_USER_INFO: '/auth/get-user-info',
            ADD_USER_INFO: '/auth/add-user-info',
            HAS_USER_INFO: '/auth/has-user-info'
        },
        // File management endpoints
        FILES: {
            UPLOAD: '/files/upload',
            LIST: '/files/files',
            PROCESS: '/files/process',
            STATUS: '/files/status',
            POLL: '/files/poll',
            DOWNLOAD: '/files/download'
        },
        // Code endpoints
        CODES: '/codes',
        // Webhook endpoints
        WEBHOOK: '/webhook',
        // Chat endpoints
        CHATS: '/chats'
    },
    getApiUrl: () => {
        const baseUrl = API_CONFIG.URL;
        return baseUrl;
    }
};

// --- START OF REFACTORED CODE ---

// Type definition for the message structure from the LangChain backend
export interface BackendMessage {
    type: 'human' | 'ai' | 'system';
    content: string;
    additional_kwargs?: {
        file_url?: string;
        [key: string]: any;
    };
}

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string) => {
    return `${API_CONFIG.getApiUrl()}${endpoint}`;
};

// Convenience functions for common API calls
export const getAuthUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS.AUTH) => {
    return buildApiUrl(API_CONFIG.ENDPOINTS.AUTH[endpoint]);
};

export const getFilesUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS.FILES, param?: string) => {
    const baseUrl = buildApiUrl(API_CONFIG.ENDPOINTS.FILES[endpoint]);
    return param ? `${baseUrl}/${param}` : baseUrl;
};

export const getChatsUrl = (endpoint: string = '') => {
    const baseUrl = buildApiUrl(API_CONFIG.ENDPOINTS.CHATS);
    return endpoint ? `${baseUrl}${endpoint}` : baseUrl;
};

// New langgraph-specific API functions
export const getThreadMessagesUrl = (threadId: string) => {
    return getChatsUrl(`/${threadId}/messages`);
};

export const sendMessageToThreadUrl = (threadId: string) => {
    return getChatsUrl(`/${threadId}/send`);
};

// --- END OF REFACTORED CODE ---
