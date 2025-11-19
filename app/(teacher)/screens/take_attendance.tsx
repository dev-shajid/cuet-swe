import { AlertDialog } from '@/components/ui/alert-dialog';
import Button from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import { getAttendanceByDate, takeAttendance } from '@/services/attendance.service';
import { getStudentEnrollments } from '@/services/course.service';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface RollStudent {
    studentId: number;
    roll: number;
}

export default function TakeAttendanceScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { session: { user } } = useAuth();
    const { courseId, section, date } = useLocalSearchParams<{
        courseId: string;
        section: string;
        date?: string;
    }>();

    const [students, setStudents] = useState<RollStudent[]>([]);
    const [attendanceMarking, setAttendanceMarking] = useState<Set<string>>(new Set());
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const styles = getStyles(colors);

    // Extract roll number from student ID (last 3 digits)
    const getRollNumber = (id: number): number => {
        return parseInt(String(id).slice(-3));
    };

    useEffect(() => {
        if (courseId && section) {
            console.log('Loading students for:', { courseId, section });
            loadStudents();
        }
    }, [courseId, section]);

    const loadStudents = async () => {
        try {
            setLoading(true);
            console.log('Fetching enrollments for course:', courseId);
            // Load student enrollments for this course
            const enrollments = await getStudentEnrollments(courseId);
            console.log('Total enrollments:', enrollments.length);

            // Filter by section and generate roll numbers
            const sectionEnrollments = enrollments.filter(e => e.section === section);
            console.log(`Section ${section} enrollments:`, sectionEnrollments);

            // Generate all student IDs from enrollment ranges
            const allStudents: RollStudent[] = [];
            sectionEnrollments.forEach(enrollment => {
                console.log(`Generating IDs from ${enrollment.startId} to ${enrollment.endId}`);
                for (let id = enrollment.startId; id <= enrollment.endId; id++) {
                    allStudents.push({
                        studentId: id,
                        roll: getRollNumber(id)
                    });
                }
            });

            // Sort by student ID
            allStudents.sort((a, b) => a.studentId - b.studentId);

            console.log('Total students generated:', allStudents.length);
            console.log('First 5 students:', allStudents.slice(0, 5));

            setStudents(allStudents);
            // Mark all as present initially (use studentId as string)
            setAttendanceMarking(new Set(allStudents.map(s => String(s.studentId))));
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAttendance = (studentIdStr: string) => {
        const newSet = new Set(attendanceMarking);
        if (newSet.has(studentIdStr)) {
            newSet.delete(studentIdStr);
        } else {
            newSet.add(studentIdStr);
        }
        setAttendanceMarking(newSet);
    };

    const handleSave = async () => {
        if (!user?.email) return;
        if (students.length === 0) {
            console.log('⚠️ No students to save');
            return;
        }

        // Check if attendance already exists for this date and section
        const existingAttendance = await getAttendanceByDate(courseId, section, new Date(date || new Date().toISOString().split('T')[0]));
        if (existingAttendance) {
            Alert.alert(
                'Attendance Already Exists',
                `Attendance for Section ${section} on ${new Date(date || new Date()).toLocaleDateString()} has already been recorded. Please select a different date or section.`,
                [{ text: 'OK' }]
            );
            return;
        }

        try {
            setSaving(true);
            // Create attendance record with student statuses using student IDs as strings
            const studentStatuses: Record<string, 'present' | 'absent'> = {};
            students.forEach(student => {
                const studentIdStr = String(student.studentId);
                studentStatuses[studentIdStr] = attendanceMarking.has(studentIdStr) ? 'present' : 'absent';
            });

            await takeAttendance(
                courseId,
                section,
                new Date(date || new Date().toISOString().split('T')[0]),
                user.email,
                studentStatuses
            );

            setShowSuccessAlert(true);
        } catch (error) {
            console.error('Error saving attendance:', error);
            alert('Failed to save attendance. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleAlertClose = () => {
        setShowSuccessAlert(false);
        router.back();
    };

    const toggleAll = () => {
        if (attendanceMarking.size === students.length) {
            // All present, mark all absent
            setAttendanceMarking(new Set());
        } else {
            // Mark all present (use studentId as string)
            setAttendanceMarking(new Set(students.map(s => String(s.studentId))));
        }
    };

    const presentCount = attendanceMarking.size;
    const absentCount = students.length - presentCount;

    return (
        <Container useSafeArea={false} style={styles.container}>
            <ScreenHeader
                title={`Take Attendance - Section ${section}`}
                subtitle={date || new Date().toLocaleDateString()}
                showBack={true}
            />

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.chart3 }]}>{presentCount}</Text>
                    <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.destructive }]}>{absentCount}</Text>
                    <Text style={styles.statLabel}>Absent</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.foreground }]}>{students.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statDivider} />
                <TouchableOpacity
                    style={styles.toggleAllBtn}
                    onPress={toggleAll}
                >
                    <Ionicons
                        name={attendanceMarking.size === students.length ? "close-circle" : "checkmark-circle"}
                        size={18}
                        color={colors.primaryForeground}
                    />
                    <Text style={[styles.toggleAllText, { color: colors.primaryForeground }]}>
                        {attendanceMarking.size === students.length ? "All Absent" : "All Present"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Student Grid */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.gridContainer}>
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    students.map((student) => {
                        const studentIdStr = String(student.studentId);
                        const isPresent = attendanceMarking.has(studentIdStr);
                        return (
                            <TouchableOpacity
                                key={student.studentId}
                                style={[
                                    styles.studentTile,
                                    {
                                        backgroundColor: isPresent ? '#22c55e' : '#ef4444',
                                    }
                                ]}
                                onPress={() => toggleAttendance(studentIdStr)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.rollNumber}>
                                    {student.roll}
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* Save Button */}
            <View style={styles.saveButtonContainer}>
                <Button
                    onPress={handleSave}
                    style={styles.saveButton}
                    size='sm'
                    disabled={saving}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {saving ? (
                            <ActivityIndicator size={16} color={colors.primaryForeground} />
                        ) : (
                            <Ionicons name="save" size={16} color={colors.primaryForeground} />
                        )}
                        <Text style={{ color: colors.primaryForeground, fontSize: 14, fontWeight: '600' }}>
                            {saving ? 'Saving...' : 'Save Attendance'}
                        </Text>
                    </View>
                </Button>
            </View>

            {/* Success Alert */}
            <AlertDialog
                visible={showSuccessAlert}
                type="success"
                title="Attendance Saved!"
                message={`Section ${section}: ${presentCount} present, ${absentCount} absent`}
                onClose={handleAlertClose}
                buttonText="Done"
            />
        </Container>
    );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 10,
        color: colors.mutedForeground,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.border,
    },
    toggleAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: colors.primary,
        gap: 4,
    },
    toggleAllText: {
        fontSize: 11,
        fontWeight: '600',
    },
    gridContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
        gap: 6,
    },
    studentTile: {
        width: '12.7%',
        aspectRatio: 1,
        borderRadius: 8,
        borderWidth: 0,
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rollNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    saveButtonContainer: {
        padding: 12,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    saveButton: {
        paddingVertical: 12,
        display: 'flex',
    },
});
