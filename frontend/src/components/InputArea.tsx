// Path: frontend/src/components/InputArea.tsx

import React, { useState, useRef, useCallback } from 'react';
import { buildApiUrl } from '../lib/api';

interface InputAreaProps {
  onSendMessage: (text?: string, audioPath?: string) => void;
  disabled?: boolean;
}

// --- START OF REFACTORED CODE ---

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, disabled = false }) => {
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      // Set a max-height (e.g., 120px) to prevent it from growing indefinitely
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    autoResize();
  };

  const sendTextMessage = () => {
    const message = textInput.trim();
    if (!message) return;

    onSendMessage(message, undefined);
    setTextInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Handle Enter key press for sending text messages
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      if (!disabled) {
        sendTextMessage();
      }
    }
  };

  const uploadAudioBlob = async (blob: Blob, filename: string): Promise<{ data: { unique_filename: string } }> => {
    const formData = new FormData();
    formData.append('file', blob, filename);

    const response = await fetch(buildApiUrl('/files/upload'), {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to upload audio blob:', response.status, errorText);
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    return response.json();
  };

  const processAudioRecording = async (audioBlob: Blob) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `recording-${timestamp}.wav`;

      const uploadResult = await uploadAudioBlob(audioBlob, filename);
      const backendFilename = uploadResult.data?.unique_filename;

      if (!backendFilename) {
        throw new Error("Backend did not return a valid filename for the audio.");
      }

      const audioPath = `https://files.nikolanikolovski.com/test/download/${backendFilename}`;

      // Send both the current text input and the new audio path
      onSendMessage(textInput, audioPath);
      setTextInput(''); // Clear text input after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

    } catch (error) {
      console.error('Error processing audio recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Send an error message back to the user in the chat
      onSendMessage(`[Error] Failed to process audio: ${errorMessage}`);
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        processAudioRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Release microphone
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Could not access microphone. Please check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
      <div className="input-area">
        <div className="text-input-container">
        <textarea
            ref={textareaRef}
            className="text-input"
            placeholder="Type a message (Enter to send) or hold the mic to record"
            value={textInput}
            onChange={handleTextChange}
            onKeyPress={handleKeyPress}
            rows={1}
            disabled={disabled}
        />
          <button
              className={`send-voice-btn ${isRecording ? 'recording' : ''}`}
              // Use mouse/touch events for hold-to-record functionality
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording} // Stop if mouse leaves button area
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={disabled}
              title="Hold to Record Audio"
          >
            <div className="btn-content">
            <span className="send-btn-text">
              {isRecording ? 'Recording...' : '🎤'}
            </span>
              <span className="send-btn-icon">
              {isRecording ? '🔴' : '🎤'}
            </span>
            </div>
            {isRecording && <div className="recording-indicator" />}
          </button>
        </div>
      </div>
  );
};

export default InputArea;
// --- END OF REFACTORED CODE ---