// components/ui/screen-header.tsx
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { LinkProps, router } from 'expo-router';
import { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ButtonVariant = "default" | "destructive" | "primary" | "secondary";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean | LinkProps['href'];
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    variant?: ButtonVariant;
  };
  onLongPressHeader?: () => void;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  rightAction,
  onLongPressHeader
}: ScreenHeaderProps) {
  const { isDarkMode, colors } = useTheme();
  const styles = getStyles(colors);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // animate fade in
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 0,
    useNativeDriver: true,
  }).start();

  const getVariantStyles = (variant: ButtonVariant = "default") => {
    const variantStyles: Record<ButtonVariant, { backgroundColor: string; iconColor: string }> = {
      default: {
        backgroundColor: isDarkMode ? colors.muted : colors.card,
        iconColor: colors.foreground,
      },
      primary: {
        backgroundColor: colors.primary,
        iconColor: colors.primaryForeground,
      },
      secondary: {
        backgroundColor: isDarkMode ? colors.accent : colors.secondary,
        iconColor: isDarkMode ? colors.accentForeground : colors.secondaryForeground,
      },
      destructive: {
        backgroundColor: colors.destructive,
        iconColor: colors.destructiveForeground,
      },
    };
    return variantStyles[variant];
  };

  const rightVariant = rightAction?.variant || "default";
  const rightVariantStyles = getVariantStyles(rightVariant);

  return (
    <Animated.View style={[{ opacity: fadeAnim }]}>
      <SafeAreaView
        style={styles.header}
        edges={{ bottom: 'off', top: 'maximum' }}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onLongPress={onLongPressHeader}
          activeOpacity={1}
        />
        {/* Back Button / Spacer */}
        {showBack ? (
          <TouchableOpacity
            style={[
              styles.iconButton,
            ]}
            onPress={() => showBack == true ? router.back() : router.push(showBack)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.foreground}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}

        {/* Center Content */}
        <View style={styles.headerContent}>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.foreground }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.headerSubtitle,
                { color: colors.mutedForeground }
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Action / Spacer */}
        {rightAction ? (
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: rightVariantStyles.backgroundColor,
                borderColor: colors.border,
                width: 40,
                height: 40,
              }
            ]}
            onPress={rightAction.onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={rightAction.icon}
              size={24}
              color={rightVariantStyles.iconColor}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    backgroundColor: colors.tabBackground,
  },
  iconButton: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 44,
    height: 44,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '400',
  },
});