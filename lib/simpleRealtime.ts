import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';
import { realtimeTools } from './realtime-agents-tools';
import { log } from './logger';

// Callback type for transcript updates
export type OnTranscriptCallback = (transcript: string) => void;

export async function startSimpleRealtimeSession(
  token: string,
  model: string = 'gpt-realtime',
  isTranscriptOnly: boolean = false,
  instructions?: string,
  onTranscript?: OnTranscriptCallback
) {
  log.info('[SimpleRealtime] Creating agent...', { model, isTranscriptOnly });

  if (isTranscriptOnly) {
    // TRANSCRIPT-ONLY MODE: Use native WebSocket connection
    // Following official OpenAI documentation for real-time transcription
    // The @openai/agents-realtime SDK does NOT support transcript mode
    log.info('[SimpleRealtime] Using native WebSocket for transcription mode');

    // Create native WebSocket connection with authentication
    const ws = new WebSocket('wss://api.openai.com/v1/realtime?intent=transcription', [
      'realtime',
      'openai-insecure-api-key.' + token
    ]);

    // Promise to wait for connection
    await new Promise<void>((resolve, reject) => {
      // Handle incoming messages
      ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          log.info('[WebSocket Received]', { type: data.type, data });

          // Call callback for completed transcriptions
          if (data.type === 'conversation.item.input_audio_transcription.completed' && onTranscript) {
            const transcript = data.transcript || '';
            if (transcript) {
              onTranscript(transcript);
            }
          }
        } catch (e) {
          log.info('[WebSocket Received RAW]', { data: event.data });
        }
      });

      // Log connection close with code and reason
      ws.addEventListener('close', (event) => {
        // Only log as error if it was an unexpected/unclean close
        // wasClean === true means it was a normal closure (e.g., user stopped session)
        if (event.wasClean) {
          log.info('[WebSocket Closed]', {
            code: event.code,
            reason: event.reason || 'Session stopped by user',
            wasClean: true
          });
        } else {
          log.error('[WebSocket Closed Unexpectedly]', {
            code: event.code,
            reason: event.reason,
            wasClean: false
          });
        }
      });

      ws.addEventListener('open', () => {
        log.info('[SimpleRealtime] WebSocket connected, sending session configuration');

        // Send session configuration for transcription
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            type: 'transcription',
            audio: {
              input: {
                format: { type: 'audio/pcm', rate: 24000 },
                transcription: {
                  model: 'gpt-4o-mini-transcribe',
                  language: 'en'
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 500
                },
                noise_reduction: {
                  type: 'near_field'
                }
              }
            }
          }
        }));

        log.info('[SimpleRealtime] Session configuration sent');
        resolve();
      });

      ws.addEventListener('error', (error) => {
        log.error('[SimpleRealtime] WebSocket error:', error);
        reject(error);
      });
    });

    log.info('Connected successfully to transcription session!');

    // Setup audio capture and streaming
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      log.info('[SimpleRealtime] Microphone access granted');

      // Create AudioContext to process audio
      const audioContext = new AudioContext({ sampleRate: 24000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      // Connect audio pipeline
      source.connect(processor);
      processor.connect(audioContext.destination);

      // Process audio chunks and send to WebSocket
      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);

          // Convert Float32Array to Int16Array (PCM16)
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // Convert to base64
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));

          // Send audio buffer to OpenAI
          ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        }
      };

      log.info('[SimpleRealtime] Audio streaming started');

      // Return WebSocket with audio cleanup
      return {
        ws,
        session: null,
        agent: null,
        cleanup: () => {
          processor.disconnect();
          source.disconnect();
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
        }
      };
    } catch (error) {
      log.error('[SimpleRealtime] Microphone access error:', error);
      ws.close();
      throw new Error('Microphone access required for transcription mode');
    }

  } else {
    // CONVERSATION MODE: Normal conversational agent
    log.info('[SimpleRealtime] Using conversation mode');

    // NOTE: Instructions are now loaded dynamically from the user's selected template
    // via the Edge Function that generates the token. No default prompt needed here.

    const agent = new RealtimeAgent({
      name: 'AI Assistant',
      instructions: instructions || 'You are a helpful AI assistant.',
      tools: realtimeTools,
    });

    log.info('[SimpleRealtime] Agent created with dynamic instructions from template');

    log.info('[SimpleRealtime] Creating session...');
    const session = new RealtimeSession(agent, {
      model: model, // 'gpt-realtime'
      config: {
        outputModalities: ['text']
      }
    });

    log.info('[SimpleRealtime] Session created', {
      model: model,
      outputModalities: ['text']
    });

    // Log history updates specifically
    session.on('history_updated', (history: any) => {
      log.info('[History Updated]', { history });

      // Show the actual messages
      history.forEach((item: any, index: number) => {
        if (item.type === 'message') {
          const content = Array.isArray(item.content) ? item.content[0] : item.content;
          const text = content?.transcript || content?.text || content?.audio?.transcript || '[audio]';
          log.info(`Message ${index}: ${item.role}: ${text}`);
        }
      });
    });

    // Connect
    await session.connect({
      apiKey: token
    });

    log.info('Connected successfully to conversation session!');

    return { agent, session };
  }
}