/**
 * localStorage key constants
 */

export const STORAGE_KEYS = {
  USER_CONFIG: 'mcp_user_config',
  SESSION_HISTORY: 'mcp_session_history',
  CUSTOM_TEMPLATES: 'mcp_custom_templates',
} as const;

export const STORAGE_LIMITS = {
  MAX_CONVERSATION_SESSIONS: 20,
  MAX_MEETING_COACH_SESSIONS: 100,
  MAX_CUSTOM_TEMPLATES: 10,
} as const;
