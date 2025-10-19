
import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Square, Copy, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useTokenConsumption } from "@/components/hooks/useTokenConsumption";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { User } from "@/api/entities";

export default function VoiceDictationModal({ isOpen, onClose, onInsert }) {
  const [recordingState, setRecordingState] = useState('ready');
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const recordingStartTimeRef = useRef(null);

  // Max recording duration (seconds)
  const MAX_SECONDS = 90;

  const { consumeTokensForFeature, isCheckingTokens } = useTokenConsumption();
  const { enabled: voiceAiEnabled, isLoading: featureFlagLoading } = useFeatureFlag('voice-ai', {
    currentUser,
    defaultEnabled: false
  });

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    if (isOpen) {
      loadUser();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const isSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (!isSupported()) {
      setError('Voice dictation is not supported in your browser. Please use Chrome, Firefox, or Safari.');
      return;
    }

    // Check feature flag
    if (!voiceAiEnabled) {
      setError('Voice AI feature is not available on your plan.');
      toast.error('Voice AI feature is not available on your plan.');
      return;
    }

    // Check and consume tokens BEFORE starting recording
    const tokenResult = await consumeTokensForFeature('voice-ai');
    if (!tokenResult.success) {
      setError(tokenResult.error || 'Insufficient tokens to use Voice AI.');
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/ogg';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());

        const actualDuration = recordingStartTimeRef.current ?
        (Date.now() - recordingStartTimeRef.current) / 1000 :
        recordingTimeRef.current;

        console.log('Recording stopped. Actual duration:', actualDuration, 'seconds');

        if (actualDuration < 1) {
          setError('Recording too short. Please speak for at least 1 second.');
          setRecordingState('ready');
          setRecordingTime(0);
          recordingTimeRef.current = 0;
          recordingStartTimeRef.current = null;
          return;
        }

        await transcribeAudioData(audioBlob);
      };

      mediaRecorder.start();
      setRecordingState('recording');
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      recordingStartTimeRef.current = Date.now();

      toast.success(`Tokens deducted. Recording started.`);

      timerIntervalRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= MAX_SECONDS) {
            stopRecording();
            return MAX_SECONDS;
          }
          return newTime;
        });
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access is required for voice dictation. Please enable it in your browser settings.');
      } else {
        setError('Failed to start recording. Please check your microphone and try again.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecordingState('processing');

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const transcribeAudioData = async (audioBlob) => {
    try {
      console.log('Sending audio to transcription API, size:', audioBlob.size);

      const audioFile = new File([audioBlob], 'recording.webm', {
        type: audioBlob.type || 'audio/webm'
      });

      console.log('Audio file created:', audioFile.name, audioFile.size, audioFile.type);

      const uploadResult = await base44.integrations.Core.UploadFile({
        file: audioFile
      });

      console.log('Audio uploaded:', uploadResult.file_url);

      const { data } = await base44.functions.invoke('transcribeAudio', {
        file_url: uploadResult.file_url
      });

      console.log('Response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Transcription successful:', data.text?.substring(0, 50));

      setTranscribedText(data.text);
      setRecordingState('ready');
      toast.success('Transcription complete!');
    } catch (error) {
      console.error('Transcription error:', error);
      setError(`Transcription failed: ${error.message || 'Please try again.'}`);
      setRecordingState('ready');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcribedText);
    toast.success('Copied to clipboard');
  };

  const handleInsert = () => {
    if (onInsert && transcribedText) {
      onInsert(transcribedText);
      onClose();
    }
  };

  const handleClose = () => {
    if (recordingState === 'recording') {
      stopRecording();
    }
    setTranscribedText('');
    setError(null);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    recordingStartTimeRef.current = null;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-purple-600" />
            Voice Dictation
          </DialogTitle>
          <DialogDescription>
            Record audio and transcribe it to text using AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Recording Status */}
          <div className="flex flex-col items-center justify-center space-y-4">
            {recordingState === 'ready' &&
            <div className="flex flex-col items-center gap-4">
                <Mic className="w-16 h-16 text-slate-400" />
                <p className="text-slate-600">Ready to record</p>
              </div>
            }

            {recordingState === 'recording' &&
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Mic className="w-16 h-16 text-purple-600 animate-pulse" />
                  <div className="absolute -inset-4 bg-purple-100 rounded-full opacity-30 animate-ping"></div>
                </div>
                <p className="text-lg font-semibold text-purple-600">{formatTime(recordingTime)}</p>
                <p className="text-sm text-slate-500">Recording... (max 90s)</p>
              </div>
            }

            {recordingState === 'processing' &&
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                <p className="text-slate-600">Transcribing audio...</p>
              </div>
            }
          </div>

          {/* Error Display */}
          {error &&
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          }

          {/* Transcribed Text */}
          {transcribedText &&
          <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-slate-700 whitespace-pre-wrap">{transcribedText}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCopy} className="gap-2">
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
                <Button onClick={handleInsert} className="gap-2 bg-purple-600 hover:bg-purple-700">
                  Insert into Editor
                </Button>
              </div>
            </div>
          }

          {/* Recording Controls */}
          <div className="flex justify-center gap-3">
  {recordingState === 'ready' &&
            <Button
              onClick={startRecording}
              disabled={isCheckingTokens || featureFlagLoading || !voiceAiEnabled} className="bg-gradient-to-r text-white px-8 py-6 text-lg font-medium rounded-[25px] hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 from-green-600 via-emerald-500 to-teal-500 hover:from-teal-500 hover:via-emerald-500 hover:to-green-600">

      {isCheckingTokens ?
              <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Checking...
        </> :

              <>
          <Mic className="w-5 h-5 mr-2" />
          Start Recording
        </>
              }
    </Button>
            }

  {recordingState === 'recording' &&
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="px-8 py-6 text-lg">
      <Square className="w-5 h-5 mr-2 fill-current" />
      Stop Recording
    </Button>
            }
          </div>

          <p className="text-xs text-center text-slate-500">
            Audio is processed by Whisper and not stored permanently
          </p>
        </div>
      </DialogContent>
    </Dialog>);

}
