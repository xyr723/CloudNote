import React, {useState} from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type {RichDocument} from '../../../entities/document/types';
import {appendWidgetSchemasToDocument, mergeTextDocumentWithWidgets} from '../../../entities/note/document';
import type {WidgetSchema} from '../../../entities/widget/types';
import {
  createNoteTextMirrorDocument,
  createWidgetOnlyDocument,
} from './noteEditorDocument';
import {useNoteDocumentMirror} from './useNoteDocumentMirror';

const buildWidget = (id: string): WidgetSchema => ({
  id,
  type: 'todo-list',
  title: `待办 ${id}`,
  props: {
    items: ['一', '二'],
  },
});

describe('useNoteDocumentMirror', () => {
  test('syncs a live text mirror while keeping a widget-only document for H5 editor', async () => {
    const initialDocument: RichDocument = {
      version: '1.0',
      blocks: [
        {
          id: 'widget-block-1',
          type: 'widget',
          widget: buildWidget('widget-1'),
        },
      ],
    };
    const onChangeDocument = jest.fn();
    let latestMirror: ReturnType<typeof useNoteDocumentMirror> | null = null;

    const Probe = () => {
      const [document, setDocument] = useState<RichDocument | undefined>(
        initialDocument,
      );

      latestMirror = useNoteDocumentMirror({
        noteDocument: document,
        onChangeDocument: nextDocument => {
          setDocument(nextDocument);
          onChangeDocument(nextDocument);
        },
        visible: true,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(() => {
      latestMirror?.markTextMirrorDirty();
      latestMirror?.syncTextMirror('原文[图片0]更新');
    });

    const expectedDocument = mergeTextDocumentWithWidgets(
      createNoteTextMirrorDocument('原文[图片0]更新'),
      initialDocument,
    );
    const mirror = latestMirror!;

    expect(onChangeDocument).toHaveBeenLastCalledWith(expectedDocument);
    expect(mirror.draftDocument).toEqual(expectedDocument);
    expect(mirror.widgetDocument).toEqual(
      createWidgetOnlyDocument(expectedDocument),
    );
  });

  test('keeps the full live mirror as the last document write when widgets append during dirty text updates', async () => {
    const aiWidget = buildWidget('todo-1');
    const onChangeDocument = jest.fn();
    let latestMirror: ReturnType<typeof useNoteDocumentMirror> | null = null;

    const Probe = () => {
      const [document, setDocument] = useState<RichDocument | undefined>(
        undefined,
      );

      latestMirror = useNoteDocumentMirror({
        noteDocument: document,
        onChangeDocument: nextDocument => {
          setDocument(nextDocument);
          onChangeDocument(nextDocument);
        },
        visible: true,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(() => {
      latestMirror?.markTextMirrorDirty();
      latestMirror?.handleAppendWidgets([aiWidget]);
      latestMirror?.syncTextMirror('原文续写内容');
    });

    const expectedDocument = mergeTextDocumentWithWidgets(
      createNoteTextMirrorDocument('原文续写内容'),
      appendWidgetSchemasToDocument(undefined, [aiWidget]),
    );
    const mirror = latestMirror!;

    expect(onChangeDocument).toHaveBeenLastCalledWith(expectedDocument);
    expect(mirror.draftDocument).toEqual(expectedDocument);
    expect(mirror.widgetDocument).toEqual(
      createWidgetOnlyDocument(expectedDocument),
    );
  });
});
