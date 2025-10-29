'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function InstructionsPage() {
  const params = useParams();
  const topicNumber = params.topicNumber as string;
  const [instructions, setInstructions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchInstructions() {
      try {
        const { data, error } = await supabase
          .from('sbir_final')
          .select('topic_number, title, status, instructions_plain_text, instructions_generated_at, consolidated_instructions_url, open_date, close_date')
          .eq('topic_number', topicNumber)
          .single();

        if (error) throw error;
        setInstructions(data);
      } catch (error) {
        console.error('Error fetching instructions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInstructions();
  }, [topicNumber, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading instructions...</div>
        </div>
      </div>
    );
  }

  if (!instructions || !instructions.instructions_plain_text) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-4">Instructions Not Available</h1>
            <p className="text-gray-600">
              Instructions have not been generated for this topic yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{instructions.title}</h1>
              <p className="text-gray-600">Topic Number: {instructions.topic_number}</p>
              <p className="text-sm text-gray-500 mt-2">
                Status: <span className="font-semibold">{instructions.status}</span>
              </p>
            </div>
            {instructions.consolidated_instructions_url && (
              <a
                href={instructions.consolidated_instructions_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </a>
            )}
          </div>

          {instructions.open_date && instructions.close_date && (
            <div className="flex gap-6 text-sm text-gray-600 mt-4 pt-4 border-t">
              <div>
                <span className="font-semibold">Open:</span> {new Date(instructions.open_date).toLocaleDateString()}
              </div>
              <div>
                <span className="font-semibold">Close:</span> {new Date(instructions.close_date).toLocaleDateString()}
              </div>
            </div>
          )}

          {instructions.instructions_generated_at && (
            <p className="text-xs text-gray-500 mt-2">
              Instructions generated: {new Date(instructions.instructions_generated_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Notice Box */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This document consolidates instructions from Component-specific and BAA/Solicitation documents.</p>
                <p className="mt-1">Always verify requirements against the original source documents.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Consolidated Instructions</h2>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
              {instructions.instructions_plain_text}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Full text length: {instructions.instructions_plain_text.length.toLocaleString()} characters</p>
        </div>
      </div>
    </div>
  );
}

