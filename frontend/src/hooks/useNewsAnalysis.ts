import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { NewsAnalyzeRequest, NewsAnalyzeResponse } from '../types/news';

export interface SampleDisruptionPreset {
  id: string;
  title: string;
  category: string;
  text: string;
}

export const SAMPLE_PRESETS: SampleDisruptionPreset[] = [
  {
    id: 'rotterdam-strike',
    title: 'Rotterdam Port Strike',
    category: 'Labor Strike',
    text: 'Due to a major port strike in Rotterdam, shipments from European electronics suppliers are experiencing severe delays and container vessel backlogs across the Netherlands.',
  },
  {
    id: 'taiwan-earthquake',
    title: 'Taiwan Semiconductor Hub Earthquake',
    category: 'Natural Disaster',
    text: 'A powerful 6.8 magnitude earthquake near Hsinchu and Taipei has caused emergency shut downs at major semiconductor fabrication plants and cleanrooms in Taiwan.',
  },
  {
    id: 'shanghai-typhoon',
    title: 'Shanghai & Ningbo Port Closure',
    category: 'Severe Weather',
    text: 'A catastrophic typhoon has forced the complete closure and shutdown of container terminals in Shanghai and Ningbo-Zhoushan, halting semiconductor and automotive exports across China.',
  },
  {
    id: 'hamburg-backlog',
    title: 'Hamburg Freight & Rail Congestion',
    category: 'Logistics Congestion',
    text: 'Logistics operators in Hamburg, Germany report mounting customs delays, minor rail congestion, and cargo slowdowns affecting industrial machinery components.',
  },
  {
    id: 'houston-explosion',
    title: 'Houston Chemical Plant Fire',
    category: 'Industrial Accident',
    text: 'A major fire and chemical plant explosion in Houston, USA has destroyed polymer production units, triggering critical shortages for automotive battery materials.',
  },
];

export function useNewsAnalysis() {
  const [text, setText] = useState<string>(SAMPLE_PRESETS[0].text);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<NewsAnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<NewsAnalyzeResponse[]>([]);

  const analyze = useCallback(async (customPayload?: Partial<NewsAnalyzeRequest>) => {
    const payloadText = customPayload?.text || text;
    if (!payloadText || payloadText.trim().length < 5) {
      setError('Please provide valid disruption news text (at least 5 characters).');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await api.analyzeNews({
        text: payloadText,
        propagate_ripple: customPayload?.propagate_ripple ?? true,
        severity_override: customPayload?.severity_override,
      });
      setAnalysisResult(response);
      setHistory((prev) => [response, ...prev.slice(0, 9)]);
    } catch (err: any) {
      console.error('Disruption analysis failed:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to analyze news text with backend NLP pipeline.';
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  }, [text]);

  const loadPreset = useCallback((preset: SampleDisruptionPreset) => {
    setText(preset.text);
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
  }, []);

  return {
    text,
    setText,
    isAnalyzing,
    analysisResult,
    error,
    history,
    analyze,
    loadPreset,
    clearResult,
    presets: SAMPLE_PRESETS,
  };
}
