import AsyncStorage from '@react-native-async-storage/async-storage';
import {Buffer} from 'buffer';
import RNFetchBlob from 'react-native-blob-util';
import type {
  DocumentBlock,
  RichDocument,
  TextBlockType,
} from '../../entities/document/types';
import type {Note, TextSegment} from '../../entities/note/types';
import type {
  WidgetAction,
  WidgetActionType,
  WidgetSchema,
  WidgetType,
} from '../../entities/widget/types';
import {
  copyManagedFile,
  fileExists,
  stripFileScheme,
  toPlatformFileUri,
} from './localFileStore';

const NOTES_KEY_PREFIX = 'notes_';
const TRASH_KEY_PREFIX = 'trash_';

const btoa = (value: string): string =>
  Buffer.from(value, 'binary').toString('base64');
const atob = (value: string): string =>
  Buffer.from(value, 'base64').toString('binary');

const encodeString = (value: string): string => {
  return btoa(unescape(encodeURIComponent(value)));
};

const decodeString = (value: string): string => {
  try {
    return decodeURIComponent(escape(atob(value)));
  } catch (_error) {
    return value;
  }
};

const TEXT_BLOCK_TYPES: TextBlockType[] = [
  'paragraph',
  'heading',
  'quote',
  'code',
];
const WIDGET_TYPES: WidgetType[] = [
  'todo-list',
  'action-card',
  'form',
  'quote',
  'metric',
  'timeline',
];
const WIDGET_ACTION_TYPES: WidgetActionType[] = [
  'open-url',
  'insert-text',
  'toggle',
  'submit-form',
];

const isObjectRecord = (
  value: unknown,
): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const stringifyNotes = (notes: Note[]): string => {
  return JSON.stringify(notes, (_key, value: unknown) => {
    if (typeof value === 'string') {
      return encodeString(value);
    }

    return value;
  });
};

const parseTextSegment = (value: unknown): TextSegment | null => {
  if (!isObjectRecord(value)) {
    return null;
  }

  const record = value;

  if (typeof record.text !== 'string' || typeof record.fontSize !== 'number') {
    return null;
  }

  return {
    text: record.text,
    fontSize: record.fontSize,
    isBold: typeof record.isBold === 'boolean' ? record.isBold : undefined,
    isItalic: typeof record.isItalic === 'boolean' ? record.isItalic : undefined,
    color: typeof record.color === 'string' ? record.color : undefined,
  };
};

const parseWidgetSchema = (value: unknown): WidgetSchema | null => {
  if (!isObjectRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.type !== 'string' ||
    !WIDGET_TYPES.includes(value.type as WidgetType)
  ) {
    return null;
  }

  const actions = Array.isArray(value.actions)
    ? value.actions
        .map(action => {
          if (!isObjectRecord(action)) {
            return null;
          }

          if (
            typeof action.id !== 'string' ||
            typeof action.label !== 'string' ||
            typeof action.type !== 'string' ||
            !WIDGET_ACTION_TYPES.includes(action.type as WidgetActionType)
          ) {
            return null;
          }

          const parsedAction: WidgetAction = {
            id: action.id,
            label: action.label,
            type: action.type as WidgetActionType,
          };

          if (isObjectRecord(action.payload)) {
            parsedAction.payload = action.payload;
          }

          return parsedAction;
        })
        .filter((action): action is WidgetAction => action !== null)
    : undefined;

  return {
    id: value.id,
    type: value.type as WidgetType,
    title: typeof value.title === 'string' ? value.title : undefined,
    description:
      typeof value.description === 'string' ? value.description : undefined,
    props: isObjectRecord(value.props) ? value.props : undefined,
    actions: actions && actions.length > 0 ? actions : undefined,
    layout: isObjectRecord(value.layout)
      ? {
          span:
            value.layout.span === 1 ||
            value.layout.span === 2 ||
            value.layout.span === 3 ||
            value.layout.span === 4
              ? value.layout.span
              : undefined,
          minHeight:
            typeof value.layout.minHeight === 'number'
              ? value.layout.minHeight
              : undefined,
        }
      : undefined,
  };
};

