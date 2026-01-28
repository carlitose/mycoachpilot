import { useCallback, useEffect, useState } from 'react';

import type { SessionModeType } from '@domain/session';
import type { CoachingStyleType } from '@domain/settings';

import { useContainer } from '@infrastructure/di';
import {
  selectConfig,
  selectTemplates,
  selectIsLoading,
  selectIsSaving,
  selectSettingsError,
  selectHasOpenaiKey,
  selectHasDeepgramKey,
  selectDefaultMode,
  selectDefaultTemplateId,
  selectCoachingStyle,
  selectTheme,
  selectCanUseMeetingCoach,
  selectCanUseConversation,
  setConfig,
  setOpenaiApiKey,
  setDeepgramApiKey,
  setDefaultMode,
  setDefaultTemplate,
  setCoachingStyle,
  setTheme,
  setTemplates,
  setSettingsLoading,
  setSettingsError,
} from '@infrastructure/state';

import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useSettings() {
  const dispatch = useAppDispatch();
  const { configRepository } = useContainer();
  const [initialized, setInitialized] = useState(false);

  const config = useAppSelector(selectConfig);
  const templates = useAppSelector(selectTemplates);
  const isLoading = useAppSelector(selectIsLoading);
  const isSaving = useAppSelector(selectIsSaving);
  const error = useAppSelector(selectSettingsError);
  const hasOpenaiKey = useAppSelector(selectHasOpenaiKey);
  const hasDeepgramKey = useAppSelector(selectHasDeepgramKey);
  const defaultMode = useAppSelector(selectDefaultMode);
  const defaultTemplate = useAppSelector(selectDefaultTemplateId);
  const coachingStyle = useAppSelector(selectCoachingStyle);
  const theme = useAppSelector(selectTheme);
  const canUseMeetingCoach = useAppSelector(selectCanUseMeetingCoach);
  const canUseConversation = useAppSelector(selectCanUseConversation);

  // Load settings on mount
  useEffect(() => {
    if (!initialized) {
      void loadSettings();
      setInitialized(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const loadSettings = useCallback(async () => {
    dispatch(setSettingsLoading(true));

    const configResult = await configRepository.getConfig();
    if (configResult.isOk()) {
      const loadedConfig = configResult.unwrap();
      if (loadedConfig !== null) {
        dispatch(setConfig(loadedConfig));
      }
    }

    const templatesResult = await configRepository.getTemplates();
    if (templatesResult.isOk()) {
      dispatch(setTemplates(templatesResult.unwrap()));
    }

    dispatch(setSettingsLoading(false));
  }, [dispatch, configRepository]);

  const saveOpenaiKey = useCallback(async (key: string | null) => {
    dispatch(setOpenaiApiKey(key));
    await configRepository.saveConfig({ ...config, openaiApiKey: key });
  }, [dispatch, config, configRepository]);

  const saveDeepgramKey = useCallback(async (key: string | null) => {
    dispatch(setDeepgramApiKey(key));
    await configRepository.saveConfig({ ...config, deepgramApiKey: key });
  }, [dispatch, config, configRepository]);

  const saveDefaultMode = useCallback(async (mode: SessionModeType) => {
    dispatch(setDefaultMode(mode));
    await configRepository.saveConfig({ ...config, defaultMode: mode });
  }, [dispatch, config, configRepository]);

  const saveDefaultTemplate = useCallback(async (templateId: string) => {
    dispatch(setDefaultTemplate(templateId));
    await configRepository.saveConfig({ ...config, defaultTemplateId: templateId });
  }, [dispatch, config, configRepository]);

  const saveCoachingStyle = useCallback(async (style: CoachingStyleType) => {
    dispatch(setCoachingStyle(style));
    await configRepository.saveConfig({ ...config, coachingStyle: style });
  }, [dispatch, config, configRepository]);

  const saveTheme = useCallback(async (newTheme: 'light' | 'dark' | 'system') => {
    dispatch(setTheme(newTheme));
    await configRepository.saveConfig({ ...config, theme: newTheme });
  }, [dispatch, config, configRepository]);

  const clearError = useCallback(() => {
    dispatch(setSettingsError(null));
  }, [dispatch]);

  return {
    // State
    config,
    templates,
    isLoading,
    isSaving,
    error,
    hasOpenaiKey,
    hasDeepgramKey,
    defaultMode,
    defaultTemplate,
    coachingStyle,
    theme,
    canUseMeetingCoach,
    canUseConversation,

    // Actions
    loadSettings,
    saveOpenaiKey,
    saveDeepgramKey,
    saveDefaultMode,
    saveDefaultTemplate,
    saveCoachingStyle,
    saveTheme,
    clearError,
  };
}
