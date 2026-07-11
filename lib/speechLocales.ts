/** Maps the app's language names to BCP-47 locale tags for SpeechRecognition/SpeechSynthesis. */
const SPEECH_LOCALES: Record<string, string> = {
  English: "en-IN",
  Hindi: "hi-IN",
  Bengali: "bn-IN",
  Marathi: "mr-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Gujarati: "gu-IN",
  Kannada: "kn-IN",
  Malayalam: "ml-IN",
  Punjabi: "pa-IN",
  Spanish: "es-ES",
  French: "fr-FR",
};

export function getSpeechLocale(language: string): string {
  return SPEECH_LOCALES[language] ?? "en-IN";
}
