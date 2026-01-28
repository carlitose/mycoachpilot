import { describe, it, expect } from 'vitest';

import { SessionStatus } from '../valueObjects/SessionStatus';

describe('SessionStatus', () => {
  describe('create', () => {
    it('should create idle status', () => {
      const status = SessionStatus.create('idle');
      expect(status.toString()).toBe('idle');
    });

    it('should create active status', () => {
      const status = SessionStatus.create('active');
      expect(status.toString()).toBe('active');
    });

    it('should create paused status', () => {
      const status = SessionStatus.create('paused');
      expect(status.toString()).toBe('paused');
    });

    it('should create stopped status', () => {
      const status = SessionStatus.create('stopped');
      expect(status.toString()).toBe('stopped');
    });

    it('should throw on invalid status', () => {
      // @ts-expect-error Testing invalid input
      expect(() => SessionStatus.create('invalid')).toThrow('Invalid session status');
    });
  });

  describe('factory methods', () => {
    it('should create idle status via factory', () => {
      const status = SessionStatus.idle();
      expect(status.isIdle()).toBe(true);
    });

    it('should create active status via factory', () => {
      const status = SessionStatus.active();
      expect(status.isActive()).toBe(true);
    });

    it('should create paused status via factory', () => {
      const status = SessionStatus.paused();
      expect(status.isPaused()).toBe(true);
    });

    it('should create stopped status via factory', () => {
      const status = SessionStatus.stopped();
      expect(status.isStopped()).toBe(true);
    });
  });

  describe('state checks', () => {
    it('isIdle returns true only for idle', () => {
      expect(SessionStatus.idle().isIdle()).toBe(true);
      expect(SessionStatus.active().isIdle()).toBe(false);
      expect(SessionStatus.paused().isIdle()).toBe(false);
      expect(SessionStatus.stopped().isIdle()).toBe(false);
    });

    it('isActive returns true only for active', () => {
      expect(SessionStatus.idle().isActive()).toBe(false);
      expect(SessionStatus.active().isActive()).toBe(true);
      expect(SessionStatus.paused().isActive()).toBe(false);
      expect(SessionStatus.stopped().isActive()).toBe(false);
    });

    it('isPaused returns true only for paused', () => {
      expect(SessionStatus.idle().isPaused()).toBe(false);
      expect(SessionStatus.active().isPaused()).toBe(false);
      expect(SessionStatus.paused().isPaused()).toBe(true);
      expect(SessionStatus.stopped().isPaused()).toBe(false);
    });

    it('isStopped returns true only for stopped', () => {
      expect(SessionStatus.idle().isStopped()).toBe(false);
      expect(SessionStatus.active().isStopped()).toBe(false);
      expect(SessionStatus.paused().isStopped()).toBe(false);
      expect(SessionStatus.stopped().isStopped()).toBe(true);
    });
  });

  describe('transition permissions', () => {
    it('canStart returns true only for idle', () => {
      expect(SessionStatus.idle().canStart()).toBe(true);
      expect(SessionStatus.active().canStart()).toBe(false);
      expect(SessionStatus.paused().canStart()).toBe(false);
      expect(SessionStatus.stopped().canStart()).toBe(false);
    });

    it('canPause returns true only for active', () => {
      expect(SessionStatus.idle().canPause()).toBe(false);
      expect(SessionStatus.active().canPause()).toBe(true);
      expect(SessionStatus.paused().canPause()).toBe(false);
      expect(SessionStatus.stopped().canPause()).toBe(false);
    });

    it('canResume returns true only for paused', () => {
      expect(SessionStatus.idle().canResume()).toBe(false);
      expect(SessionStatus.active().canResume()).toBe(false);
      expect(SessionStatus.paused().canResume()).toBe(true);
      expect(SessionStatus.stopped().canResume()).toBe(false);
    });

    it('canStop returns true for active and paused', () => {
      expect(SessionStatus.idle().canStop()).toBe(false);
      expect(SessionStatus.active().canStop()).toBe(true);
      expect(SessionStatus.paused().canStop()).toBe(true);
      expect(SessionStatus.stopped().canStop()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same status', () => {
      const status1 = SessionStatus.active();
      const status2 = SessionStatus.active();

      expect(status1.equals(status2)).toBe(true);
    });

    it('should return false for different statuses', () => {
      const status1 = SessionStatus.active();
      const status2 = SessionStatus.paused();

      expect(status1.equals(status2)).toBe(false);
    });
  });
});
