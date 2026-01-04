'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadSurveys();
    }
  }, [status, router]);

  const loadSurveys = async () => {
    try {
      const res = await fetch('/api/surveys');
      if (res.ok) {
        const data = await res.json();
        setSurveys(data);
      }
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (code) => {
    const link = `${window.location.origin}/survey/${code}`;
    navigator.clipboard.writeText(link);
    alert('Survey link copied to clipboard!');
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">SurveyLab</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Welcome, <span className="font-semibold">{session?.user?.name}</span>
            </span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">My Surveys</h2>
          <Link
            href="/create"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            + Create New Survey
          </Link>
        </div>

        {surveys.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No surveys yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first survey to start collecting responses
            </p>
            <Link
              href="/create"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Create Survey
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <div
                key={survey._id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold flex-1 line-clamp-2">
                    {survey.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      survey.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {survey.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {survey.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {survey.description}
                  </p>
                )}

                <div className="text-sm text-gray-500 mb-4">
                  <p className="flex items-center gap-2">
                    <span className="font-medium">{survey.questions.length}</span>
                    questions
                  </p>
                  <p className="text-xs mt-1">
                    Created: {new Date(survey.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => copyLink(survey.surveyCode)}
                    className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium transition"
                  >
                    📋 Copy Survey Link
                  </button>
                  <Link
                    href={`/results/${survey._id}`}
                    className="block w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 text-center text-sm font-medium transition"
                  >
                    📊 View Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}