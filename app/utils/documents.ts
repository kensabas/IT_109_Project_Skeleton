// Wave 2.6 [F-02] — file rules for cleaner documents. Placeholder values
// (plan D7, Q18 unconfirmed): PDF, JPG or PNG, up to 5 MB. Only the
// file's name, type and size are kept; nothing is uploaded (mock).

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const
export const ALLOWED_DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

export interface FileInfo { name: string; type: string; size: number }

export function validateDocumentFile(file: FileInfo): string | null {
  if (!file.name.trim()) return 'Choose a file.'
  if (!(ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
    return 'The file must be a PDF, JPG or PNG.'
  }
  if (file.size <= 0) return 'The file is empty.'
  if (file.size > MAX_DOCUMENT_BYTES) return 'The file must be 5 MB or smaller.'
  return null
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
