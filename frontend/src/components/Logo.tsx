import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, FONT_WEIGHTS, BORDER_RADIUS } from '../constants/theme';

type LogoVariant = 'full' | 'symbol' | 'compact';

interface LogoProps {
  variant?: LogoVariant;
  width?: number;
  height?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'full', width, height, showText = true }) => {
  if (variant === 'symbol') {
    const size = width && typeof width === 'number' ? width : 48;
    return (
      <Image
        source={require('../../assets/Logo3.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }

  if (variant === 'compact') {
    const symbolSize = width && typeof width === 'number' ? width : 32;
    return (
      <View style={styles.compactContainer}>
        <Image
          source={require('../../assets/Logo3.png')}
          style={{ width: symbolSize, height: symbolSize }}
          resizeMode="contain"
        />
        {showText && <Text style={styles.compactText}>ServeYeah Health</Text>}
      </View>
    );
  }

  const fullW = width && typeof width === 'number' ? width : 200;
  const fullH = height && typeof height === 'number' ? height : 72;

  return (
    <View style={styles.fullContainer}>
      <Image
        source={require('../../assets/logo.jpeg')}
        style={{ width: fullW, height: fullH }}
        resizeMode="contain"
      />
      {showText && <Text style={styles.fullText}>ServeYeah Health</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactText: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryDark,
    fontFamily: FONT_FAMILY.heading,
  },
  fullContainer: {
    alignItems: 'center',
    gap: 8,
  },
  fullText: {
    fontSize: 22,
    fontWeight: FONT_WEIGHTS.black,
    color: COLORS.primaryDark,
    fontFamily: FONT_FAMILY.heading,
  },
});
