import { useState, useRef, useCallback } from 'react';

// SpeechRecognition type definitions
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionResultItem;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): ISpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): ISpeechRecognition;
    };
  }
}

export function useVoiceRecognition(onResultCallback?: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const currentTranscriptRef = useRef<string>('');

  const isSupported = typeof window !== 'undefined' && Boolean(
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  );

  // Send recorded audio to backend Groq Whisper fallback
  const transcribeAudioBlob = async (blob: Blob): Promise<string> => {
    try {
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');

      const response = await fetch('http://127.0.0.1:8000/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper transcription error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (err) {
      console.warn('[Whisper Fallback Error]', err);
      return '';
    } finally {
      setIsTranscribing(false);
    }
  };

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    currentTranscriptRef.current = '';
    audioChunksRef.current = [];

    // 1. Request microphone access explicitly to trigger browser permission dialog
    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Initialize MediaRecorder for Whisper backup
        if (typeof MediaRecorder !== 'undefined') {
          const recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };
          recorder.start(250);
          mediaRecorderRef.current = recorder;
        }
      }
    } catch (permErr: unknown) {
      const errMsg = permErr instanceof Error ? permErr.message : 'Microphone permission denied';
      console.warn('[Microphone Permission Denied]', errMsg);
      setError('Microphone access was denied. Please allow microphone permissions in your browser.');
      setIsListening(false);
      return;
    }

    // 2. Initialize and start Web Speech API if supported
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let liveText = '';
          for (let i = 0; i < event.results.length; i++) {
            liveText += event.results[i][0].transcript;
          }
          if (liveText.trim()) {
            currentTranscriptRef.current = liveText;
            setTranscript(liveText);
            if (onResultCallback) {
              onResultCallback(liveText);
            }
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === 'no-speech') return;
          console.warn('[WebSpeech API Warning]', event.error);
        };

        recognition.onend = () => {
          // Keep listening state synced
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        console.warn('[WebSpeech start error, using audio recorder]', e);
      }
    }

    setIsListening(true);
  }, [onResultCallback]);

  const stopListening = useCallback(async () => {
    setIsListening(false);

    // Stop WebSpeech
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn(err);
      }
    }

    // Stop MediaRecorder and process audio if WebSpeech didn't capture text
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Allow a brief delay for final chunk collection
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // If WebSpeech caught nothing or was empty, use high-precision Groq Whisper
      if (!currentTranscriptRef.current.trim() && audioBlob.size > 1000) {
        const whisperText = await transcribeAudioBlob(audioBlob);
        if (whisperText.trim()) {
          setTranscript(whisperText);
          if (onResultCallback) {
            onResultCallback(whisperText);
          }
        }
      }
    }

    // Stop all microphone tracks to release the hardware mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [onResultCallback]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    currentTranscriptRef.current = '';
  }, []);

  return {
    isListening,
    isTranscribing,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}
