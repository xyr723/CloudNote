import {generateThemeColors} from '../../../shared/theme/colors';

export type AuthTheme = ReturnType<typeof generateThemeColors>;

export type AuthFeedbackState = {
  message: string;
  title: string;
  visible: boolean;
};
