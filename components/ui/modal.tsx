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

interface ModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    colors: ColorScheme;
    scrollable?: boolean;
    contentStyle?: ViewStyle;
    maxHeight?: DimensionValue;
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
}) => {
    const styles = getStyles(colors, maxHeight);

    return (
        <RNModal
            visible={visible}
            animationType="slide"
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
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.foreground} />
                        </TouchableOpacity>
                    </View>

                    {scrollable ? (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {children}
                        </ScrollView>
                    ) : (
                        children
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
    });
