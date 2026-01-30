/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { describe, it, expect } from 'vitest';

import { Template, PREDEFINED_TEMPLATES } from '../entities/Template';

describe('Template', () => {
  describe('create', () => {
    it('should create custom template', () => {
      const template = Template.create('My Template', 'You are a helpful assistant');

      expect(template.name).toBe('My Template');
      expect(template.systemPrompt).toBe('You are a helpful assistant');
      expect(template.isPredefined).toBe(false);
      expect(template.icon).toBe('📝'); // default
      expect(template.description).toBe(''); // default
    });

    it('should create template with options', () => {
      const template = Template.create('Custom', 'Prompt', {
        icon: '🎯',
        description: 'A custom template',
      });

      expect(template.icon).toBe('🎯');
      expect(template.description).toBe('A custom template');
    });
  });

  describe('predefined', () => {
    it('should create predefined template', () => {
      const template = Template.predefined(
        'general',
        'General Assistant',
        '🤖',
        'A helpful AI assistant',
        'You are helpful',
      );

      expect(template.isPredefined).toBe(true);
    });
  });

  describe('update', () => {
    it('should update custom template name', () => {
      const template = Template.create('Old Name', 'Prompt');

      template.update({ name: 'New Name' });

      expect(template.name).toBe('New Name');
    });

    it('should update custom template icon', () => {
      const template = Template.create('Name', 'Prompt');

      template.update({ icon: '🚀' });

      expect(template.icon).toBe('🚀');
    });

    it('should update custom template description', () => {
      const template = Template.create('Name', 'Prompt');

      template.update({ description: 'New description' });

      expect(template.description).toBe('New description');
    });

    it('should update custom template systemPrompt', () => {
      const template = Template.create('Name', 'Old prompt');

      template.update({ systemPrompt: 'New prompt' });

      expect(template.systemPrompt).toBe('New prompt');
    });

    it('should update multiple fields at once', () => {
      const template = Template.create('Name', 'Prompt');

      template.update({
        name: 'New Name',
        icon: '🎯',
        description: 'New desc',
        systemPrompt: 'New prompt',
      });

      expect(template.name).toBe('New Name');
      expect(template.icon).toBe('🎯');
      expect(template.description).toBe('New desc');
      expect(template.systemPrompt).toBe('New prompt');
    });

    it('should throw when updating predefined template', () => {
      const template = Template.predefined(
        'general',
        'General',
        '🤖',
        'Description',
        'Prompt',
      );

      expect(() => template.update({ name: 'New Name' })).toThrow('Cannot modify predefined templates');
    });
  });

  describe('toProps', () => {
    it('should serialize to props object', () => {
      const template = Template.create('Test', 'Prompt', {
        icon: '🎯',
        description: 'Test description',
      });
      const props = template.toProps();

      expect(props.name).toBe('Test');
      expect(props.systemPrompt).toBe('Prompt');
      expect(props.icon).toBe('🎯');
      expect(props.description).toBe('Test description');
      expect(props.isPredefined).toBe(false);
      expect(props.id).toBeDefined();
    });
  });

  describe('fromProps', () => {
    it('should restore template from props', () => {
      const original = Template.create('Custom Template', 'My prompt', {
        icon: '💡',
        description: 'My description',
      });
      const props = original.toProps();

      const restored = Template.fromProps(props);

      expect(restored.name).toBe(original.name);
      expect(restored.systemPrompt).toBe(original.systemPrompt);
      expect(restored.icon).toBe(original.icon);
      expect(restored.description).toBe(original.description);
      expect(restored.isPredefined).toBe(original.isPredefined);
    });

    it('should restore predefined template from props', () => {
      const props = PREDEFINED_TEMPLATES[0];
      if (!props) return;

      const restored = Template.fromProps(props);

      expect(restored.isPredefined).toBe(true);
    });
  });

  describe('PREDEFINED_TEMPLATES', () => {
    it('should have 4 predefined templates', () => {
      expect(PREDEFINED_TEMPLATES).toHaveLength(4);
    });

    it('should include general template', () => {
      const general = PREDEFINED_TEMPLATES.find(t => t.id === 'general');
      expect(general).toBeDefined();
      expect(general?.name).toBe('General Assistant');
    });

    it('should include interview template', () => {
      const interview = PREDEFINED_TEMPLATES.find(t => t.id === 'interview');
      expect(interview).toBeDefined();
      expect(interview?.name).toBe('Interview Coach');
    });

    it('should include sales template', () => {
      const sales = PREDEFINED_TEMPLATES.find(t => t.id === 'sales');
      expect(sales).toBeDefined();
      expect(sales?.name).toBe('Sales Coach');
    });

    it('should include presentation template', () => {
      const presentation = PREDEFINED_TEMPLATES.find(t => t.id === 'presentation');
      expect(presentation).toBeDefined();
      expect(presentation?.name).toBe('Presentation Coach');
    });

    it('should all be marked as predefined', () => {
      PREDEFINED_TEMPLATES.forEach(template => {
        expect(template.isPredefined).toBe(true);
      });
    });
  });
});
