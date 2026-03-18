import type {TextSegment} from '../../../entities/note/types';
import type {WidgetType} from '../../../entities/widget/types';
import type {ThemeColors} from '../../../shared/theme/colors';

export type H5TextEditorState = {
  content: string;
  textSegments: TextSegment[];
};

export type H5TextEditorFormatCommand = {
  id: number;
  type: 'bold' | 'italic';
};

export type H5TextEditorDeleteMediaPayload = {
  kind: 'image' | 'audio';
  index: number;
};

export type H5TextEditorMediaInsertAction =
  | 'pick-image'
  | 'capture-image'
  | 'record-audio';

export type H5TextEditorMediaInsertRequestEvent = {
  type: 'media-insert-request';
  action: H5TextEditorMediaInsertAction;
};

export type H5TextEditorSelectionPayload = {
  start: number;
  end: number;
  cursorPosition: number;
};

export type H5WidgetBridgeEvent =
  | {
      type: 'widget-select';
      blockId: string;
      widgetId: string;
      widgetType: WidgetType;
    }
  | {
      type: 'widget-edit-request';
      blockId: string;
      widgetId: string;
      widgetType: WidgetType;
    }
  | {
      type: 'widget-delete';
      blockId: string;
      widgetId: string;
      widgetType: WidgetType;
    }
  | {
      type: 'widget-insert-request';
      afterBlockId?: string | null;
    };

type H5TextEditorMessage =
  | ({
      type: 'content-change';
    } & H5TextEditorState)
  | ({
      type: 'selection-change';
    } & H5TextEditorSelectionPayload)
  | ({
      type: 'media-delete';
    } & H5TextEditorDeleteMediaPayload)
  | H5TextEditorMediaInsertRequestEvent
  | H5WidgetBridgeEvent
  | {
      type: 'unknown';
    };

const isTextSegment = (value: unknown): value is TextSegment => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const segment = value as Partial<TextSegment>;

  return (
    typeof segment.text === 'string' && typeof segment.fontSize === 'number'
  );
};

const isTextSegmentList = (value: unknown): value is TextSegment[] => {
  return Array.isArray(value) && value.every(isTextSegment);
};

const isMediaKind = (value: unknown): value is 'image' | 'audio' => {
  return value === 'image' || value === 'audio';
};

const isMediaInsertAction = (
  value: unknown,
): value is H5TextEditorMediaInsertAction => {
  return (
    value === 'pick-image' ||
    value === 'capture-image' ||
    value === 'record-audio'
  );
};

const isSelectionOffset = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
};

const isWidgetType = (value: unknown): value is WidgetType => {
  return (
    value === 'todo-list' ||
    value === 'action-card' ||
    value === 'form' ||
    value === 'quote' ||
    value === 'metric' ||
    value === 'timeline'
  );
};

const isWidgetMessageIdentifier = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0;
};

