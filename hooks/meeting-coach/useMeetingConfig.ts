/**
 * useMeetingConfig Hook
 *
 * Manages Meeting Coach configuration stored in localStorage:
 * - API keys (Deepgram, OpenAI)
 * - Selected coaching template and style
 * - Custom user templates
 * - Template CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import type { MeetingCoachConfig, CoachingTemplate, CoachingStyle } from '@/lib/meeting-coach/types';
import { STORAGE_KEYS } from '@/lib/meeting-coach/types';
import { PREDEFINED_TEMPLATES, getAllPredefinedTemplates } from '@/constants/meeting-coach-templates';
import { log } from '@/lib/logger';

const DEFAULT_CONFIG: MeetingCoachConfig = {
  deepgramApiKey: '',
  openaiApiKey: '',
  selectedTemplateId: 'general',
  coachingStyle: 'diplomatic',
  customTemplates: [],
};

export function useMeetingConfig() {
  const [config, setConfig] = useState<MeetingCoachConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load config from localStorage on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored) as MeetingCoachConfig;
        setConfig(parsed);
        log.info( '[useMeetingConfig] Loaded config from localStorage');
      } else {
        setConfig(DEFAULT_CONFIG);
        log.info( '[useMeetingConfig] No config found, using defaults');
      }
    } catch (error) {
      log.error( '[useMeetingConfig] Error loading config', error);
      setConfig(DEFAULT_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save config to localStorage
   */
  const saveConfig = useCallback((newConfig: MeetingCoachConfig) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
      log.info( '[useMeetingConfig] Config saved');
    } catch (error) {
      log.error( '[useMeetingConfig] Error saving config', error);
      throw error;
    }
  }, []);

  /**
   * Update config (partial update)
   */
  const updateConfig = useCallback((updates: Partial<MeetingCoachConfig>) => {
    setConfig((prev) => {
      if (!prev) return null;

      const updated = { ...prev, ...updates };
      saveConfig(updated);
      return updated;
    });
  }, [saveConfig]);

  /**
   * Update API keys
   */
  const updateApiKeys = useCallback((deepgramApiKey?: string, openaiApiKey?: string) => {
    const updates: Partial<MeetingCoachConfig> = {};
    if (deepgramApiKey !== undefined) updates.deepgramApiKey = deepgramApiKey;
    if (openaiApiKey !== undefined) updates.openaiApiKey = openaiApiKey;
    updateConfig(updates);
  }, [updateConfig]);

  /**
   * Update coaching style
   */
  const updateCoachingStyle = useCallback((style: CoachingStyle) => {
    updateConfig({ coachingStyle: style });
  }, [updateConfig]);

  /**
   * Update selected template
   */
  const updateSelectedTemplate = useCallback((templateId: string) => {
    updateConfig({ selectedTemplateId: templateId });
  }, [updateConfig]);

  /**
   * Get all templates (predefined + custom)
   */
  const getAllTemplates = useCallback((): CoachingTemplate[] => {
    if (!config) return PREDEFINED_TEMPLATES;
    return [...PREDEFINED_TEMPLATES, ...config.customTemplates];
  }, [config]);

  /**
   * Get template by ID
   */
  const getTemplateById = useCallback((templateId: string): CoachingTemplate | undefined => {
    return getAllTemplates().find((t) => t.id === templateId);
  }, [getAllTemplates]);

  /**
   * Get currently selected template
   */
  const getSelectedTemplate = useCallback((): CoachingTemplate | undefined => {
    if (!config) return PREDEFINED_TEMPLATES[0];
    return getTemplateById(config.selectedTemplateId);
  }, [config, getTemplateById]);

  /**
   * Add custom template
   */
  const addCustomTemplate = useCallback((template: Omit<CoachingTemplate, 'id' | 'createdAt'>) => {
    if (!config) return;

    const newTemplate: CoachingTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      isPredefined: false,
      createdAt: new Date().toISOString(),
    };

    const customTemplates = [...config.customTemplates, newTemplate];
    updateConfig({ customTemplates });

    log.info( '[useMeetingConfig] Custom template added', { id: newTemplate.id });
    return newTemplate.id;
  }, [config, updateConfig]);

  /**
   * Update custom template
   */
  const updateCustomTemplate = useCallback((
    templateId: string,
    updates: Partial<Omit<CoachingTemplate, 'id' | 'createdAt' | 'isPredefined'>>
  ) => {
    if (!config) return;

    const customTemplates = config.customTemplates.map((t) =>
      t.id === templateId ? { ...t, ...updates } : t
    );

    updateConfig({ customTemplates });
    log.info( '[useMeetingConfig] Custom template updated', { templateId });
  }, [config, updateConfig]);

  /**
   * Remove custom template
   */
  const removeCustomTemplate = useCallback((templateId: string) => {
    if (!config) return;

    // Cannot remove predefined templates
    if (PREDEFINED_TEMPLATES.some((t) => t.id === templateId)) {
      log.warn( '[useMeetingConfig] Cannot remove predefined template', { templateId });
      return;
    }

    const customTemplates = config.customTemplates.filter((t) => t.id !== templateId);
    updateConfig({ customTemplates });

    // If removed template was selected, switch to default
    if (config.selectedTemplateId === templateId) {
      updateConfig({ selectedTemplateId: 'general', customTemplates });
    }

    log.info( '[useMeetingConfig] Custom template removed', { templateId });
  }, [config, updateConfig]);

  /**
   * Validate Deepgram API key
   */
  const validateDeepgramKey = useCallback(async (apiKey: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/deepgram/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      log.error( '[useMeetingConfig] Error validating Deepgram key', error);
      return false;
    }
  }, []);

  /**
   * Check if config is valid for starting a session
   */
  const isConfigValid = useCallback((): boolean => {
    if (!config) return false;
    return (
      config.deepgramApiKey.length > 0 &&
      config.openaiApiKey.length > 0 &&
      config.selectedTemplateId.length > 0
    );
  }, [config]);

  /**
   * Get validation errors
   */
  const getValidationErrors = useCallback((): string[] => {
    const errors: string[] = [];
    if (!config) return ['Config not loaded'];

    if (!config.deepgramApiKey) {
      errors.push('Deepgram API key is required');
    }
    if (!config.openaiApiKey) {
      errors.push('OpenAI API key is required');
    }
    if (!config.selectedTemplateId) {
      errors.push('Coaching template must be selected');
    }

    return errors;
  }, [config]);

  return {
    // State
    config,
    isLoading,

    // Actions
    updateConfig,
    updateApiKeys,
    updateCoachingStyle,
    updateSelectedTemplate,

    // Templates
    getAllTemplates,
    getTemplateById,
    getSelectedTemplate,
    addCustomTemplate,
    updateCustomTemplate,
    removeCustomTemplate,

    // Validation
    validateDeepgramKey,
    isConfigValid,
    getValidationErrors,
  };
}
