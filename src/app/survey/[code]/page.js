'use client';

export const dynamic = 'force-dynamic'; 

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SurveyTakerPage({ params }) {
  const { code } = use(params);
  const { data: session, status } = useSession();
  
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const [requiresAuth, setRequiresAuth] = useState(false);

  useEffect(() => {
    loadSurvey();
  }, [code]);

  const loadSurvey = async () => {
    try {
      console.log('Fetching survey:', code);
      const res = await fetch(`/api/surveys/by-code/${code}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Survey loaded:', data);
        setSurvey(data);
        
        // login needed if not allowing anonymous responses
        if (!data.anonymousResponses) {
          setRequiresAuth(true);
        }
      } else {
        console.error('Survey not found');
        alert('Survey not found');
      }
    } catch (error) {
      console.error('Error loading survey:', error);
      alert('Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    //if login neeed but not logged in 
    if (requiresAuth && !session) {
      alert('Please login to submit this survey');
      return;
    }

    const requiredQuestions = survey.questions.filter((q) => q.required);
    const unansweredRequired = requiredQuestions.filter((q) => !answers[q._id]);

    if (unansweredRequired.length > 0) {
      alert('Please answer all required questions');
      return;
    }

    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));

    const completionTime = Math.floor((Date.now() - startTime) / 1000);

    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: survey._id,
          answers: formattedAnswers,
          completionTime,
          respondent: session?.user?.id || null,
          isAnonymous: survey.anonymousResponses,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert('Failed to submit survey');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit survey');
    }
  };

  const renderQuestion = (question) => {
    switch (question.questionType) {
      case 'multiple-choice':
        return (
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={question._id}
                  value={option}
                  checked={answers[question._id] === option}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                  className="mr-2"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={answers[question._id]?.includes(option) || false}
                  onChange={(e) => {
                    const currentAnswers = answers[question._id] || [];
                    const newAnswers = e.target.checked
                      ? [...currentAnswers, option]
                      : currentAnswers.filter((a) => a !== option);
                    handleAnswerChange(question._id, newAnswers);
                  }}
                  className="mr-2"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            value={answers[question._id] || ''}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows="4"
            placeholder="Enter your answer..."
          />
        );

      case 'rating':
        return (
          <div className="flex space-x-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <label key={rating} className="flex flex-col items-center cursor-pointer">
                <input
                  type="radio"
                  name={question._id}
                  value={rating}
                  checked={answers[question._id] === rating}
                  onChange={(e) => handleAnswerChange(question._id, parseInt(e.target.value))}
                  className="mb-1"
                />
                <span className="text-sm">{rating}</span>
              </label>
            ))}
          </div>
        );

      case 'likert':
        const likertOptions = [
          'Strongly Disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly Agree',
        ];
        return (
          <div className="space-y-2">
            {likertOptions.map((option, index) => (
              <label key={index} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={question._id}
                  value={option}
                  checked={answers[question._id] === option}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                  className="mr-2"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading survey...</div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold mb-2">Survey Not Found</h2>
          <p className="text-gray-600">
            This survey may have been deleted or is no longer active.
          </p>
        </div>
      </div>
    );
  }

  if (requiresAuth && status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">
            This survey requires you to be logged in to respond.
          </p>
          <Link
            href={`/login?callbackUrl=/survey/${code}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Thank You!</h2>
          <p className="text-gray-700">
            Your response has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-2">{survey.title}</h1>
          {survey.description && (
            <p className="text-gray-600 mb-6">{survey.description}</p>
          )}

          {/* 사용자 정보 표시 */}
          {!survey.anonymousResponses && session && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Responding as:</span> {session.user.name} ({session.user.email})
              </p>
            </div>
          )}

          {survey.anonymousResponses && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm text-gray-600">
                🔒 Your responses will be collected anonymously
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {survey.questions.map((question, index) => (
              <div key={question._id} className="p-4 border rounded bg-gray-50">
                <label className="block font-medium mb-3">
                  {index + 1}. {question.questionText}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderQuestion(question)}
              </div>
            ))}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              Submit Survey
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}