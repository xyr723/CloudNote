import type {
  AttachmentKind,
  AttachmentProvider,
  SaveAttachmentInput,
} from '../attachmentProvider'
import {
  copyManagedFile,
  deleteManagedFile,
  fileExists,
  managedDocumentDir,
  stripFileScheme,
} from '../../../shared/lib/localFileStore'

const ATTACHMENT_ROOT_DIR = `${managedDocumentDir}/draft-attachments`

const DEFAULT_EXTENSION_MAP: Record<AttachmentKind, string> = {
  image: 'jpg',
  audio: 'mp3',
}

const getAttachmentDirectory = (kind: AttachmentKind): string => {
  return kind === 'image' ? 'images' : 'audios'
}

const normalizeExtension = (extension: string): string => {
  const sanitizedValue = extension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  return sanitizedValue || 'bin'
}

const extractExtension = (uri: string, fallbackExtension: string): string => {
  const sanitizedUri = uri.split('?')[0]
  const matchedValue = sanitizedUri.match(/\.([a-zA-Z0-9]+)$/)

  return matchedValue
    ? normalizeExtension(matchedValue[1])
    : normalizeExtension(fallbackExtension)
}

const buildAttachmentPath = ({
  noteId,
  kind,
  index,
  extension,
}: {
  noteId: string
  kind: AttachmentKind
  index: number
  extension: string
}): string => {
  const directoryPath = `${ATTACHMENT_ROOT_DIR}/${getAttachmentDirectory(kind)}/${noteId}`
  return `${directoryPath}/${kind}_${index}_${Date.now()}.${extension}`
}

export class LocalAttachmentProvider implements AttachmentProvider {
  async saveAttachment(input: SaveAttachmentInput): Promise<string> {
    const fallbackExtension =
      input.preferredExtension ?? DEFAULT_EXTENSION_MAP[input.kind]
    const extension = extractExtension(input.uri, fallbackExtension)
    const targetPath = buildAttachmentPath({
      noteId: input.noteId,
      kind: input.kind,
      index: input.index,
      extension,
    })

    return copyManagedFile(input.uri, targetPath)
  }

  async removeAttachment(uri: string): Promise<void> {
    if (/^https?:\/\//.test(uri) || /^data:/.test(uri)) {
      return
    }

    const filePath = stripFileScheme(uri)
    const exists = await fileExists(filePath)

    if (!exists) {
      return
    }

    await deleteManagedFile(filePath)
  }
}
