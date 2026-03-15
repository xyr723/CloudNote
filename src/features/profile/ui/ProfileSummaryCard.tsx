import React from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import type {AuthTheme} from '../../auth/ui/types';
import {profileModalStyles} from './profileModalStyles';
import {profileScaffoldStyles} from './profileScaffoldStyles';

type ProfileSummaryCardProps = {
  avatar?: string;
  avatarSource?: {uri: string};
  notesCount: number;
  onPressAvatar: () => void;
  theme: AuthTheme;
  username: string;
};

export const ProfileSummaryCard: React.FC<ProfileSummaryCardProps> = ({
  avatar,
  avatarSource,
  notesCount,
  onPressAvatar,
  theme,
  username,
}) => {
  return (
    <View
      style={[
        profileScaffoldStyles.sectionCard,
        profileModalStyles.profileSection,
        {backgroundColor: theme.surface},
      ]}>
      <TouchableOpacity
        onPress={onPressAvatar}
        style={[
          profileModalStyles.avatarContainer,
          {backgroundColor: theme.primary},
        ]}>
        {avatar ? (
          <Image source={avatarSource} style={profileModalStyles.avatarImage} />
        ) : (
          <Text style={[profileModalStyles.avatarText, {color: theme.surface}]}>
            {username?.[0]?.toUpperCase() ?? '?'}
          </Text>
        )}
      </TouchableOpacity>
      <Text style={[profileModalStyles.username, {color: theme.textDark}]}>
        {username}
      </Text>
      <View style={profileModalStyles.statsContainer}>
        <View style={profileModalStyles.statItem}>
          <Text style={[profileModalStyles.statNumber, {color: theme.primary}]}>
            {notesCount}
          </Text>
          <Text style={[profileModalStyles.statLabel, {color: theme.primaryLight}]}>
            笔记数量
          </Text>
        </View>
      </View>
    </View>
  );
};
