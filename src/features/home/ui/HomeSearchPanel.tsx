import React from 'react';
import {Text, TextInput, View} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import type {SortOrder, SortType} from '../../../entities/note/types';
import {homeScreenStyles} from './homeScreenStyles';
import {HomeSortMenu} from './HomeSortMenu';

type HomeSearchPanelProps = {
  isLoading: boolean;
  onChangeSearchQuery: (value: string) => void;
  onSelectSortOrder: (sortOrder: SortOrder) => void;
  onSelectSortType: (sortType: SortType) => void;
  onToggleSortMenu: () => void;
  searchQuery: string;
  showSortMenu: boolean;
  sortOrder: SortOrder;
  sortType: SortType;
  theme: ReturnType<typeof generateThemeColors>;
};

export const HomeSearchPanel: React.FC<HomeSearchPanelProps> = ({
  isLoading,
  onChangeSearchQuery,
  onSelectSortOrder,
  onSelectSortType,
  onToggleSortMenu,
  searchQuery,
  showSortMenu,
  sortOrder,
  sortType,
  theme,
}) => {
  return (
    <View style={homeScreenStyles.searchContainer}>
      <TextInput
        style={[
          homeScreenStyles.searchInput,
          {
            borderColor: theme.primary,
            backgroundColor: theme.surface,
            color: theme.text,
          },
        ]}
        placeholder="搜索笔记..."
        placeholderTextColor={theme.textLight}
        value={searchQuery}
        onChangeText={onChangeSearchQuery}
      />
      {isLoading ? (
        <View style={homeScreenStyles.loadingContainer}>
          <Text style={[homeScreenStyles.loadingText, {color: theme.textLight}]}>
            加载中...
          </Text>
        </View>
      ) : (
        <View style={homeScreenStyles.tipContainer}>
          <Text style={[homeScreenStyles.tipText, {color: theme.textLight}]}>
            💡 小贴士：长按笔记可以删除哦 (◕‿◕✿)
          </Text>
        </View>
      )}
      <HomeSortMenu
        onSelectSortOrder={onSelectSortOrder}
        onSelectSortType={onSelectSortType}
        onToggle={onToggleSortMenu}
        showSortMenu={showSortMenu}
        sortOrder={sortOrder}
        sortType={sortType}
        theme={theme}
      />
    </View>
  );
};
