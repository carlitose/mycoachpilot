// Session slice
export { default as sessionReducer } from './sessionSlice';
export {
  setSession,
  updateSessionStatus,
  setConnectionState,
  setError as setSessionError,
  setAudioLevel,
  setMuted,
  sessionStarted,
  sessionPaused,
  sessionResumed,
  sessionStopped,
  resetSession,
} from './sessionSlice';
export type { SessionSliceState, ConnectionState } from './sessionSlice';

// Transcript slice
export { default as transcriptReducer } from './transcriptSlice';
export {
  addMessage,
  updateMessage,
  addSegment,
  updateSegment,
  addSpeaker,
  updateSpeaker,
  setUserSpeaker,
  setInterimTranscript,
  clearInterim,
  setMessages,
  setSegments,
  setSpeakers,
  clearTranscript,
} from './transcriptSlice';
export type { TranscriptSliceState } from './transcriptSlice';

// Coaching slice
export { default as coachingReducer } from './coachingSlice';
export {
  addSuggestion,
  markSuggestionUsed,
  dismissSuggestion,
  setGenerating,
  setSuggestions,
  clearSuggestions,
} from './coachingSlice';
export type { CoachingSliceState } from './coachingSlice';

// Settings slice
export { default as settingsReducer } from './settingsSlice';
export {
  setConfig,
  setOpenaiApiKey,
  setDefaultMode,
  setDefaultTemplate,
  setCoachingStyle,
  setTheme,
  setLanguage,
  setTemplates,
  addTemplate,
  updateTemplate,
  removeTemplate,
  setLoading as setSettingsLoading,
  setSaving as setSettingsSaving,
  setError as setSettingsError,
  resetSettings,
} from './settingsSlice';
export type { SettingsSliceState } from './settingsSlice';
