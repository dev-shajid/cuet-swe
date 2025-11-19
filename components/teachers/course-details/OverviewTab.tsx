import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { AttendanceSession, ClassTest, Student } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface OverviewTabProps {
    students: Student[];
    attendanceSessions: AttendanceSession[];
    classTests: ClassTest[];
    studentAttendancePercentages: Record<string, number>;
    colors: ColorScheme;
    onTakeAttendance: () => void;
    onCreateCT: () => void;
    onEditCourse: () => void;
    onInviteMembers: () => void;
    onViewAttendance: (session: AttendanceSession) => void;
    onExportReport?: () => void;
    refreshing?: boolean;
    onRefresh?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    students,
    attendanceSessions,
    classTests,
    studentAttendancePercentages,
    colors,
    onTakeAttendance,
    onCreateCT,
    onEditCourse,
    onInviteMembers,
    onViewAttendance,
    onExportReport,
    refreshing = false,
    onRefresh,
}) => {
    const styles = getStyles(colors);

    // Calculate average attendance
    const avgAttendance = students.length > 0
        ? Math.round(Object.values(studentAttendancePercentages).reduce((a, b) => a + b, 0) / students.length)
        : 0;

    // Calculate total classes as max of section A and B
    const sectionACounts = attendanceSessions.filter(s => s.section === 'A').length;
    const sectionBCounts = attendanceSessions.filter(s => s.section === 'B').length;
    const totalClasses = Math.max(sectionACounts, sectionBCounts);

    return (
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
            {/* Course Stats */}
            <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="people" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.statValue}>{students.length}</Text>
                    <Text style={styles.statLabel}>Students</Text>
                </Card>

                <Card style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: colors.chart2 + '20' }]}>
                        <Ionicons name="calendar" size={24} color={colors.chart2} />
                    </View>
                    <Text style={styles.statValue}>{totalClasses}</Text>
                    <Text style={styles.statLabel}>Classes Held</Text>
                </Card>

                <Card style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: colors.chart3 + '20' }]}>
                        <Ionicons name="clipboard" size={24} color={colors.chart3} />
                    </View>
                    <Text style={styles.statValue}>{avgAttendance}%</Text>
                    <Text style={styles.statLabel}>Avg Attendance</Text>
                </Card>

                <Card style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: colors.chart4 + '20' }]}>
                        <Ionicons name="document-text" size={24} color={colors.chart4} />
                    </View>
                    <Text style={styles.statValue}>{classTests.length}</Text>
                    <Text style={styles.statLabel}>Class Tests</Text>
                </Card>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: colors.primary }]}
                        onPress={onTakeAttendance}
                    >
                        <Ionicons name="checkmark-circle" size={28} color={colors.primaryForeground} />
                        <Text style={[styles.actionText, { color: colors.primaryForeground }]}>
                            Take Attendance
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: colors.chart2 }]}
                        onPress={onCreateCT}
                    >
                        <Ionicons name="add-circle" size={28} color="#FFFFFF" />
                        <Text style={[styles.actionText, { color: '#FFFFFF' }]}>
                            Add New CT
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: colors.chart4 }]}
                        onPress={onEditCourse}
                    >
                        <Ionicons name="create-outline" size={28} color="#FFFFFF" />
                        <Text style={[styles.actionText, { color: '#FFFFFF' }]}>
                            Edit Course
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: colors.chart3 }]}
                        onPress={onInviteMembers}
                    >
                        <Ionicons name="person-add" size={28} color="#FFFFFF" />
                        <Text style={[styles.actionText, { color: '#FFFFFF' }]}>
                            Invite Members
                        </Text>
                    </TouchableOpacity>

                    {onExportReport && (
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: '#10b981' }]}
                            onPress={onExportReport}
                        >
                            <Ionicons name="download" size={28} color="#FFFFFF" />
                            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>
                                Export Report
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Recent Activity */}
            {attendanceSessions.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <Card style={styles.activityCard}>
                        {attendanceSessions.slice(0, 5).map((session, index) => {
                            const presentCount = Object.values(session.studentStatuses).filter(s => s === 'present').length;
                            const absentCount = Object.values(session.studentStatuses).filter(s => s === 'absent').length;

                            return (
                                <TouchableOpacity
                                    key={session.id}
                                    activeOpacity={0.7}
                                    onPress={() => onViewAttendance(session)}
                                >
                                    <Card
                                        style={[
                                            styles.activityItem,
                                            ...(index < attendanceSessions.slice(0, 5).length - 1 ? [styles.activityItemBorder] : [])
                                        ]}
                                    >
                                        <View style={styles.activityInfo}>
                                            <Text style={styles.activityDate}>
                                                {session.date.toDate().toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Text>
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
                        })}
                    </Card>
                </View>
            )}
        </ScrollView>
    );
};

const getStyles = (colors: ColorScheme) => StyleSheet.create({
    tabContent: {
        flex: 1,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
    },
    statCard: {
        width: '47%',
        padding: 16,
        alignItems: 'center',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.foreground,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 12,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '47%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    activityCard: {
        backgroundColor: colors.card,
        padding: 0,
        borderWidth: 1,
        borderColor: colors.border,
    },
    activityItem: {
        padding: 16,
        backgroundColor: 'transparent',
        borderRadius: 0,
    },
    activityItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    activityInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activityDate: {
        fontSize: 14,
        color: colors.foreground,
        fontWeight: '500',
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
