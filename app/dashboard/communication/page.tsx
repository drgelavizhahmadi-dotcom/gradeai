'use client'

import { useEffect, useState, useRef } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import { OwlMascot } from '@/components/mascots'
import {
  Mail,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  FileText,
  Users,
  CreditCard,
  PartyPopper,
  Info,
  Heart,
  BookOpen,
  Trash2,
  Archive,
  Check,
  Filter,
  X,
} from 'lucide-react'

interface Child {
  id: string
  name: string
  grade: number
  schoolType: string
}

interface SchoolDocument {
  id: string
  fileName: string
  fileUrl: string
  mimeType: string
  category: string | null
  title: string | null
  summary: string | null
  actionNeeded: string | null
  deadline: string | null
  extractedData: Record<string, any> | null
  status: string
  createdAt: string
  child: {
    id: string
    name: string
    grade: number
    schoolType: string
  }
}

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bgColor: string; label: string; labelDe: string }> = {
  meeting: { icon: Users, color: 'var(--primary)', bgColor: 'var(--primary-soft)', label: 'Meeting', labelDe: 'Termin' },
  permission: { icon: FileText, color: 'var(--gold)', bgColor: 'var(--gold-soft)', label: 'Permission', labelDe: 'Einwilligung' },
  payment: { icon: CreditCard, color: 'var(--coral)', bgColor: 'var(--coral-soft)', label: 'Payment', labelDe: 'Zahlung' },
  event: { icon: PartyPopper, color: 'var(--lavender)', bgColor: 'var(--lavender-soft)', label: 'Event', labelDe: 'Veranstaltung' },
  info: { icon: Info, color: 'var(--gray-500)', bgColor: 'var(--gray-100)', label: 'Info', labelDe: 'Info' },
  health: { icon: Heart, color: 'var(--success)', bgColor: 'var(--success-soft)', label: 'Health', labelDe: 'Gesundheit' },
  reportCard: { icon: BookOpen, color: 'var(--primary-dark)', bgColor: 'var(--primary-soft)', label: 'Report Card', labelDe: 'Zeugnis' },
}

const STATUS_FILTERS = ['all', 'action_needed', 'extracted', 'pending', 'done', 'archived'] as const

