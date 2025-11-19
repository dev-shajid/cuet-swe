import { ColorScheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    DimensionValue,
    Modal as RNModal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { Text } from './text';

export interface ModalOption {
    label: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    destructive?: boolean;
    disabled?: boolean;
}

interface ModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    colors: ColorScheme;
    scrollable?: boolean;
    contentStyle?: ViewStyle;
    maxHeight?: DimensionValue;
    // ActionSheet-style options
    options?: ModalOption[];
    message?: string;
}

export const Modal: React.FC<ModalProps> = ({
    visible,
    onClose,
    title,
    subtitle,
    children,
    colors,
    scrollable = true,
    contentStyle,
    maxHeight = '85%',
    options,
    message,
}) => {
    const styles = getStyles(colors, maxHeight);

    const handleOptionPress = (option: ModalOption) => {
        if (option.disabled) return;
        onClose();
        // Delay the action slightly to allow modal to close smoothly
        setTimeout(() => option.onPress(), 100);
    };

    return (
        <RNModal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    style={[styles.modalContent, contentStyle]}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.modalHeader}>
                        <View style={styles.headerText}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            {subtitle && (
                                <Text style={styles.modalSubtitle}>{subtitle}</Text>
                            )}
                            {message && (
                                <Text style={styles.modalMessage}>{message}</Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={24} color={colors.foreground} />
                        </TouchableOpacity>
                    </View>

                    {/* Options mode (ActionSheet style) */}
                    {options && options.length > 0 ? (
                        <ScrollView showsVerticalScrollIndicator={false} style={styles.optionsContainer}>
                            {options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.option,
                                        index === options.length - 1 && styles.lastOption,
                                        option.disabled && styles.disabledOption,
                                    ]}
                                    onPress={() => handleOptionPress(option)}
                                    activeOpacity={0.7}
                                    disabled={option.disabled}
                                >
                                    {option.icon && (
                                        <Ionicons
                                            name={option.icon}
                                            size={22}
                                            color={
                                                option.disabled
                                                    ? colors.mutedForeground
                                                    : option.destructive
                                                        ? colors.destructive
                                                        : colors.primary
                                            }
                                            style={styles.optionIcon}
                                        />
                                    )}
                                    <Text
                                        style={[
                                            styles.optionText,
                                            option.destructive && { color: colors.destructive },
                                            option.disabled && { color: colors.mutedForeground },
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        // Custom content mode
                        scrollable ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {children}
                            </ScrollView>
                        ) : (
                            children
                        )
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        </RNModal>
    );
};

const getStyles = (colors: ColorScheme, maxHeight: DimensionValue) =>
    StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        } as ViewStyle,
        modalContent: {
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingBottom: 40,
            maxHeight,
        } as ViewStyle,
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            marginBottom: 20,
        } as ViewStyle,
        headerText: {
            flex: 1,
            marginRight: 12,
        } as ViewStyle,
        modalTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.foreground,
        },
        modalSubtitle: {
            fontSize: 14,
            color: colors.mutedForeground,
            marginTop: 4,
        },
        modalMessage: {
            fontSize: 14,
            color: colors.mutedForeground,
            marginTop: 8,
            lineHeight: 20,
        },
        // Options styles (ActionSheet mode)
        optionsContainer: {
            maxHeight: 400,
        },
        option: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 16,
            paddingHorizontal: 4,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        lastOption: {
            borderBottomWidth: 0,
        },
        disabledOption: {
            opacity: 0.5,
        },
        optionIcon: {
            marginRight: 12,
        },
        optionText: {
            fontSize: 16,
            color: colors.foreground,
            flex: 1,
        },
    });
