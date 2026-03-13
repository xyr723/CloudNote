export type AttachmentKind = 'image' | 'audio'

export interface SaveAttachmentInput {
  uri: string
  noteId: string
  kind: AttachmentKind
  index: number
  preferredExtension?: string
}

export interface AttachmentProvider {
  saveAttachment(input: SaveAttachmentInput): Promise<string>
  removeAttachment(uri: string): Promise<void>
}
