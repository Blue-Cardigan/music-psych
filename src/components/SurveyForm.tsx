'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SurveyFormProps {
  songId: string;
}

export default function SurveyForm({ songId }: SurveyFormProps) {
  const [formData, setFormData] = useState({
    mood_before: 3,
    mood_after: 3,
    energy_level: 3,
    focus_level: 3,
    comments: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('survey_responses')
        .insert([
          {
            song_id: songId,
            ...formData,
          },
        ]);

      if (error) throw error;
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 p-6 rounded-lg border border-green-100">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-700 font-medium">Thank you for your contribution to our research!</p>
        </div>
        <p className="mt-2 text-green-600">Your response has been recorded and will be analyzed as part of our study.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pre-Intervention Mood Level
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="5"
              value={formData.mood_before}
              onChange={(e) => setFormData({ ...formData, mood_before: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700 w-8 text-center">{formData.mood_before}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Very Low</span>
            <span>Very High</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post-Intervention Mood Level
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="5"
              value={formData.mood_after}
              onChange={(e) => setFormData({ ...formData, mood_after: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700 w-8 text-center">{formData.mood_after}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Very Low</span>
            <span>Very High</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Perceived Energy Level
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="5"
              value={formData.energy_level}
              onChange={(e) => setFormData({ ...formData, energy_level: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700 w-8 text-center">{formData.energy_level}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Exhausted</span>
            <span>Energized</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cognitive Focus Level
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="5"
              value={formData.focus_level}
              onChange={(e) => setFormData({ ...formData, focus_level: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700 w-8 text-center">{formData.focus_level}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Distracted</span>
            <span>Focused</span>
          </div>
        </div>

        <div>
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
            Qualitative Observations
          </label>
          <textarea
            id="comments"
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            className="text-black p-1 mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={4}
            placeholder="Please describe any notable changes in your emotional or physical state..."
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Include any specific thoughts, feelings, or physical sensations you experienced.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting response...
          </span>
        ) : (
          'Submit Research Data'
        )}
      </button>
    </form>
  );
} 