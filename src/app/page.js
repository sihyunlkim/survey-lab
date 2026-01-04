import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            SurveyLab
          </h1>
          <p className="text-2xl text-gray-600 mb-2">
            Professional Survey Platform for Academic Research
          </p>
          <p className="text-lg text-gray-500 mb-12">
            Create, distribute, and analyze surveys with ease
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-lg transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-3">Easy Survey Builder</h3>
            <p className="text-gray-600">
              Create professional surveys with multiple question types and intuitive interface.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-3">Secure Data Collection</h3>
            <p className="text-gray-600">
              Collect responses securely with built-in authentication and data protection.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3">Real-time Analytics</h3>
            <p className="text-gray-600">
              Visualize and analyze your data with interactive charts and export options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}