const parseDocumentBlock = (value: unknown): DocumentBlock | null => {
  if (!isObjectRecord(value) || typeof value.id !== 'string') {
    return null;
  }

  if (
    typeof value.type === 'string' &&
    TEXT_BLOCK_TYPES.includes(value.type as TextBlockType) &&
    typeof value.text === 'string'
  ) {
    return {
      id: value.id,
      type: value.type as TextBlockType,
      text: value.text,
      level:
        value.level === 1 || value.level === 2 || value.level === 3
          ? value.level
          : undefined,
    };
  }

  if (value.type === 'list' && Array.isArray(value.items)) {
    const items = value.items.filter(
      (item): item is string => typeof item === 'string',
    );

    if (items.length !== value.items.length) {
      return null;
    }

    return {
      id: value.id,
      type: 'list',
      items,
      ordered: typeof value.ordered === 'boolean' ? value.ordered : undefined,
    };
  }

  if (value.type === 'widget') {
    const widget = parseWidgetSchema(value.widget);

    if (!widget) {
      return null;
    }

    return {
      id: value.id,
      type: 'widget',
      widget,
    };
  }

  return null;
};

const parseRichDocument = (value: unknown): RichDocument | undefined => {
  if (!isObjectRecord(value) || value.version !== '1.0') {
    return undefined;
  }

  if (!Array.isArray(value.blocks)) {
    return undefined;
  }

  const parsedBlocks = value.blocks
    .map(parseDocumentBlock)
    .filter((block): block is DocumentBlock => block !== null);

  if (value.blocks.length > 0 && parsedBlocks.length === 0) {
    return undefined;
  }

  return {
    version: '1.0',
    blocks: parsedBlocks,
    plainText: typeof value.plainText === 'string' ? value.plainText : undefined,
  };
};

const normalizeStringArray = async (
  mediaUris: string[] | undefined,
): Promise<string[] | undefined> => {
  if (!mediaUris) {
    return undefined;
  }

  const normalizedUris = await Promise.all(
    mediaUris.map(async mediaUri => {
      if (/^https?:\/\//.test(mediaUri)) {
        return mediaUri;
      }

      const normalizedPath = stripFileScheme(mediaUri);
      const exists = await fileExists(normalizedPath);

      return exists ? toPlatformFileUri(normalizedPath) : null;
    }),
  );

  const filteredUris = normalizedUris.filter(
    (mediaUri): mediaUri is string => typeof mediaUri === 'string',
  );

  return filteredUris.length > 0 ? filteredUris : undefined;
};

const parseNotes = async (notesString: string | null): Promise<Note[]> => {
  if (!notesString) {
    return [];
  }

  const rawValue: unknown = JSON.parse(notesString, (_key, value: unknown) => {
    if (typeof value === 'string') {
      return decodeString(value);
    }

    return value;
  });

  if (!Array.isArray(rawValue)) {
    return [];
  }

  const notes = await Promise.all(
    rawValue.map(async (rawNote): Promise<Note | null> => {
      if (
        typeof rawNote !== 'object' ||
        rawNote === null ||
        Array.isArray(rawNote)
      ) {
        return null;
      }

      const noteRecord = rawNote as Record<string, unknown>;
      const textSegments = Array.isArray(noteRecord.textSegments)
        ? noteRecord.textSegments
            .map(parseTextSegment)
            .filter((segment): segment is TextSegment => segment !== null)
        : undefined;

      const images = Array.isArray(noteRecord.images)
        ? (noteRecord.images.filter(
            (value): value is string => typeof value === 'string',
          ) as string[])
        : undefined;

      const audios = Array.isArray(noteRecord.audios)
        ? (noteRecord.audios.filter(
            (value): value is string => typeof value === 'string',
          ) as string[])
        : undefined;

      const parsedNote: Note = {
        id: typeof noteRecord.id === 'string' ? noteRecord.id : `${Date.now()}`,
        title: typeof noteRecord.title === 'string' ? noteRecord.title : '',
        content:
          typeof noteRecord.content === 'string' ? noteRecord.content : '',
        timestamp: new Date(
          typeof noteRecord.timestamp === 'string' ||
            typeof noteRecord.timestamp === 'number'
            ? noteRecord.timestamp
            : Date.now(),
        ),
        images: await normalizeStringArray(images),
        audios: await normalizeStringArray(audios),
        fontSize:
          typeof noteRecord.fontSize === 'number'
            ? noteRecord.fontSize
            : undefined,
        textSegments,
        document: parseRichDocument(noteRecord.document),
        deletedAt:
          typeof noteRecord.deletedAt === 'string'
            ? noteRecord.deletedAt
            : undefined,
        isHidden:
          typeof noteRecord.isHidden === 'boolean'
            ? noteRecord.isHidden
            : undefined,
      };

      return parsedNote;
    }),
  );

  return notes.filter((note): note is Note => note !== null);
};

