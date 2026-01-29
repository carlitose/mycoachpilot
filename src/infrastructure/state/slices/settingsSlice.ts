import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { SessionModeType } from '@domain/session';
import type { UserConfigProps, TemplateProps, CoachingStyleType } from '@domain/settings';
import { PREDEFINED_TEMPLATES } from '@domain/settings';

export interface SettingsSliceState {
  config: UserConfigProps;
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
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
