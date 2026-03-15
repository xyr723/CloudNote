import type {AttachmentKind} from '../../providers/attachment/attachmentProvider';
import {providerRegistry} from '../../providers/providerRegistry';

type SaveNoteAttachmentInput = {
  index: number;
  kind: AttachmentKind;
  noteId?: string;
  preferredExtension?: string;
  tempNoteId: string;
  uri: string;
};

export async function saveNoteAttachment(
  input: SaveNoteAttachmentInput,
): Promise<string> {
  return providerRegistry.getAttachmentProvider().saveAttachment({
    index: input.index,
    kind: input.kind,
    noteId: input.noteId ?? input.tempNoteId,
    preferredExtension: input.preferredExtension,
    uri: input.uri,
  });
}
