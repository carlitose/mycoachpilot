import { useCallback, useEffect, useState } from 'react';

import type { CoachingStyleType, ReactivityConfigProps } from '@domain/settings';
import type { SessionModeType } from '@domain/shared';

import { useContainer } from '../context';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useSettings() {
  const { configRepository, useSettingsState } = useContainer();
  const [initialized, setInitialized] = useState(false);

  // Get reactive state from port
  const settingsState = useSettingsState();

  // Load settings on mount
  useEffect(() => {
    if (!initialized) {
      void loadSettings();
      setInitialized(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const loadSettings = useCallback(async () => {
    settingsState.setLoading(true);

    const configResult = await configRepository.getConfig();
    if (configResult.isOk()) {
      const loadedConfig = configResult.unwrap();
      if (loadedConfig !== null) {
        settingsState.setConfig(loadedConfig);
      }
    }

    const templatesResult = await configRepository.getTemplates();
    if (templatesResult.isOk()) {
      settingsState.setTemplates(templatesResult.unwrap());
    }

    // Load reactivity config
    const reactivityResult = await configRepository.getReactivityConfig();
    if (reactivityResult.isOk()) {
      const loadedReactivity = reactivityResult.unwrap();
      if (loadedReactivity !== null) {
        settingsState.setReactivity(loadedReactivity);
      }
    }

    settingsState.setLoading(false);
  }, [configRepository, settingsState]);

  const saveOpenaiKey = useCallback(async (key: string | null) => {
    settingsState.setOpenaiApiKey(key);
    await configRepository.saveConfig({ ...settingsState.config, openaiApiKey: key });
  }, [settingsState, configRepository]);

  const saveDefaultMode = useCallback(async (mode: SessionModeType) => {
    settingsState.setDefaultMode(mode);
    await configRepository.saveConfig({ ...settingsState.config, defaultMode: mode });
  }, [settingsState, configRepository]);

  const saveDefaultTemplate = useCallback(async (templateId: string) => {
    settingsState.setDefaultTemplate(templateId);
    await configRepository.saveConfig({ ...settingsState.config, defaultTemplateId: templateId });
  }, [settingsState, configRepository]);

  const saveCoachingStyle = useCallback(async (style: CoachingStyleType) => {
    settingsState.setCoachingStyle(style);
    await configRepository.saveConfig({ ...settingsState.config, coachingStyle: style });
  }, [settingsState, configRepository]);

  const saveTheme = useCallback(async (newTheme: 'light' | 'dark' | 'system') => {
    settingsState.setTheme(newTheme);
    await configRepository.saveConfig({ ...settingsState.config, theme: newTheme });
  }, [settingsState, configRepository]);

  const clearError = useCallback(() => {
    settingsState.setError(null);
  }, [settingsState]);

  // Reactivity config save functions
  const saveVadThreshold = useCallback(async (value: number) => {
    settingsState.setVadThreshold(value);
    await configRepository.saveReactivityConfig({ ...settingsState.reactivity, vadThreshold: value });
  }, [settingsState, configRepository]);

  const saveVadSilenceDuration = useCallback(async (value: number) => {
    settingsState.setVadSilenceDuration(value);
    await configRepository.saveReactivityConfig({ ...settingsState.reactivity, vadSilenceDurationMs: value });
  }, [settingsState, configRepository]);

  const saveSuggestionInterval = useCallback(async (value: number) => {
    settingsState.setSuggestionInterval(value);
    await configRepository.saveReactivityConfig({ ...settingsState.reactivity, suggestionIntervalMs: value });
  }, [settingsState, configRepository]);

  const saveMaxActiveSuggestions = useCallback(async (value: number) => {
    settingsState.setMaxActiveSuggestions(value);
    await configRepository.saveReactivityConfig({ ...settingsState.reactivity, maxActiveSuggestions: value });
  }, [settingsState, configRepository]);

  const saveSuggestionModel = useCallback(async (value: string) => {
    settingsState.setSuggestionModel(value);
    await configRepository.saveReactivityConfig({ ...settingsState.reactivity, suggestionModel: value });
  }, [settingsState, configRepository]);

  const saveTranscriptionModel = useCallback(async (value: string) => {
    settingsState.setTranscriptionModel(value);
    await configRepository.saveReactivityConfig({ ...settingsState.reactivity, transcriptionModel: value });
  }, [settingsState, configRepository]);

  const resetReactivityToDefaults = useCallback(async () => {
    settingsState.resetReactivity();
    // After reset, reactivity will have defaults - we need to save them
    const { REACTIVITY_DEFAULTS } = await import('@domain/settings');
    await configRepository.saveReactivityConfig({ ...REACTIVITY_DEFAULTS });
  }, [settingsState, configRepository]);

  const saveReactivityConfig = useCallback(async (config: ReactivityConfigProps) => {
    settingsState.setReactivity(config);
    await configRepository.saveReactivityConfig(config);
  }, [settingsState, configRepository]);

  return {
    // State (reactive values from port)
    config: settingsState.config,
    templates: settingsState.templates,
    isLoading: settingsState.isLoading,
    isSaving: settingsState.isSaving,
    error: settingsState.error,
    hasOpenaiKey: settingsState.hasOpenaiKey,
    defaultMode: settingsState.defaultMode,
    defaultTemplate: settingsState.defaultTemplateId,
    coachingStyle: settingsState.coachingStyle,
    theme: settingsState.theme,
    canUseMeetingCoach: settingsState.canUseMeetingCoach,
    canUseConversation: settingsState.canUseConversation,

    // Reactivity state
    reactivity: settingsState.reactivity,
    vadThreshold: settingsState.vadThreshold,
    vadSilenceDuration: settingsState.vadSilenceDuration,
    suggestionInterval: settingsState.suggestionInterval,
    maxActiveSuggestions: settingsState.maxActiveSuggestions,
    suggestionModel: settingsState.suggestionModel,
    transcriptionModel: settingsState.transcriptionModel,

    // Actions
    loadSettings,
    saveOpenaiKey,
    saveDefaultMode,
    saveDefaultTemplate,
    saveCoachingStyle,
    saveTheme,
    clearError,

    // Reactivity actions
    saveVadThreshold,
    saveVadSilenceDuration,
    saveSuggestionInterval,
    saveMaxActiveSuggestions,
    saveSuggestionModel,
    saveTranscriptionModel,
    resetReactivityToDefaults,
    saveReactivityConfig,
  };
}
