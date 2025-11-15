import React from 'react';
import {
    View,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';

interface EmptyStateProps {
    colors: ColorScheme;
}

export const EmptyCoursesState: React.FC<EmptyStateProps> = ({ colors }) => {
    const styles = getStyles(colors);

    return (
        <View style={styles.emptyState}>
            <Ionicons
                name="book-outline"
                size={64}
                color={colors.mutedForeground}
            />
            <Text style={styles.emptyTitle}>No courses yet</Text>
            <Text style={styles.emptyText}>Create your first course to get started</Text>
        </View>
    );
};

const getStyles = (colors: ColorScheme) =>
    StyleSheet.create({
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60,
        },
        emptyTitle: {
            fontSize: 20,
            fontWeight: '600',
            color: colors.foreground,
            marginTop: 16,
        },
        emptyText: {
            fontSize: 14,
            color: colors.mutedForeground,
            marginTop: 8,
        },
    });