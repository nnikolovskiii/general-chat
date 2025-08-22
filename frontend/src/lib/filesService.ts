import { buildApiUrl, getFilesUrl } from './api';

// Type definitions
export interface FileUploadResponse {
  filename: string;
  file_id: string;
  url: string;
}

export interface FileStatus {
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}

export interface ProcessFileRequest {
  file_id: string;
  prompt?: string;
}

export interface ProcessFileResponse {
  task_id: string;
  status: string;
}

export interface FileListItem {
  id: string;
  filename: string;
  size: number;
  upload_date: string;
}

// Files service functions
export const filesService = {
  uploadFile: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(getFilesUrl('UPLOAD'), {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`File upload failed: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  listFiles: async (): Promise<FileListItem[]> => {
    const response = await fetch(getFilesUrl('LIST'), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list files: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  processFile: async (request: ProcessFileRequest): Promise<ProcessFileResponse> => {
    const response = await fetch(getFilesUrl('PROCESS'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to process file: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  getFileStatus: async (fileId: string): Promise<FileStatus> => {
    const response = await fetch(getFilesUrl('STATUS', fileId), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get file status: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  pollFileStatus: async (fileId: string): Promise<FileStatus> => {
    const response = await fetch(getFilesUrl('POLL', fileId), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to poll file status: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  downloadFile: async (fileId: string): Promise<Blob> => {
    const response = await fetch(getFilesUrl('DOWNLOAD', fileId), {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download file: ${response.statusText} (${errorText})`);
    }

    return response.blob();
  },
};