export default function CommunicationPage() {
  const { t, language } = useLanguage()
  const isDE = language === 'de'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<SchoolDocument[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [extractingId, setExtractingId] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [childFilter, setChildFilter] = useState<string>('all')

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<SchoolDocument | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchDocuments()
    fetchChildren()
  }, [statusFilter, childFilter])

  async function fetchChildren() {
    try {
      const res = await fetch('/api/children')
      const data = await res.json()
      if (data.children) {
        setChildren(data.children)
        if (!selectedChildId && data.children.length > 0) {
          setSelectedChildId(data.children[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch children:', err)
    }
  }

  async function fetchDocuments() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (childFilter !== 'all') params.set('childId', childFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/school-communication?${params}`)
      const data = await res.json()
      if (data.success) {
        setDocuments(data.documents)
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (!selectedFile || !selectedChildId) return

    setUploading(true)
    try {
      // Step 1: Upload file
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('childId', selectedChildId)

      const uploadRes = await fetch('/api/school-communication', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()

      if (!uploadData.success) {
        alert(uploadData.error || 'Upload failed')
        return
      }

      // Close modal and refresh
      setShowUploadModal(false)
      setSelectedFile(null)
      await fetchDocuments()

      // Step 2: Trigger AI extraction in background
      setExtractingId(uploadData.documentId)
      try {
        await fetch('/api/ai/extract-school-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: uploadData.documentId,
            imageBase64: uploadData.image.base64,
            mimeType: uploadData.image.mimeType,
          }),
        })
        await fetchDocuments()
      } catch (err) {
        console.error('AI extraction failed:', err)
      } finally {
        setExtractingId(null)
      }
    } catch (err) {
      console.error('Upload failed:', err)
      alert(isDE ? 'Upload fehlgeschlagen' : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleStatusUpdate(docId: string, newStatus: string) {
    try {
      await fetch(`/api/school-communication/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      await fetchDocuments()
    } catch (err) {
      console.error('Status update failed:', err)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/school-communication/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      await fetchDocuments()
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  function getDeadlineInfo(deadline: string | null) {
    if (!deadline) return null
    const d = new Date(deadline)
    const now = new Date()
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { label: isDE ? 'Überfällig' : 'Overdue', color: 'var(--coral)', days: diffDays }
    if (diffDays <= 3) return { label: isDE ? 'Bald fällig' : 'Due soon', color: 'var(--gold)', days: diffDays }
    return { label: formatDate(deadline), color: 'var(--gray-500)', days: diffDays }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(isDE ? 'de-DE' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function getCategoryConfig(category: string | null) {
    return CATEGORY_CONFIG[category || 'info'] || CATEGORY_CONFIG.info
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, { de: string; en: string }> = {
      pending: { de: 'Wird verarbeitet', en: 'Processing' },
      extracted: { de: 'Verarbeitet', en: 'Processed' },
      action_needed: { de: 'Aktion erforderlich', en: 'Action needed' },
      done: { de: 'Erledigt', en: 'Done' },
      archived: { de: 'Archiviert', en: 'Archived' },
    }
    const l = labels[status]
    return l ? (isDE ? l.de : l.en) : status
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'var(--gold)',
      extracted: 'var(--primary)',
      action_needed: 'var(--coral)',
      done: 'var(--success)',
      archived: 'var(--gray-400)',
    }
    return colors[status] || 'var(--gray-400)'
  }

  const actionCount = documents.filter(d => d.status === 'action_needed').length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-2xl font-bold text-[var(--gray-800)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Mail className="inline-block h-7 w-7 mr-2 text-[var(--primary)]" />
            {isDE ? 'Schulpost' : 'School Post'}
          </h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            {isDE
              ? 'Dokumente von der Schule verwalten und verfolgen'
              : 'Manage and track documents from school'}
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center gap-2"
          disabled={children.length === 0}
        >
          <Upload className="h-4 w-4" />
          {isDE ? 'Dokument hochladen' : 'Upload Document'}
        </button>
      </div>

      {/* Action needed banner */}
      {actionCount > 0 && (
        <div className="mb-6 rounded-xl bg-[var(--coral)]/10 border-2 border-[var(--coral)]/30 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-[var(--coral)] flex-shrink-0" />
          <p className="text-sm font-semibold text-[var(--coral)]">
            {actionCount} {isDE
              ? (actionCount === 1 ? 'Dokument erfordert Ihre Aufmerksamkeit' : 'Dokumente erfordern Ihre Aufmerksamkeit')
              : (actionCount === 1 ? 'document needs your attention' : 'documents need your attention')}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--gray-400)]" />
          <select
            value={childFilter}
            onChange={(e) => setChildFilter(e.target.value)}
            className="text-sm border-2 border-[var(--gray-200)] rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          >
            <option value="all">{isDE ? 'Alle Kinder' : 'All Children'}</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>{child.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-colors ${
                statusFilter === s
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-white text-[var(--gray-600)] border-[var(--gray-200)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
              }`}
            >
              {getStatusLabel(s === 'all' ? 'all' : s)}
              {s === 'all' && ` (${isDE ? 'Alle' : 'All'})`}
            </button>
          ))}
        </div>
      </div>

      {/* Document List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16">
          <OwlMascot mood="encouraging" size="md" showMessage={false} />
          <h3
            className="text-lg font-bold text-[var(--gray-700)] mt-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isDE ? 'Noch keine Schulpost' : 'No school documents yet'}
          </h3>
          <p className="text-sm text-[var(--gray-500)] mt-2 max-w-md mx-auto">
            {isDE
              ? 'Laden Sie Dokumente von der Schule hoch — Einladungen, Formulare, Mitteilungen — und wir organisieren alles für Sie.'
              : 'Upload documents from school — invitations, forms, notices — and we\'ll organize everything for you.'}
          </p>
          {children.length > 0 && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary mt-6 inline-flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isDE ? 'Erstes Dokument hochladen' : 'Upload first document'}
            </button>
          )}
          {children.length === 0 && (
            <p className="text-sm text-[var(--gray-400)] mt-4">
              {isDE ? 'Bitte fügen Sie zuerst ein Kind hinzu.' : 'Please add a child first.'}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => {
            const cat = getCategoryConfig(doc.category)
            const CatIcon = cat.icon
            const deadlineInfo = getDeadlineInfo(doc.deadline)
            const isExtracting = extractingId === doc.id

            return (
              <div
                key={doc.id}
                className={`card-story p-5 bg-white transition-all ${
                  doc.status === 'action_needed' ? 'border-l-4 border-l-[var(--coral)]' : ''
                } ${doc.status === 'done' || doc.status === 'archived' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Category Icon */}
                  <div
                    className="rounded-xl p-3 flex-shrink-0"
                    style={{ backgroundColor: cat.bgColor }}
                  >
                    <CatIcon className="h-5 w-5" style={{ color: cat.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-[var(--gray-800)] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                          {isExtracting ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
                              {isDE ? 'Wird analysiert...' : 'Analyzing...'}
                            </span>
                          ) : (
                            doc.title || doc.fileName
                          )}
                        </h3>
                        {doc.summary && !isExtracting && (
                          <p className="text-sm text-[var(--gray-600)] mt-1">{doc.summary}</p>
                        )}
                        {doc.extractedData?.details && !isExtracting && Object.keys(doc.extractedData.details).length > 0 && (
                          <dl className="mt-2 text-xs text-[var(--gray-600)] space-y-0.5">
                            {Object.entries(doc.extractedData.details as Record<string, string>).map(([key, value]) =>
                              value ? (
                                <div key={key} className="flex gap-1">
                                  <dt className="font-semibold capitalize shrink-0">{key}:</dt>
                                  <dd>{String(value)}</dd>
                                </div>
                              ) : null
                            )}
                          </dl>
                        )}
                      </div>

                      {/* Status badge */}
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold flex-shrink-0"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${getStatusColor(doc.status)} 15%, transparent)`,
                          color: getStatusColor(doc.status),
                        }}
                      >
                        {doc.status === 'pending' && <Clock className="h-3 w-3" />}
                        {doc.status === 'action_needed' && <AlertCircle className="h-3 w-3" />}
                        {doc.status === 'done' && <CheckCircle className="h-3 w-3" />}
                        {getStatusLabel(doc.status)}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[var(--gray-500)]">
                      {/* Child */}
                      <span className="inline-flex items-center gap-1 bg-[var(--gray-100)] rounded-full px-2 py-0.5">
                        <Users className="h-3 w-3" />
                        {doc.child.name}
                      </span>

                      {/* Category */}
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                        style={{ backgroundColor: cat.bgColor, color: cat.color }}
                      >
                        {isDE ? cat.labelDe : cat.label}
                      </span>

                      {/* Deadline */}
                      {deadlineInfo && (
                        <span
                          className="inline-flex items-center gap-1 font-semibold"
                          style={{ color: deadlineInfo.color }}
                        >
                          <Calendar className="h-3 w-3" />
                          {deadlineInfo.label}
                        </span>
                      )}

                      {/* Action needed */}
                      {doc.actionNeeded && doc.status !== 'done' && (
                        <span className="text-[var(--coral)] font-semibold">
                          {doc.actionNeeded}
                        </span>
                      )}

                      {/* Upload date */}
                      <span className="ml-auto">{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {doc.status !== 'archived' && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--gray-100)]">
                    {doc.status !== 'done' && (
                      <button
                        onClick={() => handleStatusUpdate(doc.id, 'done')}
                        className="text-xs font-semibold text-[var(--success)] bg-[var(--success-soft)] hover:bg-[var(--success)]/20 rounded-lg px-3 py-1.5 flex items-center gap-1 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {isDE ? 'Erledigt' : 'Done'}
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusUpdate(doc.id, 'archived')}
                      className="text-xs font-semibold text-[var(--gray-500)] bg-[var(--gray-100)] hover:bg-[var(--gray-200)] rounded-lg px-3 py-1.5 flex items-center gap-1 transition-colors"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      {isDE ? 'Archivieren' : 'Archive'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(doc)}
                      className="text-xs font-semibold text-[var(--coral)] bg-[var(--coral)]/10 hover:bg-[var(--coral)]/20 rounded-lg px-3 py-1.5 flex items-center gap-1 transition-colors ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t.common?.delete || (isDE ? 'Löschen' : 'Delete')}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-bold text-[var(--gray-800)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {isDE ? 'Schulpost hochladen' : 'Upload School Document'}
              </h2>
              <button
                onClick={() => { setShowUploadModal(false); setSelectedFile(null) }}
                className="p-1 rounded-lg hover:bg-[var(--gray-100)] transition-colors"
              >
                <X className="h-5 w-5 text-[var(--gray-400)]" />
              </button>
            </div>

            {/* Child selector */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                {isDE ? 'Kind auswählen' : 'Select Child'}
              </label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full border-2 border-[var(--gray-200)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>{child.name} ({child.schoolType}, {isDE ? 'Klasse' : 'Grade'} {child.grade})</option>
                ))}
              </select>
            </div>

            {/* File picker */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                {isDE ? 'Dokument' : 'Document'}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[var(--gray-300)] rounded-xl p-6 text-center hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]/30 transition-colors"
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-[var(--primary)]" />
                    <span className="text-sm font-medium text-[var(--gray-700)]">{selectedFile.name}</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-[var(--gray-400)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--gray-500)]">
                      {isDE ? 'Klicken zum Auswählen (JPG, PNG, PDF)' : 'Click to select (JPG, PNG, PDF)'}
                    </p>
                    <p className="text-xs text-[var(--gray-400)] mt-1">Max. 4MB</p>
                  </div>
                )}
              </button>
            </div>

            {/* Upload button */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowUploadModal(false); setSelectedFile(null) }}
                className="btn-secondary flex-1"
              >
                {t.common?.cancel || (isDE ? 'Abbrechen' : 'Cancel')}
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !selectedChildId || uploading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isDE ? 'Wird hochgeladen...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {isDE ? 'Hochladen' : 'Upload'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={isDE ? 'Dokument löschen?' : 'Delete document?'}
        message={isDE
          ? `Möchten Sie "${deleteTarget?.title || deleteTarget?.fileName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
          : `Are you sure you want to delete "${deleteTarget?.title || deleteTarget?.fileName}"? This action cannot be undone.`}
      />
    </div>
  )
}
