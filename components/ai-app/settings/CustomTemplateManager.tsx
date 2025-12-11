'use client';

import { useState } from 'react';
import { log } from '@/lib/logger';
import toast from 'react-hot-toast';

interface CustomTemplate {
  id: string;
  name: string;
  system_prompt: string;
  created_at?: string;
  updated_at?: string;
}

interface CustomTemplateManagerProps {
  templates: CustomTemplate[];
  onTemplatesChange: (templates: CustomTemplate[]) => void;
}

export default function CustomTemplateManager({
  templates,
  onTemplatesChange,
}: CustomTemplateManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', system_prompt: '' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.system_prompt.trim()) {
      toast.error('Name and prompt are required');
      return;
    }

    setLoading(true);
    try {
      const newTemplate: CustomTemplate = {
        id: crypto.randomUUID(),
        name: formData.name,
        system_prompt: formData.system_prompt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const newTemplates = [...templates, newTemplate];
      onTemplatesChange(newTemplates);

      toast.success('Template created successfully!');
      setFormData({ name: '', system_prompt: '' });
      setIsCreating(false);
    } catch (error: any) {
      log.error('Error creating template:', error);
      toast.error(error.message || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.name.trim() && !formData.system_prompt.trim()) {
      toast.error('At least one field must be provided');
      return;
    }

    setLoading(true);
    try {
      const newTemplates = templates.map(t => {
        if (t.id === id) {
          return {
            ...t,
            name: formData.name,
            system_prompt: formData.system_prompt,
            updated_at: new Date().toISOString(),
          };
        }
        return t;
      });

      onTemplatesChange(newTemplates);

      toast.success('Template updated successfully!');
      setEditingId(null);
      setFormData({ name: '', system_prompt: '' });
    } catch (error: any) {
      log.error('Error updating template:', error);
      toast.error(error.message || 'Failed to update template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const newTemplates = templates.filter(t => t.id !== id);
      onTemplatesChange(newTemplates);

      toast.success('Template deleted successfully!');
    } catch (error: any) {
      log.error('Error deleting template:', error);
      toast.error(error.message || 'Failed to delete template');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (template: CustomTemplate) => {
    setEditingId(template.id);
    setFormData({ name: template.name, system_prompt: template.system_prompt });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: '', system_prompt: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg !text-gray-900 dark:!text-gray-100">My Custom Templates</h3>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
            setFormData({ name: '', system_prompt: '' });
          }}
          disabled={loading}
        >
          + Create Template
        </button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="card bg-base-200 p-4 space-y-3">
          <h4 className="font-semibold text-sm">
            {editingId ? 'Edit Template' : 'Create New Template'}
          </h4>
          <div className="space-y-3">
            <div>
              <label className="label">
                <span className="label-text">Template Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g., My Marketing Assistant"
                className="input input-bordered w-full"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">System Prompt</span>
              </label>
              <textarea
                placeholder="You are a helpful assistant who..."
                className="textarea textarea-bordered w-full h-40 font-mono text-sm"
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                disabled={loading}
              />
              <label className="label">
                <span className="label-text-alt !text-gray-600 dark:!text-gray-400">
                  Define how the AI should behave. Be specific about its role, knowledge, and
                  response style.
                </span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => (editingId ? handleUpdate(editingId) : handleCreate())}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Saving...
                </>
              ) : editingId ? (
                'Update Template'
              ) : (
                'Create Template'
              )}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={cancelEdit} disabled={loading}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Template List */}
      {templates.length > 0 ? (
        <div className="space-y-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="card bg-base-100 border border-base-300 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <h4 className="font-medium truncate !text-gray-900 dark:!text-gray-100">{template.name}</h4>
                  </div>
                  <p className="text-sm !text-gray-700 dark:!text-gray-300 mt-2 line-clamp-3 whitespace-pre-wrap">
                    {template.system_prompt}
                  </p>
                  {template.created_at && (
                    <p className="text-xs !text-gray-600 dark:!text-gray-400 mt-2">
                      Created {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => startEdit(template)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                    onClick={() => handleDelete(template.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isCreating && (
          <div className="text-center py-8 !text-gray-600 dark:!text-gray-400">
            <p>No custom templates yet. Create your first template to get started!</p>
          </div>
        )
      )}
    </div>
  );
}
