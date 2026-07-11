import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

function noopSubscribe() {
  return () => {};
}

function getIsSupported() {
  return "speechSynthesis" in window;
}

function getServerIsSupported() {
  return false;
}

/** Wraps the browser's SpeechSynthesis API for reading text aloud. Voice/language coverage depends on the browser and OS. */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = useSyncExternalStore(noopSubscribe, getIsSupported, getServerIsSupported);

  const speak = useCallback((text: string, lang: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return { isSupported, isSpeaking, speak, stop };
}
