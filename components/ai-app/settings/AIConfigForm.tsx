'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger';
import TemplateSelector from './TemplateSelector';
import CustomTemplateManager from './CustomTemplateManager';
import toast from 'react-hot-toast';

export default function AIConfigForm() {
  const [config, setConfig] = useState<any>({
    openai_api_key: '',
    selected_template_id: null,
    selected_custom_template_id: null,
    custom_instructions: '',
  });
  const [mode, setMode] = useState<'conversation' | 'transcript_only'>('conversation');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);

  const router = useRouter();

  useEffect(() => {
    loadConfig();
    loadTemplates();
  }, []);

  const loadConfig = () => {
    setIsLoading(true);
    try {
      const savedConfig = localStorage.getItem('ai_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        setMode(parsed.mode || 'conversation');
        setCustomInstructions(parsed.custom_instructions || '');
      }
    } catch (err: any) {
      log.error('Error loading config:', err);
      toast.error('Failed to load configuration from local storage');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = () => {
    try {
      const savedTemplates = localStorage.getItem('custom_templates');
      if (savedTemplates) {
        setCustomTemplates(JSON.parse(savedTemplates));
      }
    } catch (error) {
      log.error('Error loading templates:', error);
    }
  };

  const handleTemplateSelect = (templateId: string, isCustom: boolean) => {
    setConfig({
      ...config,
      selected_template_id: isCustom ? null : templateId,
      selected_custom_template_id: isCustom ? templateId : null,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Validation: conversation mode requires a template selection
      if (mode === 'conversation' && !config?.selected_template_id && !config?.selected_custom_template_id) {
        toast.error('Please select a template for conversation mode');
        setIsSaving(false);
        return;
      }

      const newConfig = {
        openai_api_key: config.openai_api_key,
        mode: mode,
        selected_template_id: config.selected_template_id,
        selected_custom_template_id: config.selected_custom_template_id,
        custom_instructions: customInstructions?.trim() || null,
      };

      localStorage.setItem('ai_config', JSON.stringify(newConfig));
      setConfig(newConfig);

      toast.success('Configuration saved locally!');
    } catch (err: any) {
      log.error('Save config error:', err);
      toast.error('An error occurred while saving configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  // Callback for CustomTemplateManager to update local storage
  const handleTemplatesChange = (newTemplates: any[]) => {
      setCustomTemplates(newTemplates);
      localStorage.setItem('custom_templates', JSON.stringify(newTemplates));
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* SECTION 1: AI Configuration */}
      <section className="space-y-8 mb-12">
        <div>
          <h2 className="text-2xl font-bold mb-2 !text-gray-900 dark:!text-gray-100">AI Assistant Configuration</h2>
          <p className="!text-gray-700 dark:!text-gray-300">
            Customize your AI assistant by selecting a template and adding optional instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* OpenAI API Key */}
          <div className="card bg-base-100 border border-base-300 p-6">
            <h3 className="text-xl font-bold mb-4 !text-gray-900 dark:!text-gray-100">OpenAI API Key</h3>
            <div className="space-y-4">
              <p className="text-sm !text-gray-700 dark:!text-gray-300">
                 Enter your OpenAI API key to enable the AI assistant. You can find this in your <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="link link-primary">OpenAI Dashboard</a>.
              </p>
              <input
                type="password"
                placeholder="sk-..."
                className="input input-bordered w-full"
                value={config.openai_api_key || ''}
                onChange={(e) => setConfig({ ...config, openai_api_key: e.target.value })}
              />
              <p className="text-xs !text-gray-500">
                Your key is stored locally in your browser and used to communicate directly with OpenAI.
              </p>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="card bg-base-100 border border-base-300 p-6">
            <h3 className="text-xl font-bold mb-4 !text-gray-900 dark:!text-gray-100">Select Mode</h3>
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-base-200"
                     style={{ borderColor: mode === 'conversation' ? 'rgb(59, 130, 246)' : 'transparent' }}>
                <input
                  type="radio"
                  name="mode"
                  value="conversation"
                  checked={mode === 'conversation'}
                  onChange={(e) => setMode(e.target.value as 'conversation' | 'transcript_only')}
                  className="radio radio-primary mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-lg !text-gray-900 dark:!text-gray-100">Conversation Mode</div>
                  <p className="text-sm !text-gray-600 dark:!text-gray-400 mt-1">
                    Full AI assistant with templates and custom instructions.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-base-200"
                     style={{ borderColor: mode === 'transcript_only' ? 'rgb(34, 197, 94)' : 'transparent' }}>
                <input
                  type="radio"
                  name="mode"
                  value="transcript_only"
                  checked={mode === 'transcript_only'}
                  onChange={(e) => setMode(e.target.value as 'conversation' | 'transcript_only')}
                  className="radio radio-success mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-lg !text-gray-900 dark:!text-gray-100 flex items-center gap-2">
                    Transcription Only
                  </div>
                  <p className="text-sm !text-gray-600 dark:!text-gray-400 mt-1">
                    Real-time speech transcription only. No AI responses.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Template Selection - Only visible in conversation mode */}
          {mode === 'conversation' && (
            <div className="card bg-base-100 border border-base-300 p-6">
              <h3 className="text-xl font-bold mb-4 !text-gray-900 dark:!text-gray-100">Select AI Assistant Type</h3>
              <TemplateSelector
                selectedTemplateId={config?.selected_template_id}
                selectedCustomTemplateId={config?.selected_custom_template_id}
                onSelect={handleTemplateSelect}
              />
            </div>
          )}

          {/* Custom Instructions - Only visible in conversation mode */}
          {mode === 'conversation' && (
            <div className="card bg-base-100 border border-base-300 p-6">
            <h3 className="text-xl font-bold mb-2 !text-gray-900 dark:!text-gray-100">Additional Instructions (Optional)</h3>
            <p className="text-sm !text-gray-700 dark:!text-gray-300 mb-4">
              Add custom instructions to extend or override the selected template behavior.
            </p>

            <textarea
              className="textarea textarea-bordered w-full h-32 font-mono text-sm !text-gray-900 dark:!text-gray-100 placeholder:!text-gray-500 dark:placeholder:!text-gray-400"
              placeholder="e.g., Focus on Python questions. I'm interviewing for a senior role at a fintech company."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
            />

            <div className="mt-4 p-3 bg-info/10 border border-info/30 rounded-lg">
              <p className="text-sm font-semibold text-info mb-2">💡 Tips for custom instructions:</p>
              <ul className="text-xs !text-gray-700 dark:!text-gray-300 space-y-1 list-disc list-inside">
                <li>Specify your preferred coding language or framework</li>
                <li>Add context about your role or industry</li>
                <li>Define specific topics to focus on or avoid</li>
                <li>Set the level of detail you prefer in responses</li>
              </ul>
            </div>
          </div>
          )}

          {/* Save Button */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              ← Back
            </Button>
            <Button type="submit" disabled={isSaving || isLoading} className="w-full sm:flex-1">
              {isSaving ? (
                <>
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* DIVIDER */}
      <div className="divider my-12 !text-gray-600 dark:!text-gray-400">Template Management</div>

      {/* SECTION 2: Custom Template Manager */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 !text-gray-900 dark:!text-gray-100">Manage Custom Templates</h2>
          <p className="text-sm !text-gray-700 dark:!text-gray-300">
            Create and manage your own reusable AI assistant templates.
          </p>
        </div>

        <div className="card bg-base-100 border border-base-300 p-6">
          <CustomTemplateManager templates={customTemplates} onTemplatesChange={handleTemplatesChange} />
        </div>
      </section>
    </div>
  );
}
