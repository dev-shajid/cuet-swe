import { ColorScheme, useTheme } from '@/hooks/use-theme';
import React from 'react';
import {
    Modal as RNModal,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Button from './button';
import { Text } from './text';

interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    destructive = false,
}) => {
    const { colors, isDarkMode } = useTheme();
    const styles = getStyles(colors);

    return (
        <RNModal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onCancel}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onCancel}
            >
                <TouchableOpacity
                    style={styles.dialog}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        <Button
                            onPress={onCancel}
                            variant="outline"
                            style={styles.button}
                        >
                            <Text style={{ color: colors.foreground }}>{cancelText}</Text>
                        </Button>
                        <Button
                            onPress={onConfirm}
                            variant={destructive ? 'destructive' : 'primary'}
                            style={styles.button}
                        >
                            <Text style={{ color: destructive ? colors.destructiveForeground : colors.primaryForeground }}>
                                {confirmText}
                            </Text>
                        </Button>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </RNModal>
    );
};

const getStyles = (colors: ColorScheme) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        dialog: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        },
        title: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.foreground,
            marginBottom: 12,
            textAlign: 'center',
        },
        message: {
            fontSize: 15,
            color: colors.mutedForeground,
            marginBottom: 24,
            textAlign: 'center',
            lineHeight: 22,
        },
        buttonContainer: {
            flexDirection: 'row',
            gap: 12,
        },
        button: {
            flex: 1,
        },
    });
