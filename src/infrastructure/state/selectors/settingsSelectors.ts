import { createSelector } from '@reduxjs/toolkit';

import type { SettingsSliceState } from '../slices/settingsSlice';
import type { RootState } from '../store';

export const selectSettings = (state: RootState): SettingsSliceState => state.settings;

export const selectConfig = createSelector(
  selectSettings,
  (settings) => settings.config,
);

export const selectTemplates = createSelector(
  selectSettings,
  (settings) => settings.templates,
);

export const selectIsLoading = createSelector(
  selectSettings,
  (settings) => settings.isLoading,
);

export const selectIsSaving = createSelector(
  selectSettings,
  (settings) => settings.isSaving,
);

export const selectSettingsError = createSelector(
  selectSettings,
  (settings) => settings.error,
);

export const selectHasOpenaiKey = createSelector(
  selectConfig,
  (config) => config.openaiApiKey !== null && config.openaiApiKey.length > 0,
);

export const selectDefaultMode = createSelector(
  selectConfig,
  (config) => config.defaultMode,
);

export const selectDefaultTemplateId = createSelector(
  selectConfig,
  selectTemplates,
  (config, templates) => {
    const found = templates.find((t) => t.id === config.defaultTemplateId);
    return found?.id ?? templates[0]?.id ?? 'general';
  },
);

export const selectDefaultTemplate = createSelector(
  selectConfig,
  selectTemplates,
  (config, templates) => templates.find((t) => t.id === config.defaultTemplateId) ?? templates[0],
);

export const selectCoachingStyle = createSelector(
  selectConfig,
  (config) => config.coachingStyle,
);

export const selectTheme = createSelector(
  selectConfig,
  (config) => config.theme,
);

export const selectPredefinedTemplates = createSelector(
  selectTemplates,
  (templates) => templates.filter((t) => t.isPredefined),
);

export const selectCustomTemplates = createSelector(
  selectTemplates,
  (templates) => templates.filter((t) => !t.isPredefined),
);

// Simply re-export the same selector - no createSelector wrapper needed for identity functions
export const selectCanUseMeetingCoach = selectHasOpenaiKey;
export const selectCanUseConversation = selectHasOpenaiKey;

// Reactivity Config selectors
export const selectReactivity = createSelector(
  selectSettings,
  (settings) => settings.reactivity,
);

export const selectVadThreshold = createSelector(
  selectReactivity,
  (reactivity) => reactivity.vadThreshold,
);

export const selectVadSilenceDuration = createSelector(
  selectReactivity,
  (reactivity) => reactivity.vadSilenceDurationMs,
);

export const selectSuggestionInterval = createSelector(
  selectReactivity,
  (reactivity) => reactivity.suggestionIntervalMs,
);

export const selectMaxActiveSuggestions = createSelector(
  selectReactivity,
  (reactivity) => reactivity.maxActiveSuggestions,
);

export const selectSuggestionModel = createSelector(
  selectReactivity,
  (reactivity) => reactivity.suggestionModel,
);

export const selectRealtimeModel = createSelector(
  selectReactivity,
  (reactivity) => reactivity.realtimeModel,
);

export const selectTranscriptionModel = createSelector(
  selectReactivity,
  (reactivity) => reactivity.transcriptionModel,
);

// Coaching Prompt Config selectors
export const selectCoachingPromptConfig = createSelector(
  selectSettings,
  (settings) => settings.coachingPromptConfig,
);
