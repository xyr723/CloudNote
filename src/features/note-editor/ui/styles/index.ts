import {StyleSheet} from 'react-native';
import {layoutStyles} from './layoutStyles';
import {mediaStyles} from './mediaStyles';
import {statusStyles} from './statusStyles';

export const styles = StyleSheet.create({
  ...layoutStyles,
  ...mediaStyles,
  ...statusStyles,
});
