// System templates for AI assistant
export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  system_prompt: string;
  icon?: string;
  sort_order?: number;
}

// Default system templates
export const SYSTEM_TEMPLATES: Template[] = [
  {
    id: 'default',
    name: 'General Assistant',
    category: 'General',
    description: 'A helpful general-purpose AI assistant',
    system_prompt: 'You are a helpful AI assistant. Be concise, accurate, and helpful.',
    icon: '🤖',
    sort_order: 1,
  },
];