export const parseH5TextEditorMessage = (data: string): H5TextEditorMessage => {
  try {
    const message = JSON.parse(data) as {
      action?: unknown;
      afterBlockId?: unknown;
      blockId?: unknown;
      content?: unknown;
      cursorPosition?: unknown;
      end?: unknown;
      index?: unknown;
      kind?: unknown;
      start?: unknown;
      textSegments?: unknown;
      type?: unknown;
      widgetId?: unknown;
      widgetType?: unknown;
    };

    if (
      message.type === 'content-change' &&
      typeof message.content === 'string' &&
      isTextSegmentList(message.textSegments)
    ) {
      return {
        type: 'content-change',
        content: message.content,
        textSegments: message.textSegments,
      };
    }

    if (
      message.type === 'selection-change' &&
      isSelectionOffset(message.start) &&
      isSelectionOffset(message.end) &&
      isSelectionOffset(message.cursorPosition)
    ) {
      return {
        type: 'selection-change',
        start: message.start,
        end: message.end,
        cursorPosition: message.cursorPosition,
      };
    }

    if (
      message.type === 'media-delete' &&
      isMediaKind(message.kind) &&
      typeof message.index === 'number'
    ) {
      return {
        type: 'media-delete',
        kind: message.kind,
        index: message.index,
      };
    }

    if (
      message.type === 'media-insert-request' &&
      isMediaInsertAction(message.action)
    ) {
      return {
        type: 'media-insert-request',
        action: message.action,
      };
    }

    if (
      (message.type === 'widget-select' ||
        message.type === 'widget-edit-request' ||
        message.type === 'widget-delete') &&
      isWidgetMessageIdentifier(message.blockId) &&
      isWidgetMessageIdentifier(message.widgetId) &&
      isWidgetType(message.widgetType)
    ) {
      return {
        type: message.type,
        blockId: message.blockId,
        widgetId: message.widgetId,
        widgetType: message.widgetType,
      };
    }

    if (
      message.type === 'widget-insert-request' &&
      (typeof message.afterBlockId === 'string' ||
        typeof message.afterBlockId === 'undefined' ||
        message.afterBlockId === null)
    ) {
      return {
        type: 'widget-insert-request',
        afterBlockId: message.afterBlockId,
      };
    }
  } catch (error) {
    console.error('Failed to parse H5 editor message', error);
  }

  return {type: 'unknown'};
};

