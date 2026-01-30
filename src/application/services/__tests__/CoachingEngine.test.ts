/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-confusing-void-expression, @typescript-eslint/no-non-null-assertion, max-lines */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { EventBusPort } from '../../ports';
import { CoachingEngine, CoachingContext, CoachingEngineConfig } from '../CoachingEngine';

describe('CoachingEngine', () => {
  let mockEventBus: EventBusPort;
  let engine: CoachingEngine;
  let defaultConfig: CoachingEngineConfig;

  beforeEach(() => {
    mockEventBus = {
      publish: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
      subscribeMany: vi.fn().mockReturnValue(() => {}),
    };

    defaultConfig = {
      sessionId: 'session-123',
      coachingStyle: 'diplomatic',
      templateSystemPrompt: 'You are a coach',
      userSpeakerId: 1,
      suggestionIntervalMs: 15000,
      maxActiveSuggestions: 5,
    };

    engine = new CoachingEngine(mockEventBus, defaultConfig);
  });

  const createContext = (overrides?: Partial<CoachingContext>): CoachingContext => ({
    recentSegments: [
      { id: '1', speakerId: 0, text: 'Hello', startMs: 0, endMs: 1000, confidence: 0.9, words: [], isFinal: true },
    ],
    speakers: [
      { id: 0, name: 'Other', isUser: false, wordCount: 10, segmentCount: 1, speakingTimeMs: 5000 },
      { id: 1, name: 'You', isUser: true, wordCount: 5, segmentCount: 1, speakingTimeMs: 2500 },
    ],
    currentSpeaker: 0,
    conversationTone: 'neutral',
    ...overrides,
  });

  describe('constructor', () => {
    it('should initialize with empty suggestions', () => {
      expect(engine.suggestions).toEqual([]);
      expect(engine.activeSuggestions).toEqual([]);
    });

    it('should use default values for optional config', () => {
      const minimalConfig: CoachingEngineConfig = {
        sessionId: 'test',
        coachingStyle: 'assertive',
        templateSystemPrompt: 'Test',
        userSpeakerId: null,
      };
      const minimalEngine = new CoachingEngine(mockEventBus, minimalConfig);
      expect(minimalEngine.suggestions).toEqual([]);
    });
  });

  describe('processSegment', () => {
    it('should not generate suggestion when user is speaking', async () => {
      const segment = {
        id: '1',
        speakerId: 1, // user speaker
        text: 'Hello',
        startMs: 0,
        endMs: 1000,
        confidence: 0.9,
        words: [],
        isFinal: true,
      };

      const result = await engine.processSegment(segment, createContext());

      expect(result).toBeNull();
    });

    it('should not generate suggestion without generator function', async () => {
      const segment = {
        id: '1',
        speakerId: 0, // other speaker
        text: 'Hello',
        startMs: 0,
        endMs: 1000,
        confidence: 0.9,
        words: [],
        isFinal: true,
      };

      const result = await engine.processSegment(segment, createContext());

      expect(result).toBeNull();
    });

    it('should generate suggestion when conditions are met', async () => {
      const mockGenerator = vi.fn().mockResolvedValue({
        id: 'sugg-1',
        sessionId: 'session-123',
        type: 'question',
        content: 'Ask about their goals',
        context: 'Customer mentioned success',
        confidence: 0.85,
        timestamp: new Date(),
        used: false,
        dismissed: false,
      });

      engine.setSuggestionGenerator(mockGenerator);

      const segment = {
        id: '1',
        speakerId: 0,
        text: 'I want to be successful',
        startMs: 0,
        endMs: 1000,
        confidence: 0.9,
        words: [],
        isFinal: true,
      };

      const result = await engine.processSegment(segment, createContext());

      expect(result).not.toBeNull();
      expect(result?.content).toBe('Ask about their goals');
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should rate limit suggestions', async () => {
      const mockGenerator = vi.fn().mockResolvedValue({
        id: 'sugg-1',
        sessionId: 'session-123',
        type: 'question',
        content: 'Ask something',
        context: null,
        confidence: 0.8,
        timestamp: new Date(),
        used: false,
        dismissed: false,
      });

      engine.setSuggestionGenerator(mockGenerator);

      const segment = {
        id: '1',
        speakerId: 0,
        text: 'Hello',
        startMs: 0,
        endMs: 1000,
        confidence: 0.9,
        words: [],
        isFinal: true,
      };

      // First call should succeed
      await engine.processSegment(segment, createContext());

      // Second call immediately should be rate limited
      const result = await engine.processSegment(segment, createContext());

      expect(result).toBeNull();
      expect(mockGenerator).toHaveBeenCalledTimes(1);
    });

    it('should handle null response from generator', async () => {
      const mockGenerator = vi.fn().mockResolvedValue(null);
      engine.setSuggestionGenerator(mockGenerator);

      const segment = {
        id: '1',
        speakerId: 0,
        text: 'Hello',
        startMs: 0,
        endMs: 1000,
        confidence: 0.9,
        words: [],
        isFinal: true,
      };

      const result = await engine.processSegment(segment, createContext());

      expect(result).toBeNull();
    });
  });

  describe('useSuggestion', () => {
    it('should mark suggestion as used', async () => {
      const mockGenerator = vi.fn().mockResolvedValue({
        id: 'sugg-1',
        sessionId: 'session-123',
        type: 'question',
        content: 'Ask about goals',
        context: null,
        confidence: 0.8,
        timestamp: new Date(),
        used: false,
        dismissed: false,
      });

      engine.setSuggestionGenerator(mockGenerator);

      const segment = { id: '1', speakerId: 0, text: 'Hello', startMs: 0, endMs: 1000, confidence: 0.9, words: [], isFinal: true };
      const suggestion = await engine.processSegment(segment, createContext());

      engine.useSuggestion(suggestion!.id);

      expect(engine.activeSuggestions).toHaveLength(0);
      expect(engine.suggestions[0]?.used).toBe(true);
    });

    it('should not throw for non-existent suggestion', () => {
      expect(() => engine.useSuggestion('non-existent')).not.toThrow();
    });
  });

  describe('dismissSuggestion', () => {
    it('should mark suggestion as dismissed', async () => {
      const mockGenerator = vi.fn().mockResolvedValue({
        id: 'sugg-1',
        sessionId: 'session-123',
        type: 'talking_point',
        content: 'Mention this',
        context: null,
        confidence: 0.8,
        timestamp: new Date(),
        used: false,
        dismissed: false,
      });

      engine.setSuggestionGenerator(mockGenerator);

      const segment = { id: '1', speakerId: 0, text: 'Hello', startMs: 0, endMs: 1000, confidence: 0.9, words: [], isFinal: true };
      const suggestion = await engine.processSegment(segment, createContext());

      engine.dismissSuggestion(suggestion!.id);

      expect(engine.activeSuggestions).toHaveLength(0);
      expect(engine.suggestions[0]?.dismissed).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      engine.updateConfig({ userSpeakerId: 2 });

      // Config is private, but we can test behavior
      // After setting userSpeakerId to 2, speaker 1 should be able to trigger suggestions
    });
  });

  describe('setUserSpeakerId', () => {
    it('should update user speaker id', async () => {
      engine.setUserSpeakerId(2);

      // Now speaker 1 is not the user, should be able to generate suggestions
      const mockGenerator = vi.fn().mockResolvedValue({
        id: 'sugg-1',
        sessionId: 'session-123',
        type: 'general',
        content: 'Tip',
        context: null,
        confidence: 0.8,
        timestamp: new Date(),
        used: false,
        dismissed: false,
      });

      engine.setSuggestionGenerator(mockGenerator);

      const segment = { id: '1', speakerId: 1, text: 'Hello', startMs: 0, endMs: 1000, confidence: 0.9, words: [], isFinal: true };
      const result = await engine.processSegment(segment, createContext());

      expect(result).not.toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all suggestions', async () => {
      const mockGenerator = vi.fn().mockResolvedValue({
        id: 'sugg-1',
        sessionId: 'session-123',
        type: 'question',
        content: 'Ask',
        context: null,
        confidence: 0.8,
        timestamp: new Date(),
        used: false,
        dismissed: false,
      });

      engine.setSuggestionGenerator(mockGenerator);

      const segment = { id: '1', speakerId: 0, text: 'Hello', startMs: 0, endMs: 1000, confidence: 0.9, words: [], isFinal: true };
      await engine.processSegment(segment, createContext());

      expect(engine.suggestions).toHaveLength(1);

      engine.clear();

      expect(engine.suggestions).toHaveLength(0);
    });
  });

  describe('generateCoachingPrompt', () => {
    it('should generate prompt with context and style', () => {
      const context = createContext();
      const prompt = CoachingEngine.generateCoachingPrompt(context, 'diplomatic', 'You are a coach');

      expect(prompt).toContain('You are a coach');
      expect(prompt).toContain('Coaching Style: diplomatic');
      expect(prompt).toContain('tactful'); // lowercase in the prompt
      expect(prompt).toContain('Hello'); // From recent segment
    });

    it('should include speaker labels in prompt', () => {
      const context = createContext({
        speakers: [{ id: 0, name: 'Client', isUser: false, wordCount: 10, segmentCount: 1, speakingTimeMs: 5000 }],
      });
      const prompt = CoachingEngine.generateCoachingPrompt(context, 'assertive', 'Test');

      expect(prompt).toContain('Client:');
    });

    it('should handle different coaching styles', () => {
      const context = createContext();

      const diplomaticPrompt = CoachingEngine.generateCoachingPrompt(context, 'diplomatic', 'Test');
      expect(diplomaticPrompt).toContain('tactful');

      const assertivePrompt = CoachingEngine.generateCoachingPrompt(context, 'assertive', 'Test');
      expect(assertivePrompt).toContain('direct');

      const analyticalPrompt = CoachingEngine.generateCoachingPrompt(context, 'analytical', 'Test');
      expect(analyticalPrompt).toContain('data-driven');

      const supportivePrompt = CoachingEngine.generateCoachingPrompt(context, 'supportive', 'Test');
      expect(supportivePrompt).toContain('empathetic');
    });
  });

  describe('parseSuggestionResponse', () => {
    it('should parse valid JSON response', () => {
      const response = `Here's a suggestion: {"type": "question", "content": "Ask about goals", "context": "They mentioned success"}`;
      const result = CoachingEngine.parseSuggestionResponse(response, 'session-1');

      expect(result).not.toBeNull();
      expect(result?.type).toBe('question');
      expect(result?.content).toBe('Ask about goals');
      expect(result?.context).toBe('They mentioned success');
    });

    it('should return null for invalid JSON', () => {
      const response = 'This is not valid JSON';
      const result = CoachingEngine.parseSuggestionResponse(response, 'session-1');

      expect(result).toBeNull();
    });

    it('should return null for missing required fields', () => {
      const response = '{"type": "question"}'; // missing content
      const result = CoachingEngine.parseSuggestionResponse(response, 'session-1');

      expect(result).toBeNull();
    });

    it('should handle response without context', () => {
      const response = '{"type": "general", "content": "Good tip"}';
      const result = CoachingEngine.parseSuggestionResponse(response, 'session-1');

      expect(result).not.toBeNull();
      expect(result?.context).toBeNull();
    });

    it('should set default confidence and flags', () => {
      const response = '{"type": "question", "content": "Ask this"}';
      const result = CoachingEngine.parseSuggestionResponse(response, 'session-1');

      expect(result?.confidence).toBe(0.8);
      expect(result?.used).toBe(false);
      expect(result?.dismissed).toBe(false);
      expect(result?.sessionId).toBe('session-1');
    });
  });
});
