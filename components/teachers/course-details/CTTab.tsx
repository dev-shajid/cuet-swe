import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { ClassTest, Mark } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface CTTabProps {
    classTests: ClassTest[];
    marks: Record<string, Mark[]>;
    colors: ColorScheme;
    onCreateCT: () => void;
    onCTClick: (ct: ClassTest) => void;
    onEditCT?: (ct: ClassTest) => void;
    onDeleteCT?: (ct: ClassTest) => void;
    onExportCT?: (ct: ClassTest) => void;
    refreshing?: boolean;
    onRefresh?: () => void;
}

export const CTTab: React.FC<CTTabProps> = ({
    classTests,
    marks,
    colors,
    onCreateCT,
    onCTClick,
    onEditCT,
    onDeleteCT,
    onExportCT,
    refreshing = false,
    onRefresh,
}) => {
    const styles = getStyles(colors);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedCT, setSelectedCT] = useState<ClassTest | null>(null);

    return (
        <>
            <ScrollView
                style={styles.tabContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                        />
                    ) : undefined
                }
            >
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Class Tests</Text>
                        <Button onPress={onCreateCT}>
                            <Ionicons name="add" size={20} color={colors.primaryForeground} />
                            <Text style={{ color: colors.primaryForeground, marginLeft: 4 }}>Create CT</Text>
                        </Button>
                    </View>

                    {classTests.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
                            <Text style={styles.emptyText}>No class tests yet</Text>
                            <Text style={styles.emptySubtext}>Create a CT to get started</Text>
                        </Card>
                    ) : (
                        <View style={styles.ctGrid}>
                            {classTests.map((ct) => {
                                const ctMarks = marks[ct.id] || [];
                                const completed = ctMarks.length > 0;
                                const isDone = new Date(ct.date.toDate()) < new Date();

                                return (
                                    <TouchableOpacity
                                        key={ct.id}
                                        activeOpacity={0.7}
                                        onPress={() => onCTClick(ct)}
                                    >
                                        <Card style={styles.ctCard}>
                                            {/* Title - Full Width */}
                                            <Text style={styles.ctTitle}>{ct.name}</Text>

                                            {/* Description */}
                                            {ct.description && (
                                                <Text style={styles.ctDescription} numberOfLines={2}>
                                                    {ct.description}
                                                </Text>
                                            )}

                                            {/* Badges Row */}
                                            <View style={styles.badgesRow}>
                                                {isDone && (
                                                    <View style={[styles.ctBadge, { backgroundColor: colors.chart3 + '20' }]}>
                                                        <Ionicons name="checkmark-circle" size={12} color={colors.chart3} />
                                                        <Text style={[styles.ctBadgeText, { color: colors.chart3 }]}>Done</Text>
                                                    </View>
                                                )}
                                                <View
                                                    style={[
                                                        styles.ctBadge,
                                                        { backgroundColor: ct.isPublished ? colors.chart2 + '20' : colors.mutedForeground + '20' },
                                                    ]}
                                                >
                                                    <Ionicons
                                                        name={ct.isPublished ? 'eye' : 'eye-off'}
                                                        size={12}
                                                        color={ct.isPublished ? colors.chart2 : colors.mutedForeground}
                                                    />
                                                    <Text
                                                        style={[
                                                            styles.ctBadgeText,
                                                            { color: ct.isPublished ? colors.chart2 : colors.mutedForeground },
                                                        ]}
                                                    >
                                                        {ct.isPublished ? 'Visible' : 'Hidden'}
                                                    </Text>
                                                </View>
                                                <Text style={styles.totalMarks}>{ct.totalMarks} marks</Text>
                                            </View>
                                        </Card>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>

            <ConfirmDialog
                visible={showDeleteConfirm}
                title="Delete CT"
                message="Are you sure you want to delete this class test? This action cannot be undone."
                onConfirm={() => {
                    setShowDeleteConfirm(false);
                    if (selectedCT) onDeleteCT?.(selectedCT);
                }}
                onCancel={() => setShowDeleteConfirm(false)}
                confirmText="Delete"
                destructive
            />
        </>
    );
};

const getStyles = (colors: ColorScheme) => StyleSheet.create({
    tabContent: {
        flex: 1,
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
    },
    emptyCard: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.mutedForeground,
        marginTop: 4,
    },
    ctGrid: {
        gap: 12,
    },
    ctCard: {
        padding: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    ctTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 8,
    },
    ctDescription: {
        fontSize: 13,
        color: colors.mutedForeground,
        marginBottom: 12,
        lineHeight: 18,
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    ctBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ctBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    totalMarks: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
        marginLeft: 'auto',
    },
});
