import React, { useState, useRef, useCallback } from 'react';

interface InputAreaProps {
  onSendMessage: (message: string, inputType: 'voice' | 'text') => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage }) => {
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    autoResize();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const sendTextMessage = () => {
    const message = textInput.trim();
    if (!message) return;

    onSendMessage(message, 'text');
    setTextInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        processAudioRecording(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check your browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const processAudioRecording = (audioBlob: Blob) => {
    // Simulate voice processing (in real app, this would be sent to speech-to-text API)
    const simulatedTranscript = "This is a simulated voice message transcription. In a real implementation, this would be processed by a speech-to-text service.";
    onSendMessage(simulatedTranscript, 'voice');
  };

  const handleSendClick = () => {
    if (textInput.trim()) {
      sendTextMessage();
    }
  };

  // Handle hold-to-record functionality
  const startHoldRecording = () => {
    if (!isRecording) {
      startRecording();
    }
  };

  const stopHoldRecording = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  return (
    <div className="input-area">
      <div className="text-input-container">
        <textarea
          ref={textareaRef}
          className="text-input"
          placeholder="Type your message here..."
          value={textInput}
          onChange={handleTextChange}
          onKeyPress={handleKeyPress}
          rows={1}
        />
        <button
          className={`send-voice-btn ${isRecording ? 'recording' : ''}`}
          onMouseDown={startHoldRecording}
          onMouseUp={stopHoldRecording}
          onMouseLeave={stopHoldRecording}
          onTouchStart={startHoldRecording}
          onTouchEnd={stopHoldRecording}
          onClick={handleSendClick}
          disabled={!textInput.trim() && !isRecording}
        >
          <div className="btn-content">
            <span className="send-btn-text">
              {isRecording ? 'Recording...' : 'Send'}
            </span>
            <span className="send-btn-icon">
              {isRecording ? '🎤' : '➤'}
            </span>
          </div>
          {isRecording && (
            <div className="recording-indicator">
              <div className="pulse"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputArea;
