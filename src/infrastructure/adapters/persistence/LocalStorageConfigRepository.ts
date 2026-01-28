import type { UserConfigProps, TemplateProps } from '@domain/settings';
import { PREDEFINED_TEMPLATES } from '@domain/settings';
import { ok, err, type Result } from '@domain/shared';

import type { ConfigRepositoryPort } from '@application/ports';

import { STORAGE_KEYS, STORAGE_LIMITS } from './storageKeys';

/**
 * LocalStorage Config Repository
 * Persists user configuration and custom templates
 */
export class LocalStorageConfigRepository implements ConfigRepositoryPort {
  getConfig(): Promise<Result<UserConfigProps | null, Error>> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_CONFIG);
      if (!data) return Promise.resolve(ok(null));

      const config = JSON.parse(data) as UserConfigProps;
      return Promise.resolve(ok(config));
    } catch (error) {
      return Promise.resolve(err(error instanceof Error ? error : new Error('Failed to load config')));
    }
  }

  saveConfig(config: UserConfigProps): Promise<Result<void, Error>> {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_CONFIG, JSON.stringify(config));
      return Promise.resolve(ok(undefined));
    } catch (error) {
      return Promise.resolve(err(error instanceof Error ? error : new Error('Failed to save config')));
    }
  }

  getTemplates(): Promise<Result<TemplateProps[], Error>> {
    try {
      // Get custom templates
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
      const customTemplates = data ? (JSON.parse(data) as TemplateProps[]) : [];

      // Combine with predefined
      return Promise.resolve(ok([...PREDEFINED_TEMPLATES, ...customTemplates]));
    } catch (error) {
      return Promise.resolve(err(error instanceof Error ? error : new Error('Failed to load templates')));
    }
  }

  getTemplateById(templateId: string): Promise<Result<TemplateProps | null, Error>> {
    try {
      // Check predefined first
      const predefined = PREDEFINED_TEMPLATES.find((t) => t.id === templateId);
      if (predefined) return Promise.resolve(ok(predefined));

      // Check custom templates
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
      if (!data) return Promise.resolve(ok(null));

      const customTemplates = JSON.parse(data) as TemplateProps[];
      const template = customTemplates.find((t) => t.id === templateId);
      return Promise.resolve(ok(template ?? null));
    } catch (error) {
      return Promise.resolve(err(error instanceof Error ? error : new Error('Failed to get template')));
    }
  }

  saveTemplate(template: TemplateProps): Promise<Result<void, Error>> {
    try {
      if (template.isPredefined) {
        return Promise.resolve(err(new Error('Cannot modify predefined templates')));
      }

      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
      const templates = data ? (JSON.parse(data) as TemplateProps[]) : [];

      // Check limit
      const existingIndex = templates.findIndex((t) => t.id === template.id);
      if (existingIndex < 0 && templates.length >= STORAGE_LIMITS.MAX_CUSTOM_TEMPLATES) {
        return Promise.resolve(err(new Error(`Maximum of ${String(STORAGE_LIMITS.MAX_CUSTOM_TEMPLATES)} custom templates allowed`)));
      }

      // Update or add
      if (existingIndex >= 0) {
        templates[existingIndex] = template;
      } else {
        templates.push(template);
      }

      localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(templates));
      return Promise.resolve(ok(undefined));
    } catch (error) {
      return Promise.resolve(err(error instanceof Error ? error : new Error('Failed to save template')));
    }
  }

  deleteTemplate(templateId: string): Promise<Result<void, Error>> {
    try {
      // Check if predefined
      const predefined = PREDEFINED_TEMPLATES.find((t) => t.id === templateId);
      if (predefined) {
        return Promise.resolve(err(new Error('Cannot delete predefined templates')));
      }

      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
      if (!data) return Promise.resolve(ok(undefined));

      const templates = JSON.parse(data) as TemplateProps[];
      const filtered = templates.filter((t) => t.id !== templateId);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(filtered));

      return Promise.resolve(ok(undefined));
    } catch (error) {
      return Promise.resolve(err(error instanceof Error ? error : new Error('Failed to delete template')));
    }
  }

  resetToDefaults(): Promise<Result<void, Error>> {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_CONFIG);
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
      return Promise.resolve(ok(undefined));
    } catch (error) {
      return Promise.resolve(err(error instanceof Error ? error : new Error('Failed to reset config')));
    }
  }
}
