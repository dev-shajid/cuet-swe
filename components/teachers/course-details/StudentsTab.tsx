import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { Student, StudentEnrollment } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface StudentsTabProps {
    students: Student[];
    studentAttendancePercentages: Record<string, number>;
    searchQuery: string;
    colors: ColorScheme;
    enrollments: StudentEnrollment[];
    refreshing?: boolean;
    onSearchChange: (query: string) => void;
    onStudentPress: (student: Student) => void;
    onEnrollmentPress: (enrollment: StudentEnrollment) => void;
    onAddEnrollment: () => void;
    onRefresh?: () => void;
    calculateStudentBestCTAverage: (studentEmail: string) => number;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
    students,
    studentAttendancePercentages,
    searchQuery,
    colors,
    enrollments,
    refreshing = false,
    onSearchChange,
    onStudentPress,
    onEnrollmentPress,
    onAddEnrollment,
    onRefresh,
    calculateStudentBestCTAverage,
}) => {
    const styles = getStyles(colors);

    const filteredStudents = students.filter((student) => {
        const query = searchQuery.toLowerCase();
        return (
            student.name.toLowerCase().includes(query) ||
            student.studentId.toString().includes(query)
        );
    });

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
            {/* Student ID Ranges Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Student ID Ranges</Text>
                    <TouchableOpacity onPress={onAddEnrollment} style={styles.addButton}>
                        <Ionicons name="add-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {enrollments.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
                        <Text style={styles.emptyText}>No student ranges added</Text>
                        <Text style={styles.emptySubtext}>Add ID ranges to enroll students</Text>
                    </Card>
                ) : (
                    enrollments.map((enrollment) => (
                        <TouchableOpacity
                            key={enrollment.id}
                            onPress={() => onEnrollmentPress(enrollment)}
                            activeOpacity={0.7}
                        >
                            <Card style={styles.enrollmentCard}>
                                <View style={styles.enrollmentHeader}>
                                    <View style={styles.enrollmentSection}>
                                        <Text style={styles.enrollmentSectionLabel}>Section {enrollment.section}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
                                </View>
                                <View style={styles.enrollmentBody}>
                                    <View style={styles.enrollmentInfo}>
                                        <Ionicons name="people" size={16} color={colors.primary} />
                                        <Text style={styles.enrollmentRange}>
                                            ID Range: {enrollment.startId} - {enrollment.endId}
                                        </Text>
                                    </View>
                                    <Text style={styles.enrollmentCount}>
                                        {enrollment.endId - enrollment.startId + 1} students
                                    </Text>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    ))
                )}
            </View>

            {/* Enrolled Students Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Enrolled Students ({students.length})</Text>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={colors.mutedForeground} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or ID..."
                        placeholderTextColor={colors.mutedForeground}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => onSearchChange('')}>
                            <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
                        </TouchableOpacity>
                    )}
                </View>

                {filteredStudents.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Ionicons name="search-outline" size={48} color={colors.mutedForeground} />
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No students found' : 'No students enrolled'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {searchQuery ? 'Try a different search term' : 'Invite students to get started'}
                        </Text>
                    </Card>
                ) : (
                    filteredStudents.map((student) => {
                        const attendancePercentage = studentAttendancePercentages[student.email] || 0;
                        const ctAverage = calculateStudentBestCTAverage(student.email);

                        return (
                            <TouchableOpacity
                                key={student.email}
                                onPress={() => onStudentPress(student)}
                                activeOpacity={0.7}
                            >
                                <Card style={styles.studentCard}>
                                    <View style={styles.studentHeader}>
                                        <View style={styles.studentAvatar}>
                                            <Text style={styles.studentAvatarText}>
                                                {student.name.split(' ').map(n => n[0]).join('')}
                                            </Text>
                                        </View>
                                        <View style={styles.studentInfo}>
                                            <Text style={styles.studentName}>{student.name}</Text>
                                            <Text style={styles.studentId}>ID: {student.studentId}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.studentStats}>
                                        <View style={styles.studentStat}>
                                            <View style={styles.studentStatHeader}>
                                                <Ionicons name="clipboard" size={16} color={colors.chart3} />
                                                <Text style={styles.studentStatLabel}>Attendance</Text>
                                            </View>
                                            <Text style={[styles.studentStatValue, { color: colors.chart3 }]}>
                                                {attendancePercentage.toFixed(0)}%
                                            </Text>
                                        </View>

                                        <View style={styles.studentStat}>
                                            <View style={styles.studentStatHeader}>
                                                <Ionicons name="star" size={16} color={colors.chart2} />
                                                <Text style={styles.studentStatLabel}>CT Average</Text>
                                            </View>
                                            <Text style={[styles.studentStatValue, { color: colors.chart2 }]}>
                                                {ctAverage.toFixed(1)}
                                            </Text>
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
    addButton: {
        padding: 4,
    },
    enrollmentCard: {
        padding: 12,
        marginBottom: 10,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    enrollmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    enrollmentSection: {
        backgroundColor: colors.primary + '15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    enrollmentSectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    enrollmentBody: {
        gap: 4,
    },
    enrollmentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    enrollmentRange: {
        fontSize: 14,
        color: colors.foreground,
        fontWeight: '500',
    },
    enrollmentCount: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: colors.foreground,
        padding: 0,
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
    studentCard: {
        padding: 12,
        marginBottom: 10,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    studentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    studentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    studentAvatarText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 1,
    },
    studentId: {
        fontSize: 10,
        color: colors.mutedForeground,
    },
    studentStats: {
        flexDirection: 'row',
        gap: 12,
    },
    studentStat: {
        flex: 1,
    },
    studentStatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginBottom: 4,
    },
    studentStatLabel: {
        fontSize: 11,
        color: colors.mutedForeground,
    },
    studentStatValue: {
        fontSize: 16,
        fontWeight: '600',
    },
});
