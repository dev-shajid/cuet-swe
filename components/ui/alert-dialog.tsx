import { ColorScheme, useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal as RNModal,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Button from './button';
import { Text } from './text';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertDialogProps {
    visible: boolean;
    type?: AlertType;
    title: string;
    message?: string;
    onClose: () => void;
    buttonText?: string;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
    visible,
    type = 'info',
    title,
    message,
    onClose,
    buttonText = 'OK',
}) => {
    const { colors, isDarkMode } = useTheme();
    const styles = getStyles(colors);

    const getIconConfig = () => {
        switch (type) {
            case 'success':
                return { name: 'checkmark-circle' as const, color: colors.chart3 };
            case 'error':
                return { name: 'close-circle' as const, color: colors.destructive };
            case 'warning':
                return { name: 'warning' as const, color: '#f59e0b' };
            case 'info':
            default:
                return { name: 'information-circle' as const, color: colors.primary };
        }
    };

    const iconConfig = getIconConfig();

    return (
        <RNModal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    style={styles.dialog}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={iconConfig.name}
                            size={56}
                            color={iconConfig.color}
                        />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    {message && <Text style={styles.message}>{message}</Text>}

                    <Button
                        onPress={onClose}
                        variant="primary"
                        style={styles.button}
                    >
                        <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>
                            {buttonText}
                        </Text>
                    </Button>
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
            borderRadius: 20,
            padding: 28,
            width: '100%',
            maxWidth: 380,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        },
        iconContainer: {
            marginBottom: 16,
        },
        title: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.foreground,
            marginBottom: 8,
            textAlign: 'center',
        },
        message: {
            fontSize: 15,
            color: colors.mutedForeground,
            marginBottom: 24,
            textAlign: 'center',
            lineHeight: 22,
        },
        button: {
            width: '100%',
            marginTop: 8,
        },
    });
