import type { ConfigRepositoryPort } from '../../application/ports/ConfigRepositoryPort';
import type { UserConfigProps, TemplateProps, ReactivityConfigProps, CoachingPromptConfigProps, TTSConfigProps } from '../../domain/settings';
import { PREDEFINED_TEMPLATES } from '../../domain/settings';
import { ok } from '../../domain/shared/Result';
import type { Result } from '../../domain/shared/Result';

export class InMemoryConfigRepository implements ConfigRepositoryPort {
  private config: UserConfigProps | null = null;
  private templates = new Map<string, TemplateProps>();
  private reactivityConfig: ReactivityConfigProps | null = null;
  private coachingPromptConfig: CoachingPromptConfigProps | null = null;
  private ttsConfig: TTSConfigProps | null = null;

  constructor() {
    for (const t of PREDEFINED_TEMPLATES) {
      this.templates.set(t.id, t);
    }
  }

  getConfig(): Promise<Result<UserConfigProps | null, Error>> {
    return Promise.resolve(ok(this.config));
  }

  saveConfig(config: UserConfigProps): Promise<Result<void, Error>> {
    this.config = config;
    return Promise.resolve(ok(undefined));
  }

  getTemplates(): Promise<Result<TemplateProps[], Error>> {
    return Promise.resolve(ok(Array.from(this.templates.values())));
  }

  getTemplateById(templateId: string): Promise<Result<TemplateProps | null, Error>> {
    return Promise.resolve(ok(this.templates.get(templateId) ?? null));
  }

  saveTemplate(template: TemplateProps): Promise<Result<void, Error>> {
    this.templates.set(template.id, template);
    return Promise.resolve(ok(undefined));
  }

  deleteTemplate(templateId: string): Promise<Result<void, Error>> {
    this.templates.delete(templateId);
    return Promise.resolve(ok(undefined));
  }

  resetToDefaults(): Promise<Result<void, Error>> {
    this.config = null;
    this.templates.clear();
    this.reactivityConfig = null;
    this.coachingPromptConfig = null;
    this.ttsConfig = null;
    for (const t of PREDEFINED_TEMPLATES) {
      this.templates.set(t.id, t);
    }
    return Promise.resolve(ok(undefined));
  }

  getReactivityConfig(): Promise<Result<ReactivityConfigProps | null, Error>> {
    return Promise.resolve(ok(this.reactivityConfig));
  }

  saveReactivityConfig(config: ReactivityConfigProps): Promise<Result<void, Error>> {
    this.reactivityConfig = config;
    return Promise.resolve(ok(undefined));
  }

  getCoachingPromptConfig(): Promise<Result<CoachingPromptConfigProps | null, Error>> {
    return Promise.resolve(ok(this.coachingPromptConfig));
  }

  saveCoachingPromptConfig(config: CoachingPromptConfigProps): Promise<Result<void, Error>> {
    this.coachingPromptConfig = config;
    return Promise.resolve(ok(undefined));
  }

  getTTSConfig(): Promise<Result<TTSConfigProps | null, Error>> {
    return Promise.resolve(ok(this.ttsConfig));
  }

  saveTTSConfig(config: TTSConfigProps): Promise<Result<void, Error>> {
    this.ttsConfig = config;
    return Promise.resolve(ok(undefined));
  }
}