const createBridgeScript = (): string => {
  return `
      (function () {
        var editor = document.getElementById('editor');

        if (!editor) {
          return;
        }

        var mediaActions = document.getElementById('note-media-actions');

        var normalizeText = function (value) {
          return (value || '')
            .replace(/\\r\\n/g, '\\n')
            .replace(/\\u00A0/g, ' ');
        };

        var isMarkerElement = function (node) {
          return Boolean(
            node &&
              node.nodeType === Node.ELEMENT_NODE &&
              node.hasAttribute('data-note-marker'),
          );
        };

        var isWidgetElement = function (node) {
          return Boolean(
            node &&
              node.nodeType === Node.ELEMENT_NODE &&
              (node.hasAttribute('data-widget-block-id') ||
                node.hasAttribute('data-widget-insert-request')),
          );
        };

        var isTextSegmentElement = function (node) {
          return Boolean(
            node &&
              node.nodeType === Node.ELEMENT_NODE &&
              node.classList.contains('note-text-segment'),
          );
        };

        var getDefaultStyle = function () {
          return {
            fontSize: parseInt(
              editor.getAttribute('data-default-font-size') || '16',
              10,
            ),
            isBold: editor.getAttribute('data-default-is-bold') === 'true',
            isItalic: editor.getAttribute('data-default-is-italic') === 'true',
            color: editor.getAttribute('data-default-color') || '',
          };
        };

        var readSegmentStyle = function (node, fallbackStyle) {
          if (!isTextSegmentElement(node)) {
            return fallbackStyle;
          }

          return {
            fontSize: parseInt(
              node.getAttribute('data-note-font-size') ||
                String(fallbackStyle.fontSize),
              10,
            ),
            isBold: node.getAttribute('data-note-is-bold') === 'true',
            isItalic: node.getAttribute('data-note-is-italic') === 'true',
            color: node.getAttribute('data-note-color') || fallbackStyle.color,
          };
        };

        var createSegment = function (text, style) {
          var segment = {
            text: text,
            fontSize: style.fontSize,
          };

          if (style.isBold) {
            segment.isBold = true;
          }

          if (style.isItalic) {
            segment.isItalic = true;
          }

          if (style.color) {
            segment.color = style.color;
          }

          return segment;
        };

        var areStylesEqual = function (left, right) {
          return (
            left.fontSize === right.fontSize &&
            Boolean(left.isBold) === Boolean(right.isBold) &&
            Boolean(left.isItalic) === Boolean(right.isItalic) &&
            (left.color || '') === (right.color || '')
          );
        };

        var appendSegmentText = function (segments, text, style) {
          var normalizedText = normalizeText(text);

          if (!normalizedText) {
            return;
          }

          var lastSegment = segments[segments.length - 1];

          if (lastSegment && areStylesEqual(lastSegment, style)) {
            lastSegment.text += normalizedText;
            return;
          }

          segments.push(createSegment(normalizedText, style));
        };

        var serializeNode = function (node, currentStyle, segments) {
          if (!node) {
            return;
          }

          if (node.nodeType === Node.TEXT_NODE) {
            appendSegmentText(segments, node.textContent || '', currentStyle);
            return;
          }

          if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
          }

          if (isMarkerElement(node)) {
            appendSegmentText(
              segments,
              node.getAttribute('data-note-marker') || '',
              currentStyle,
            );
            return;
          }

          if (isWidgetElement(node)) {
            return;
          }

          if (node.tagName === 'BR') {
            appendSegmentText(segments, '\\n', currentStyle);
            return;
          }

          var nextStyle = readSegmentStyle(node, currentStyle);

          Array.from(node.childNodes).forEach(function (childNode) {
            serializeNode(childNode, nextStyle, segments);
          });
        };

        var normalizeSegments = function (segments) {
          var filteredSegments = segments.filter(function (segment) {
            return segment.text !== '';
          });

          if (filteredSegments.length > 0) {
            return filteredSegments;
          }

          return [createSegment('', getDefaultStyle())];
        };

        var serializeEditor = function () {
          var segments = [];
          var defaultStyle = getDefaultStyle();

          Array.from(editor.childNodes).forEach(function (childNode) {
            serializeNode(childNode, defaultStyle, segments);
          });

          var normalizedSegments = normalizeSegments(segments);
          var content = normalizedSegments
            .map(function (segment) {
              return segment.text;
            })
            .join('');

          return {
            content: content,
            textSegments: normalizedSegments,
          };
        };

        var getSerializedNodeLength = function (node) {
          if (!node) {
            return 0;
          }

          if (node.nodeType === Node.TEXT_NODE) {
            return normalizeText(node.textContent || '').length;
          }

          if (node.nodeType !== Node.ELEMENT_NODE) {
            return 0;
          }

          if (isMarkerElement(node)) {
            return normalizeText(node.getAttribute('data-note-marker') || '').length;
          }

          if (isWidgetElement(node)) {
            return 0;
          }

          if (node.tagName === 'BR') {
            return 1;
          }

          return Array.from(node.childNodes).reduce(function (total, childNode) {
            return total + getSerializedNodeLength(childNode);
          }, 0);
        };

        var getNodeOffset = function (node, offset) {
          if (!node) {
            return 0;
          }

          if (node.nodeType === Node.TEXT_NODE) {
            return normalizeText((node.textContent || '').slice(0, offset)).length;
          }

          if (node.nodeType !== Node.ELEMENT_NODE) {
            return 0;
          }

          if (isMarkerElement(node)) {
            return offset > 0 ? getSerializedNodeLength(node) : 0;
          }

          if (node.tagName === 'BR') {
            return offset > 0 ? 1 : 0;
          }

          var boundedOffset = Math.max(0, Math.min(offset, node.childNodes.length));

          return Array.from(node.childNodes)
            .slice(0, boundedOffset)
            .reduce(function (total, childNode) {
              return total + getSerializedNodeLength(childNode);
            }, 0);
        };

        var isWithinEditor = function (node) {
          return Boolean(node && (node === editor || editor.contains(node)));
        };

        var getAbsoluteOffset = function (node, offset) {
          if (!isWithinEditor(node)) {
            return null;
          }

          var position = getNodeOffset(node, offset);
          var currentNode = node;

          while (currentNode && currentNode !== editor) {
            var sibling = currentNode.previousSibling;

            while (sibling) {
              position += getSerializedNodeLength(sibling);
              sibling = sibling.previousSibling;
            }

            currentNode = currentNode.parentNode;
          }

          return position;
        };

        var resolveSelectionState = function () {
          var selection = window.getSelection();

          if (!selection || selection.rangeCount === 0) {
            return null;
          }

          var range = selection.getRangeAt(0);

          if (
            !isWithinEditor(range.startContainer) ||
            !isWithinEditor(range.endContainer)
          ) {
            return null;
          }

          var start = getAbsoluteOffset(range.startContainer, range.startOffset);
          var end = getAbsoluteOffset(range.endContainer, range.endOffset);

          if (typeof start !== 'number' || typeof end !== 'number') {
            return null;
          }

          return {
            start: start,
            end: end,
            cursorPosition: start,
          };
        };

        var postChange = function () {
          if (!window.ReactNativeWebView) {
            return;
          }

          var state = serializeEditor();

          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'content-change',
              content: state.content,
              textSegments: state.textSegments,
            }),
          );
        };

        var postSelectionChange = function () {
          if (!window.ReactNativeWebView) {
            return;
          }

          var selectionState = resolveSelectionState();

          if (!selectionState) {
            return;
          }

          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'selection-change',
              start: selectionState.start,
              end: selectionState.end,
              cursorPosition: selectionState.cursorPosition,
            }),
          );
        };

        window.__cloudNoteH5PostChange = postChange;
        window.__cloudNoteH5ApplyFormat = function (commandType) {
          if (!editor || typeof document.execCommand !== 'function') {
            return;
          }

          editor.focus();
          document.execCommand(commandType, false, null);
          postChange();
          postSelectionChange();
        };

        var insertPlainTextAtSelection = function (text) {
          var selection = window.getSelection();

          if (!selection || selection.rangeCount === 0) {
            return;
          }

          var range = selection.getRangeAt(0);
          range.deleteContents();

          var textNode = document.createTextNode(text);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        };

        var resolveAdjacentNode = function (container, offset, direction) {
          if (!container) {
            return null;
          }

          if (container.nodeType === Node.TEXT_NODE) {
            if (direction === 'backward' && offset === 0) {
              return container.previousSibling || container.parentNode.previousSibling;
            }

            if (
              direction === 'forward' &&
              offset === (container.textContent || '').length
            ) {
              return container.nextSibling || container.parentNode.nextSibling;
            }

            return null;
          }

          if (container.nodeType === Node.ELEMENT_NODE) {
            if (direction === 'backward' && offset > 0) {
              return container.childNodes[offset - 1] || null;
            }

            if (direction === 'forward' && offset < container.childNodes.length) {
              return container.childNodes[offset] || null;
            }
          }

          return null;
        };

        editor.addEventListener('keydown', function (event) {
          if (event.key === 'Enter') {
            event.preventDefault();
            insertPlainTextAtSelection('\\n');
            postChange();
            return;
          }

          if (event.key !== 'Backspace' && event.key !== 'Delete') {
            return;
          }

          var selection = window.getSelection();

          if (!selection || selection.rangeCount === 0) {
            return;
          }

          var range = selection.getRangeAt(0);

          if (!range.collapsed) {
            var fragment = range.cloneContents();

            if (
              fragment.querySelector &&
              fragment.querySelector('[data-note-marker]')
            ) {
              event.preventDefault();
            }

            return;
          }

          var adjacentNode = resolveAdjacentNode(
            range.startContainer,
            range.startOffset,
            event.key === 'Backspace' ? 'backward' : 'forward',
          );

          if (isMarkerElement(adjacentNode) || isWidgetElement(adjacentNode)) {
            event.preventDefault();
          }
        });

        editor.addEventListener('paste', function (event) {
          var clipboardData =
            event.clipboardData ||
            window.clipboardData;

          if (!clipboardData) {
            return;
          }

          event.preventDefault();
          insertPlainTextAtSelection(clipboardData.getData('text'));
          postChange();
          postSelectionChange();
        });

        editor.addEventListener('click', function (event) {
          var target = event.target;

          if (
            !target ||
            typeof target.closest !== 'function' ||
            !window.ReactNativeWebView
          ) {
            return;
          }

          var deleteButton = target.closest('[data-note-marker-delete-kind]');

          if (!deleteButton) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          var kind = deleteButton.getAttribute('data-note-marker-delete-kind');
          var index = parseInt(
            deleteButton.getAttribute('data-note-marker-delete-index') || '-1',
            10,
          );

          if ((kind !== 'image' && kind !== 'audio') || index < 0) {
            return;
          }

          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'media-delete',
              kind: kind,
              index: index,
            }),
          );
          return;
        });

        editor.addEventListener('click', function (event) {
          var target = event.target;

          if (
            !target ||
            typeof target.closest !== 'function' ||
            !window.ReactNativeWebView
          ) {
            return;
          }

          var resolveWidgetMeta = function (element) {
            var widgetElement = element.closest('[data-widget-block-id]');

            if (!widgetElement) {
              return null;
            }

            var blockId = widgetElement.getAttribute('data-widget-block-id');
            var widgetId = widgetElement.getAttribute('data-widget-id');
            var widgetType = widgetElement.getAttribute('data-widget-type');

            if (!blockId || !widgetId || !widgetType) {
              return null;
            }

            return {
              blockId: blockId,
              widgetId: widgetId,
              widgetType: widgetType,
            };
          };

          var widgetActionButton = target.closest('[data-widget-action]');

          if (widgetActionButton) {
            var widgetAction = widgetActionButton.getAttribute('data-widget-action');
            var widgetMeta = resolveWidgetMeta(widgetActionButton);

            if (
              !widgetMeta ||
              (widgetAction !== 'edit' && widgetAction !== 'delete')
            ) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type:
                  widgetAction === 'edit'
                    ? 'widget-edit-request'
                    : 'widget-delete',
                blockId: widgetMeta.blockId,
                widgetId: widgetMeta.widgetId,
                widgetType: widgetMeta.widgetType,
              }),
            );
            return;
          }

          var widgetInsertButton = target.closest('[data-widget-insert-request]');

          if (widgetInsertButton) {
            event.preventDefault();
            event.stopPropagation();
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'widget-insert-request',
                afterBlockId:
                  widgetInsertButton.getAttribute(
                    'data-widget-insert-after-block-id',
                  ) || null,
              }),
            );
            return;
          }

          var widgetMeta = resolveWidgetMeta(target);

          if (!widgetMeta) {
            return;
          }

          event.preventDefault();
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'widget-select',
              blockId: widgetMeta.blockId,
              widgetId: widgetMeta.widgetId,
              widgetType: widgetMeta.widgetType,
            }),
          );
        });

        if (mediaActions) {
          mediaActions.addEventListener('click', function (event) {
            var target = event.target;

            if (
              !target ||
              typeof target.closest !== 'function' ||
              !window.ReactNativeWebView
            ) {
              return;
            }

            var mediaActionButton = target.closest('[data-note-media-insert-action]');

            if (!mediaActionButton) {
              return;
            }

            var action = mediaActionButton.getAttribute(
              'data-note-media-insert-action',
            );

            if (
              action !== 'pick-image' &&
              action !== 'capture-image' &&
              action !== 'record-audio'
            ) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'media-insert-request',
                action: action,
              }),
            );
          });
        }

        editor.addEventListener('input', postChange);
        editor.addEventListener('focus', postSelectionChange);
        editor.addEventListener('blur', postChange);
        editor.addEventListener('keyup', postSelectionChange);
        editor.addEventListener('mouseup', postSelectionChange);
        document.addEventListener('selectionchange', postSelectionChange);
      })();
  `;
};

