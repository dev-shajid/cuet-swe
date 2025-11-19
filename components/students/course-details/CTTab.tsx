import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { ClassTest, Mark, MarkStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

interface CTTabProps {
    classTests: ClassTest[];
    marks: Record<string, Mark[]>;
    studentEmail: string;
    bestCTCount?: number;
    colors: ColorScheme;
    refreshing: boolean;
    onRefresh: () => void;
}

export const CTTab: React.FC<CTTabProps> = ({
    classTests,
    marks,
    studentEmail,
    bestCTCount,
    colors,
    refreshing,
    onRefresh,
}) => {
    const styles = getStyles(colors);

    const getStudentMark = (ctId: string): Mark | undefined => {
        const ctMarks = marks[ctId] || [];
        return ctMarks.find((mark) => mark.studentEmail === studentEmail);
    };

    // Only show published CTs
    const publishedCTs = classTests.filter(ct => ct.isPublished);

    // Calculate stats only from published CTs with marks
    const studentMarks = publishedCTs
        .map((ct) => {
            const mark = getStudentMark(ct.id);
            return {
                ct,
                mark,
            };
        })
        .filter((item) => item.mark && item.mark.status === 'present' && item.mark.marksObtained !== undefined);

    const marksValues = studentMarks
        .map((item) => item.mark?.marksObtained || 0)
        .sort((a, b) => b - a);

    const bestMarks = bestCTCount
        ? marksValues.slice(0, bestCTCount)
        : marksValues;

    const averageMark =
        bestMarks.length > 0
            ? bestMarks.reduce((sum, mark) => sum + mark, 0) / bestMarks.length
            : 0;

    const upcomingCTs = classTests.filter(ct => !ct.isPublished);
    const completedCTs = publishedCTs.length;
    const totalAttended = studentMarks.filter(item => item.mark?.status === 'present').length;

    return (
        <ScrollView
            style={styles.tabContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                />
            }
        >
            {/* Performance Summary */}
            <Card style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>📊 Your Performance</Text>
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: colors.primary }]}>
                            {averageMark > 0 ? averageMark.toFixed(1) : '--'}
                        </Text>
                        <Text style={styles.summaryLabel}>Average</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: colors.chart3 }]}>
                            {completedCTs}
                        </Text>
                        <Text style={styles.summaryLabel}>Completed</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: colors.chart2 }]}>
                            {upcomingCTs.length}
                        </Text>
                        <Text style={styles.summaryLabel}>Upcoming</Text>
                    </View>
                </View>
                {bestCTCount && completedCTs >= bestCTCount && (
                    <View style={styles.bestCTInfo}>
                        <Ionicons name="trophy" size={16} color={colors.chart2} />
                        <Text style={styles.bestCTText}>
                            Best {bestCTCount} CTs will count for final grade
                        </Text>
                    </View>
                )}
            </Card>

            {/* Upcoming CTs */}
            {upcomingCTs.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="time-outline" size={20} color={colors.chart2} />
                        <Text style={styles.sectionTitle}>Upcoming ({upcomingCTs.length})</Text>
                    </View>
                    <View style={styles.ctList}>
                        {upcomingCTs.map((ct) => (
                            <Card key={ct.id} style={styles.upcomingCard}>
                                <View style={styles.upcomingHeader}>
                                    <View style={styles.upcomingBadge}>
                                        <Ionicons name="calendar" size={14} color={colors.chart2} />
                                    </View>
                                    <View style={styles.upcomingInfo}>
                                        <Text style={styles.upcomingTitle}>{ct.name}</Text>
                                        <Text style={styles.upcomingDate}>
                                            {ct.date.toDate().toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </Text>
                                    </View>
                                    <View style={styles.upcomingMarks}>
                                        <Text style={styles.upcomingMarksText}>{ct.totalMarks}</Text>
                                        <Text style={styles.upcomingMarksLabel}>marks</Text>
                                    </View>
                                </View>
                                {ct.description && (
                                    <Text style={styles.upcomingDescription}>{ct.description}</Text>
                                )}
                            </Card>
                        ))}
                    </View>
                </View>
            )}

            {/* Published CT Marks */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="trophy-outline" size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Your Marks ({publishedCTs.length})</Text>
                </View>
                {publishedCTs.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
                        <Text style={styles.emptyText}>No marks published yet</Text>
                        <Text style={styles.emptySubtext}>Your CT marks will appear here once published</Text>
                    </Card>
                ) : (
                    <View style={styles.ctGrid}>
                        {publishedCTs.map((ct) => {
                            const mark = getStudentMark(ct.id);
                            const status: MarkStatus = mark?.status || 'absent';
                            const marksValue = mark?.marksObtained;
                            const percentage = marksValue !== undefined
                                ? (marksValue / ct.totalMarks) * 100
                                : 0;

                            // Determine grade/emoji based on percentage
                            const getGrade = (pct: number) => {
                                if (pct >= 90) return { emoji: '🏆', label: 'Excellent', color: colors.chart3 };
                                if (pct >= 80) return { emoji: '🌟', label: 'Great', color: colors.chart3 };
                                if (pct >= 70) return { emoji: '👍', label: 'Good', color: colors.chart2 };
                                if (pct >= 60) return { emoji: '✓', label: 'Pass', color: colors.chart2 };
                                return { emoji: '📚', label: 'Study More', color: colors.destructive };
                            };

                            return (
                                <Card key={ct.id} style={styles.ctCard}>
                                    <View style={styles.ctCardHeader}>
                                        <Text style={styles.ctName}>{ct.name}</Text>
                                        {status === 'present' && marksValue !== undefined && (
                                            <Text style={styles.gradeEmoji}>
                                                {getGrade(percentage).emoji}
                                            </Text>
                                        )}
                                    </View>

                                    <Text style={styles.ctDate}>
                                        {ct.date.toDate().toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </Text>

                                    {status === 'present' && marksValue !== undefined ? (
                                        <>
                                            <View style={styles.marksDisplay}>
                                                <Text style={styles.marksValue}>{marksValue}</Text>
                                                <Text style={styles.marksMax}>/ {ct.totalMarks}</Text>
                                            </View>

                                            <View style={styles.progressBar}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        {
                                                            width: `${percentage}%`,
                                                            backgroundColor: getGrade(percentage).color,
                                                        },
                                                    ]}
                                                />
                                            </View>

                                            <View style={styles.gradeInfo}>
                                                <Text style={[styles.gradeLabel, { color: getGrade(percentage).color }]}>
                                                    {getGrade(percentage).label}
                                                </Text>
                                                <Text style={styles.percentageText}>
                                                    {percentage.toFixed(0)}%
                                                </Text>
                                            </View>
                                        </>
                                    ) : (
                                        <View style={styles.noMarksContainer}>
                                            <Ionicons
                                                name={status === 'absent' ? 'close-circle' : 'time'}
                                                size={28}
                                                color={status === 'absent' ? colors.destructive : colors.mutedForeground}
                                            />
                                            <Text style={[
                                                styles.noMarksText,
                                                status === 'absent' && { color: colors.destructive }
                                            ]}>
                                                {status === 'absent' ? 'Absent' : 'Not Marked Yet'}
                                            </Text>
                                        </View>
                                    )}
                                </Card>
                            );
                        })}
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const getStyles = (colors: ColorScheme) =>
    StyleSheet.create({
        tabContent: {
            flex: 1,
            padding: 16,
        },
        // Performance Summary
        summaryCard: {
            padding: 16,
            marginBottom: 20,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        summaryTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.foreground,
            marginBottom: 16,
        },
        summaryGrid: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        summaryItem: {
            flex: 1,
            alignItems: 'center',
        },
        summaryValue: {
            fontSize: 24,
            fontWeight: '700',
            marginBottom: 4,
        },
        summaryLabel: {
            fontSize: 11,
            color: colors.mutedForeground,
            fontWeight: '600',
        },
        summaryDivider: {
            width: 1,
            height: 40,
            backgroundColor: colors.border,
        },
        bestCTInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        bestCTText: {
            fontSize: 12,
            color: colors.mutedForeground,
            fontWeight: '500',
        },
        // Section
        section: {
            marginBottom: 20,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.foreground,
        },
        // Upcoming CTs
        ctList: {
            gap: 10,
        },
        upcomingCard: {
            padding: 14,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderLeftWidth: 4,
            borderLeftColor: colors.chart2,
        },
        upcomingHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        upcomingBadge: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.chart2 + '20',
            alignItems: 'center',
            justifyContent: 'center',
        },
        upcomingInfo: {
            flex: 1,
        },
        upcomingTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 2,
        },
        upcomingDate: {
            fontSize: 12,
            color: colors.mutedForeground,
        },
        upcomingMarks: {
            alignItems: 'center',
        },
        upcomingMarksText: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.chart2,
        },
        upcomingMarksLabel: {
            fontSize: 10,
            color: colors.mutedForeground,
        },
        upcomingDescription: {
            fontSize: 12,
            color: colors.mutedForeground,
            marginTop: 10,
            fontStyle: 'italic',
        },
        // Empty state
        emptyCard: {
            padding: 40,
            alignItems: 'center',
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        emptyText: {
            fontSize: 14,
            color: colors.mutedForeground,
            marginTop: 12,
            fontWeight: '500',
        },
        emptySubtext: {
            fontSize: 12,
            color: colors.mutedForeground,
            marginTop: 6,
            textAlign: 'center',
        },
        // CT Marks Grid
        ctGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
        ctCard: {
            width: '48%',
            padding: 14,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        ctCardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 6,
        },
        ctName: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.foreground,
            flex: 1,
        },
        gradeEmoji: {
            fontSize: 20,
        },
        ctDate: {
            fontSize: 11,
            color: colors.mutedForeground,
            marginBottom: 14,
        },
        marksDisplay: {
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'center',
            marginBottom: 10,
        },
        marksValue: {
            fontSize: 32,
            fontWeight: '700',
            color: colors.primary,
        },
        marksMax: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.mutedForeground,
            marginLeft: 4,
        },
        progressBar: {
            height: 6,
            backgroundColor: colors.border,
            borderRadius: 3,
            marginBottom: 10,
            overflow: 'hidden',
        },
        progressFill: {
            height: '100%',
            borderRadius: 3,
        },
        gradeInfo: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        gradeLabel: {
            fontSize: 12,
            fontWeight: '600',
        },
        percentageText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.mutedForeground,
        },
        noMarksContainer: {
            alignItems: 'center',
            paddingVertical: 20,
        },
        noMarksText: {
            fontSize: 12,
            color: colors.mutedForeground,
            marginTop: 8,
            fontWeight: '500',
        },
    });
