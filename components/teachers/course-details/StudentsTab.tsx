import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { Student } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface StudentsTabProps {
    students: Student[];
    studentAttendancePercentages: Record<string, number>;
    searchQuery: string;
    colors: ColorScheme;
    onSearchChange: (query: string) => void;
    onStudentPress: (student: Student) => void;
    calculateStudentBestCTAverage: (studentEmail: string) => number;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
    students,
    studentAttendancePercentages,
    searchQuery,
    colors,
    onSearchChange,
    onStudentPress,
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
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Enrolled Students</Text>

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
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 16,
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
        padding: 16,
        marginBottom: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    studentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    studentAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    studentAvatarText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 2,
    },
    studentId: {
        fontSize: 13,
        color: colors.mutedForeground,
    },
    studentStats: {
        flexDirection: 'row',
        gap: 16,
    },
    studentStat: {
        flex: 1,
    },
    studentStatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    studentStatLabel: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    studentStatValue: {
        fontSize: 18,
        fontWeight: '600',
    },
});
