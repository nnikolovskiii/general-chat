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
    return endpoint ? `${baseUrl}/${endpoint}` : baseUrl;
};

// New langgraph-specific API functions
export const getThreadMessagesUrl = (threadId: string) => {
    return getChatsUrl(`${threadId}/messages`);
};

export const sendMessageToThreadUrl = (threadId: string) => {
    return getChatsUrl(`${threadId}/send`);
};

// API functions for langgraph integration
export const fetchThreadMessages = async (threadId: string): Promise<Array<{content: string, type: string}>> => {
    const response = await fetch(getThreadMessagesUrl(threadId), {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }

    return response.json();
};

export const sendMessageToThread = async (threadId: string, message?: string, audioPath?: string): Promise<{status: string, message: string}> => {
    const payload: { message?: string; audio_path?: string } = {};
    
    if (message) {
        payload.message = message;
    }
    
    if (audioPath) {
        payload.audio_path = audioPath;
    }

    const response = await fetch(sendMessageToThreadUrl(threadId), {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
};

export const createNewThread = async (title: string): Promise<{chat_id: string, thread_id: string, title: string, created_at: string}> => {
    const response = await fetch(getChatsUrl('create-thread'), {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
    });

    if (!response.ok) {
        throw new Error(`Failed to create thread: ${response.statusText}`);
    }

    return response.json();
};
