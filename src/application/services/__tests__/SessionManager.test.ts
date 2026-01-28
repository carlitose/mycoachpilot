/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-confusing-void-expression */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ok, err } from '@domain/shared';

import type { EventBusPort, AudioCapturePort, RealtimeConnectionPort, TranscriptionPort } from '../../ports';
import { SessionManager, SessionManagerDependencies } from '../SessionManager';

describe('SessionManager', () => {
  let mockEventBus: EventBusPort;
  let mockAudioCapture: AudioCapturePort;
  let mockRealtimeConnection: RealtimeConnectionPort;
  let mockTranscription: TranscriptionPort;
  let deps: SessionManagerDependencies;
  let manager: SessionManager;

  beforeEach(() => {
    mockEventBus = {
      publish: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
      subscribeMany: vi.fn().mockReturnValue(() => {}),
    };

    mockAudioCapture = {
      getState: vi.fn().mockReturnValue({ isCapturing: false, source: null, sampleRate: 24000, channelCount: 1, error: null }),
      startMicrophone: vi.fn().mockResolvedValue(ok(undefined)),
      startTabAudio: vi.fn().mockResolvedValue(ok(undefined)),
      startMixed: vi.fn().mockResolvedValue(ok(undefined)),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      onAudioEvent: vi.fn().mockReturnValue(() => {}),
      getPCM16Data: vi.fn().mockReturnValue(null),
    };

    mockRealtimeConnection = {
      getState: vi.fn().mockReturnValue('disconnected'),
      connect: vi.fn().mockResolvedValue(ok(undefined)),
      disconnect: vi.fn(),
      sendAudio: vi.fn(),
      sendText: vi.fn().mockResolvedValue(ok(undefined)),
      triggerResponse: vi.fn(),
      cancelResponse: vi.fn(),
      updateSession: vi.fn().mockResolvedValue(ok(undefined)),
      onEvent: vi.fn().mockReturnValue(() => {}),
    };

    mockTranscription = {
      getState: vi.fn().mockReturnValue('disconnected'),
      connect: vi.fn().mockResolvedValue(ok(undefined)),
      disconnect: vi.fn(),
      sendAudio: vi.fn(),
      onEvent: vi.fn().mockReturnValue(() => {}),
    };

    deps = {
      eventBus: mockEventBus,
      audioCapture: mockAudioCapture,
      realtimeConnection: mockRealtimeConnection,
      transcription: mockTranscription,
    };

    manager = new SessionManager(deps);
  });

  describe('initial state', () => {
    it('should have no active session', () => {
      expect(manager.currentSession).toBeNull();
      expect(manager.isActive).toBe(false);
      expect(manager.isPaused).toBe(false);
    });

    it('should have empty messages and segments', () => {
      expect(manager.getMessages()).toEqual([]);
      expect(manager.getSegments()).toEqual([]);
      expect(manager.getSpeakers()).toEqual([]);
    });
  });

  describe('startSession - conversation mode', () => {
    it('should start conversation session successfully', async () => {
      const result = await manager.startSession('conversation', {
        openaiApiKey: 'sk-test-key',
        templateId: 'general',
      });

      expect(result.isOk()).toBe(true);
      expect(manager.currentSession).not.toBeNull();
      expect(manager.currentSession?.mode.toString()).toBe('conversation');
      expect(manager.isActive).toBe(true);
    });

    it('should fail without OpenAI API key', async () => {
      const result = await manager.startSession('conversation', {});

      expect(result.isOk()).toBe(false);
      expect(result.unwrapErr().message).toContain('OpenAI API key');
    });

    it('should setup audio capture for conversation mode', async () => {
      await manager.startSession('conversation', { openaiApiKey: 'sk-test' });

      expect(mockAudioCapture.startMicrophone).toHaveBeenCalledWith({
        sampleRate: 24000,
        micEnabled: true,
      });
    });

    it('should connect to realtime API', async () => {
      await manager.startSession('conversation', {
        openaiApiKey: 'sk-test',
        systemPrompt: 'You are helpful',
      });

      expect(mockRealtimeConnection.connect).toHaveBeenCalledWith({
        apiKey: 'sk-test',
        systemPrompt: 'You are helpful',
        vadEnabled: true,
      });
    });

    it('should fail if audio capture fails', async () => {
      mockAudioCapture.startMicrophone = vi.fn().mockResolvedValue(err(new Error('No microphone')));

      const result = await manager.startSession('conversation', { openaiApiKey: 'sk-test' });

      expect(result.isOk()).toBe(false);
      expect(result.unwrapErr().message).toBe('No microphone');
    });

    it('should fail if realtime connection fails', async () => {
      mockRealtimeConnection.connect = vi.fn().mockResolvedValue(err(new Error('Connection failed')));

      const result = await manager.startSession('conversation', { openaiApiKey: 'sk-test' });

      expect(result.isOk()).toBe(false);
      expect(mockAudioCapture.stop).toHaveBeenCalled();
    });

    it('should not start if session is already active', async () => {
      await manager.startSession('conversation', { openaiApiKey: 'sk-test' });
      const result = await manager.startSession('conversation', { openaiApiKey: 'sk-test' });

      expect(result.isOk()).toBe(false);
      expect(result.unwrapErr().message).toContain('already running');
    });

    it('should publish SessionStarted event', async () => {
      await manager.startSession('conversation', { openaiApiKey: 'sk-test' });

      expect(mockEventBus.publish).toHaveBeenCalled();
    });
  });

  describe('startSession - transcript_only mode', () => {
    it('should start transcript only session', async () => {
      const result = await manager.startSession('transcript_only', {
        openaiApiKey: 'sk-test',
      });

      expect(result.isOk()).toBe(true);
      expect(manager.currentSession?.mode.toString()).toBe('transcript_only');
    });

    it('should connect with transcriptOnly flag', async () => {
      await manager.startSession('transcript_only', { openaiApiKey: 'sk-test' });

      expect(mockRealtimeConnection.connect).toHaveBeenCalledWith(
        expect.objectContaining({ transcriptOnly: true }),
      );
    });
  });

  describe('startSession - meeting_coach mode', () => {
    it('should start meeting coach session', async () => {
      const result = await manager.startSession('meeting_coach', {
        deepgramApiKey: 'dg-test-key-32-characters-long!!',
      });

      expect(result.isOk()).toBe(true);
      expect(manager.currentSession?.mode.toString()).toBe('meeting_coach');
    });

    it('should fail without Deepgram API key', async () => {
      const result = await manager.startSession('meeting_coach', {});

      expect(result.isOk()).toBe(false);
      expect(result.unwrapErr().message).toContain('Deepgram API key');
    });

    it('should setup audio at 16kHz for Deepgram', async () => {
      await manager.startSession('meeting_coach', {
        deepgramApiKey: 'dg-test-key-32-characters-long!!',
      });

      expect(mockAudioCapture.startMicrophone).toHaveBeenCalledWith({
        sampleRate: 16000,
        micEnabled: true,
      });
    });

    it('should use mixed audio when tabAudioEnabled', async () => {
      await manager.startSession('meeting_coach', {
        deepgramApiKey: 'dg-test-key-32-characters-long!!',
        audioConfig: { tabAudioEnabled: true },
      });

      expect(mockAudioCapture.startMixed).toHaveBeenCalled();
    });

    it('should connect to transcription service', async () => {
      await manager.startSession('meeting_coach', {
        deepgramApiKey: 'dg-test-key-32-characters-long!!',
      });

      expect(mockTranscription.connect).toHaveBeenCalledWith({
        apiKey: 'dg-test-key-32-characters-long!!',
        diarize: true,
        punctuate: true,
        interimResults: true,
        sampleRate: 16000,
      });
    });
  });

  describe('pauseSession', () => {
    it('should pause active session', async () => {
      await manager.startSession('conversation', { openaiApiKey: 'sk-test' });

      const result = manager.pauseSession();

      expect(result.isOk()).toBe(true);
      expect(manager.isPaused).toBe(true);
      expect(mockAudioCapture.pause).toHaveBeenCalled();
    });

    it('should fail if no session', () => {
      const result = manager.pauseSession();

      expect(result.isOk()).toBe(false);
      expect(result.unwrapErr().message).toContain('not found');
    });

    it('should publish SessionPaused event', async () => {
      await manager.startSession('conversation', { openaiApiKey: 'sk-test' });
      vi.clearAllMocks();

      manager.pauseSession();

      expect(mockEventBus.publish).toHaveBeenCalled();
    });
  });

  describe('resumeSession', () => {
    it('should resume paused session', async () => {
      await manager.startSession('conversation', { openaiApiKey: 'sk-test' });
      manager.pauseSession();

      const result = manager.resumeSession();

      expect(result.isOk()).toBe(true);
      expect(manager.isActive).toBe(true);
      expect(mockAudioCapture.resume).toHaveBeenCalled();
    });

    it('should fail if no session', () => {
      const result = manager.resumeSession();

      expect(result.isOk()).toBe(false);
    });
  });

  describe('stopSession', () => {
    it('should stop active session', async () => {
      await manager.startSession('conversation', { openaiApiKey: 'sk-test' });

      const result = manager.stopSession();

      expect(result.isOk()).toBe(true);
      expect(manager.currentSession?.status.isStopped()).toBe(true);
    });

    it('should cleanup resources', async () => {
      await manager.startSession('conversation', { openaiApiKey: 'sk-test' });
      manager.stopSession();

      expect(mockAudioCapture.stop).toHaveBeenCalled();
      expect(mockRealtimeConnection.disconnect).toHaveBeenCalled();
      expect(mockTranscription.disconnect).toHaveBeenCalled();
    });

    it('should fail if no session', () => {
      const result = manager.stopSession();

      expect(result.isOk()).toBe(false);
    });

    it('should publish SessionStopped event', async () => {
      await manager.startSession('conversation', { openaiApiKey: 'sk-test' });
      vi.clearAllMocks();

      manager.stopSession();

      expect(mockEventBus.publish).toHaveBeenCalled();
    });
  });

  describe('sendTextMessage', () => {
    it('should send text in conversation mode', async () => {
      await manager.startSession('conversation', { openaiApiKey: 'sk-test' });

      const result = await manager.sendTextMessage('Hello');

      expect(result.isOk()).toBe(true);
      expect(mockRealtimeConnection.sendText).toHaveBeenCalledWith('Hello');
    });

    it('should add user message to state', async () => {
      await manager.startSession('conversation', { openaiApiKey: 'sk-test' });

      await manager.sendTextMessage('Hello');

      const messages = manager.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0]?.content).toBe('Hello');
      expect(messages[0]?.role).toBe('user');
    });

    it('should fail if session not active', async () => {
      const result = await manager.sendTextMessage('Hello');

      expect(result.isOk()).toBe(false);
    });

    it('should fail in non-conversation mode', async () => {
      await manager.startSession('meeting_coach', {
        deepgramApiKey: 'dg-test-key-32-characters-long!!',
      });

      const result = await manager.sendTextMessage('Hello');

      expect(result.isOk()).toBe(false);
      expect(result.unwrapErr().message).toContain('conversation mode');
    });
  });

  describe('identifySpeakerAsUser', () => {
    it('should not throw for undefined speakerId', () => {
      expect(() => manager.identifySpeakerAsUser(undefined)).not.toThrow();
    });

    it('should not throw for non-existent speaker', () => {
      expect(() => manager.identifySpeakerAsUser(999)).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should stop session on dispose', async () => {
      await manager.startSession('conversation', { openaiApiKey: 'sk-test' });

      manager.dispose();

      expect(mockAudioCapture.stop).toHaveBeenCalled();
    });
  });
});
