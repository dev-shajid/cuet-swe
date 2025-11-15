import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { ClassTest, Mark, MarkStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface CTTabProps {
    classTests: ClassTest[];
    marks: Record<string, Mark[]>;
    studentEmail: string;
    bestCTCount?: number;
    colors: ColorScheme;
}

export const CTTab: React.FC<CTTabProps> = ({
    classTests,
    marks,
    studentEmail,
    bestCTCount,
    colors,
}) => {
    const styles = getStyles(colors);

    const getStudentMark = (ctId: string): Mark | undefined => {
        const ctMarks = marks[ctId] || [];
        return ctMarks.find((mark) => mark.studentEmail === studentEmail);
    };

    const studentMarks = classTests
        .map((ct) => {
            const mark = getStudentMark(ct.id);
            return {
                ct,
                mark,
            };
        })
        .filter((item) => item.mark && item.mark.status === 'present');

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

    return (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Summary */}
            {bestCTCount && (
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Best CTs to Count</Text>
                        <Text style={styles.infoValue}>
                            {bestCTCount} out of {classTests.length}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Your Average (Best {bestCTCount})</Text>
                        <Text style={[styles.infoValue, { color: colors.primary }]}>
                            {averageMark.toFixed(1)}
                        </Text>
                    </View>
                </Card>
            )}

            {/* CT Marks */}
            <Text style={styles.sectionTitle}>Your CT Marks</Text>
            {classTests.length === 0 ? (
                <Card style={styles.emptyCard}>
                    <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
                    <Text style={styles.emptyText}>No class tests yet</Text>
                </Card>
            ) : (
                <View style={styles.ctGrid}>
                    {classTests.map((ct) => {
                        const mark = getStudentMark(ct.id);
                        const status: MarkStatus = mark?.status || 'absent';
                        const marksValue = mark?.marksObtained;
                        const percentage = marksValue
                            ? (marksValue / ct.totalMarks) * 100
                            : 0;

                        return (
                            <Card key={ct.id} style={styles.ctCard}>
                                <View style={styles.ctHeader}>
                                    <Text style={styles.ctTitle}>{ct.name}</Text>
                                    {status === 'present' && (
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: colors.chart3 + '20' },
                                            ]}
                                        >
                                            <Ionicons
                                                name="checkmark"
                                                size={12}
                                                color={colors.chart3}
                                            />
                                        </View>
                                    )}
                                </View>

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
                                                        backgroundColor:
                                                            percentage >= 75
                                                                ? colors.chart3
                                                                : percentage >= 50
                                                                    ? colors.chart2
                                                                    : colors.destructive,
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.percentageText}>
                                            {percentage.toFixed(0)}%
                                        </Text>
                                    </>
                                ) : (
                                    <View style={styles.noMarksContainer}>
                                        <Ionicons
                                            name={
                                                status === 'absent'
                                                    ? 'close-circle-outline'
                                                    : 'time-outline'
                                            }
                                            size={32}
                                            color={colors.mutedForeground}
                                        />
                                        <Text style={styles.noMarksText}>
                                            {status === 'absent'
                                                ? 'Absent'
                                                : 'Not yet marked'}
                                        </Text>
                                    </View>
                                )}

                                {ct.description && (
                                    <Text style={styles.ctDescription}>{ct.description}</Text>
                                )}
                            </Card>
                        );
                    })}
                </View>
            )}
        </ScrollView>
    );
};

const getStyles = (colors: ColorScheme) =>
    StyleSheet.create({
        tabContent: {
            flex: 1,
            padding: 16,
        },
        infoCard: {
            padding: 16,
            marginBottom: 24,
            backgroundColor: colors.primary + '10',
            borderWidth: 1,
            borderColor: colors.primary + '40',
            gap: 12,
        },
        infoRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        infoLabel: {
            fontSize: 14,
            color: colors.foreground,
            fontWeight: '500',
        },
        infoValue: {
            fontSize: 14,
            color: colors.foreground,
            fontWeight: '700',
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 12,
        },
        emptyCard: {
            padding: 48,
            alignItems: 'center',
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        emptyText: {
            fontSize: 14,
            color: colors.mutedForeground,
            marginTop: 12,
        },
        ctGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
        },
        ctCard: {
            width: '47%',
            padding: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        ctHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        ctTitle: {
            fontSize: 15,
            fontWeight: '700',
            color: colors.foreground,
            flex: 1,
        },
        statusBadge: {
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },
        marksDisplay: {
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'center',
            marginBottom: 12,
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
            marginBottom: 8,
            overflow: 'hidden',
        },
        progressFill: {
            height: '100%',
            borderRadius: 3,
        },
        percentageText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.mutedForeground,
            textAlign: 'center',
        },
        noMarksContainer: {
            alignItems: 'center',
            paddingVertical: 24,
        },
        noMarksText: {
            fontSize: 13,
            color: colors.mutedForeground,
            marginTop: 8,
        },
        ctDescription: {
            fontSize: 12,
            color: colors.mutedForeground,
            marginTop: 12,
            fontStyle: 'italic',
        },
    });
