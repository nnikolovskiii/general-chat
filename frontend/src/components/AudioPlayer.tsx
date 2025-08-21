import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Format time from seconds to MM:SS format
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setError('Failed to play audio. Please check if the audio file is accessible.');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle stop
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  // Fast forward 10 seconds
  const fastForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  };

  // Rewind 10 seconds
  const rewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      setError('Failed to load audio file. The file may be corrupted or inaccessible.');
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    // Add event listeners
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as EventListener);
    audio.addEventListener('loadstart', handleLoadStart);

    // Cleanup
    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as EventListener);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, []);

  return (
    <div className={`audio-player ${className}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
      />
      
      {/* Error message */}
      {error && (
        <div className="audio-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && !error && (
        <div className="audio-loading">
          <div className="loading-spinner"></div>
          Loading audio...
        </div>
      )}
      
      {/* Audio controls */}
      {!isLoading && !error && (
        <div className="audio-controls">
          {/* Main controls */}
          <div className="main-controls">
            <button 
              onClick={rewind}
              className="control-btn"
              title="Rewind 10 seconds"
              disabled={currentTime <= 0}
            >
              ⏪
            </button>
            
            <button 
              onClick={togglePlayPause}
              className="control-btn play-pause-btn"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            
            <button 
              onClick={stopAudio}
              className="control-btn"
              title="Stop"
              disabled={currentTime <= 0}
            >
              ⏹️
            </button>
            
            <button 
              onClick={fastForward}
              className="control-btn"
              title="Fast forward 10 seconds"
              disabled={currentTime >= duration}
            >
              ⏩
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="progress-container">
            <span className="time-display">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar"
              disabled={duration <= 0}
            />
            <span className="time-display">{formatTime(duration)}</span>
          </div>
          
          {/* Volume control */}
          <div className="volume-container">
            <span className="volume-icon">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
