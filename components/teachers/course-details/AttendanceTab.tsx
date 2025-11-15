import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { AttendanceSession } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface AttendanceTabProps {
    attendanceSessions: AttendanceSession[];
    colors: ColorScheme;
    onTakeAttendance: () => void;
    onViewSession: (session: AttendanceSession) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
    attendanceSessions,
    colors,
    onTakeAttendance,
    onViewSession,
}) => {
    const styles = getStyles(colors);

    return (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Attendance Records</Text>
                    <Button onPress={onTakeAttendance}>
                        <Ionicons name="add" size={20} color={colors.primaryForeground} />
                        <Text style={{ color: colors.primaryForeground, marginLeft: 4 }}>Take Attendance</Text>
                    </Button>
                </View>

                {attendanceSessions.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} />
                        <Text style={styles.emptyText}>No attendance records yet</Text>
                        <Text style={styles.emptySubtext}>Take attendance to get started</Text>
                    </Card>
                ) : (
                    attendanceSessions.map((session) => {
                        const presentCount = Object.values(session.studentStatuses).filter(s => s === 'present').length;
                        const absentCount = Object.values(session.studentStatuses).filter(s => s === 'absent').length;

                        return (
                            <TouchableOpacity
                                key={session.id}
                                activeOpacity={0.7}
                                onPress={() => onViewSession(session)}
                            >
                                <Card style={styles.attendanceCard}>
                                    <View style={styles.attendanceHeader}>
                                        <View style={styles.attendanceDateContainer}>
                                            <Ionicons name="calendar" size={20} color={colors.primary} />
                                            <Text style={styles.attendanceDate}>
                                                {session.date.toDate().toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                        <View style={styles.attendanceStats}>
                                            <View style={styles.attendanceStat}>
                                                <Ionicons name="checkmark-circle" size={16} color={colors.chart3} />
                                                <Text style={[styles.attendanceStatText, { color: colors.chart3 }]}>
                                                    {presentCount}
                                                </Text>
                                            </View>
                                            <View style={styles.attendanceStat}>
                                                <Ionicons name="close-circle" size={16} color={colors.destructive} />
                                                <Text style={[styles.attendanceStatText, { color: colors.destructive }]}>
                                                    {absentCount}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </ScrollView>
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
    attendanceCard: {
        padding: 16,
        marginBottom: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    attendanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    attendanceDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    attendanceDate: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.foreground,
    },
    attendanceStats: {
        flexDirection: 'row',
        gap: 12,
    },
    attendanceStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    attendanceStatText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