export const createH5TextEditorHtml = ({
  bodyHtml,
  defaultTextColor,
  fontSize,
  theme,
}: {
  bodyHtml: string;
  defaultTextColor: string;
  fontSize: number;
  theme: ThemeColors;
}): string => {
  const mediaActionsHtml = `
    <div id="note-media-actions" class="note-media-actions">
      <button type="button" class="note-media-action-button" data-note-media-insert-action="pick-image">相册</button>
      <button type="button" class="note-media-action-button" data-note-media-insert-action="capture-image">拍照</button>
      <button type="button" class="note-media-action-button" data-note-media-insert-action="record-audio">录音</button>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
        padding: 0;
        background: ${theme.surface};
        color: ${defaultTextColor};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .note-media-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 16px 16px 0;
      }

      .note-media-action-button {
        border: 1px solid ${theme.border};
        border-radius: 999px;
        background: ${theme.surface};
        color: ${theme.text};
        font-size: 13px;
        line-height: 1;
        padding: 8px 12px;
        cursor: pointer;
      }

      #editor {
        min-height: calc(100vh - 64px);
        padding: 16px;
        outline: none;
        font-size: ${fontSize}px;
        line-height: 1.7;
        color: ${defaultTextColor};
        white-space: pre-wrap;
        word-break: break-word;
      }

      .note-marker {
        display: inline-flex;
        align-items: center;
        padding: 2px 10px;
        border-radius: 999px;
        margin: 0 2px;
        background: ${theme.primaryTransparent};
        color: ${theme.primaryDark};
        border: 1px solid ${theme.border};
        user-select: none;
        -webkit-user-select: none;
      }

      .note-marker-label {
        display: inline-flex;
        align-items: center;
      }

      .note-marker-remove {
        margin-left: 6px;
        border: none;
        background: transparent;
        color: inherit;
        font-size: 14px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
      }

      .note-widget-block {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 12px;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid ${theme.border};
        background: ${theme.primaryTransparent};
      }

      .note-widget-meta {
        min-width: 0;
        flex: 1;
      }

      .note-widget-title {
        font-weight: 600;
        color: ${theme.textDark};
      }

      .note-widget-description {
        margin-top: 4px;
        font-size: 13px;
        color: ${theme.textLight};
      }

      .note-widget-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .note-widget-button,
      .note-widget-insert-button {
        border: 1px solid ${theme.border};
        border-radius: 999px;
        background: ${theme.surface};
        color: ${theme.text};
        font-size: 13px;
        line-height: 1;
        padding: 8px 12px;
        cursor: pointer;
      }

      .note-widget-button-danger {
        color: ${theme.error};
      }

      .note-widget-insert-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-top: 12px;
      }
    </style>
  </head>
  <body>
    ${mediaActionsHtml}
    <div
      id="editor"
      contenteditable="true"
      spellcheck="false"
      data-default-font-size="${fontSize}"
      data-default-is-bold="false"
      data-default-is-italic="false"
      data-default-color="${defaultTextColor}"
    >${bodyHtml}</div>
    <script>${createBridgeScript()}</script>
  </body>
</html>`;
};

