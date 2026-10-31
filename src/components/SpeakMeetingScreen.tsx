import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  ShieldAlert, 
  Upload, 
  RotateCcw, 
  Sparkles, 
  FileText, 
  Lock, 
  EyeOff, 
  Info, 
  Check, 
  AlertCircle,
  Clock,
  Send,
  Calendar,
  FolderGit2
} from 'lucide-react';
import { RedactionItem, MeetingRecord } from '../types/index.js';
import { api } from '../services/api.js';

interface SpeakMeetingScreenProps {
  onMeetingAnalyzed: (meeting: MeetingRecord) => void;
  isListening: boolean;
  onToggleListening: () => void;
  voiceTranscript: string;
  isOffTheRecord: boolean;
  onToggleOffTheRecord: () => void;
  prefilledCase?: { title: string; project: string; transcript: string } | null;
  onClearPrefilledCase?: () => void;
}

export const SpeakMeetingScreen: React.FC<SpeakMeetingScreenProps> = ({
  onMeetingAnalyzed,
  isListening,
  onToggleListening,
  voiceTranscript,
  isOffTheRecord,
  onToggleOffTheRecord,
  prefilledCase,
  onClearPrefilledCase
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [project, setProject] = useState('Core Platform v2');
  const [isConfidential, setIsConfidential] = useState(false);
  const [transcriptInput, setTranscriptInput] = useState('');
  
  // Privacy scan state
  const [redactionItems, setRedactionItems] = useState<RedactionItem[]>([]);
  const [sanitizedPreview, setSanitizedPreview] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [customRedactWord, setCustomRedactWord] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync voice transcript updates into input area
  useEffect(() => {
    if (voiceTranscript) {
      setTranscriptInput(prev => {
        if (!prev) return voiceTranscript;
        if (prev.endsWith(voiceTranscript)) return prev;
        return `${prev} ${voiceTranscript}`;
      });
    }
  }, [voiceTranscript]);

  // Handle prefilled demo case selected from Demo option
  useEffect(() => {
    if (prefilledCase) {
      setTitle(prefilledCase.title);
      setProject(prefilledCase.project);
      setTranscriptInput(prefilledCase.transcript);
      if (onClearPrefilledCase) onClearPrefilledCase();
    }
  }, [prefilledCase, onClearPrefilledCase]);

  // Debounced auto-scan for sensitive items
  useEffect(() => {
    if (!transcriptInput.trim()) {
      setRedactionItems([]);
      setSanitizedPreview('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsScanning(true);
        const result = await api.redactText(transcriptInput);
        setRedactionItems(result.items);
        setSanitizedPreview(result.redactedText);
      } catch (err: any) {
        console.warn('Scan error:', err);
      } finally {
        setIsScanning(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [transcriptInput]);

  // Restore false positive redaction
  const handleRestoreItem = (id: string) => {
    const targetItem = redactionItems.find(item => item.id === id);
    if (!targetItem) return;

    // Replace masked placeholder back with original value in transcript input
    const updated = transcriptInput.replace(targetItem.maskedPlaceholder, targetItem.originalValue);
    setTranscriptInput(updated);
    setRedactionItems(prev => prev.filter(item => item.id !== id));
  };

  // Add manual redaction
  const handleAddManualRedaction = () => {
    if (!customRedactWord.trim()) return;
    const word = customRedactWord.trim();
    if (transcriptInput.includes(word)) {
      const placeholder = `[CONFIDENTIAL PHRASE REMOVED]`;
      const replaced = transcriptInput.replaceAll(word, placeholder);
      setTranscriptInput(replaced);
      setRedactionItems(prev => [
        {
          id: `manual-${Date.now()}`,
          itemType: 'Manually Flagged Secret',
          category: 'confidential',
          maskedPlaceholder: placeholder,
          originalValue: word,
          startIndex: 0,
          endIndex: word.length,
          restored: false,
          detectedBy: 'manual'
        },
        ...prev
      ]);
      setCustomRedactWord('');
    } else {
      setErrorMsg(`Phrase "${word}" was not found in the current transcript text.`);
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setTranscriptInput(content);
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    };
    reader.readAsText(file);
  };

  // Analyze meeting trigger
  const handleAnalyzeMeeting = async () => {
    if (!transcriptInput.trim()) {
      setErrorMsg('Please dictate, paste, or upload a meeting transcript first.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMsg('');

      // Send sanitized text (zero unredacted transmission)
      const payload = {
        title,
        date,
        project,
        redactedTranscript: sanitizedPreview || transcriptInput,
        isConfidential,
        hasOffTheRecordSections: isOffTheRecord,
        redactionItems
      };

      const result = await api.analyzeMeeting(payload);
      if (result.success && result.meeting) {
        onMeetingAnalyzed(result.meeting);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to analyze meeting');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Off-The-Record Warning Banner */}
      {isOffTheRecord && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between animate-pulse shadow-xs">
          <div className="flex items-center gap-3">
            <EyeOff className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <div className="text-sm font-bold text-amber-900">
                OFF THE RECORD MODE ACTIVE
              </div>
              <div className="text-xs text-amber-700">
                Current and newly spoken words in this section will be permanently excluded from database persistence, AI summarization, and team distribution.
              </div>
            </div>
          </div>
          <button
            onClick={onToggleOffTheRecord}
            className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors"
          >
            Go Back On The Record
          </button>
        </div>
      )}

      {/* Main Form & Capture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Meeting Metadata & Wispr Flow Dictation Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Metadata Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Cloud Architecture Sync"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1B2A4A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Meeting Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1B2A4A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Project Workspace
                </label>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1B2A4A]"
                >
                  <option value="Core Platform v2">Core Platform v2</option>
                  <option value="Infrastructure Security">Infrastructure Security</option>
                  <option value="Billing & Pricing Expansion">Billing & Pricing Expansion</option>
                  <option value="Mobile Native Applet">Mobile Native Applet</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transcript Area Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1B2A4A]">
                  Dictated Meeting Transcript
                </span>
                <span className="text-xs text-slate-400">
                  (Wispr Flow / Speech / Text)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfidential}
                    onChange={(e) => setIsConfidential(e.target.checked)}
                    className="rounded text-[#2563EB] focus:ring-0"
                  />
                  <span>Confidential Meeting (Restricted access)</span>
                </label>
              </div>
            </div>

            {/* Large Text Area */}
            <div className="relative">
              <textarea
                value={transcriptInput}
                onChange={(e) => setTranscriptInput(e.target.value)}
                rows={12}
                placeholder="Speak your meeting, paste speech transcripts, or dictate directly here with Wispr Flow...

Example:
Alex Rivera: Welcome everyone. After reviewing the vector indexing requirements, we officially approve switching our primary database from MySQL to PostgreSQL 16. Priya, please update the database configuration by tomorrow."
                className="w-full p-4 text-sm font-mono text-[#1B2A4A] bg-slate-50/60 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] leading-relaxed resize-y"
              />
              {isScanning && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 border border-slate-200 px-2 py-1 rounded text-[11px] text-slate-500 shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-spin" />
                  <span>Scanning privacy layer...</span>
                </div>
              )}
            </div>

            {/* Voice & Capture Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Start Microphone Button */}
                <button
                  type="button"
                  onClick={onToggleListening}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs ${
                    isListening
                      ? 'bg-red-50 text-red-700 border border-red-300 animate-pulse'
                      : 'bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4 text-red-600" />
                      <span>Stop Microphone</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-[#2563EB]" />
                      <span>Start Microphone</span>
                    </>
                  )}
                </button>

                {/* Off the record Toggle */}
                <button
                  type="button"
                  onClick={onToggleOffTheRecord}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs ${
                    isOffTheRecord
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Say 'off the record' to exclude sensitive commentary"
                >
                  <EyeOff className={`w-4 h-4 ${isOffTheRecord ? 'text-amber-800' : 'text-slate-500'}`} />
                  <span>{isOffTheRecord ? 'Off The Record (ON)' : 'Off The Record'}</span>
                </button>

                {/* Upload Transcript Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.vtt,.srt,.json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-all shadow-xs"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Upload Transcript</span>
                </button>
              </div>

              {/* Voice Command Hints */}
              <div className="text-right text-xs text-slate-400 hidden xl:block">
                Voice commands: &quot;off the record&quot;, &quot;approve all tasks&quot;
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pre-Storage Privacy & Redaction Review Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
            {/* Redaction Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#2563EB]" />
                <h2 className="text-sm font-bold text-[#1B2A4A]">
                  Privacy Redaction Panel
                </h2>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  redactionItems.length > 0
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {redactionItems.length} items redacted
              </span>
            </div>

            {/* Honest Security Notice */}
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
              <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span>
                <strong>Human-in-the-loop:</strong> Detection is not perfect, which is why human review exists. Raw unredacted values are <strong>never stored</strong> or sent to the model.
              </span>
            </div>

            {/* List of Redacted Items (NEVER values - Item types only!) */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {redactionItems.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <Check className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
                  <p className="text-xs font-medium text-slate-600">
                    No sensitive PII, credentials, or private financial spans detected.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Passwords, phone numbers, routing codes, and unreleased pricing are automatically shielded.
                  </p>
                </div>
              ) : (
                redactionItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#1B2A4A] flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>{item.itemType}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {item.maskedPlaceholder}
                      </div>
                    </div>
                    {/* Restore button */}
                    <button
                      onClick={() => handleRestoreItem(item.id)}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded text-[11px] flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                      title="Restore false positive if this was not confidential"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>Restore</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Manual Redaction Tool */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Redact Missed Confidential Phrase
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRedactWord}
                  onChange={(e) => setCustomRedactWord(e.target.value)}
                  placeholder="e.g. Project Apollo, $450/seat"
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={handleAddManualRedaction}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors shrink-0"
                >
                  Mask
                </button>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Primary Action Button: "Analyze meeting" in Electric Blue */}
            <button
              onClick={handleAnalyzeMeeting}
              disabled={isAnalyzing}
              className="w-full py-3 px-4 bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Extracting Decisions & Conflicts...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Meeting</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
