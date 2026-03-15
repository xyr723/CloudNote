import {saveNoteAttachment} from './noteAttachmentStore';

const mockSaveAttachment = jest.fn();

jest.mock('../../providers/providerRegistry', () => ({
  providerRegistry: {
    getAttachmentProvider: () => ({
      saveAttachment: mockSaveAttachment,
    }),
  },
}));

describe('noteAttachmentStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses temp note id when note has not been saved', async () => {
    mockSaveAttachment.mockResolvedValue('file:///image-0.jpg');

    await expect(
      saveNoteAttachment({
        index: 0,
        kind: 'image',
        noteId: undefined,
        tempNoteId: 'temp-note-id',
        uri: 'file:///source-0.jpg',
      }),
    ).resolves.toBe('file:///image-0.jpg');

    expect(mockSaveAttachment).toHaveBeenCalledWith({
      index: 0,
      kind: 'image',
      noteId: 'temp-note-id',
      preferredExtension: undefined,
      uri: 'file:///source-0.jpg',
    });
  });
});
