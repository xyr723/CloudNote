import React from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import {generateThemeColors} from '../../../../app/theme/colors';
import {homeScreenStyles} from './homeScreenStyles';

type HomeHeaderProps = {
  onOpenProfile: () => void;
  theme: ReturnType<typeof generateThemeColors>;
  user: {
    avatar?: string;
    isLoggedIn: boolean;
    username: string;
  };
};

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  onOpenProfile,
  theme,
  user,
}) => {
  return (
    <View style={[homeScreenStyles.header, {backgroundColor: theme.primary}]}>
      <Text style={homeScreenStyles.title}>云笔记</Text>
      <TouchableOpacity
        style={[
          homeScreenStyles.profileButton,
          {backgroundColor: theme.surface},
        ]}
        onPress={onOpenProfile}>
        {user.avatar ? (
          <Image
            source={{uri: user.avatar}}
            style={homeScreenStyles.profileImage}
          />
        ) : (
          <Text
            style={[
              homeScreenStyles.profileButtonText,
              {color: theme.primary},
            ]}>
            {user.username ? user.username[0].toUpperCase() : '?'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
