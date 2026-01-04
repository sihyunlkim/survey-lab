'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResultsPage({ params }) {
  const { surveyId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadResults();
    }
  }, [status, surveyId]);

  const loadResults = async () => {
    try {
      const res = await fetch(`/api/responses/survey/${surveyId}`);
      if (res.ok) {
        const results = await res.json();
        setData(results);
      } else {
        alert('Failed to load results');
      }
    } catch (error) {
      console.error('Error loading results:', error);
      alert('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const calculateQuestionStats = (question) => {
    if (!data || !data.responses) return null;

    const questionResponses = data.responses
      .map(r => r.answers.find(a => a.questionId.toString() === question._id.toString()))
      .filter(a => a && a.answer);

    if (questionResponses.length === 0) return null;

    switch (question.questionType) {
      case 'multiple-choice':
      case 'likert':
        const counts = {};
        const options = question.questionType === 'likert' 
          ? ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
          : question.options;
        
        options.forEach(opt => counts[opt] = 0);
        questionResponses.forEach(r => {
          if (counts[r.answer] !== undefined) {
            counts[r.answer]++;
          }
        });

        return {
          type: 'bar',
          data: counts,
          total: questionResponses.length,
        };

      case 'checkbox':
        const checkboxCounts = {};
        question.options.forEach(opt => checkboxCounts[opt] = 0);
        questionResponses.forEach(r => {
          if (Array.isArray(r.answer)) {
            r.answer.forEach(ans => {
              if (checkboxCounts[ans] !== undefined) {
                checkboxCounts[ans]++;
              }
            });
          }
        });

        return {
          type: 'bar',
          data: checkboxCounts,
          total: questionResponses.length,
        };

      case 'rating':
        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let sum = 0;
        questionResponses.forEach(r => {
          const rating = parseInt(r.answer);
          if (rating >= 1 && rating <= 5) {
            ratingCounts[rating]++;
            sum += rating;
          }
        });

        return {
          type: 'bar',
          data: ratingCounts,
          average: (sum / questionResponses.length).toFixed(2),
          total: questionResponses.length,
        };

      case 'text':
        return {
          type: 'text',
          responses: questionResponses.map(r => r.answer),
          total: questionResponses.length,
        };

      default:
        return null;
    }
  };

  const downloadCSV = () => {
    if (!data || !data.responses) return;

    const headers = ['Submitted At', 'Completion Time (s)'];
    data.survey.questions.forEach((q, i) => {
      headers.push(`Q${i + 1}: ${q.questionText}`);
    });

    const rows = [headers];

    data.responses.forEach(response => {
      const row = [
        new Date(response.submittedAt).toLocaleString(),
        response.completionTime || 'N/A',
      ];

      data.survey.questions.forEach(question => {
        const answer = response.answers.find(
          a => a.questionId.toString() === question._id.toString()
        );
        
        if (answer) {
          if (Array.isArray(answer.answer)) {
            row.push(answer.answer.join('; '));
          } else {
            row.push(answer.answer);
          }
        } else {
          row.push('No answer');
        }
      });

      rows.push(row);
    });

    const csv = rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey-results-${surveyId}.csv`;
    a.click();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading results...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Failed to load results</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold">{data.survey.title}</h1>
          </div>
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
          >
            📥 Download CSV
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {data.totalResponses}
            </div>
            <div className="text-gray-600">Total Responses</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {Math.round(data.averageCompletionTime)}s
            </div>
            <div className="text-gray-600">Avg. Completion Time</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {data.survey.questions.length}
            </div>
            <div className="text-gray-600">Questions</div>
          </div>
        </div>

        {/* Question Results */}
        <div className="space-y-6">
          {data.survey.questions.map((question, index) => {
            const stats = calculateQuestionStats(question);

            return (
              <div key={question._id} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">
                  Q{index + 1}. {question.questionText}
                </h3>

                {stats && (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      {stats.total} response{stats.total !== 1 ? 's' : ''}
                    </p>

                    {stats.type === 'bar' && (
                      <div className="space-y-2">
                        {Object.entries(stats.data).map(([option, count]) => {
                          const percentage = stats.total > 0 
                            ? ((count / stats.total) * 100).toFixed(1)
                            : 0;

                          return (
                            <div key={option}>
                              <div className="flex justify-between text-sm mb-1">
                                <span>{option}</span>
                                <span className="font-medium">
                                  {count} ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                  className="bg-blue-600 h-4 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {stats.average && (
                          <p className="mt-4 text-sm font-medium">
                            Average Rating: {stats.average} / 5.0
                          </p>
                        )}
                      </div>
                    )}

                    {stats.type === 'text' && (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {stats.responses.map((response, i) => (
                          <div key={i} className="p-3 bg-gray-50 rounded border">
                            <p className="text-sm">{response}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!stats && (
                  <p className="text-gray-500 italic">No responses yet</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Individual Responses */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Individual Responses</h2>
          
          {data.responses.length === 0 ? (
            <p className="text-gray-500 italic">No responses yet</p>
          ) : (
            <div className="space-y-4">
              {data.responses.map((response, index) => (
                <div key={response._id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Response #{data.responses.length - index}</span>
                    <span className="text-sm text-gray-600">
                      {new Date(response.submittedAt).toLocaleString()}
                      {response.completionTime && 
                        ` • ${response.completionTime}s`
                      }
                    </span>
                  </div>
                  
                  <div className="ml-4 space-y-2 text-sm">
                    {data.survey.questions.map((question, qIndex) => {
                      const answer = response.answers.find(
                        a => a.questionId.toString() === question._id.toString()
                      );

                      return (
                        <div key={question._id}>
                          <span className="font-medium">Q{qIndex + 1}:</span>{' '}
                          {answer ? (
                            Array.isArray(answer.answer) 
                              ? answer.answer.join(', ')
                              : answer.answer
                          ) : (
                            <span className="text-gray-400 italic">No answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}