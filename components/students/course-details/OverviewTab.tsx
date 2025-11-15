import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { Course, Student } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface OverviewTabProps {
    course: Course;
    currentStudent: Student;
    totalClasses: number;
    completedClasses: number;
    attendancePercentage: number;
    averageCTMarks: number;
    colors: ColorScheme;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    course,
    currentStudent,
    totalClasses,
    completedClasses,
    attendancePercentage,
    averageCTMarks,
    colors,
}) => {
    const styles = getStyles(colors);

    return (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Course Info */}
            <Card style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Course Code</Text>
                    <Text style={styles.infoValue}>{course.code}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Course Name</Text>
                    <Text style={styles.infoValue}>{course.name}</Text>
                </View>
            </Card>

            {/* Personal Stats */}
            <Text style={styles.sectionTitle}>My Progress</Text>
            <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.statValue}>{attendancePercentage.toFixed(0)}%</Text>
                    <Text style={styles.statLabel}>Attendance</Text>
                </Card>

                <Card style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: colors.chart2 + '20' }]}>
                        <Ionicons name="document-text" size={24} color={colors.chart2} />
                    </View>
                    <Text style={styles.statValue}>{averageCTMarks.toFixed(1)}</Text>
                    <Text style={styles.statLabel}>CT Average</Text>
                </Card>

                <Card style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: colors.chart3 + '20' }]}>
                        <Ionicons name="calendar" size={24} color={colors.chart3} />
                    </View>
                    <Text style={styles.statValue}>{completedClasses}/{totalClasses}</Text>
                    <Text style={styles.statLabel}>Classes</Text>
                </Card>

                <Card style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: colors.chart4 + '20' }]}>
                        <Ionicons name="person" size={24} color={colors.chart4} />
                    </View>
                    <Text style={styles.statValue}>{currentStudent.studentId}</Text>
                    <Text style={styles.statLabel}>Student ID</Text>
                </Card>
            </View>

            {/* Attendance Status */}
            <Text style={styles.sectionTitle}>Attendance Status</Text>
            <Card style={styles.statusCard}>
                <View style={styles.statusRow}>
                    <View style={styles.statusIconContainer}>
                        <Ionicons
                            name={attendancePercentage >= 75 ? 'checkmark-circle' : 'warning'}
                            size={32}
                            color={attendancePercentage >= 75 ? colors.chart3 : colors.destructive}
                        />
                    </View>
                    <View style={styles.statusInfo}>
                        <Text style={styles.statusTitle}>
                            {attendancePercentage >= 75 ? 'Good Standing' : 'Below Requirement'}
                        </Text>
                        <Text style={styles.statusDescription}>
                            {attendancePercentage >= 75
                                ? 'Your attendance meets the minimum requirement'
                                : 'Minimum 75% attendance required'}
                        </Text>
                    </View>
                </View>
            </Card>
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
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 12,
        },
        infoRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        infoLabel: {
            fontSize: 14,
            color: colors.mutedForeground,
            fontWeight: '500',
        },
        infoValue: {
            fontSize: 14,
            color: colors.foreground,
            fontWeight: '600',
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 12,
        },
        statsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 24,
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
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
        },
        statValue: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.foreground,
            marginBottom: 4,
        },
        statLabel: {
            fontSize: 11,
            color: colors.mutedForeground,
            textAlign: 'center',
        },
        statusCard: {
            padding: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
        },
        statusRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
        },
        statusIconContainer: {
            width: 56,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
        },
        statusInfo: {
            flex: 1,
        },
        statusTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 4,
        },
        statusDescription: {
            fontSize: 13,
            color: colors.mutedForeground,
        },
    });
