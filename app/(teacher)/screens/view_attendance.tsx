import { Card } from '@/components/ui';
import { AlertDialog } from '@/components/ui/alert-dialog';
import Button from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import { takeAttendance } from '@/services/attendance.service';
import { getStudentEnrollments } from '@/services/course.service';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface RollStudent {
    studentId: number;
    roll: number;
}

export default function ViewAttendanceScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { session: { user } } = useAuth();
    const params = useLocalSearchParams<{
        courseId: string;
        sessionId: string;
        sessionDate: string;
        sessionSection: string;
        studentStatuses: string;
    }>();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [students, setStudents] = useState<RollStudent[]>([]);
    const [studentStatuses, setStudentStatuses] = useState<Record<string, 'present' | 'absent'>>({});
    const [attendanceMarking, setAttendanceMarking] = useState<Set<string>>(new Set());
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);

    const styles = getStyles(colors);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            setLoading(true);

            // Parse student statuses from params
            const statuses = JSON.parse(params.studentStatuses || '{}');
            setStudentStatuses(statuses);

            // Initialize attendance marking with present students
            const presentStudents = new Set<string>();
            Object.entries(statuses).forEach(([studentId, status]) => {
                if (status === 'present') {
                    presentStudents.add(studentId);
                }
            });
            setAttendanceMarking(presentStudents);

            // Fetch enrollments for this section
            const enrollments = await getStudentEnrollments(params.courseId);
            const sectionEnrollments = enrollments.filter(e => e.section === params.sessionSection);

            // Generate student array from enrollments
            const allStudents: RollStudent[] = [];
            sectionEnrollments.forEach(enrollment => {
                for (let id = enrollment.startId; id <= enrollment.endId; id++) {
                    const roll = parseInt(String(id).slice(-3));
                    allStudents.push({
                        studentId: id,
                        roll: roll,
                    });
                }
            });

            // Sort by studentId
            allStudents.sort((a, b) => a.studentId - b.studentId);
            setStudents(allStudents);
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAttendance = (studentIdStr: string) => {
        if (!editMode) return;

        const newSet = new Set(attendanceMarking);
        if (newSet.has(studentIdStr)) {
            newSet.delete(studentIdStr);
        } else {
            newSet.add(studentIdStr);
        }
        setAttendanceMarking(newSet);
    };

    const toggleAll = () => {
        if (!editMode) return;

        if (attendanceMarking.size === students.length) {
            // All present, mark all absent
            setAttendanceMarking(new Set());
        } else {
            // Mark all present
            setAttendanceMarking(new Set(students.map(s => String(s.studentId))));
        }
    };

    const handleSave = async () => {
        if (!user?.email) return;

        try {
            setSaving(true);

            // Create attendance record with updated student statuses
            const updatedStatuses: Record<string, 'present' | 'absent'> = {};
            students.forEach(student => {
                const studentIdStr = String(student.studentId);
                updatedStatuses[studentIdStr] = attendanceMarking.has(studentIdStr) ? 'present' : 'absent';
            });

            // Extract date from sessionId (format: courseId_section_timestamp)
            const timestamp = parseInt(params.sessionId.split('_')[2]);
            const date = new Date(timestamp);

            await takeAttendance(
                params.courseId,
                params.sessionSection,
                date,
                user.email,
                updatedStatuses
            );

            setStudentStatuses(updatedStatuses);
            setEditMode(false);
            setShowSuccessAlert(true);
        } catch (error) {
            console.error('Error saving attendance:', error);
            alert('Failed to update attendance. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset to original statuses
        const presentStudents = new Set<string>();
        Object.entries(studentStatuses).forEach(([studentId, status]) => {
            if (status === 'present') {
                presentStudents.add(studentId);
            }
        });
        setAttendanceMarking(presentStudents);
        setEditMode(false);
    };

    const getPresentCount = () => {
        return editMode ? attendanceMarking.size : Object.values(studentStatuses).filter(s => s === 'present').length;
    };

    const getAbsentCount = () => {
        return editMode ? (students.length - attendanceMarking.size) : Object.values(studentStatuses).filter(s => s === 'absent').length;
    };

    const getTotalCount = () => {
        return students.length;
    };

    const getStatusForStudent = (studentId: number): 'present' | 'absent' => {
        const studentIdStr = String(studentId);
        if (editMode) {
            return attendanceMarking.has(studentIdStr) ? 'present' : 'absent';
        }
        return studentStatuses[studentIdStr] || 'absent';
    };

    return (
        <Container useSafeArea={false}>
            <ScreenHeader
                title="Attendance Details"
                subtitle={`${params.sessionDate} - Section ${params.sessionSection}`}
                showBack={true}
                rightAction={!editMode ? {
                    icon: 'create-outline',
                    onPress: () => setEditMode(true),
                } : undefined}
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <View style={styles.container}>
                    {/* Stats Bar */}
                    <Card style={styles.statsBar}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: '#22c55e' }]}>
                                {getPresentCount()}
                            </Text>
                            <Text style={styles.statLabel}>Present</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: '#ef4444' }]}>
                                {getAbsentCount()}
                            </Text>
                            <Text style={styles.statLabel}>Absent</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.foreground }]}>
                                {getTotalCount()}
                            </Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        {editMode && (
                            <>
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
                            </>
                        )}
                    </Card>

                    {/* Student Grid */}
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.gridContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {students.map((student) => {
                            const status = getStatusForStudent(student.studentId);
                            const isPresent = status === 'present';
                            const studentIdStr = String(student.studentId);

                            return (
                                <TouchableOpacity
                                    key={student.studentId}
                                    style={[
                                        styles.tile,
                                        {
                                            backgroundColor: isPresent ? '#22c55e' : '#ef4444',
                                            opacity: editMode ? 1 : 0.9,
                                        }
                                    ]}
                                    onPress={() => toggleAttendance(studentIdStr)}
                                    activeOpacity={editMode ? 0.7 : 1}
                                    disabled={!editMode}
                                >
                                    <Text style={styles.tileText}>
                                        {student.roll}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Edit Mode Buttons */}
                    {editMode && (
                        <View style={styles.editButtonsContainer}>
                            <Button
                                onPress={handleCancel}
                                style={[styles.editButton, { backgroundColor: colors.muted }]}
                                size='sm'
                            >
                                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>
                                    Cancel
                                </Text>
                            </Button>
                            <Button
                                onPress={handleSave}
                                style={[styles.editButton, styles.saveButton]}
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
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </Text>
                                </View>
                            </Button>
                        </View>
                    )}
                </View>
            )}

            {/* Success Alert */}
            <AlertDialog
                visible={showSuccessAlert}
                type="success"
                title="Attendance Updated!"
                message={`Section ${params.sessionSection}: ${getPresentCount()} present, ${getAbsentCount()} absent`}
                onClose={() => {
                    setShowSuccessAlert(false);
                    router.back();
                }}
                buttonText="Done"
            />
        </Container>
    );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsBar: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e5e5e5',
    },
    toggleAllBtn: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    toggleAllText: {
        fontSize: 12,
        fontWeight: '600',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        paddingBottom: 20,
    },
    tile: {
        width: '12.7%',
        aspectRatio: 1,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tileText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    editButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 12,
    },
    editButton: {
        flex: 1,
    },
    saveButton: {
        flex: 1.5,
    },
});
