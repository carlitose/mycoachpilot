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

export const selectHasDeepgramKey = createSelector(
  selectConfig,
  (config) => config.deepgramApiKey !== null && config.deepgramApiKey.length > 0,
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

export const selectCanUseMeetingCoach = createSelector(
  selectHasDeepgramKey,
  (hasKey) => hasKey,
);

export const selectCanUseConversation = createSelector(
  selectHasOpenaiKey,
  (hasKey) => hasKey,
);
