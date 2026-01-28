import type { ReactNode } from 'react';

import { useSettings } from '@presentation/hooks';

import { Select, type SelectOption } from '../common';

interface TemplateSelectorProps {
  value: string;
  onChange: (templateId: string) => void;
  disabled?: boolean;
}

export function TemplateSelector({ value, onChange, disabled }: TemplateSelectorProps): ReactNode {
  const { templates } = useSettings();

  const options: SelectOption[] = templates.map((template) => ({
    value: template.id,
    label: `${template.icon} ${template.name}`,
  }));

  return (
    <Select
      label="Default Template"
      value={value}
      onChange={(e) => { onChange(e.target.value); }}
      options={options}
      disabled={disabled}
      helperText="Template to use for new sessions"
    />
  );
}
