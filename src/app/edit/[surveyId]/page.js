'use client';

export const dynamic = 'force-dynamic'; 

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function EditSurveyPage({ params }) {
  const { surveyId } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();

  const [survey, setSurvey] = useState({
    title: '',
    description: '',
    anonymousResponses: true,
    questions: [],
  });

  const [responseCount, setResponseCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    questionType: 'multiple-choice',
    options: [''],
    required: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadSurvey();
    }
  }, [status, surveyId]);

  const loadSurvey = async () => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}`);
      
      if (res.ok) {
        const data = await res.json();
        setSurvey({
          title: data.title,
          description: data.description || '',
          anonymousResponses: data.anonymousResponses,
          questions: data.questions,
        });
        setResponseCount(data.responseCount || 0);
      } else {
        alert('Survey not found');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error loading survey:', error);
      alert('Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const questionTypes = [
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'text', label: 'Short Answer' },
    { value: 'rating', label: 'Rating (1-5)' },
    { value: 'likert', label: 'Likert Scale' },
  ];

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, ''],
    });
  };

  const updateOption = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const removeOption = (index) => {
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addQuestion = () => {
    if (!currentQuestion.questionText.trim()) {
      alert('Please enter a question');
      return;
    }

    if (
      (currentQuestion.questionType === 'multiple-choice' ||
        currentQuestion.questionType === 'checkbox') &&
      currentQuestion.options.filter((opt) => opt.trim()).length < 2
    ) {
      alert('Please add at least 2 options');
      return;
    }

    setSurvey({
      ...survey,
      questions: [
        ...survey.questions,
        { ...currentQuestion, order: survey.questions.length },
      ],
    });

    setCurrentQuestion({
      questionText: '',
      questionType: 'multiple-choice',
      options: [''],
      required: false,
    });
  };

  const removeQuestion = (index) => {
    setSurvey({
      ...survey,
      questions: survey.questions.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!survey.title.trim() || survey.questions.length === 0) {
      alert('Please add a title and at least one question');
      return;
    }

    // alert if there is reply 
    if (responseCount > 0) {
      if (!confirm(`Warning: This survey has ${responseCount} response(s). Editing may affect existing data. Continue?`)) {
        return;
      }
    }

    try {
      const res = await fetch(`/api/surveys/${surveyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(survey),
      });

      if (!res.ok) {
        throw new Error('Failed to update survey');
      }

      alert('Survey updated successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating survey:', error);
      alert('Failed to update survey');
    }
  };

  if (status === 'loading' || loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Edit Survey</h1>
            {responseCount > 0 && (
              <p className="text-sm text-orange-600 mt-1">
                ⚠️ This survey has {responseCount} response(s)
              </p>
            )}
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            ← Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* basic infos about the survey*/}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Survey Information</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Survey Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={survey.title}
                onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
                className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter survey title"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={survey.description}
                onChange={(e) =>
                  setSurvey({ ...survey, description: e.target.value })
                }
                className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows="3"
                placeholder="Describe your survey (optional)"
              />
            </div>

            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={survey.anonymousResponses}
                  onChange={(e) =>
                    setSurvey({ ...survey, anonymousResponses: e.target.checked })
                  }
                  className="mr-2 w-4 h-4"
                />
                <span className="text-sm">Allow anonymous responses</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                {survey.anonymousResponses 
                  ? "Anyone can respond without logging in" 
                  : "Only logged-in users can respond"}
              </p>
            </div>
          </div>

          {/* 질문 추가 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Add Question</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Question Text <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={currentQuestion.questionText}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    questionText: e.target.value,
                  })
                }
                className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your question"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Question Type</label>
              <select
                value={currentQuestion.questionType}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    questionType: e.target.value,
                  })
                }
                className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {questionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {(currentQuestion.questionType === 'multiple-choice' ||
              currentQuestion.questionType === 'checkbox') && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Options</label>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex mb-2 gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Option ${index + 1}`}
                    />
                    {currentQuestion.options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  + Add Option
                </button>
              </div>
            )}

            <div className="mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentQuestion.required}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      required: e.target.checked,
                    })
                  }
                  className="mr-2 w-4 h-4"
                />
                <span className="text-sm">Required question</span>
              </label>
            </div>

            <button
              type="button"
              onClick={addQuestion}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
            >
              ➕ Add Question to Survey
            </button>
          </div>

          {/* previewing the additional questions */}
          {survey.questions.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                Survey Preview ({survey.questions.length} question
                {survey.questions.length > 1 ? 's' : ''})
              </h2>
              <div className="space-y-4">
                {survey.questions.map((q, index) => (
                  <div key={index} className="p-4 border rounded bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-lg mb-2">
                          Q{index + 1}. {q.questionText}
                          {q.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          Type: <span className="font-medium">{q.questionType}</span>
                        </p>
                        {q.options && q.options.length > 0 && (
                          <ul className="ml-4 text-sm text-gray-700 space-y-1">
                            {q.options.map((opt, i) => (
                              <li key={i}>
                                {q.questionType === 'checkbox' ? '☐' : '○'} {opt}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="ml-4 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* submit button  */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400"
              disabled={!survey.title || survey.questions.length === 0}
            >
              💾 Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}