"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import UploadZone from "@/components/UploadZone";
import { ArrowLeft, Loader2, AlertCircle, GraduationCap, User, ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { OwlMascot } from "@/components/mascots";

interface Child {
  id: string;
  name: string;
  grade: number;
  schoolType: string;
}

export default function UploadPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const childIdFromUrl = searchParams.get("childId");
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
        throw new Error(t.errors.generic);
      }

      const data = await response.json();

      const sortedChildren = data.children.sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setChildren(sortedChildren);

      if (sortedChildren.length > 0) {
        // Pre-select the child from URL query param, or fall back to the first child
        const matchFromUrl = childIdFromUrl && sortedChildren.find((c: Child) => c.id === childIdFromUrl);
        setSelectedChildId(matchFromUrl ? matchFromUrl.id : sortedChildren[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-[var(--primary)] via-[var(--primary-dark)] to-[var(--lavender)] text-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.upload.backToDashboard}
          </Link>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {t.upload.title}
              </h1>
              <p className="text-white/80 text-lg">
                {t.upload.uploadTestDesc}
              </p>
            </div>
            <div className="flex-shrink-0">
              <OwlMascot mood="happy" size="lg" message={t.upload.mascotReady} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 card-story p-4 border-2 border-[var(--coral)]/30 bg-[var(--coral)]/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[var(--coral)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-[var(--coral)] mb-1">
                  {t.upload.loadError}
                </p>
                <p className="text-sm text-[var(--gray-700)]">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card-story p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--primary)] mb-3" />
            <p className="text-[var(--gray-600)] font-medium">{t.upload.loadingChildren}</p>
          </div>
        )}

        {/* Child Selection Card */}
        {!loading && !error && children.length > 0 && (
          <div className="mb-8 card-story p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[var(--primary-soft)] rounded-xl">
                <User className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
                {t.upload.selectChildLabel}
              </h2>
            </div>

            <div className="relative">
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full appearance-none rounded-xl border-2 border-[var(--gray-200)] bg-white px-4 py-3 pr-10 text-[var(--gray-800)] font-medium focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
              >
                <option value="">{t.upload.selectChildPlaceholder}</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} &ndash; {t.upload.classLabel.replace('{grade}', String(child.grade))} ({child.schoolType})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--gray-400)] pointer-events-none" />
            </div>

            {selectedChild && (
              <div className="mt-3 flex items-center gap-2 text-sm text-[var(--primary)]">
                <GraduationCap className="h-4 w-4" />
                <span>{selectedChild.name} &bull; {t.upload.classLabel.replace('{grade}', String(selectedChild.grade))} &bull; {selectedChild.schoolType}</span>
              </div>
            )}
          </div>
        )}

        {/* Upload Zone */}
        {!loading && !error && selectedChildId && (
          <UploadZone childId={selectedChildId} />
        )}

        {/* No Children State */}
        {!loading && !error && children.length === 0 && (
          <div className="card-story p-8 text-center">
            <OwlMascot mood="thinking" size="md" message={t.upload.mascotNoChild} showMessage={false} />
            <p className="mt-4 text-[var(--gray-600)] mb-6">
              {t.upload.noChildYetDesc}
            </p>
            <Link
              href="/dashboard/children/new"
              className="btn-primary inline-flex items-center gap-2"
            >
              <User className="h-5 w-5" />
              {t.upload.addFirstChild}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
