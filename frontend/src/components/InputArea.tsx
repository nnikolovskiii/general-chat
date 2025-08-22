import React, { useState, useRef, useCallback } from 'react';
import { buildApiUrl } from '../lib/api';
import { Mic, Paperclip, Send } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (text?: string, audioPath?: string) => void;
  disabled?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, disabled = false }) => {
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && textInput.trim()) {
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
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    return response.json();
  };

  const processAudioRecording = async (audioBlob: Blob) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `recording-${timestamp}.webm`;
      const uploadResult = await uploadAudioBlob(audioBlob, filename);
      const backendFilename = uploadResult.data?.unique_filename;

      if (!backendFilename) {
        throw new Error("Backend did not return a valid filename for the audio.");
      }

      const audioPath = `https://files.nikolanikolovski.com/test/download/${backendFilename}`;
      onSendMessage(textInput, audioPath);
      setTextInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
        stream.getTracks().forEach(track => track.stop());
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

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="input-area-wrapper">
      <div className="input-area">
        <div className="input-form">
          <button className="icon-button" title="Attach file" disabled={disabled}>
            <Paperclip size={20} />
          </button>
          <textarea
            ref={textareaRef}
            className="text-input"
            placeholder="How can Grok help?"
            value={textInput}
            onChange={handleTextChange}
            onKeyPress={handleKeyPress}
            rows={1}
            disabled={disabled}
          />
          <button
            className={`icon-button ${isRecording ? 'recording' : ''}`}
            onClick={handleMicClick}
            disabled={disabled}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            <Mic size={20} />
          </button>
          {textInput.trim() && (
            <button
              className="icon-button send-btn"
              onClick={sendTextMessage}
              disabled={disabled}
              title="Send Message"
            >
              <Send size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputArea;