import { useState, useRef, useCallback, useEffect } from 'react';

export type RecorderState = 'idle' | 'recording' | 'processing';

interface UseAudioRecorderReturn {
  state: RecorderState;
  volume: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle');
  const [volume, setVolume]  = useState(0);
  const [error, setError]    = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const animFrameRef     = useRef<number | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const audioCtxRef      = useRef<AudioContext | null>(null);

  const startVolumeMonitor = (stream: MediaStream) => {
    const ctx      = new AudioContext();
    audioCtxRef.current = ctx;
    const source   = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setVolume(Math.min(avg / 128, 1));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  };

  const stopVolumeMonitor = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    analyserRef.current = null;
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state !== 'closed') {
      ctx.close().catch(() => {});
    }
    audioCtxRef.current = null;
    setVolume(0);
  };

  // Cleanup на размонтировании: закрываем AudioContext и освобождаем поток
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
      audioCtxRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const mimeRef = useRef<string>('audio/webm');

  const pickMime = (): string => {
    // Android WebView часто не поддерживает голый 'audio/webm', но нормально
    // хавает с уточнённым codec, а на некоторых устройствах — только mp4/ogg.
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      '', // финальный fallback — пусть браузер сам выберет
    ];
    for (const m of candidates) {
      if (!m || (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m))) return m;
    }
    return '';
  };

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mime = pickMime();
      mimeRef.current = mime || 'audio/webm';
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      // Меньший тайм-слайс = чаще обновляются чанки. Стоп-тап минимум ~150мс
      // всё равно нужен, иначе Groq не примет пустышку. Это ниже валидируем.
      recorder.start(50);
      setState('recording');
      startVolumeMonitor(stream);
    } catch (err) {
      setError('Microphone access denied or unavailable');
      console.error(err);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    stopVolumeMonitor();
    const recorder = mediaRecorderRef.current;
    const stream   = streamRef.current;
    if (!recorder || recorder.state === 'inactive') return null;

    return new Promise((resolve) => {
      recorder.onstop = () => {
        stream?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        setState('idle');
        // Отбраковываем совсем пустышки (<1 КБ ≈ короче ~50мс тишины).
        resolve(blob.size > 1024 ? blob : null);
      };
      // requestData() принудительно сбрасывает буфер в ondataavailable перед stop —
      // спасает при супер-коротком тапе, когда обычный timeslice не успел выстрелить.
      try { recorder.requestData(); } catch { /* not supported everywhere */ }
      recorder.stop();
      setState('processing');
    });
  }, []);

  return { state, volume, startRecording, stopRecording, error };
}
