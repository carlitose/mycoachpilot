import { useState, useCallback, type ChangeEvent, type ReactNode } from 'react';

import { Input, Button } from '../common';

interface ApiKeyInputProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  helperText?: string;
  validationPrefix?: string;
  disabled?: boolean;
}

export function ApiKeyInput({
  label,
  value,
  onChange,
  placeholder = 'Enter API key...',
  helperText,
  validationPrefix,
  disabled,
}: ApiKeyInputProps): ReactNode {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasKey = value !== null && value.length > 0;
  const maskedValue = hasKey ? `${value.slice(0, 7)}${'•'.repeat(20)}` : '';

  const handleStartEdit = useCallback(() => {
    setTempValue('');
    setError(null);
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setTempValue('');
    setError(null);
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(() => {
    const trimmed = tempValue.trim();

    if (!trimmed) {
      setError('API key is required');
      return;
    }

    if (validationPrefix && !trimmed.startsWith(validationPrefix)) {
      setError(`API key should start with "${validationPrefix}"`);
      return;
    }

    onChange(trimmed);
    setTempValue('');
    setError(null);
    setIsEditing(false);
  }, [tempValue, onChange, validationPrefix]);

  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
    setError(null);
  }, []);

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Input
          label={label}
          type={showKey ? 'text' : 'password'}
          value={tempValue}
          onChange={handleChange}
          placeholder={placeholder}
          {...(error ? { error } : {})}
          {...(helperText ? { helperText } : {})}
          disabled={disabled}
          autoFocus
        />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={disabled}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={disabled || !tempValue.trim()}>
            Save
          </Button>
          <button
            type="button"
            onClick={() => { setShowKey(!showKey); }}
            className="ml-auto text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {hasKey ? (
          <>
            <div className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {maskedValue}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleStartEdit} disabled={disabled}>
              Change
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear} disabled={disabled}>
              Clear
            </Button>
          </>
        ) : (
          <>
            <div className="flex-1 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
              <span className="text-sm text-gray-400 dark:text-gray-500">
                No API key configured
              </span>
            </div>
            <Button size="sm" onClick={handleStartEdit} disabled={disabled}>
              Add Key
            </Button>
          </>
        )}
      </div>
      {helperText !== undefined && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}
