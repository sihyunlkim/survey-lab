'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function SurveyTakerPage() {
  const params = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    loadSurvey();
  }, []);

  const loadSurvey = async () => {
    try {
      const res = await fetch(`/api/surveys/${params.code}`);
      if (res.ok) {
        const data = await res.json();
        setSurvey(data);
      } else {
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

    // 필수 질문 체크
    const requiredQuestions = survey.questions.filter((q) => q.required);
    const unansweredRequired = requiredQuestions.filter((q) => !answers[q._id]);

    if (unansweredRequired.length > 0) {
      alert('Please answer all required questions');
      return;
    }

    // 응답 형식 변환
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

  if (loading) {
    return <div className="text-center p-8">Loading survey...</div>;
  }

  if (!survey) {
    return <div className="text-center p-8">Survey not found</div>;
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-green-50 p-8 rounded-lg">
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
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-2">{survey.title}</h1>
        {survey.description && (
          <p className="text-gray-600 mb-6">{survey.description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {survey.questions.map((question, index) => (
            <div key={question._id} className="p-4 border rounded">
              <label className="block font-medium mb-3">
                {index + 1}. {question.questionText}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderQuestion(question)}
            </div>
          ))}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Submit Survey
          </button>
        </form>
      </div>
    </div>
  );
}