/**
 * Settings bounded context
 * Manages user configuration and API keys
 */

// Value Objects
export {
  ApiKey,
  TemplateId,
  CoachingStyle,
  ReactivityConfig,
  REACTIVITY_DEFAULTS,
} from './valueObjects';
export type {
  ApiKeyService,
  ApiKeyProps,
  PredefinedTemplateId,
  CoachingStyleType,
  ReactivityConfigProps,
} from './valueObjects';

// Entities
export {
  UserConfig,
  Template,
  PREDEFINED_TEMPLATES,
} from './entities';
export type {
  UserConfigProps,
  TemplateProps,
} from './entities';

// Events
export { ConfigUpdated } from './events';
export type { ConfigUpdatedPayload } from './events';
