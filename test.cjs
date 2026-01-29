const { SystemAudioRecorder } = require('coreaudio-node');

const recorder = new SystemAudioRecorder({
  deviceId: 'BlackHole2ch_UID'
});

recorder.events.on('data', (event) => {
  const buffer = event.data;
  const hasAudio = buffer.some(b => b !== 0);
  console.log(`Audio: ${buffer.length} bytes, has sound: ${hasAudio}`);
});

recorder.start();

setTimeout(() => recorder.stop(), 5000);