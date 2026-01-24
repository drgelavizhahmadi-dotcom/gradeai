import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-screen flex-col items-center justify-center py-12 text-center">
          <div className="mb-12 space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">GradeAI</span>
              <span className="mt-2 block text-3xl text-blue-600 sm:text-4xl md:text-5xl">
                Understand Your Child&apos;s School Performance
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 sm:text-xl">
              AI-powered analysis of German school tests in your language
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex items-center rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16 w-full">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-xl bg-white p-8 shadow-md transition-shadow hover:shadow-lg">
                <div className="mb-4 text-5xl">📸</div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Upload Tests
                </h3>
                <p className="text-gray-600">
                  Take a photo of any test
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl bg-white p-8 shadow-md transition-shadow hover:shadow-lg">
                <div className="mb-4 text-5xl">🤖</div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  AI Analysis
                </h3>
                <p className="text-gray-600">
                  Get detailed feedback in minutes
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl bg-white p-8 shadow-md transition-shadow hover:shadow-lg">
                <div className="mb-4 text-5xl">📊</div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Track Progress
                </h3>
                <p className="text-gray-600">
                  See improvement over time
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
