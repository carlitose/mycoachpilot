import { describe, it, expect } from 'vitest';

import { AudioConfig } from '../valueObjects/AudioConfig';

describe('AudioConfig', () => {
  describe('create', () => {
    it('should create with default values', () => {
      const config = AudioConfig.create();

      expect(config.micEnabled).toBe(true);
      expect(config.tabAudioEnabled).toBe(false);
      expect(config.sampleRate).toBe(24000);
      expect(config.channelCount).toBe(1);
    });

    it('should create with partial overrides', () => {
      const config = AudioConfig.create({ tabAudioEnabled: true });

      expect(config.micEnabled).toBe(true);
      expect(config.tabAudioEnabled).toBe(true);
      expect(config.sampleRate).toBe(24000);
    });

    it('should create with full overrides', () => {
      const config = AudioConfig.create({
        micEnabled: false,
        tabAudioEnabled: true,
        sampleRate: 16000,
        channelCount: 2,
      });

      expect(config.micEnabled).toBe(false);
      expect(config.tabAudioEnabled).toBe(true);
      expect(config.sampleRate).toBe(16000);
      expect(config.channelCount).toBe(2);
    });
  });

  describe('factory methods', () => {
    it('should create default config', () => {
      const config = AudioConfig.default();

      expect(config.sampleRate).toBe(24000);
    });

    it('should create Deepgram config with 16kHz', () => {
      const config = AudioConfig.forDeepgram();

      expect(config.sampleRate).toBe(16000);
      expect(config.micEnabled).toBe(true);
    });

    it('should create OpenAI config with 24kHz', () => {
      const config = AudioConfig.forOpenAI();

      expect(config.sampleRate).toBe(24000);
      expect(config.micEnabled).toBe(true);
    });
  });

  describe('immutable updates', () => {
    it('should create new instance with mic enabled changed', () => {
      const original = AudioConfig.create({ micEnabled: true });
      const updated = original.withMicEnabled(false);

      expect(original.micEnabled).toBe(true);
      expect(updated.micEnabled).toBe(false);
    });

    it('should create new instance with tab audio enabled changed', () => {
      const original = AudioConfig.create({ tabAudioEnabled: false });
      const updated = original.withTabAudioEnabled(true);

      expect(original.tabAudioEnabled).toBe(false);
      expect(updated.tabAudioEnabled).toBe(true);
    });

    it('should create new instance with sample rate changed', () => {
      const original = AudioConfig.create({ sampleRate: 24000 });
      const updated = original.withSampleRate(16000);

      expect(original.sampleRate).toBe(24000);
      expect(updated.sampleRate).toBe(16000);
    });

    it('should throw on invalid sample rate (too low)', () => {
      const config = AudioConfig.create();

      expect(() => config.withSampleRate(4000)).toThrow('Sample rate must be between 8000 and 48000 Hz');
    });

    it('should throw on invalid sample rate (too high)', () => {
      const config = AudioConfig.create();

      expect(() => config.withSampleRate(96000)).toThrow('Sample rate must be between 8000 and 48000 Hz');
    });
  });

  describe('toJSON', () => {
    it('should serialize to props object', () => {
      const config = AudioConfig.create({
        micEnabled: true,
        tabAudioEnabled: true,
        sampleRate: 16000,
        channelCount: 1,
      });
      const json = config.toJSON();

      expect(json).toEqual({
        micEnabled: true,
        tabAudioEnabled: true,
        sampleRate: 16000,
        channelCount: 1,
      });
    });

    it('should return a new object (not reference)', () => {
      const config = AudioConfig.create();
      const json1 = config.toJSON();
      const json2 = config.toJSON();

      expect(json1).not.toBe(json2);
      expect(json1).toEqual(json2);
    });
  });

  describe('equals', () => {
    it('should return true for same config', () => {
      const config1 = AudioConfig.forOpenAI();
      const config2 = AudioConfig.forOpenAI();

      expect(config1.equals(config2)).toBe(true);
    });

    it('should return false for different configs', () => {
      const config1 = AudioConfig.forOpenAI();
      const config2 = AudioConfig.forDeepgram();

      expect(config1.equals(config2)).toBe(false);
    });
  });
});
