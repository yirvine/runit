import { Platform } from 'react-native';

export const fonts = {
  primary: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System',
  }),
  weights: {
    regular: Platform.select({
      ios: '400',
      android: '400',
      default: 'normal',
    }),
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  sizes: {
    title: 28,
    subtitle: 22,
    body: 16,
    caption: 14,
  },
};

export const typography = {
  title: {
    fontFamily: fonts.primary,
    fontSize: fonts.sizes.title,
    fontWeight: fonts.weights.bold as '700',
  },
  subtitle: {
    fontFamily: fonts.primary,
    fontSize: fonts.sizes.subtitle,
    fontWeight: fonts.weights.semibold as '600',
  },
  body: {
    fontFamily: fonts.primary,
    fontSize: fonts.sizes.body,
    fontWeight: fonts.weights.regular as '400',
  },
  caption: {
    fontFamily: fonts.primary,
    fontSize: fonts.sizes.caption,
    fontWeight: fonts.weights.regular as '400',
  },
  weights: fonts.weights,
}; 