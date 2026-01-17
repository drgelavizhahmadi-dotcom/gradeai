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

      const sortedChildren = data.children.sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setChildren(sortedChildren);

      // Pre-select the first child (most recently added)
      if (sortedChildren.length > 0) {
        setSelectedChildId(sortedChildren[0].id);
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

        {/* Loading State */}
        {loading && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading children...</p>
            </div>
          </div>
        )}

        {/* Child Selection Card */}
        {!loading && !error && children.length > 0 && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Select Child
            </h2>

            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select a child...</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} - Grade {child.grade}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Upload Zone */}
        {!loading && !error && selectedChildId && (
          <UploadZone childId={selectedChildId} />
        )}

        {/* No Children State */}
        {!loading && !error && children.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow-md">
            <p className="mb-4 text-gray-600">
              You haven't added any children yet.
            </p>
            <Link
              href="/dashboard/children/new"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              Add Your First Child
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}