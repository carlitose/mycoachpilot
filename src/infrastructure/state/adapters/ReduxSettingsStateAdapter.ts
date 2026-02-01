/**
 * Redux Settings State Adapter
 * Implements SettingsStatePort using Redux
 */
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { SettingsStatePort } from '@application/ports';

import {
  selectCanUseConversation,
  selectCanUseMeetingCoach,
  selectCoachingPromptConfig,
  selectCoachingStyle,
  selectConfig,
  selectCustomTemplates,
  selectDefaultMode,
  selectDefaultTemplate,
  selectDefaultTemplateId,
  selectHasOpenaiKey,
  selectIsLoading,
  selectIsSaving,
  selectMaxActiveSuggestions,
  selectPredefinedTemplates,
  selectReactivity,
  selectRealtimeModel,
  selectSettingsError,
  selectSuggestionInterval,
  selectSuggestionModel,
  selectTemplates,
  selectTheme,
  selectTranscriptionModel,
  selectTTSConfig,
  selectTTSEnabled,
  selectTTSVolume,
  selectVadSilenceDuration,
  selectVadThreshold,
} from '../selectors/settingsSelectors';
import {
  addTemplate,
  removeTemplate,
  resetCoachingPrompts,
  resetReactivity,
  resetSettings,
  resetTTSConfig,
  setCoachingPromptConfig,
  setCoachingStyle,
  setConfig,
  setDefaultMode,
  setDefaultTemplate,
  setError,
  setLanguage,
  setLoading,
  setMaxActiveSuggestions,
  setOpenaiApiKey,
  setReactivity,
  setRealtimeModel,
  setSaving,
  setSuggestionInterval,
  setSuggestionModel,
  setTemplates,
  setTheme,
  setTranscriptionModel,
  setTTSConfig,
  setTTSEnabled,
  setTTSVolume,
  setVadSilenceDuration,
  setVadThreshold,
  updateTemplate,
} from '../slices/settingsSlice';
import type { AppDispatch, RootState } from '../store';

/**
 * Hook that provides a SettingsStatePort implementation backed by Redux.
 * Must be called within a React component inside a Redux Provider.
 */