const getManagedMediaPath = (
  username: string,
  noteId: string,
  mediaType: 'images' | 'audios',
  index: number,
  fallbackExtension: string,
): string => {
  const baseDirectory = `${RNFetchBlob.fs.dirs.DocumentDir}/${mediaType}/${username}`;
  return `${baseDirectory}/${noteId}_${index}.${fallbackExtension}`;
};

const persistMediaUris = async (
  username: string,
  noteId: string,
  mediaUris: string[] | undefined,
  mediaType: 'images' | 'audios',
  fallbackExtension: string,
): Promise<string[] | undefined> => {
  if (!mediaUris) {
    return undefined;
  }

  const persistedUris = await Promise.all(
    mediaUris.map(async (mediaUri, index) => {
      const targetPath = getManagedMediaPath(
        username,
        noteId,
        mediaType,
        index,
        fallbackExtension,
      );

      return copyManagedFile(mediaUri, targetPath);
    }),
  );

  return persistedUris.length > 0 ? persistedUris : undefined;
};

const persistNoteAssets = async (
  username: string,
  note: Note,
): Promise<Note> => {
  return {
    ...note,
    images: await persistMediaUris(username, note.id, note.images, 'images', 'jpg'),
    audios: await persistMediaUris(username, note.id, note.audios, 'audios', 'mp3'),
  };
};

const getNotesKey = (username: string): string => `${NOTES_KEY_PREFIX}${username}`;
const getTrashKey = (username: string): string => `${TRASH_KEY_PREFIX}${username}`;

export const localNoteStore = {
  async loadNotes(username: string): Promise<Note[]> {
    const notesString = await AsyncStorage.getItem(getNotesKey(username));
    return parseNotes(notesString);
  },

  async saveNotes(username: string, notes: Note[]): Promise<void> {
    const persistedNotes = await Promise.all(
      notes.map(note => persistNoteAssets(username, note)),
    );
    await AsyncStorage.setItem(getNotesKey(username), stringifyNotes(persistedNotes));
  },

  async loadTrashNotes(username: string): Promise<Note[]> {
    const notesString = await AsyncStorage.getItem(getTrashKey(username));
    return parseNotes(notesString);
  },

  async saveTrashNotes(username: string, notes: Note[]): Promise<void> {
    await AsyncStorage.setItem(getTrashKey(username), stringifyNotes(notes));
  },

  async moveNoteToTrash(username: string, note: Note): Promise<void> {
    const trashNotes = await this.loadTrashNotes(username);
    const trashNote: Note = {
      ...note,
      deletedAt: new Date().toISOString(),
    };

    await this.saveTrashNotes(username, [...trashNotes, trashNote]);
  },

  async restoreTrashNote(username: string, noteId: string): Promise<Note | null> {
    const trashNotes = await this.loadTrashNotes(username);
    const targetNote = trashNotes.find(note => note.id === noteId) ?? null;

    if (!targetNote) {
      return null;
    }

    const updatedTrashNotes = trashNotes.filter(note => note.id !== noteId);
    await this.saveTrashNotes(username, updatedTrashNotes);

    return {
      ...targetNote,
      timestamp: new Date(),
      deletedAt: undefined,
      isHidden: false,
    };
  },

  async deleteTrashNote(username: string, noteId: string): Promise<void> {
    const trashNotes = await this.loadTrashNotes(username);
    await this.saveTrashNotes(
      username,
      trashNotes.filter(note => note.id !== noteId),
    );
  },
};
