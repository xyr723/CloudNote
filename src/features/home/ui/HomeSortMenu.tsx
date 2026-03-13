import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {generateThemeColors} from '../../../../app/theme/colors';
import type {SortOrder, SortType} from '../../../entities/note/types';
import {homeScreenStyles} from './homeScreenStyles';

type HomeSortMenuProps = {
  onSelectSortOrder: (sortOrder: SortOrder) => void;
  onSelectSortType: (sortType: SortType) => void;
  onToggle: () => void;
  showSortMenu: boolean;
  sortOrder: SortOrder;
  sortType: SortType;
  theme: ReturnType<typeof generateThemeColors>;
};

export const HomeSortMenu: React.FC<HomeSortMenuProps> = ({
  onSelectSortOrder,
  onSelectSortType,
  onToggle,
  showSortMenu,
  sortOrder,
  sortType,
  theme,
}) => {
  return (
    <View style={homeScreenStyles.sortMenu}>
      <TouchableOpacity
        style={[
          homeScreenStyles.sortMenuButton,
          {backgroundColor: theme.primaryLight},
        ]}
        onPress={onToggle}>
        <Text
          style={[homeScreenStyles.sortMenuButtonText, {color: theme.text}]}>
          {sortType === 'editDate'
            ? '编辑日期'
            : sortType === 'createDate'
              ? '创建日期'
              : '标题'}
        </Text>
        <Text style={[homeScreenStyles.sortMenuArrow, {color: theme.text}]}>
          {showSortMenu ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>
      {showSortMenu && (
        <View
          style={[
            homeScreenStyles.sortMenuContent,
            {backgroundColor: theme.surface},
          ]}>
          <View style={homeScreenStyles.sortMenuSection}>
            <Text
              style={[homeScreenStyles.sortMenuTitle, {color: theme.textLight}]}>
              排序方式
            </Text>
            <TouchableOpacity
              style={[
                homeScreenStyles.sortMenuItem,
                sortType === 'editDate' && {
                  backgroundColor: theme.primaryLight,
                },
              ]}
              onPress={() => onSelectSortType('editDate')}>
              <Text
                style={[homeScreenStyles.sortMenuItemText, {color: theme.text}]}>
                编辑日期
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                homeScreenStyles.sortMenuItem,
                sortType === 'createDate' && {
                  backgroundColor: theme.primaryLight,
                },
              ]}
              onPress={() => onSelectSortType('createDate')}>
              <Text
                style={[homeScreenStyles.sortMenuItemText, {color: theme.text}]}>
                创建日期
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                homeScreenStyles.sortMenuItem,
                sortType === 'title' && {backgroundColor: theme.primaryLight},
              ]}
              onPress={() => onSelectSortType('title')}>
              <Text
                style={[homeScreenStyles.sortMenuItemText, {color: theme.text}]}>
                标题
              </Text>
            </TouchableOpacity>
          </View>
          <View style={homeScreenStyles.sortMenuSection}>
            <Text
              style={[homeScreenStyles.sortMenuTitle, {color: theme.textLight}]}>
              排序顺序
            </Text>
            <TouchableOpacity
              style={[
                homeScreenStyles.sortMenuItem,
                sortOrder === 'desc' && {
                  backgroundColor: theme.primaryLight,
                },
              ]}
              onPress={() => onSelectSortOrder('desc')}>
              <Text
                style={[homeScreenStyles.sortMenuItemText, {color: theme.text}]}>
                降序
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                homeScreenStyles.sortMenuItem,
                sortOrder === 'asc' && {backgroundColor: theme.primaryLight},
              ]}
              onPress={() => onSelectSortOrder('asc')}>
              <Text
                style={[homeScreenStyles.sortMenuItemText, {color: theme.text}]}>
                升序
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};
