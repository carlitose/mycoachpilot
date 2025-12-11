import React from 'react';

interface TabAudioCaptureGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCapture: () => void;
}

const TabAudioCaptureGuide: React.FC<TabAudioCaptureGuideProps> = ({ 
  isOpen, 
  onClose, 
  onStartCapture 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-700 my-8">
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Capture Tab Audio - Better Solution!</h2>
            <button onClick={onClose} className="btn btn-ghost btn-circle">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
            <div>
              <h3 className="font-bold text-green-200 mb-2">No BlackHole Required!</h3>
              <p className="text-green-100">This method captures audio directly from Chrome tabs without any additional software.</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="text-xl font-semibold">How it works:</h3>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold">1</span>
                <div>
                  <p className="font-medium text-lg">Open Google Meet in a Chrome tab</p>
                  <p className="text-slate-300">Make sure it&apos;s in a separate tab, not this one</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold">2</span>
                <div>
                  <p className="font-medium text-lg">Click &quot;Start Tab Capture&quot; below</p>
                  <p className="text-slate-300">Chrome will show a sharing dialog</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold">3</span>
                <div>
                  <p className="font-medium text-lg">Select the Google Meet tab</p>
                  <p className="text-slate-300">Choose &quot;Chrome Tab&quot; at the top, then pick the Meet tab</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold">4</span>
                <div>
                  <p className="font-medium text-lg">Check &quot;Share tab audio&quot;</p>
                  <p className="text-amber-300 font-semibold">⚠️ This checkbox is CRUCIAL - must be checked!</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
            <h4 className="font-medium mb-2">Example Dialog:</h4>
            <div className="text-sm text-slate-300 space-y-1">
              <p>🖥️ Chrome Tab → [Your Google Meet Tab]</p>
              <p>☑️ Share tab audio</p>
              <p className="text-blue-400">Click &quot;Share&quot;</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={onStartCapture}
              className="btn btn-primary flex-1"
            >
              Start Tab Capture
            </button>
            <button 
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 text-sm text-slate-400">
            <p><strong>Note:</strong> This captures both video and audio from the tab. The video is ignored, we only use the audio.</p>
          </div>

          <div className="mt-4 bg-amber-500/20 border border-amber-500/50 rounded-lg p-4">
            <h4 className="font-medium text-amber-200 mb-2">⚠️ If tab audio sharing doesn&apos;t work:</h4>
            <p className="text-amber-100">Use two different browsers - for example:</p>
            <ul className="list-disc list-inside mt-2 text-amber-100">
              <li>Chrome for the interview (Google Meet, Zoom, etc.)</li>
              <li>Safari for My Coach Pilot</li>
            </ul>
            <p className="text-amber-100 mt-2">Then use microphone capture to pick up the audio from your speakers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabAudioCaptureGuide;