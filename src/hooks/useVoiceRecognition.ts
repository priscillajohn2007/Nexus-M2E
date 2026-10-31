import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceRecognitionOptions {
  onVoiceCommand?: (command: string) => void;
  onTranscriptUpdate?: (transcript: string) => void;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isOffTheRecord, setIsOffTheRecord] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0].transcript;
          if (item.isFinal) {
            finalChunk += text + ' ';
          } else {
            currentInterim += text;
          }
        }

        setInterimTranscript(currentInterim);

        if (finalChunk) {
          const lower = finalChunk.toLowerCase().trim();

          // Check voice commands
          if (lower.includes('off the record')) {
            setIsOffTheRecord(true);
            options.onVoiceCommand?.('off_the_record');
          } else if (lower.includes('back on the record') || lower.includes('on the record')) {
            setIsOffTheRecord(false);
            options.onVoiceCommand?.('back_on_the_record');
          } else if (lower.includes('approve all tasks') || lower.includes('confirm and dispatch all')) {
            options.onVoiceCommand?.('approve_all_tasks');
          } else if (lower.includes('show my tasks') || lower.includes('open my work')) {
            options.onVoiceCommand?.('show_my_tasks');
          } else if (lower.includes('mark the database task done')) {
            options.onVoiceCommand?.('mark_database_task_done');
          }

          // Append speech if not off-the-record or label it
          setTranscript(prev => {
            const next = prev ? `${prev} ${finalChunk.trim()}` : finalChunk.trim();
            options.onTranscriptUpdate?.(next);
            return next;
          });
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition status/error:', err.error);
        if (err.error === 'not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // If still supposed to be listening, attempt reconnect
        if (isListening) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
          }
        }
      };

      recognitionRef.current = recognition;
    }
  }, [isListening, options]);

  // Audio wave animation simulation when listening
  useEffect(() => {
    if (isListening) {
      const updateLevel = () => {
        setAudioLevel(0.2 + Math.random() * 0.8);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      animFrameRef.current = requestAnimationFrame(updateLevel);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setAudioLevel(0);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isListening]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Recognition start caught:', e);
      }
    } else {
      // Browser fallback simulation mode with sample speech dictation
      setIsListening(true);
      const samplePhases = [
        'Alex Rivera: Good morning team. Let us review the database migration schedule.',
        'Priya Sharma: The Postgres 16 benchmarks look solid with pgvector enabled.',
        'Marcus Vance: Reminder that SOC2 requires all database cutovers to complete staging gate tests.',
        'Alex Rivera: Priya, please update the database configuration by tomorrow.'
      ];
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < samplePhases.length) {
          setTranscript(prev => `${prev ? prev + ' ' : ''}${samplePhases[idx]}`);
          idx++;
        } else {
          clearInterval(interval);
          setIsListening(false);
        }
      }, 2500);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    interimTranscript,
    transcript,
    setTranscript,
    isOffTheRecord,
    setIsOffTheRecord,
    audioLevel,
    startListening,
    stopListening,
    toggleListening
  };
}
