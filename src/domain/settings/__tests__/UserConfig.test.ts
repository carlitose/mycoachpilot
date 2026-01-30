import { describe, it, expect } from 'vitest';

import { UserConfig } from '../entities/UserConfig';

describe('UserConfig', () => {
  describe('create', () => {
    it('should create with default values', () => {
      const config = UserConfig.create();

      expect(config.openaiApiKey).toBeNull();
      expect(config.defaultMode).toBe('conversation');
      expect(config.defaultTemplateId).toBe('general');
      expect(config.coachingStyle.toString()).toBe('diplomatic');
      expect(config.theme).toBe('system');
      expect(config.language).toBe('en');
    });

    it('should create with custom id', () => {
      const config = UserConfig.create('custom-id');
      const props = config.toProps();

      expect(props.id).toBe('custom-id');
    });
  });

  describe('API keys', () => {
    it('should set OpenAI API key', () => {
      const config = UserConfig.create();

      config.setOpenaiApiKey('sk-test-key-12345');

      expect(config.openaiApiKey).toBe('sk-test-key-12345');
      expect(config.hasOpenaiKey).toBe(true);
    });

    it('should clear OpenAI API key when set to null', () => {
      const config = UserConfig.create();
      config.setOpenaiApiKey('sk-test-key');
      config.setOpenaiApiKey(null);

      expect(config.openaiApiKey).toBeNull();
      expect(config.hasOpenaiKey).toBe(false);
    });

    it('should return masked OpenAI key', () => {
      const config = UserConfig.create();
      config.setOpenaiApiKey('sk-1234567890abcdef');

      expect(config.maskedOpenaiKey).toBe('sk-1••••••••cdef');
    });

    it('should return null for masked key when not set', () => {
      const config = UserConfig.create();

      expect(config.maskedOpenaiKey).toBeNull();
    });
  });

  describe('canUseMeetingCoach', () => {
    it('should return true when OpenAI key is valid', () => {
      const config = UserConfig.create();
      config.setOpenaiApiKey('sk-test-key-12345');

      expect(config.canUseMeetingCoach()).toBe(true);
    });

    it('should return false when OpenAI key is not set', () => {
      const config = UserConfig.create();

      expect(config.canUseMeetingCoach()).toBe(false);
    });
  });

  describe('canUseConversation', () => {
    it('should return true when OpenAI key is valid', () => {
      const config = UserConfig.create();
      config.setOpenaiApiKey('sk-valid-key-12345');

      expect(config.canUseConversation()).toBe(true);
    });

    it('should return false when OpenAI key is not set', () => {
      const config = UserConfig.create();

      expect(config.canUseConversation()).toBe(false);
    });
  });

  describe('setDefaultMode', () => {
    it('should update default mode', () => {
      const config = UserConfig.create();

      config.setDefaultMode('meeting_coach');

      expect(config.defaultMode).toBe('meeting_coach');
    });
  });

  describe('setDefaultTemplate', () => {
    it('should update default template', () => {
      const config = UserConfig.create();

      config.setDefaultTemplate('interview');

      expect(config.defaultTemplateId).toBe('interview');
    });
  });

  describe('setCoachingStyle', () => {
    it('should update coaching style', () => {
      const config = UserConfig.create();

      config.setCoachingStyle('assertive');

      expect(config.coachingStyle.toString()).toBe('assertive');
    });
  });

  describe('setTheme', () => {
    it('should update theme to light', () => {
      const config = UserConfig.create();

      config.setTheme('light');

      expect(config.theme).toBe('light');
    });

    it('should update theme to dark', () => {
      const config = UserConfig.create();

      config.setTheme('dark');

      expect(config.theme).toBe('dark');
    });
  });

  describe('setLanguage', () => {
    it('should update language', () => {
      const config = UserConfig.create();

      config.setLanguage('it');

      expect(config.language).toBe('it');
    });
  });

  describe('getApiKey', () => {
    it('should return OpenAI API key props', () => {
      const config = UserConfig.create();
      config.setOpenaiApiKey('sk-test-key');

      const apiKeyProps = config.getApiKey('openai');

      expect(apiKeyProps).toEqual({
        key: 'sk-test-key',
        service: 'openai',
      });
    });

    it('should return null when key not set', () => {
      const config = UserConfig.create();

      expect(config.getApiKey('openai')).toBeNull();
    });
  });

  describe('toProps', () => {
    it('should serialize to props object', () => {
      const config = UserConfig.create('test-id');
      config.setOpenaiApiKey('sk-test');
      config.setDefaultMode('meeting_coach');
      config.setDefaultTemplate('sales');
      config.setCoachingStyle('analytical');
      config.setTheme('dark');
      config.setLanguage('it');

      const props = config.toProps();

      expect(props.id).toBe('test-id');
      expect(props.openaiApiKey).toBe('sk-test');
      expect(props.defaultMode).toBe('meeting_coach');
      expect(props.defaultTemplateId).toBe('sales');
      expect(props.coachingStyle).toBe('analytical');
      expect(props.theme).toBe('dark');
      expect(props.language).toBe('it');
    });
  });

  describe('fromProps', () => {
    it('should restore config from props', () => {
      const original = UserConfig.create('user-1');
      original.setOpenaiApiKey('sk-original');
      original.setDefaultMode('transcript_only');
      original.setCoachingStyle('supportive');
      original.setTheme('light');
      const props = original.toProps();

      const restored = UserConfig.fromProps(props);

      expect(restored.openaiApiKey).toBe(original.openaiApiKey);
      expect(restored.defaultMode).toBe(original.defaultMode);
      expect(restored.coachingStyle.toString()).toBe(original.coachingStyle.toString());
      expect(restored.theme).toBe(original.theme);
    });

    it('should handle null API key', () => {
      const props = {
        id: 'test',
        openaiApiKey: null,
        defaultMode: 'conversation' as const,
        defaultTemplateId: 'general',
        coachingStyle: 'diplomatic' as const,
        theme: 'system' as const,
        language: 'en',
      };

      const restored = UserConfig.fromProps(props);

      expect(restored.openaiApiKey).toBeNull();
    });
  });
});
