import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {ActivityIndicator, Text, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {useTrashNotes} from '../model/useTrashNotes';
import {TrashModal} from './TrashModal';

jest.mock('../model/useTrashNotes', () => ({
  useTrashNotes: jest.fn(),
}));

const mockUseTrashNotes = useTrashNotes as jest.MockedFunction<
  typeof useTrashNotes
>;

const theme = generateThemeColors('薄荷生巧', false);

const createHookState = (overrides: Partial<ReturnType<typeof useTrashNotes>> = {}) => {
  return {
    notes: [],
    isLoading: false,
    isRefreshing: false,
    activeAction: null,
    selectedNote: null,
    successFeedback: null,
    refresh: jest.fn(),
    requestRestore: jest.fn(),
    requestDelete: jest.fn(),
    closeActionModal: jest.fn(),
    closeSuccessFeedback: jest.fn(),
    confirmAction: jest.fn(),
    ...overrides,
  };
};

describe('TrashModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state from trash feature entry', async () => {
    mockUseTrashNotes.mockReturnValue(createHookState({isLoading: true}));

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TrashModal username="alice" onClose={() => {}} theme={theme} />,
      );
    });

    expect(
      renderer!.root.findAllByType(ActivityIndicator).length,
    ).toBeGreaterThan(0);
  });

  test('renders empty state when trash notes are empty', async () => {
    mockUseTrashNotes.mockReturnValue(createHookState());

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TrashModal username="alice" onClose={() => {}} theme={theme} />,
      );
    });

    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '暂无已删除的笔记',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('renders notes and opens restore confirmation', async () => {
    const requestRestore = jest.fn();
    mockUseTrashNotes.mockReturnValue(
      createHookState({
        notes: [
          {
            id: 'trash-1',
            title: '已删除标题',
            content: '已删除内容',
            deletedAt: '2026-03-15T12:00:00.000Z',
            timestamp: new Date('2026-03-15T10:00:00.000Z'),
          },
        ],
        requestRestore,
      }),
    );

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TrashModal username="alice" onClose={() => {}} theme={theme} />,
      );
    });

    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '已删除标题',
      ).length,
    ).toBeGreaterThan(0);

    const restoreButton = renderer!.root.find(node => {
      if (node.type !== TouchableOpacity) {
        return false;
      }

      return (
        node.findAll(
          child => child.type === Text && child.props.children === '恢复',
        ).length > 0
      );
    });

    await ReactTestRenderer.act(async () => {
      restoreButton.props.onPress();
    });

    expect(requestRestore).toHaveBeenCalledWith(
      expect.objectContaining({id: 'trash-1'}),
    );
  });

  test('renders delete confirmation and success feedback variants', async () => {
    const confirmAction = jest.fn();
    const closeActionModal = jest.fn();
    const closeSuccessFeedback = jest.fn();

    mockUseTrashNotes.mockReturnValue(
      createHookState({
        activeAction: 'delete',
        selectedNote: {
          id: 'trash-1',
          title: '已删除标题',
          content: '已删除内容',
          deletedAt: '2026-03-15T12:00:00.000Z',
          timestamp: new Date('2026-03-15T10:00:00.000Z'),
        },
        successFeedback: 'delete',
        confirmAction,
        closeActionModal,
        closeSuccessFeedback,
      }),
    );

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TrashModal username="alice" onClose={() => {}} theme={theme} />,
      );
    });

    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '彻底删除',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '删除成功',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAll(
        node =>
          node.type === Text && node.props.children === '笔记已彻底删除',
      ).length,
    ).toBeGreaterThan(0);
  });
});
