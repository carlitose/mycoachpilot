"use client";

// Importa il componente principale dell'AI dalla sua nuova posizione
import ChatGPTInterface from "@/components/ai-app/ChatGPTInterface";

// Questa è la pagina principale per la sezione protetta /app
export default function AppPage() {

  return (
    <main>
      {/* Renderizza l'interfaccia AI */}
      <ChatGPTInterface />
    </main>
  );
} 