import React, {useState} from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type {RichDocument} from '../../../entities/document/types';
import {
  insertWidgetBlock,
  moveWidgetBlock,
  removeWidgetBlock,
  replaceWidgetBlock,
} from '../../../entities/note/document';
import type {WidgetSchema} from '../../../entities/widget/types';
import {useNoteWidgetEditing} from './useNoteWidgetEditing';

const buildWidget = (
  id: string,
  overrides: Partial<WidgetSchema> = {},
): WidgetSchema => ({
  id,
  type: 'todo-list',
  title: `待办 ${id}`,
  props: {
    items: ['一', '二'],
  },
  ...overrides,
});

describe('useNoteWidgetEditing', () => {
  test('creates a widget from h5 insert request and saves it into the requested position', async () => {
    const initialDocument: RichDocument = {
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          text: '正文',
        },
        {
          id: 'widget-block-1',
          type: 'widget',
          widget: buildWidget('widget-1'),
        },
      ],
      plainText: '正文',
    };
    const appliedDocuments: RichDocument[] = [];
    let latestWidgetEditing: ReturnType<typeof useNoteWidgetEditing> | null =
      null;

    const Probe = () => {
      const [document, setDocument] = useState<RichDocument>(initialDocument);

      latestWidgetEditing = useNoteWidgetEditing({
        applyDocumentChange: nextDocument => {
          appliedDocuments.push(nextDocument);
          setDocument(nextDocument);
        },
        getCurrentDocument: () => document,
        visible: true,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });
    const getWidgetEditing = () => latestWidgetEditing!;

    await ReactTestRenderer.act(() => {
      latestWidgetEditing?.handleH5WidgetEvent({
        type: 'widget-insert-request',
        afterBlockId: null,
      });
    });

    expect(getWidgetEditing().pendingWidgetInsert).toEqual({
      afterBlockId: null,
    });

    await ReactTestRenderer.act(() => {
      latestWidgetEditing?.handleSelectWidgetType('quote');
    });

    expect(getWidgetEditing().activeWidgetEditor?.mode).toBe('create');
    expect(getWidgetEditing().activeWidgetEditor?.widget.type).toBe('quote');

    const savedWidget: WidgetSchema = {
      id: 'quote-1',
      type: 'quote',
      title: '引用',
      props: {
        content: '新的引用',
      },
    };

    await ReactTestRenderer.act(() => {
      latestWidgetEditing?.handleSaveWidget(savedWidget);
    });

    expect(appliedDocuments).toHaveLength(1);
    expect(appliedDocuments[0]).toEqual(
      insertWidgetBlock(initialDocument, savedWidget, null),
    );
    expect(getWidgetEditing().activeWidgetEditor).toBeNull();
  });

  test('opens edit mode from h5 request and saves the edited widget back to document', async () => {
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
    const appliedDocuments: RichDocument[] = [];
    let latestWidgetEditing: ReturnType<typeof useNoteWidgetEditing> | null =
      null;

    const Probe = () => {
      const [document, setDocument] = useState<RichDocument>(initialDocument);

      latestWidgetEditing = useNoteWidgetEditing({
        applyDocumentChange: nextDocument => {
          appliedDocuments.push(nextDocument);
          setDocument(nextDocument);
        },
        getCurrentDocument: () => document,
        visible: true,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });
    const getWidgetEditing = () => latestWidgetEditing!;

    await ReactTestRenderer.act(() => {
      latestWidgetEditing?.handleH5WidgetEvent({
        type: 'widget-edit-request',
        blockId: 'widget-block-1',
        widgetId: 'widget-1',
        widgetType: 'todo-list',
      });
    });

    expect(getWidgetEditing().activeWidgetEditor).toEqual({
      mode: 'edit',
      blockId: 'widget-block-1',
      widget: buildWidget('widget-1'),
    });

    const nextWidget = buildWidget('widget-1', {
      title: '编辑后的待办',
    });

    await ReactTestRenderer.act(() => {
      latestWidgetEditing?.handleSaveWidget(nextWidget);
    });

    expect(appliedDocuments).toHaveLength(1);
    expect(appliedDocuments[0]).toEqual(
      replaceWidgetBlock(initialDocument, 'widget-block-1', nextWidget),
    );
    expect(getWidgetEditing().activeWidgetEditor).toBeNull();
  });

  test('deletes the active widget through widget editor sheet action', async () => {
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
    const appliedDocuments: RichDocument[] = [];
    let latestWidgetEditing: ReturnType<typeof useNoteWidgetEditing> | null =
      null;

    const Probe = () => {
      const [document, setDocument] = useState<RichDocument>(initialDocument);

      latestWidgetEditing = useNoteWidgetEditing({
        applyDocumentChange: nextDocument => {
          appliedDocuments.push(nextDocument);
          setDocument(nextDocument);
        },
        getCurrentDocument: () => document,
        visible: true,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });
    const getWidgetEditing = () => latestWidgetEditing!;

    await ReactTestRenderer.act(() => {
      latestWidgetEditing?.handleH5WidgetEvent({
        type: 'widget-edit-request',
        blockId: 'widget-block-1',
        widgetId: 'widget-1',
        widgetType: 'todo-list',
      });
    });

    await ReactTestRenderer.act(() => {
      getWidgetEditing().handleDeleteActiveWidget();
    });

    expect(appliedDocuments).toHaveLength(1);
    expect(appliedDocuments[0]).toEqual(
      removeWidgetBlock(initialDocument, 'widget-block-1'),
    );
    expect(getWidgetEditing().activeWidgetEditor).toBeNull();
  });

  test('moves widget blocks when h5 move request arrives', async () => {
    const initialDocument: RichDocument = {
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          text: '正文',
        },
        {
          id: 'widget-block-1',
          type: 'widget',
          widget: buildWidget('widget-1'),
        },
        {
          id: 'widget-block-2',
          type: 'widget',
          widget: buildWidget('widget-2'),
        },
      ],
      plainText: '正文',
    };
    const appliedDocuments: RichDocument[] = [];
    let latestWidgetEditing: ReturnType<typeof useNoteWidgetEditing> | null =
      null;

    const Probe = () => {
      const [document, setDocument] = useState<RichDocument>(initialDocument);

      latestWidgetEditing = useNoteWidgetEditing({
        applyDocumentChange: nextDocument => {
          appliedDocuments.push(nextDocument);
          setDocument(nextDocument);
        },
        getCurrentDocument: () => document,
        visible: true,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(() => {
      latestWidgetEditing?.handleH5WidgetEvent({
        type: 'widget-move',
        blockId: 'widget-block-2',
        widgetId: 'widget-2',
        widgetType: 'todo-list',
        direction: 'up',
      });
    });

    expect(appliedDocuments).toHaveLength(1);
    expect(appliedDocuments[0]).toEqual(
      moveWidgetBlock(initialDocument, 'widget-block-2', 'up'),
    );
  });
});
