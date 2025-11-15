import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { AttendanceSession, AttendanceStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface AttendanceTabProps {
    sessions: AttendanceSession[];
    studentEmail: string;
    attendancePercentage: number;
    colors: ColorScheme;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
    sessions,
    studentEmail,
    attendancePercentage,
    colors,
}) => {
    const styles = getStyles(colors);

    const totalSessions = sessions.length;
    const presentCount = sessions.filter(
        (session) => session.studentStatuses[studentEmail] === 'present'
    ).length;
    const absentCount = totalSessions - presentCount;

    return (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Summary Card */}
            <Card style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Classes</Text>
                        <Text style={styles.summaryValue}>{totalSessions}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Present</Text>
                        <Text style={[styles.summaryValue, { color: colors.chart3 }]}>
                            {presentCount}
                        </Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Absent</Text>
                        <Text style={[styles.summaryValue, { color: colors.destructive }]}>
                            {absentCount}
                        </Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Percentage</Text>
                        <Text
                            style={[
                                styles.summaryValue,
                                {
                                    color:
                                        attendancePercentage >= 75
                                            ? colors.chart3
                                            : colors.destructive,
                                },
                            ]}
                        >
                            {attendancePercentage.toFixed(0)}%
                        </Text>
                    </View>
                </View>
            </Card>

            {/* Attendance Records */}
            <Text style={styles.sectionTitle}>Attendance Records</Text>
            {sessions.length === 0 ? (
                <Card style={styles.emptyCard}>
                    <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} />
                    <Text style={styles.emptyText}>No attendance records yet</Text>
                </Card>
            ) : (
                sessions
                    .sort((a, b) => b.date.toMillis() - a.date.toMillis())
                    .map((session, index) => {
                        const status: AttendanceStatus =
                            session.studentStatuses[studentEmail] || 'absent';
                        const isPresent = status === 'present';

                        return (
                            <Card key={index} style={styles.attendanceCard}>
                                <View style={styles.attendanceRow}>
                                    <View style={styles.dateContainer}>
                                        <Ionicons
                                            name="calendar-outline"
                                            size={18}
                                            color={colors.primary}
                                        />
                                        <Text style={styles.dateText}>
                                            {session.date.toDate().toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            {
                                                backgroundColor: isPresent
                                                    ? colors.chart3 + '20'
                                                    : colors.destructive + '20',
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={isPresent ? 'checkmark-circle' : 'close-circle'}
                                            size={16}
                                            color={isPresent ? colors.chart3 : colors.destructive}
                                        />
                                        <Text
                                            style={[
                                                styles.statusText,
                                                {
                                                    color: isPresent
                                                        ? colors.chart3
                                                        : colors.destructive,
                                                },
                                            ]}
                                        >
                                            {isPresent ? 'Present' : 'Absent'}
                                        </Text>
                                    </View>
                                </View>
                            </Card>
                        );
                    })
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
        summaryCard: {
            padding: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
        },
        summaryRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        summaryItem: {
            alignItems: 'center',
        },
        summaryLabel: {
            fontSize: 11,
            color: colors.mutedForeground,
            marginBottom: 4,
        },
        summaryValue: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.foreground,
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
        attendanceCard: {
            padding: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
        },
        attendanceRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        dateContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        dateText: {
            fontSize: 14,
            fontWeight: '500',
            color: colors.foreground,
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
        },
        statusText: {
            fontSize: 13,
            fontWeight: '600',
        },
    });
