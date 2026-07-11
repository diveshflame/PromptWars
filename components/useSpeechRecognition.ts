import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface UseSpeechRecognitionOptions {
  lang: string;
  onResult: (transcript: string) => void;
}

function noopSubscribe() {
  return () => {};
}

function getIsSupported() {
  return Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

function getServerIsSupported() {
  return false;
}

/** Wraps the browser's SpeechRecognition API (unsupported in Firefox and Safari desktop; callers should treat it as a progressive enhancement). */
export function useSpeechRecognition({ lang, onResult }: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const isSupported = useSyncExternalStore(noopSubscribe, getIsSupported, getServerIsSupported);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  const start = useCallback(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      onResultRef.current(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { isSupported, isListening, start, stop };
}
