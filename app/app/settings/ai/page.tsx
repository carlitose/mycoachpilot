// ship-fast-ts/app/app/settings/ai/page.tsx

// Ora serve 'use client' perchè la pagina padre contiene il form client-side
'use client'

import React from 'react';

// Importa il componente del form
import AIConfigForm from '@/components/ai-app/settings/AIConfigForm';

export default function AISettingsPage() {

  // La logica è ora dentro AIConfigForm

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 border-b border-base-300 pb-4">AI Provider Configuration</h1>

      {/* Contenuto della pagina delle impostazioni */}
      <p className="mb-6 text-base-content/70 text-sm md:text-base">
        Configure the AI provider that the assistant will use for processing your requests.
        Choose between standard OpenAI or Azure OpenAI Service and provide the necessary credentials.
      </p>

      {/* --- Rendering del Form --- */}
      <div className="max-w-2xl mx-auto">
           <AIConfigForm />
      </div>
      {/* --- Fine Rendering Form --- */}

    </div>
  );
} 