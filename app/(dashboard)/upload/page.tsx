"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import UploadZone from "@/components/UploadZone";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

interface Child {
  id: string;
  name: string;
  grade: number;
  schoolType: string;
}

export default function UploadPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setError(null);
      const response = await fetch("/api/children");

      if (!response.ok) {
        throw new Error("Failed to load children");
      }

      const data = await response.json();

      if (data.success && data.children) {
        // Sort by createdAt DESC (newest first)
        const sortedChildren = data.children.sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setChildren(sortedChildren);

        // Pre-select the first child (most recently added)
        if (sortedChildren.length > 0) {
          setSelectedChildId(sortedChildren[0].id);
        }
      } else {
        throw new Error(data.error || "Failed to load children");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load children");
    } finally {
      setLoading(false);
    }
  };

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

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border-2 border-red-200 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 mb-1">
                  Error Loading Children
                </p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Child Selection Card */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Select Child
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading children...</span>
            </div>
          ) : children.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                No children added yet. Please add a child first.
              </p>
              <Link
                href="/children"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Add Child
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {children.map((child) => (
                <div key={child.id} className="flex items-center gap-4">
                  <input
                    type="radio"
                    id={child.id}
                    name="child"
                    value={child.id}
                    checked={selectedChildId === child.id}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={child.id}
                    className="flex-1 cursor-pointer rounded-lg hover:bg-gray-50 p-3 -m-3 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {child.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Grade {child.grade} • {child.schoolType}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Zone - Only show if child is selected */}
        {selectedChildId && (
          <div className="mb-8">
            <UploadZone childId={selectedChildId} />
          </div>
        )}

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