export function useReduxSettingsState(): SettingsStatePort {
  const dispatch = useDispatch<AppDispatch>();

  // Reactive values - call all selectors at top level (proper hooks usage)
  const config = useSelector((state: RootState) => selectConfig(state));
  const reactivity = useSelector((state: RootState) => selectReactivity(state));
  const coachingPromptConfig = useSelector((state: RootState) => selectCoachingPromptConfig(state));
  const templates = useSelector((state: RootState) => selectTemplates(state));
  const isLoading = useSelector((state: RootState) => selectIsLoading(state));
  const isSaving = useSelector((state: RootState) => selectIsSaving(state));
  const error = useSelector((state: RootState) => selectSettingsError(state));
  const hasOpenaiKey = useSelector((state: RootState) => selectHasOpenaiKey(state));
  const defaultMode = useSelector((state: RootState) => selectDefaultMode(state));
  const defaultTemplateId = useSelector((state: RootState) => selectDefaultTemplateId(state));
  const defaultTemplate = useSelector((state: RootState) => selectDefaultTemplate(state));
  const coachingStyle = useSelector((state: RootState) => selectCoachingStyle(state));
  const theme = useSelector((state: RootState) => selectTheme(state));
  const predefinedTemplates = useSelector((state: RootState) => selectPredefinedTemplates(state));
  const customTemplates = useSelector((state: RootState) => selectCustomTemplates(state));
  const canUseMeetingCoach = useSelector((state: RootState) => selectCanUseMeetingCoach(state));
  const canUseConversation = useSelector((state: RootState) => selectCanUseConversation(state));
  const vadThreshold = useSelector((state: RootState) => selectVadThreshold(state));
  const vadSilenceDuration = useSelector((state: RootState) => selectVadSilenceDuration(state));
  const suggestionInterval = useSelector((state: RootState) => selectSuggestionInterval(state));
  const maxActiveSuggestions = useSelector((state: RootState) => selectMaxActiveSuggestions(state));
  const suggestionModel = useSelector((state: RootState) => selectSuggestionModel(state));
  const realtimeModel = useSelector((state: RootState) => selectRealtimeModel(state));
  const transcriptionModel = useSelector((state: RootState) => selectTranscriptionModel(state));
  const ttsConfig = useSelector((state: RootState) => selectTTSConfig(state));
  const ttsEnabled = useSelector((state: RootState) => selectTTSEnabled(state));
  const ttsVolume = useSelector((state: RootState) => selectTTSVolume(state));

  // Memoize actions to maintain stable references
  const actions = useMemo(() => ({
    setConfig: (cfg: Parameters<SettingsStatePort['setConfig']>[0]) => dispatch(setConfig(cfg)),
    setReactivity: (r: Parameters<SettingsStatePort['setReactivity']>[0]) => dispatch(setReactivity(r)),
    setCoachingPromptConfig: (c: Parameters<SettingsStatePort['setCoachingPromptConfig']>[0]) => dispatch(setCoachingPromptConfig(c)),
    setOpenaiApiKey: (key: Parameters<SettingsStatePort['setOpenaiApiKey']>[0]) => dispatch(setOpenaiApiKey(key)),
    setDefaultMode: (mode: Parameters<SettingsStatePort['setDefaultMode']>[0]) => dispatch(setDefaultMode(mode)),
    setDefaultTemplate: (templateId: Parameters<SettingsStatePort['setDefaultTemplate']>[0]) => dispatch(setDefaultTemplate(templateId)),
    setCoachingStyle: (style: Parameters<SettingsStatePort['setCoachingStyle']>[0]) => dispatch(setCoachingStyle(style)),
    setTheme: (t: Parameters<SettingsStatePort['setTheme']>[0]) => dispatch(setTheme(t)),
    setLanguage: (lang: Parameters<SettingsStatePort['setLanguage']>[0]) => dispatch(setLanguage(lang)),
    setTemplates: (tmpls: Parameters<SettingsStatePort['setTemplates']>[0]) => dispatch(setTemplates(tmpls)),
    addTemplate: (tmpl: Parameters<SettingsStatePort['addTemplate']>[0]) => dispatch(addTemplate(tmpl)),
    updateTemplate: (tmpl: Parameters<SettingsStatePort['updateTemplate']>[0]) => dispatch(updateTemplate(tmpl)),
    removeTemplate: (templateId: Parameters<SettingsStatePort['removeTemplate']>[0]) => dispatch(removeTemplate(templateId)),
    setLoading: (loading: Parameters<SettingsStatePort['setLoading']>[0]) => dispatch(setLoading(loading)),
    setSaving: (saving: Parameters<SettingsStatePort['setSaving']>[0]) => dispatch(setSaving(saving)),
    setError: (err: Parameters<SettingsStatePort['setError']>[0]) => dispatch(setError(err)),
    setVadThreshold: (val: Parameters<SettingsStatePort['setVadThreshold']>[0]) => dispatch(setVadThreshold(val)),
    setVadSilenceDuration: (val: Parameters<SettingsStatePort['setVadSilenceDuration']>[0]) => dispatch(setVadSilenceDuration(val)),
    setSuggestionInterval: (val: Parameters<SettingsStatePort['setSuggestionInterval']>[0]) => dispatch(setSuggestionInterval(val)),
    setMaxActiveSuggestions: (val: Parameters<SettingsStatePort['setMaxActiveSuggestions']>[0]) => dispatch(setMaxActiveSuggestions(val)),
    setSuggestionModel: (val: Parameters<SettingsStatePort['setSuggestionModel']>[0]) => dispatch(setSuggestionModel(val)),
    setRealtimeModel: (val: Parameters<SettingsStatePort['setRealtimeModel']>[0]) => dispatch(setRealtimeModel(val)),
    setTranscriptionModel: (val: Parameters<SettingsStatePort['setTranscriptionModel']>[0]) => dispatch(setTranscriptionModel(val)),
    resetReactivity: () => dispatch(resetReactivity()),
    resetCoachingPrompts: () => dispatch(resetCoachingPrompts()),
    setTTSConfig: (cfg: Parameters<SettingsStatePort['setTTSConfig']>[0]) => dispatch(setTTSConfig(cfg)),
    setTTSEnabled: (enabled: Parameters<SettingsStatePort['setTTSEnabled']>[0]) => dispatch(setTTSEnabled(enabled)),
    setTTSVolume: (vol: Parameters<SettingsStatePort['setTTSVolume']>[0]) => dispatch(setTTSVolume(vol)),
    resetTTSConfig: () => dispatch(resetTTSConfig()),
    resetSettings: () => dispatch(resetSettings()),
  }), [dispatch]);

  return {
    // Reactive values
    config,
    reactivity,
    coachingPromptConfig,
    ttsConfig,
    templates,
    isLoading,
    isSaving,
    error,
    hasOpenaiKey,
    defaultMode,
    defaultTemplateId,
    defaultTemplate,
    coachingStyle,
    theme,
    predefinedTemplates,
    customTemplates,
    canUseMeetingCoach,
    canUseConversation,
    vadThreshold,
    vadSilenceDuration,
    suggestionInterval,
    maxActiveSuggestions,
    suggestionModel,
    realtimeModel,
    transcriptionModel,
    ttsEnabled,
    ttsVolume,
    // Actions
    ...actions,
  };
}
