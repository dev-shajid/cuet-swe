import { AlertDialog } from '@/components/ui/alert-dialog';
import Button from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Container } from '@/components/ui/container';
import { Modal } from '@/components/ui/modal';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import { getStudentEnrollments } from '@/services/course.service';
import { batchUpdateMarks, getClassTestById, getClassTestMarks, updateClassTest } from '@/services/ct.service';
import { ClassTest } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface RollStudent {
    studentId: number;
    roll: number;
    section: string;
}

export default function CTDetailsScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { ctId, courseId } = useLocalSearchParams<{ ctId: string; courseId: string }>();

    const [ct, setCT] = useState<ClassTest | null>(null);
    const [students, setStudents] = useState<RollStudent[]>([]);
    const [marksInput, setMarksInput] = useState<Record<string, { status: 'present' | 'absent'; marks?: number }>>({});
    const [editMode, setEditMode] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showEditCTModal, setShowEditCTModal] = useState(false);
    const [editCTName, setEditCTName] = useState('');
    const [editCTDescription, setEditCTDescription] = useState('');
    const [editCTTotalMarks, setEditCTTotalMarks] = useState('');

    // Refs for input fields to enable auto-focus and scrolling
    const inputRefs = useRef<Record<string, TextInput | null>>({});
    const scrollViewRef = useRef<ScrollView>(null);
    const rowRefs = useRef<Record<string, View | null>>({});

    const styles = getStyles(colors);

    // Extract roll number from student ID (last 3 digits)
    const getRollNumber = (studentId: number): string => {
        return String(studentId).slice(-3);
    };

    useEffect(() => {
        loadCTData();
    }, [ctId, courseId]);

    const loadCTData = async () => {
        try {
            setLoading(true);
            // Load CT data
            const ctData = await getClassTestById(ctId);
            if (!ctData) {
                console.error('CT not found');
                return;
            }
            setCT(ctData);

            // Load student enrollments for this course
            const enrollments = await getStudentEnrollments(courseId);

            // Generate student array from enrollments
            const allStudents: RollStudent[] = [];
            enrollments.forEach(enrollment => {
                for (let id = enrollment.startId; id <= enrollment.endId; id++) {
                    allStudents.push({
                        studentId: id,
                        roll: parseInt(String(id).slice(-3)),
                        section: enrollment.section,
                    });
                }
            });

            // Sort by student ID
            allStudents.sort((a, b) => a.studentId - b.studentId);
            setStudents(allStudents);

            // Load existing marks
            const existingMarks = await getClassTestMarks(ctId);

            // Initialize marks input
            const initialMarks: Record<string, { status: 'present' | 'absent'; marks?: number }> = {};
            allStudents.forEach((student) => {
                const studentIdStr = String(student.studentId);
                const existingMark = existingMarks.find(m => m.studentId === student.studentId);

                if (existingMark) {
                    initialMarks[studentIdStr] = {
                        status: existingMark.status as 'present' | 'absent',
                        marks: existingMark.marksObtained,
                    };
                } else {
                    // Default to present with no marks
                    initialMarks[studentIdStr] = {
                        status: 'present',
                        marks: undefined,
                    };
                }
            });
            setMarksInput(initialMarks);
        } catch (error) {
            console.error('Error loading CT data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = (studentId: string) => {
        const current = marksInput[studentId];
        const newStatus = current?.status === 'present' ? 'absent' : 'present';
        setMarksInput({
            ...marksInput,
            [studentId]: {
                status: newStatus,
                marks: newStatus === 'present' ? current?.marks : undefined,
            },
        });
    };

    const handleMarksChange = (studentId: string, text: string, studentIndex: number) => {
        const maxMarks = ct?.totalMarks || 20;
        const value = text === '' ? undefined : parseInt(text) || 0;
        setMarksInput({
            ...marksInput,
            [studentId]: {
                status: 'present',
                marks: value !== undefined ? Math.min(maxMarks, Math.max(0, value)) : undefined,
            },
        });
    };

    const handleSubmitEditing = (currentIndex: number) => {
        // Find next present student
        const presentStudents = students.filter((s) => marksInput[String(s.studentId)]?.status === 'present');
        const currentStudentId = String(students[currentIndex].studentId);
        const currentPresentIndex = presentStudents.findIndex((s) => String(s.studentId) === currentStudentId);

        if (currentPresentIndex < presentStudents.length - 1) {
            const nextStudent = presentStudents[currentPresentIndex + 1];
            const nextStudentId = String(nextStudent.studentId);

            // Focus on next input
            inputRefs.current[nextStudentId]?.focus();

            // Scroll to make the next input visible
            setTimeout(() => {
                rowRefs.current[nextStudentId]?.measureLayout(
                    scrollViewRef.current as any,
                    (x, y, width, height) => {
                        scrollViewRef.current?.scrollTo({
                            y: y - 100, // Offset from top for better visibility
                            animated: true,
                        });
                    },
                    () => {
                        // Fallback if measureLayout fails
                        console.log('measureLayout failed');
                    }
                );
            }, 100);
        }
    };

    const handleSave = async () => {
        if (!ct) return;

        try {
            setLoading(true);
            // Prepare marks data for batch update
            // Note: For now we'll use studentId as email placeholder since we don't have actual student emails
            const marksData = students.map(student => {
                const studentIdStr = String(student.studentId);
                const studentData = marksInput[studentIdStr];
                return {
                    studentEmail: `student_${student.studentId}@temp.com`, // Temporary - should be real email
                    studentId: student.studentId,
                    status: studentData?.status || 'present',
                    marksObtained: studentData?.status === 'present' ? studentData?.marks : undefined
                };
            });

            // Batch update marks
            const success = await batchUpdateMarks(ct.id, courseId, marksData);

            if (success) {
                setSuccessMessage('Marks saved successfully!');
                setShowSuccessAlert(true);

                // Reload data
                await loadCTData();
                // Keep edit mode enabled so user can continue editing
            } else {
                setSuccessMessage('Failed to save marks. Please try again.');
                setShowSuccessAlert(true);
            }
        } catch (error) {
            console.error('Error saving marks:', error);
            setSuccessMessage('Failed to save marks. Please try again.');
            setShowSuccessAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const togglePublish = async () => {
        if (!ct) return;

        try {
            const newPublishState = !ct.isPublished;
            const success = await updateClassTest(ct.id, { isPublished: newPublishState });

            if (success) {
                setCT({ ...ct, isPublished: newPublishState });
                setSuccessMessage(`CT ${ct.isPublished ? 'hidden' : 'published'} successfully!`);
                setShowSuccessAlert(true);
            }
        } catch (error) {
            console.error('Error toggling publish:', error);
        }
    };

    const handleEditCT = () => {
        setShowOptionsMenu(false);
        if (ct) {
            setEditCTName(ct.name);
            setEditCTDescription(ct.description || '');
            setEditCTTotalMarks(ct.totalMarks.toString());
            setShowEditCTModal(true);
        }
    };

    const saveEditCT = async () => {
        if (!ct) return;

        const totalMarks = parseInt(editCTTotalMarks);
        if (isNaN(totalMarks) || totalMarks <= 0) {
            setSuccessMessage('Please enter valid total marks');
            setShowSuccessAlert(true);
            return;
        }

        try {
            setLoading(true);
            const success = await updateClassTest(ct.id, {
                name: editCTName.trim(),
                description: editCTDescription.trim(),
                totalMarks: totalMarks,
            });

            if (success) {
                setSuccessMessage('CT updated successfully!');
                setShowSuccessAlert(true);
                setShowEditCTModal(false);
                await loadCTData();
            } else {
                setSuccessMessage('Failed to update CT');
                setShowSuccessAlert(true);
            }
        } catch (error) {
            console.error('Error updating CT:', error);
            setSuccessMessage('Failed to update CT');
            setShowSuccessAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        // Reload data to reset any unsaved changes
        loadCTData();
    };

    const handleDeleteCT = () => {
        setShowOptionsMenu(false);
        setShowDeleteConfirm(true);
    };

    const isDone = ct ? new Date(ct.date.toDate()) < new Date() : false;
    const presentCount = Object.values(marksInput).filter((m) => m.status === 'present').length;
    const absentCount = students.length - presentCount;

    if (!ct) return null;

    return (
        <Container useSafeArea={false} style={styles.container}>
            <ScreenHeader
                title={ct.name}
                showBack={true}
                rightAction={{
                    icon: "ellipsis-vertical",
                    onPress: () => setShowOptionsMenu(true),
                }}
            />

            {/* Action Buttons */}
            <View style={styles.actionBar}>
                <Button
                    onPress={() => editMode ? handleCancelEdit() : setEditMode(true)}
                    style={styles.actionBtn}
                    variant={editMode ? 'outline' : 'primary'}
                >
                    <Ionicons name={editMode ? 'close' : 'create'} size={16} color={editMode ? colors.foreground : colors.primaryForeground} />
                    <Text style={{ color: editMode ? colors.foreground : colors.primaryForeground, marginLeft: 4, fontSize: 13 }}>
                        {editMode ? 'Cancel' : 'Edit'}
                    </Text>
                </Button>
                <Button onPress={togglePublish} style={styles.actionBtn} variant="outline">
                    <Ionicons name={ct.isPublished ? 'eye-off' : 'eye'} size={16} color={colors.foreground} />
                    <Text style={{ color: colors.foreground, marginLeft: 4, fontSize: 13 }}>
                        {ct.isPublished ? 'Hide' : 'Show'}
                    </Text>
                </Button>
            </View>

            {/* Stats */}
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
            </View>

            {/* Students List */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.studentsList}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    students.map((student, index) => {
                        const studentIdStr = String(student.studentId);
                        const studentData = marksInput[studentIdStr];
                        const isPresent = studentData?.status === 'present';

                        return (
                            <View
                                key={studentIdStr}
                                style={styles.studentRow}
                                ref={(ref) => {
                                    rowRefs.current[studentIdStr] = ref;
                                }}
                            >
                                <View style={styles.studentInfo}>
                                    <Text style={styles.rollNumber}>{student.roll}</Text>
                                    <Text style={styles.studentName}>ID: {student.studentId}</Text>
                                    <View style={styles.sectionBadge}>
                                        <Text style={styles.sectionText}>{student.section}</Text>
                                    </View>
                                </View>

                                <View style={styles.marksContainer}>
                                    <TouchableOpacity
                                        style={[styles.statusBtn, { backgroundColor: isPresent ? colors.chart3 : colors.destructive }]}
                                        onPress={() => editMode && handleToggleStatus(studentIdStr)}
                                        disabled={!editMode}
                                    >
                                        <Text style={styles.statusText}>{isPresent ? 'P' : 'ABS'}</Text>
                                    </TouchableOpacity>

                                    {isPresent ? (
                                        <TextInput
                                            ref={(ref) => {
                                                inputRefs.current[studentIdStr] = ref;
                                            }}
                                            style={styles.marksInput}
                                            value={studentData?.marks?.toString() || ''}
                                            onChangeText={(text) => handleMarksChange(studentIdStr, text, index)}
                                            onSubmitEditing={() => handleSubmitEditing(index)}
                                            keyboardType="number-pad"
                                            placeholder="0"
                                            placeholderTextColor={colors.mutedForeground}
                                            maxLength={2}
                                            editable={editMode}
                                            returnKeyType="next"
                                            blurOnSubmit={false}
                                        />
                                    ) : (
                                        <View style={[styles.marksInput, styles.absentBox]}>
                                            <Text style={styles.absentText}>ABS</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* Save Button */}
            {editMode && (
                <View style={styles.saveContainer}>
                    <Button onPress={handleSave} style={styles.saveBtn}>
                        <Ionicons name="save" size={20} color={colors.primaryForeground} />
                        <Text style={{ color: colors.primaryForeground, marginLeft: 8, fontSize: 16, fontWeight: '600' }}>
                            Save Changes
                        </Text>
                    </Button>
                </View>
            )}

            <Modal
                visible={showOptionsMenu}
                onClose={() => setShowOptionsMenu(false)}
                title={ct.name}
                colors={colors}
                options={[
                    {
                        label: 'Edit CT',
                        icon: 'create-outline',
                        onPress: handleEditCT,
                    },
                    {
                        label: 'Delete CT',
                        icon: 'trash-outline',
                        destructive: true,
                        onPress: () => setShowDeleteConfirm(true),
                    },
                ]}
            />

            <ConfirmDialog
                visible={showDeleteConfirm}
                title="Delete CT"
                message="Are you sure you want to delete this class test? This action cannot be undone."
                onConfirm={async () => {
                    setShowDeleteConfirm(false);
                    if (!ct) return;

                    try {
                        setLoading(true);
                        const { deleteClassTest } = await import('@/services/ct.service');
                        const success = await deleteClassTest(ct.id);

                        if (success) {
                            setSuccessMessage('CT deleted successfully!');
                            setShowSuccessAlert(true);
                            setTimeout(() => router.back(), 1500);
                        } else {
                            setSuccessMessage('Failed to delete CT');
                            setShowSuccessAlert(true);
                        }
                    } catch (error) {
                        console.error('Error deleting CT:', error);
                        setSuccessMessage('Failed to delete CT');
                        setShowSuccessAlert(true);
                    } finally {
                        setLoading(false);
                    }
                }}
                onCancel={() => setShowDeleteConfirm(false)}
                confirmText="Delete"
                destructive
            />

            <Modal
                visible={showEditCTModal}
                onClose={() => setShowEditCTModal(false)}
                title="Edit Class Test"
                colors={colors}
            >
                <View style={{ gap: 16 }}>
                    <View>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>CT Name</Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 14,
                                color: colors.foreground,
                                backgroundColor: colors.background,
                            }}
                            value={editCTName}
                            onChangeText={setEditCTName}
                            placeholder="Enter CT name"
                            placeholderTextColor={colors.mutedForeground}
                        />
                    </View>

                    <View>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>Description</Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 14,
                                color: colors.foreground,
                                backgroundColor: colors.background,
                                minHeight: 80,
                            }}
                            value={editCTDescription}
                            onChangeText={setEditCTDescription}
                            placeholder="Enter description (optional)"
                            placeholderTextColor={colors.mutedForeground}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>Total Marks</Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 14,
                                color: colors.foreground,
                                backgroundColor: colors.background,
                            }}
                            value={editCTTotalMarks}
                            onChangeText={setEditCTTotalMarks}
                            placeholder="Enter total marks"
                            placeholderTextColor={colors.mutedForeground}
                            keyboardType="number-pad"
                        />
                    </View>

                    <Button onPress={saveEditCT}>
                        <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Save Changes</Text>
                    </Button>
                </View>
            </Modal>

            <AlertDialog
                visible={showSuccessAlert}
                type="success"
                title="Success"
                message={successMessage}
                onClose={() => setShowSuccessAlert(false)}
            />
        </Container>
    );
}

const getStyles = (colors: ColorScheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        actionBar: {
            flexDirection: 'row',
            gap: 8,
            padding: 12,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        actionBtn: {
            flex: 1,
            paddingVertical: 8,
        },
        statsBar: {
            flexDirection: 'row',
            backgroundColor: colors.card,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            justifyContent: 'space-around',
        },
        statItem: {
            alignItems: 'center',
        },
        statValue: {
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 2,
        },
        statLabel: {
            fontSize: 11,
            color: colors.mutedForeground,
        },
        statDivider: {
            width: 1,
            height: 30,
            backgroundColor: colors.border,
        },
        studentsList: {
            flex: 1,
            backgroundColor: colors.background,
        },
        studentRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
        },
        studentInfo: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        rollNumber: {
            fontSize: 14,
            fontWeight: 'bold',
            color: colors.foreground,
            width: 40,
        },
        studentName: {
            fontSize: 14,
            color: colors.foreground,
            flex: 1,
        },
        sectionBadge: {
            backgroundColor: colors.muted,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
        },
        sectionText: {
            fontSize: 11,
            fontWeight: '600',
            color: colors.mutedForeground,
        },
        marksContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        statusBtn: {
            width: 50,
            height: 36,
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
        },
        statusText: {
            fontSize: 12,
            fontWeight: 'bold',
            color: '#FFFFFF',
        },
        marksInput: {
            width: 50,
            height: 36,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 6,
            paddingHorizontal: 4,
            fontSize: 13,
            fontWeight: '600',
            color: colors.foreground,
            backgroundColor: colors.background,
            textAlign: 'center',
        },
        absentBox: {
            backgroundColor: colors.muted,
            justifyContent: 'center',
            alignItems: 'center',
        },
        absentText: {
            fontSize: 12,
            fontWeight: 'bold',
            color: colors.mutedForeground,
        },
        saveContainer: {
            padding: 16,
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        saveBtn: {
            paddingVertical: 14,
        },
    });
