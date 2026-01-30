/**
 * Application Services
 * Domain services that orchestrate complex operations
 */

export { SessionManager } from './SessionManager';
export type { SessionManagerDependencies, SessionState } from './SessionManager';

export { CoachingEngine } from './CoachingEngine';
export type { CoachingEngineConfig, CoachingContext } from './CoachingEngine';

export {
  createSuggestionGeneratorFn,
  buildCoachingContext,
  handleTranscriptionWithCoaching,
} from './CoachingIntegration';
