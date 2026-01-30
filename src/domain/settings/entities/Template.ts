import { Entity } from '@domain/shared';

import { TemplateId, PredefinedTemplateId } from '../valueObjects/TemplateId';

export interface TemplateProps {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  isPredefined: boolean;
}

/**
 * Template entity
 * Defines system prompts and coaching styles for sessions
 */
export class Template extends Entity<TemplateId> {
  private _name: string;
  private _icon: string;
  private _description: string;
  private _systemPrompt: string;
  private readonly _isPredefined: boolean;

  private constructor(
    id: TemplateId,
    name: string,
    icon: string,
    description: string,
    systemPrompt: string,
    isPredefined: boolean,
  ) {
    super(id);
    this._name = name;
    this._icon = icon;
    this._description = description;
    this._systemPrompt = systemPrompt;
    this._isPredefined = isPredefined;
  }

  get name(): string {
    return this._name;
  }

  get icon(): string {
    return this._icon;
  }

  get description(): string {
    return this._description;
  }

  get systemPrompt(): string {
    return this._systemPrompt;
  }

  get isPredefined(): boolean {
    return this._isPredefined;
  }

  update(data: Partial<Pick<TemplateProps, 'name' | 'icon' | 'description' | 'systemPrompt'>>): void {
    if (this._isPredefined) {
      throw new Error('Cannot modify predefined templates');
    }
    if (data.name !== undefined) this._name = data.name;
    if (data.icon !== undefined) this._icon = data.icon;
    if (data.description !== undefined) this._description = data.description;
    if (data.systemPrompt !== undefined) this._systemPrompt = data.systemPrompt;
  }

  toProps(): TemplateProps {
    return {
      id: this._id.toString(),
      name: this._name,
      icon: this._icon,
      description: this._description,
      systemPrompt: this._systemPrompt,
      isPredefined: this._isPredefined,
    };
  }

  static create(
    name: string,
    systemPrompt: string,
    options?: { icon?: string; description?: string },
  ): Template {
    return new Template(
      TemplateId.create(),
      name,
      options?.icon ?? '📝',
      options?.description ?? '',
      systemPrompt,
      false,
    );
  }

  static fromProps(props: TemplateProps): Template {
    return new Template(
      TemplateId.fromString(props.id),
      props.name,
      props.icon,
      props.description,
      props.systemPrompt,
      props.isPredefined,
    );
  }

  static predefined(
    id: PredefinedTemplateId,
    name: string,
    icon: string,
    description: string,
    systemPrompt: string,
  ): Template {
    return new Template(
      TemplateId.fromString(id),
      name,
      icon,
      description,
      systemPrompt,
      true,
    );
  }
}

// Predefined templates
export const PREDEFINED_TEMPLATES: TemplateProps[] = [
  {
    id: 'general',
    name: 'General Assistant',
    icon: '🤖',
    description: 'A helpful AI assistant for general conversations',
    systemPrompt: `You are a helpful AI assistant. Be concise, clear, and friendly in your responses.
Listen actively and provide thoughtful answers. If you don't understand something, ask for clarification.`,
    isPredefined: true,
  },
  {
    id: 'interview',
    name: 'Interview Coach',
    icon: '💼',
    description: 'Practice job interviews with AI feedback',
    systemPrompt: `You are an expert interview coach helping prepare for job interviews.
- Ask relevant interview questions based on the role
- Provide feedback on answers, highlighting strengths and areas to improve
- Suggest better ways to phrase responses using the STAR method
- Help practice behavioral and technical questions
- Offer tips on body language and communication`,
    isPredefined: true,
  },
  {
    id: 'sales',
    name: 'Sales Coach',
    icon: '📊',
    description: 'Improve sales pitches and negotiation skills',
    systemPrompt: `You are a sales coaching expert helping improve sales skills.
- Analyze pitch delivery and suggest improvements
- Help handle objections effectively
- Guide on building rapport and trust
- Provide closing techniques and negotiation strategies
- Focus on value proposition communication`,
    isPredefined: true,
  },
  {
    id: 'presentation',
    name: 'Presentation Coach',
    icon: '🎤',
    description: 'Enhance presentation and public speaking skills',
    systemPrompt: `You are a presentation and public speaking coach.
- Help structure presentations for maximum impact
- Provide feedback on delivery, pacing, and clarity
- Suggest techniques for engaging the audience
- Help with managing nervousness and building confidence
- Offer tips on visual aids and storytelling`,
    isPredefined: true,
  },
];