export const createH5TextEditorSyncScript = ({
  bodyHtml,
  defaultTextColor,
  fontSize,
  theme,
}: {
  bodyHtml: string;
  defaultTextColor: string;
  fontSize: number;
  theme: ThemeColors;
}): string => {
  return `(function () {
  var editor = document.getElementById('editor');

  if (!editor) {
    return true;
  }

  document.body.style.background = ${JSON.stringify(theme.surface)};
  document.body.style.color = ${JSON.stringify(defaultTextColor)};
  editor.style.fontSize = ${JSON.stringify(`${fontSize}px`)};
  editor.style.color = ${JSON.stringify(defaultTextColor)};
  editor.setAttribute('data-default-font-size', ${JSON.stringify(String(fontSize))});
  editor.setAttribute('data-default-is-bold', 'false');
  editor.setAttribute('data-default-is-italic', 'false');
  editor.setAttribute('data-default-color', ${JSON.stringify(defaultTextColor)});

  var nextHtml = ${JSON.stringify(bodyHtml)};

  if (editor.innerHTML !== nextHtml) {
    editor.innerHTML = nextHtml;
  }

  return true;
})();`;
};

export const createH5TextEditorFormatScript = ({
  type,
}: H5TextEditorFormatCommand): string => {
  return `(function () {
  if (typeof window.__cloudNoteH5ApplyFormat === 'function') {
    window.__cloudNoteH5ApplyFormat(${JSON.stringify(type)});
  }

  return true;
})();`;
};
