import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { SessionModeType } from '@domain/session';
import type { UserConfigProps, TemplateProps, CoachingStyleType, ReactivityConfigProps } from '@domain/settings';
import { PREDEFINED_TEMPLATES, REACTIVITY_DEFAULTS } from '@domain/settings';

export interface SettingsSliceState {
  config: UserConfigProps;
  reactivity: ReactivityConfigProps;
  templates: TemplateProps[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const defaultConfig: UserConfigProps = {
  id: 'default',
  openaiApiKey: null,
  defaultMode: 'conversation',
  defaultTemplateId: 'general',
  coachingStyle: 'diplomatic',
  theme: 'system',
  language: 'en',
};

const initialState: SettingsSliceState = {
  config: defaultConfig,
  reactivity: { ...REACTIVITY_DEFAULTS },
  templates: PREDEFINED_TEMPLATES,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<UserConfigProps>) => {
      state.config = action.payload;
      state.error = null;
    },

    setOpenaiApiKey: (state, action: PayloadAction<string | null>) => {
      state.config.openaiApiKey = action.payload;
    },

    setDefaultMode: (state, action: PayloadAction<SessionModeType>) => {
      state.config.defaultMode = action.payload;
    },

    setDefaultTemplate: (state, action: PayloadAction<string>) => {
      state.config.defaultTemplateId = action.payload;
    },

    setCoachingStyle: (state, action: PayloadAction<CoachingStyleType>) => {
      state.config.coachingStyle = action.payload;
    },

    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.config.theme = action.payload;
    },

    setLanguage: (state, action: PayloadAction<string>) => {
      state.config.language = action.payload;
    },

    setTemplates: (state, action: PayloadAction<TemplateProps[]>) => {
      state.templates = action.payload;
    },

    addTemplate: (state, action: PayloadAction<TemplateProps>) => {
      state.templates.push(action.payload);
    },

    updateTemplate: (state, action: PayloadAction<TemplateProps>) => {
      const index = state.templates.findIndex((t) => t.id === action.payload.id);
      if (index >= 0) {
        state.templates[index] = action.payload;
      }
    },

    removeTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter((t) => t.id !== action.payload);
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Reactivity Config reducers
    setReactivity: (state, action: PayloadAction<ReactivityConfigProps>) => {
      state.reactivity = action.payload;
    },

    setVadThreshold: (state, action: PayloadAction<number>) => {
      state.reactivity.vadThreshold = Math.max(0.1, Math.min(1.0, action.payload));
    },

    setVadSilenceDuration: (state, action: PayloadAction<number>) => {
      state.reactivity.vadSilenceDurationMs = Math.max(100, Math.min(1000, action.payload));
    },

    setSuggestionInterval: (state, action: PayloadAction<number>) => {
      state.reactivity.suggestionIntervalMs = Math.max(3000, Math.min(30000, action.payload));
    },

    setMaxActiveSuggestions: (state, action: PayloadAction<number>) => {
      state.reactivity.maxActiveSuggestions = Math.max(1, Math.min(10, action.payload));
    },

    setSuggestionModel: (state, action: PayloadAction<string>) => {
      state.reactivity.suggestionModel = action.payload;
    },

    setRealtimeModel: (state, action: PayloadAction<string>) => {
      state.reactivity.realtimeModel = action.payload;
    },

    setTranscriptionModel: (state, action: PayloadAction<string>) => {
      state.reactivity.transcriptionModel = action.payload;
    },

    resetReactivity: (state) => {
      state.reactivity = { ...REACTIVITY_DEFAULTS };
    },

    resetSettings: () => initialState,
  },
});

export const {
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
  setLoading,
  setSaving,
  setError,
  setReactivity,
  setVadThreshold,
  setVadSilenceDuration,
  setSuggestionInterval,
  setMaxActiveSuggestions,
  setSuggestionModel,
  setRealtimeModel,
  setTranscriptionModel,
  resetReactivity,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
