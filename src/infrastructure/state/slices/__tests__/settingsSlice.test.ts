import { describe, it, expect } from 'vitest';

import { PREDEFINED_TEMPLATES, REACTIVITY_DEFAULTS, COACHING_PROMPT_DEFAULTS, TTS_DEFAULTS } from '@domain/settings';

import reducer, {
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
  SettingsSliceState,
} from '../settingsSlice';

describe('settingsSlice', () => {
  const defaultConfig = {
    id: 'default',
    openaiApiKey: null,
    defaultMode: 'conversation' as const,
    defaultTemplateId: 'general',
    coachingStyle: 'diplomatic' as const,
    theme: 'system' as const,
    language: 'en',
  };

  const initialState: SettingsSliceState = {
    config: defaultConfig,
    reactivity: { ...REACTIVITY_DEFAULTS },
    coachingPromptConfig: { ...COACHING_PROMPT_DEFAULTS },
    ttsConfig: { ...TTS_DEFAULTS },
    templates: PREDEFINED_TEMPLATES,
    isLoading: false,
    isSaving: false,
    error: null,
  };

  const mockTemplate = {
    id: 'custom-1',
    name: 'Custom Template',
    icon: '🎯',
    description: 'A custom template',
    systemPrompt: 'You are a helpful assistant',
    isPredefined: false,
  };

  describe('initial state', () => {
    it('should return initial state', () => {
      const state = reducer(undefined, { type: 'unknown' });

      expect(state.config).toEqual(defaultConfig);
      expect(state.templates).toEqual(PREDEFINED_TEMPLATES);
      expect(state.isLoading).toBe(false);
      expect(state.isSaving).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setConfig', () => {
    it('should set config', () => {
      const newConfig = {
        ...defaultConfig,
        openaiApiKey: 'sk-test',
        defaultMode: 'meeting_coach' as const,
      };

      const state = reducer(initialState, setConfig(newConfig));

      expect(state.config).toEqual(newConfig);
    });

    it('should clear error when setting config', () => {
      const stateWithError: SettingsSliceState = {
        ...initialState,
        error: 'Previous error',
      };

      const state = reducer(stateWithError, setConfig(defaultConfig));

      expect(state.error).toBeNull();
    });
  });

  describe('setOpenaiApiKey', () => {
    it('should set OpenAI API key', () => {
      const state = reducer(initialState, setOpenaiApiKey('sk-test-key'));

      expect(state.config.openaiApiKey).toBe('sk-test-key');
    });

    it('should clear OpenAI API key with null', () => {
      const stateWithKey: SettingsSliceState = {
        ...initialState,
        config: { ...defaultConfig, openaiApiKey: 'sk-test' },
      };

      const state = reducer(stateWithKey, setOpenaiApiKey(null));

      expect(state.config.openaiApiKey).toBeNull();
    });
  });

  describe('setDefaultMode', () => {
    it('should set default mode', () => {
      const state = reducer(initialState, setDefaultMode('meeting_coach'));

      expect(state.config.defaultMode).toBe('meeting_coach');
    });

    it('should set to transcript_only', () => {
      const state = reducer(initialState, setDefaultMode('transcript_only'));

      expect(state.config.defaultMode).toBe('transcript_only');
    });
  });

  describe('setDefaultTemplate', () => {
    it('should set default template', () => {
      const state = reducer(initialState, setDefaultTemplate('interview'));

      expect(state.config.defaultTemplateId).toBe('interview');
    });
  });

  describe('setCoachingStyle', () => {
    it('should set coaching style to assertive', () => {
      const state = reducer(initialState, setCoachingStyle('assertive'));

      expect(state.config.coachingStyle).toBe('assertive');
    });

    it('should set coaching style to analytical', () => {
      const state = reducer(initialState, setCoachingStyle('analytical'));

      expect(state.config.coachingStyle).toBe('analytical');
    });

    it('should set coaching style to supportive', () => {
      const state = reducer(initialState, setCoachingStyle('supportive'));

      expect(state.config.coachingStyle).toBe('supportive');
    });
  });

  describe('setTheme', () => {
    it('should set theme to light', () => {
      const state = reducer(initialState, setTheme('light'));

      expect(state.config.theme).toBe('light');
    });

    it('should set theme to dark', () => {
      const state = reducer(initialState, setTheme('dark'));

      expect(state.config.theme).toBe('dark');
    });

    it('should set theme to system', () => {
      const stateWithLight: SettingsSliceState = {
        ...initialState,
        config: { ...defaultConfig, theme: 'light' },
      };

      const state = reducer(stateWithLight, setTheme('system'));

      expect(state.config.theme).toBe('system');
    });
  });

  describe('setLanguage', () => {
    it('should set language', () => {
      const state = reducer(initialState, setLanguage('it'));

      expect(state.config.language).toBe('it');
    });
  });

  describe('setTemplates', () => {
    it('should set templates', () => {
      const templates = [mockTemplate];
      const state = reducer(initialState, setTemplates(templates));

      expect(state.templates).toHaveLength(1);
      expect(state.templates[0]).toEqual(mockTemplate);
    });
  });

  describe('addTemplate', () => {
    it('should add template', () => {
      const state = reducer(initialState, addTemplate(mockTemplate));

      expect(state.templates).toHaveLength(PREDEFINED_TEMPLATES.length + 1);
      expect(state.templates[state.templates.length - 1]).toEqual(mockTemplate);
    });
  });

  describe('updateTemplate', () => {
    it('should update existing template', () => {
      const stateWithCustom: SettingsSliceState = {
        ...initialState,
        templates: [...PREDEFINED_TEMPLATES, mockTemplate],
      };

      const updatedTemplate = { ...mockTemplate, name: 'Updated Name' };
      const state = reducer(stateWithCustom, updateTemplate(updatedTemplate));

      const updated = state.templates.find((t) => t.id === 'custom-1');
      expect(updated?.name).toBe('Updated Name');
    });

    it('should not throw when template not found', () => {
      const state = reducer(initialState, updateTemplate({ ...mockTemplate, id: 'non-existent' }));

      expect(state.templates).toHaveLength(PREDEFINED_TEMPLATES.length);
    });
  });

  describe('removeTemplate', () => {
    it('should remove template', () => {
      const stateWithCustom: SettingsSliceState = {
        ...initialState,
        templates: [...PREDEFINED_TEMPLATES, mockTemplate],
      };

      const state = reducer(stateWithCustom, removeTemplate('custom-1'));

      expect(state.templates).toHaveLength(PREDEFINED_TEMPLATES.length);
      expect(state.templates.find((t) => t.id === 'custom-1')).toBeUndefined();
    });

    it('should not throw when template not found', () => {
      const state = reducer(initialState, removeTemplate('non-existent'));

      expect(state.templates).toHaveLength(PREDEFINED_TEMPLATES.length);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const state = reducer(initialState, setLoading(true));

      expect(state.isLoading).toBe(true);
    });

    it('should set loading to false', () => {
      const loadingState: SettingsSliceState = { ...initialState, isLoading: true };
      const state = reducer(loadingState, setLoading(false));

      expect(state.isLoading).toBe(false);
    });
  });

  describe('setSaving', () => {
    it('should set saving to true', () => {
      const state = reducer(initialState, setSaving(true));

      expect(state.isSaving).toBe(true);
    });

    it('should set saving to false', () => {
      const savingState: SettingsSliceState = { ...initialState, isSaving: true };
      const state = reducer(savingState, setSaving(false));

      expect(state.isSaving).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error', () => {
      const state = reducer(initialState, setError('Failed to save'));

      expect(state.error).toBe('Failed to save');
    });

    it('should clear error with null', () => {
      const stateWithError: SettingsSliceState = { ...initialState, error: 'Previous error' };
      const state = reducer(stateWithError, setError(null));

      expect(state.error).toBeNull();
    });
  });

  describe('resetSettings', () => {
    it('should reset to initial state', () => {
      const stateWithData: SettingsSliceState = {
        config: {
          ...defaultConfig,
          openaiApiKey: 'sk-test',
          defaultMode: 'meeting_coach',
        },
        reactivity: { ...REACTIVITY_DEFAULTS },
        coachingPromptConfig: { ...COACHING_PROMPT_DEFAULTS },
        ttsConfig: { ...TTS_DEFAULTS },
        templates: [mockTemplate],
        isLoading: true,
        isSaving: true,
        error: 'Error',
      };

      const state = reducer(stateWithData, resetSettings());

      expect(state).toEqual(initialState);
    });
  });
});
