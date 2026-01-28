import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createCLIContainer } from '../../container';
import type { CLIContainer } from '../../container';

describe('Meeting Coach Integration', () => {
  let container: CLIContainer;

  beforeEach(() => {
    container = createCLIContainer();
  });

  describe('Container creation', () => {
    it('should create all adapters', () => {
      expect(container.eventBus).toBeDefined();
      expect(container.audioCapture).toBeDefined();
      expect(container.transcription).toBeDefined();
      expect(container.realtimeConnection).toBeDefined();
      expect(container.sessionRepository).toBeDefined();
      expect(container.configRepository).toBeDefined();
      expect(container.coachingEngine).toBeDefined();
      expect(container.sessionManager).toBeDefined();
    });
  });

  describe('EventBus', () => {
    it('should publish and subscribe to events', () => {
      const handler = vi.fn();
      container.eventBus.subscribe('TestEvent', handler);

      container.eventBus.publish({
        eventType: 'TestEvent',
        occurredAt: new Date(),
        aggregateId: 'test-1',
      });

      expect(handler).toHaveBeenCalledOnce();
    });

    it('should unsubscribe correctly', () => {
      const handler = vi.fn();
      const unsub = container.eventBus.subscribe('TestEvent', handler);
      unsub();

      container.eventBus.publish({
        eventType: 'TestEvent',
        occurredAt: new Date(),
        aggregateId: 'test-1',
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support subscribeMany', () => {
      const handler = vi.fn();
      container.eventBus.subscribeMany(['EventA', 'EventB'], handler);

      container.eventBus.publish({
        eventType: 'EventA',
        occurredAt: new Date(),
        aggregateId: 'a',
      });
      container.eventBus.publish({
        eventType: 'EventB',
        occurredAt: new Date(),
        aggregateId: 'b',
      });

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('SessionRepository', () => {
    it('should save and retrieve sessions', async () => {
      const entry = {
        session: {
          id: 'sess-1',
          mode: 'meeting_coach' as const,
          status: 'stopped' as const,
          startedAt: new Date(),
          endedAt: new Date(),
          createdAt: new Date(),
          templateId: 'general',
          audioConfig: {
            micEnabled: true,
            tabAudioEnabled: false,
            sampleRate: 16000,
            channelCount: 1,
          },
        },
        messages: [],
        segments: [],
        speakers: [],
        suggestions: [],
        savedAt: new Date().toISOString(),
      };

      await container.sessionRepository.save(entry);
      const result = await container.sessionRepository.getById('sess-1');
      expect(result.isOk()).toBe(true);
      expect(result.unwrap()?.session.id).toBe('sess-1');
    });

    it('should count sessions', async () => {
      const countResult = await container.sessionRepository.count();
      expect(countResult.unwrap()).toBe(0);
    });
  });

  describe('ConfigRepository', () => {
    it('should return predefined templates', async () => {
      const result = await container.configRepository.getTemplates();
      expect(result.isOk()).toBe(true);
      const templates = result.unwrap();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some((t) => t.id === 'general')).toBe(true);
    });

    it('should save and retrieve config', async () => {
      const config = {
        id: 'default',
        openaiApiKey: 'sk-test',
        deepgramApiKey: 'dg-test',
        defaultMode: 'meeting_coach' as const,
        defaultTemplateId: 'general',
        coachingStyle: 'diplomatic' as const,
        theme: 'dark' as const,
        language: 'en',
      };

      await container.configRepository.saveConfig(config);
      const result = await container.configRepository.getConfig();
      expect(result.unwrap()?.openaiApiKey).toBe('sk-test');
    });
  });

  describe('FileAudioCapture', () => {
    it('should start and stop without a file (silence mode)', async () => {
      const result = await container.audioCapture.startMicrophone();
      expect(result.isOk()).toBe(true);
      expect(container.audioCapture.getState().isCapturing).toBe(true);

      container.audioCapture.stop();
      expect(container.audioCapture.getState().isCapturing).toBe(false);
    });

    it('should emit injected audio chunks', async () => {
      const handler = vi.fn();
      container.audioCapture.onAudioEvent(handler);

      // Inject test audio
      const testAudio = new Float32Array(9600); // 600ms at 16kHz
      for (let i = 0; i < testAudio.length; i++) {
        testAudio[i] = Math.sin(i * 0.1) * 0.5;
      }
      container.audioCapture.injectAudio(testAudio);
      await container.audioCapture.startMicrophone();

      // Wait for chunks to be emitted
      await new Promise((r) => { setTimeout(r, 1000); });
      container.audioCapture.stop();

      expect(handler).toHaveBeenCalled();
      const audioEvents = handler.mock.calls.filter(
        (call: unknown[]) => (call[0] as { type: string }).type === 'audio',
      );
      expect(audioEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Session lifecycle (mock)', () => {
    it('should fail to start meeting_coach without deepgram key', async () => {
      const result = await container.sessionManager.startSession('meeting_coach', {});
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('Deepgram API key');
    });

    it('should fail to start conversation without openai key', async () => {
      const result = await container.sessionManager.startSession('conversation', {});
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('OpenAI API key');
    });
  });
});
