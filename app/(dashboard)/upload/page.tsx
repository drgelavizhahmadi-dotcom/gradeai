"use client";

import { useState } from "react";
import Link from "next/link";
import UploadZone from "@/components/UploadZone";
import { ArrowLeft } from "lucide-react";

// Hardcoded child for now - will be replaced with real data later
const HARDCODED_CHILD = {
  id: "child_demo_001",
  name: "Max Mustermann",
  grade: 7,
  schoolType: "Gymnasium",
};

export default function UploadPage() {
  const [selectedChildId, setSelectedChildId] = useState<string>(
    HARDCODED_CHILD.id
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back to Dashboard Link */}
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Upload Test
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Upload a photo or PDF of your child&apos;s test for AI analysis
          </p>
        </div>

        {/* Child Selection Card */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Select Child
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="radio"
              id={HARDCODED_CHILD.id}
              name="child"
              value={HARDCODED_CHILD.id}
              checked={selectedChildId === HARDCODED_CHILD.id}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor={HARDCODED_CHILD.id}
              className="flex-1 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {HARDCODED_CHILD.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Grade {HARDCODED_CHILD.grade} • {HARDCODED_CHILD.schoolType}
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="mb-8">
          <UploadZone childId={selectedChildId} />
        </div>

        {/* Help Text */}
        <div className="rounded-lg bg-blue-50 p-4">
          <h3 className="mb-2 font-semibold text-blue-900">
            Tips for best results:
          </h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Ensure the test is well-lit and all text is clearly visible</li>
            <li>• Take the photo straight-on, not at an angle</li>
            <li>• Include all pages if the test has multiple pages</li>
            <li>• Supported formats: JPG, PNG, PDF (max 10MB)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
