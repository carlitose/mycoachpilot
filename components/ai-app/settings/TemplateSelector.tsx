'use client';

import { useState, useEffect } from 'react';
import { log } from '@/lib/logger';
import { SYSTEM_TEMPLATES } from '@/lib/templates';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  system_prompt: string;
  icon?: string;
  sort_order?: number;
}

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  selectedCustomTemplateId: string | null;
  onSelect: (templateId: string, isCustom: boolean) => void;
}

export default function TemplateSelector({
  selectedTemplateId,
  selectedCustomTemplateId,
  onSelect,
}: TemplateSelectorProps) {
  const [systemTemplates, setSystemTemplates] = useState<Template[]>([]);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = () => {
    try {
      // Load system templates
      setSystemTemplates(SYSTEM_TEMPLATES);

      // Load custom templates from localStorage
      const savedTemplates = localStorage.getItem('custom_templates');
      if (savedTemplates) {
        setCustomTemplates(JSON.parse(savedTemplates));
      } else {
        setCustomTemplates([]);
      }
    } catch (error) {
      log.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (template: Template, isCustom: boolean) => {
    onSelect(template.id, isCustom);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Templates Section */}
      <div>
        <h3 className="font-semibold text-lg mb-3 !text-gray-900 dark:!text-gray-100">System Templates</h3>
        <div className="space-y-2">
          {systemTemplates.map((template) => (
            <label
              key={template.id}
              className={`
                flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer
                transition-all hover:border-primary/50 hover:shadow-md
                ${
                  selectedTemplateId === template.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-base-300'
                }
              `}
            >
              <input
                type="radio"
                name="template"
                className="radio radio-primary mt-1 flex-shrink-0"
                checked={selectedTemplateId === template.id}
                onChange={() => handleSelect(template, false)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl flex-shrink-0">{template.icon || '🤖'}</span>
                  <span className="font-medium !text-gray-900 dark:!text-gray-100">{template.name}</span>
                </div>
                <p className="text-sm !text-gray-700 dark:!text-gray-300 mt-1">
                  {template.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Templates Section */}
      <div>
        <h3 className="font-semibold text-lg mb-3 !text-gray-900 dark:!text-gray-100">My Custom Templates</h3>
        {customTemplates.length > 0 ? (
          <div className="space-y-2">
            {customTemplates.map((template) => (
              <label
                key={template.id}
                className={`
                  flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer
                  transition-all hover:border-primary/50 hover:shadow-md
                  ${
                    selectedCustomTemplateId === template.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-base-300'
                  }
                `}
              >
                <input
                  type="radio"
                  name="template"
                  className="radio radio-primary mt-1 flex-shrink-0"
                  checked={selectedCustomTemplateId === template.id}
                  onChange={() => handleSelect(template, true)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl flex-shrink-0">✨</span>
                    <span className="font-medium !text-gray-900 dark:!text-gray-100">{template.name}</span>
                  </div>
                  <p className="text-sm !text-gray-700 dark:!text-gray-300 mt-1 line-clamp-2">
                    {template.system_prompt.substring(0, 150)}...
                  </p>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm !text-gray-600 dark:!text-gray-400">
            No custom templates created yet. Use the &quot;Manage Custom Templates&quot; section below to create one.
          </p>
        )}
      </div>
    </div>
  );
}
