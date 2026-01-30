# Sessione 28 Gennaio 2026 - Integrazione UI v0 (shadcn/ui)

## Obiettivo

Sostituzione completa della UI esistente con un design moderno basato su **shadcn/ui**, mantenendo:
- Vite come bundler
- Redux Toolkit per lo state management
- Clean Architecture (domain, application, infrastructure, presentation)
- Business logic esistente (SessionManager, CoachingEngine, adapters)

---

## Cosa è stato fatto

### Fase 1: Setup Foundation
- Installate dipendenze: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/react-*` (dialog, tabs, switch, select, alert-dialog, scroll-area, slot, label)
- Installato **Tailwind CSS v4** (`tailwindcss@4.1.18`)
- Creato `/src/index.css` con variabili CSS per tema light/dark (sistema colori oklch)
- Creato `/src/presentation/lib/utils.ts` con utility `cn()` per class merging
- Aggiornato `main.tsx` per importare `index.css`

### Fase 2: Componenti UI shadcn
Creati 13 componenti in `/src/presentation/components/ui/`:

| Componente | Descrizione |
|------------|-------------|
| `button.tsx` | Bottoni con varianti (default, destructive, outline, ghost, link) |
| `card.tsx` | Card container |
| `dialog.tsx` | Modal dialogs (Radix) |
| `tabs.tsx` | Tab navigation (Radix) |
| `input.tsx` | Text input |
| `label.tsx` | Form labels |
| `switch.tsx` | Toggle switch (Radix) |
| `select.tsx` | Dropdown select (Radix) |
| `alert-dialog.tsx` | Confirmation dialogs (Radix) |
| `scroll-area.tsx` | Scrollable containers (Radix) |
| `badge.tsx` | Status badges |
| `separator.tsx` | Visual dividers |
| `alert.tsx` | Alert messages |

### Fase 3: Componenti Feature
Creati/riscritti i componenti principali dell'app:

- **Header** (`/layout/Header.tsx`) - Logo, toggle tema, bottone settings
- **SessionControls** (`/session/SessionControls.tsx`) - Controlli sessione con dialog nome, timer, indicatore recording
- **AudioVisualizer** (`/session/AudioVisualizer.tsx`) - 5 barre animate proporzionali al livello audio
- **TranscriptPanel** (`/transcript/TranscriptPanel.tsx`) - Segmenti con avatar speaker colorati, timestamp, badge confidence
- **SuggestionsPanel** (`/coaching/SuggestionsPanel.tsx`) - Card colorate per tipo suggerimento con icone Lucide
- **SessionHistory** (`/history/SessionHistory.tsx`) - Lista sessioni con stats e AlertDialog per delete
- **SettingsDialog** (`/settings/SettingsDialog.tsx`) - Dialog con 3 tab: API Keys, Audio, AI Coach

### Fase 4: Layout e Pagine
- **MainLayout** semplificato (rimossa sidebar laterale)
- **MainPage** con layout grid a 3 colonne:
  ```
  ┌─────────────────────────────────────────┐
  │              Header                      │
  ├─────────────────────────────────────────┤
  │         SessionControls                  │
  ├──────────────────────────┬──────────────┤
  │                          │ AI Coach     │
  │    TranscriptPanel       ├──────────────┤
  │       (2 cols)           │ Session      │
  │                          │ History      │
  └──────────────────────────┴──────────────┘
  ```
- Rimosse pagine separate Settings e History (integrate nella MainPage)
- App.tsx aggiornato con route singola

### Fase 5: Tema Dark/Light
- Creato `ThemeProvider.tsx` custom (light/dark/system) con persistenza localStorage
- Toggle tema nel Header con icona Sun/Moon

### Fase 6: Cleanup
- Eliminati componenti obsoleti: `/common/` (Button, Card, Input, Select, Toast, Modal)
- Eliminati componenti obsoleti: `/meetingCoach/` (SpeakerPanel, SuggestionList, TranscriptView, etc.)
- Eliminati vecchi componenti: SessionHistoryItem, SessionHistoryList, ApiKeyInput, SettingsPanel, TemplateSelector, CoachingStyleSelector, TextInput, InterimTranscript, MessageList, MessageItem
- Eliminati: `SettingsPage.tsx`, `HistoryPage.tsx`
- Aggiornati tutti i file `index.ts` per esportare solo i nuovi componenti

### Fase 7: Fix e Verifiche
- Fix errori TypeScript: tipi SuggestionTypeValue corretti, proprietà speaker/segment corrette
- Fix errori ESLint: import order, template literals con `String()`, optional chaining non necessario
- **Typecheck**: passa senza errori
- **Lint**: 0 errori (solo 4 warning non critici su react-refresh)

---

## Problema Risolto: Tailwind CSS non generava stili

### Sintomo
L'app si vedeva senza alcuno stile CSS - tutti i componenti impilati verticalmente, nessun colore, nessun layout.

### Causa
Il plugin `@tailwindcss/vite` (v4.1.18) **non scansionava i file sorgente** `.tsx` per estrarre le utility classes. Il CSS generato conteneva solo le definizioni del tema (variabili, colori) ma nessuna classe utility come `.flex`, `.rounded`, `.p-4`, etc.

Tentativo con `@source` directive nel CSS: non ha funzionato né con `"../"`, né con `"./"`, né con `"../src/**/*.{ts,tsx}"`.

Il CLI standalone di Tailwind (`@tailwindcss/cli`) generava correttamente le utility (2243 righe di output), confermando che il problema era specifico del plugin Vite.

### Soluzione
Sostituito `@tailwindcss/vite` con **`@tailwindcss/postcss`**:

1. Installato: `npm install @tailwindcss/postcss postcss --save-dev`
2. Creato `postcss.config.js`:
   ```js
   export default {
     plugins: {
       '@tailwindcss/postcss': {},
     },
   };
   ```
3. Rimosso `@tailwindcss/vite` da `vite.config.ts`
4. Rimossa direttiva `@source` da `index.css`

Dopo il restart del dev server, tutti gli stili funzionano correttamente.

---

## File Creati

| Path | Tipo |
|------|------|
| `src/index.css` | Tailwind CSS v4 + tema |
| `src/presentation/lib/utils.ts` | Utility cn() |
| `src/presentation/components/ui/*.tsx` | 13 componenti shadcn |
| `src/presentation/components/layout/Header.tsx` | Header app |
| `src/presentation/components/session/SessionControls.tsx` | Controlli sessione |
| `src/presentation/components/session/AudioVisualizer.tsx` | Visualizer audio |
| `src/presentation/components/transcript/TranscriptPanel.tsx` | Panel transcript |
| `src/presentation/components/coaching/SuggestionsPanel.tsx` | Panel suggestions |
| `src/presentation/components/history/SessionHistory.tsx` | Panel history |
| `src/presentation/components/settings/SettingsDialog.tsx` | Dialog settings |
| `src/presentation/components/theme/ThemeProvider.tsx` | Provider tema |
| `postcss.config.js` | Config PostCSS per Tailwind |

## File Modificati

| Path | Modifica |
|------|----------|
| `vite.config.ts` | Rimosso plugin @tailwindcss/vite |
| `src/main.tsx` | Aggiunto import index.css |
| `src/presentation/layouts/MainLayout.tsx` | Layout semplificato |
| `src/presentation/pages/MainPage.tsx` | Grid 3 colonne |
| `src/presentation/App.tsx` | ThemeProvider + route singola |
| `src/presentation/pages/index.ts` | Solo MainPage |
| `src/presentation/components/*/index.ts` | Export nuovi componenti |

## File Eliminati

- `src/presentation/components/common/` (6 file)
- `src/presentation/components/meetingCoach/` (5 file)
- `src/presentation/components/history/SessionHistoryItem.tsx`
- `src/presentation/components/history/SessionHistoryList.tsx`
- `src/presentation/components/settings/ApiKeyInput.tsx`
- `src/presentation/components/settings/SettingsPanel.tsx`
- `src/presentation/components/settings/TemplateSelector.tsx`
- `src/presentation/components/settings/CoachingStyleSelector.tsx`
- `src/presentation/components/transcript/TextInput.tsx`
- `src/presentation/components/transcript/InterimTranscript.tsx`
- `src/presentation/components/transcript/MessageList.tsx`
- `src/presentation/components/transcript/MessageItem.tsx`
- `src/presentation/pages/SettingsPage.tsx`
- `src/presentation/pages/HistoryPage.tsx`

---

## Stack Tecnologico Risultante

- **UI Framework**: React 19 + shadcn/ui + Radix UI
- **CSS**: Tailwind CSS v4 (via PostCSS)
- **Icons**: Lucide React
- **State**: Redux Toolkit
- **Bundler**: Vite 6.4
- **Linguaggio**: TypeScript strict
