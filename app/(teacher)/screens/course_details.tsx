import {
    AttendanceTab,
    CTTab,
    OverviewTab,
    StudentsTab
} from '@/components/teachers/course-details';
import { AlertDialog } from '@/components/ui/alert-dialog';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Container } from '@/components/ui/container';
import { Modal } from '@/components/ui/modal';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import { getCourseAttendance } from '@/services/attendance.service';
import { addStudentIdRange, getCourseById, getEnrolledStudents, getStudentEnrollments, removeStudentIdRange, updateStudentIdRange } from '@/services/course.service';
import { createClassTest, getClassTestMarks, getCourseClassTests } from '@/services/ct.service';
import { exportCourseReport, exportCTMarks } from '@/services/export.service';
import { AttendanceSession, AttendanceStatus, ClassTest, Course, Mark, MarkStatus, Student, StudentEnrollment } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

type TabType = 'overview' | 'attendance' | 'ct' | 'students';

export default function TeacherCourseDetailScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { session: { user } } = useAuth();
    const { courseId } = useLocalSearchParams<{ courseId: string }>();

    // State
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<Course | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [classTests, setClassTests] = useState<ClassTest[]>([]);
    const [marks, setMarks] = useState<Record<string, Mark[]>>({});
    const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
    const [studentAttendancePercentages, setStudentAttendancePercentages] = useState<Record<string, number>>({});
    const [availableSections, setAvailableSections] = useState<string[]>([]);
    const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>([]);
    const [selectedEnrollment, setSelectedEnrollment] = useState<StudentEnrollment | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Modals
    const [showSectionSelectModal, setShowSectionSelectModal] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showCTModal, setShowCTModal] = useState(false);
    const [showCreateCTModal, setShowCreateCTModal] = useState(false);
    const [showEditCourseModal, setShowEditCourseModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showDeleteCourseConfirm, setShowDeleteCourseConfirm] = useState(false);
    const [showStudentProgressModal, setShowStudentProgressModal] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>({
        type: 'success',
        title: '',
        message: ''
    });
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedAttendanceSession, setSelectedAttendanceSession] = useState<AttendanceSession | null>(null);
    const [attendanceModalMode, setAttendanceModalMode] = useState<'view' | 'edit' | 'create'>('create');
    const [studentSearchQuery, setStudentSearchQuery] = useState('');

    // Form state
    const [selectedCT, setSelectedCT] = useState<ClassTest | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceMarking, setAttendanceMarking] = useState<Set<string>>(new Set());
    const [ctMarksInput, setCTMarksInput] = useState<Record<string, { status: MarkStatus; marks?: number }>>({});
    const [newCTName, setNewCTName] = useState('');
    const [newCTDescription, setNewCTDescription] = useState('');
    const [newCTMaxMarks, setNewCTMaxMarks] = useState('20');
    const [newCTDate, setNewCTDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [newCTTime, setNewCTTime] = useState('10:00'); // HH:MM 24h
    const [newCTPublishNow, setNewCTPublishNow] = useState(false);
    const [bestCTCountInput, setBestCTCountInput] = useState<number | undefined>(undefined);

    // Edit course state
    const [editCourseName, setEditCourseName] = useState('');
    const [editBestCTCount, setEditBestCTCount] = useState('');
    const [editCourseCredit, setEditCourseCredit] = useState('');

    // Invite members state
    const [inviteType, setInviteType] = useState<'teacher' | 'student'>('student');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteStartId, setInviteStartId] = useState('');
    const [inviteEndId, setInviteEndId] = useState('');
    const [inviteSection, setInviteSection] = useState('');

    const styles = getStyles(colors);

    // Helper function to show alerts
    const showAlertMessage = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
        setAlertConfig({ type, title, message });
        setShowAlert(true);
    };

    // Load data
    useEffect(() => {
        loadCourseData();
    }, [courseId]);

    const loadCourseData = async () => {
        try {
            setRefreshing(true);
            setLoading(true);

            if (!courseId) return;

            // Load course data
            const courseData = await getCourseById(courseId);
            setCourse(courseData);

            // Load student enrollments first
            const enrollments = await getStudentEnrollments(courseId);
            setStudentEnrollments(enrollments);

            // Load enrolled students
            const enrolledStudents = await getEnrolledStudents(courseId);
            setStudents(enrolledStudents);

            // Load class tests
            const tests = await getCourseClassTests(courseId);
            setClassTests(tests);

            // Load attendance sessions
            const attendance = await getCourseAttendance(courseId);
            setAttendanceSessions(attendance);

            // Load marks for each class test
            const marksData: Record<string, Mark[]> = {};
            for (const ct of tests) {
                const classTestMarks = await getClassTestMarks(ct.id);
                marksData[ct.id] = classTestMarks;
            }
            setMarks(marksData);

            // Calculate attendance percentages by student ID
            const percentages: Record<string, number> = {};
            for (const student of enrolledStudents) {
                const studentIdStr = String(student.studentId);
                const studentSessions = attendance.filter(
                    session => studentIdStr in session.studentStatuses
                );

                if (studentSessions.length > 0) {
                    const presentCount = studentSessions.filter(
                        session => session.studentStatuses[studentIdStr] === 'present'
                    ).length;
                    percentages[student.email] = (presentCount / studentSessions.length) * 100;
                } else {
                    percentages[student.email] = 0;
                }
            }
            setStudentAttendancePercentages(percentages);

            // Load available sections from enrollments
            const sections = Array.from(new Set(enrollments.map(e => e.section))).sort();
            setAvailableSections(sections);

            console.log('Course data loaded successfully:', {
                course: courseData,
                students: enrolledStudents.length,
                enrollments: enrollments.length,
                classTests: tests.length,
                attendanceSessions: attendance.length,
                sections: sections,
            });
        } catch (error) {
            console.error('Error loading course data:', error);
            showAlertMessage('error', 'Error', 'Failed to load course data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleTakeAttendance = (session?: AttendanceSession) => {
        if (session) {
            // Navigate to view attendance screen
            handleViewAttendanceSession(session);
        } else {
            // Show section selection for new attendance
            setShowSectionSelectModal(true);
        }
    };

    const handleViewAttendanceSession = (session: AttendanceSession) => {
        const sessionDate = session.date.toDate();
        const today = new Date();
        const isToday = sessionDate.toDateString() === today.toDateString();

        const dateString = isToday ? 'Today' : sessionDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        router.push({
            pathname: '/(teacher)/screens/view_attendance',
            params: {
                courseId: courseId,
                sessionId: session.id,
                sessionDate: dateString,
                sessionSection: session.section,
                studentStatuses: JSON.stringify(session.studentStatuses),
            },
        });
    };

    const handleSectionSelected = (section: string) => {
        setShowSectionSelectModal(false);
        // Navigate to take attendance screen
        router.push({
            pathname: '/(teacher)/screens/take_attendance',
            params: {
                courseId: course?.id || '',
                section: section,
                date: new Date().toISOString().split('T')[0],
            }
        });
    };

    const toggleAttendance = (studentEmail: string) => {
        const newSet = new Set(attendanceMarking);
        if (newSet.has(studentEmail)) {
            newSet.delete(studentEmail);
        } else {
            newSet.add(studentEmail);
        }
        setAttendanceMarking(newSet);
    };

    const saveAttendance = async () => {
        if (!course || !user?.email) return;

        const studentStatuses: Record<string, AttendanceStatus> = {};
        students.forEach(student => {
            studentStatuses[student.email] = attendanceMarking.has(student.email) ? 'present' : 'absent';
        });

        // This function is no longer used - attendance is now taken via the take_attendance screen
        console.log('This attendance modal is for viewing only');
        setShowAttendanceModal(false);
        setSelectedAttendanceSession(null);
        setAttendanceModalMode('create');
    };

    const handleAddCTMarks = (ct: ClassTest) => {
        setSelectedCT(ct);

        // Initialize marks input with existing marks or default present status
        const existingMarks = marks[ct.id] || [];
        const marksInput: Record<string, { status: MarkStatus; marks?: number }> = {};

        students.forEach(student => {
            const existingMark = existingMarks.find(m => m.studentEmail === student.email);
            if (existingMark) {
                marksInput[student.email] = {
                    status: existingMark.status,
                    marks: existingMark.marksObtained,
                };
            } else {
                marksInput[student.email] = {
                    status: 'present',
                    marks: undefined,
                };
            }
        });

        setCTMarksInput(marksInput);
        setShowCTModal(true);
    };

    const handlePublishToggle = async (ct: ClassTest) => {
        const newPublishedStatus = !ct.isPublished;
        const action = newPublishedStatus ? 'publish' : 'unpublish';

        // Mock: Just update local state for demonstration
        console.log(`${action} class test (mock):`, ct.id);
        setClassTests(classTests.map(c =>
            c.id === ct.id ? { ...c, isPublished: newPublishedStatus } : c
        ));
        alert(`Class test ${action}ed! (Demo mode)`);
    };

    const saveCTMarks = async () => {
        if (!selectedCT || !course) return;

        // This function is no longer used - marks are now entered via the ct_details screen
        console.log('This CT modal is for viewing only');
        setShowCTModal(false);
        setSelectedCT(null);
    };

    const handleCreateCT = async () => {
        if (!newCTName.trim() || !newCTMaxMarks || !course || !user?.email) return;

        const maxMarks = parseInt(newCTMaxMarks);
        if (isNaN(maxMarks) || maxMarks <= 0) {
            showAlertMessage('error', 'Error', 'Invalid marks value');
            return;
        }

        try {
            setLoading(true);
            // Combine date and time
            const ctDateTime = new Date(`${newCTDate}T${newCTTime}:00`);

            const newCT = await createClassTest(
                course.id,
                newCTName.trim(),
                maxMarks,
                user.email,
                ctDateTime,
                newCTDescription.trim() || undefined
            );

            if (newCT) {
                showAlertMessage('success', 'Success', 'Class test created successfully!');
                // Reset form
                setNewCTName('');
                setNewCTDescription('');
                setNewCTMaxMarks('20');
                setNewCTDate(new Date().toISOString().split('T')[0]);
                setNewCTTime('10:00');
                setNewCTPublishNow(false);
                setShowCreateCTModal(false);
                // Reload course data
                await loadCourseData();
            } else {
                showAlertMessage('error', 'Error', 'Failed to create class test');
            }
        } catch (error) {
            console.error('Error creating CT:', error);
            showAlertMessage('error', 'Error', 'Failed to create class test');
        } finally {
            setLoading(false);
        }
    };

    const handleEditCourse = () => {
        if (course) {
            setEditCourseName(course.name);
            setEditBestCTCount(course.bestCTCount?.toString() || '');
            setEditCourseCredit(course.credit.toString());
            setShowEditCourseModal(true);
        }
    };

    const handleExportCTMarks = async (ct: ClassTest) => {
        try {
            await exportCTMarks(ct);
            showAlertMessage('success', 'Success', 'CT marks exported successfully!');
        } catch (error) {
            console.error('Error exporting CT marks:', error);
            showAlertMessage('error', 'Error', 'Failed to export CT marks. Please try again.');
        }
    };

    const handleExportCourseReport = async () => {
        try {
            if (!courseId) return;

            await exportCourseReport(courseId);
            showAlertMessage('success', 'Success', 'Course report exported successfully!');
        } catch (error) {
            console.error('Error exporting course report:', error);
            showAlertMessage('error', 'Error', 'Failed to export course report. Please try again.');
        }
    };

    const saveEditCourse = async () => {
        if (!course || !user?.email) return;

        // Validate credit
        const creditNum = parseFloat(editCourseCredit);
        if (isNaN(creditNum) || creditNum <= 0 || creditNum > 10) {
            showAlertMessage('error', 'Invalid Credit', 'Credit must be a positive number not exceeding 10');
            return;
        }

        // Parse bestCTCount (optional)
        let bestCTCountNum: number | undefined = undefined;
        if (editBestCTCount.trim() !== '') {
            bestCTCountNum = parseInt(editBestCTCount);
            if (isNaN(bestCTCountNum) || bestCTCountNum <= 0) {
                showAlertMessage('error', 'Invalid Best CT Count', 'Best CT Count must be a positive number');
                return;
            }
        }

        try {
            setLoading(true);
            const { updateCourseInfo } = await import('@/services/course.service');

            const success = await updateCourseInfo(
                course.id,
                {
                    name: editCourseName.trim(),
                    bestCTCount: bestCTCountNum,
                    credit: creditNum,
                },
                user.email
            );

            if (success) {
                showAlertMessage('success', 'Success', 'Course updated successfully!');
                setShowEditCourseModal(false);
                await loadCourseData();
            } else {
                showAlertMessage('error', 'Error', 'Failed to update course');
            }
        } catch (error) {
            console.error('Error updating course:', error);
            showAlertMessage('error', 'Error', 'Failed to update course');
        } finally {
            setLoading(false);
        }
    };

    const handleInviteMembers = async () => {
        if (!course || !user) return;

        if (inviteType === 'teacher') {
            if (!inviteEmail.trim()) {
                showAlertMessage('error', 'Error', 'Please enter teacher email');
                return;
            }

            // TODO: Implement teacher invitation
            console.log('Inviting teacher:', inviteEmail.trim());
            showAlertMessage('info', 'Coming Soon', 'Teacher invitation feature will be available soon');
            setShowInviteModal(false);
            setInviteEmail('');
        } else {
            // Student enrollment
            if (!inviteStartId.trim() || !inviteEndId.trim()) {
                showAlertMessage('error', 'Error', 'Please enter student ID range');
                return;
            }

            if (!inviteSection.trim()) {
                showAlertMessage('error', 'Error', 'Please select a section');
                return;
            }

            const startId = parseInt(inviteStartId);
            const endId = parseInt(inviteEndId);

            if (isNaN(startId) || isNaN(endId)) {
                showAlertMessage('error', 'Error', 'Invalid student ID range');
                return;
            }

            if (startId > endId) {
                showAlertMessage('error', 'Error', 'Start ID must be less than or equal to End ID');
                return;
            }

            try {
                setLoading(true);
                const success = await addStudentIdRange(
                    course.id,
                    startId,
                    endId,
                    inviteSection.trim().toUpperCase(),
                    user.email!
                );

                if (success) {
                    showAlertMessage('success', 'Success', `Students enrolled in Section ${inviteSection}!`);
                    setShowInviteModal(false);
                    setInviteStartId('');
                    setInviteEndId('');
                    setInviteSection('');
                    await loadCourseData(); // Reload data
                } else {
                    showAlertMessage('error', 'Error', 'Failed to add student ID range. Check for overlaps.');
                }
            } catch (error) {
                console.error('Error adding student ID range:', error);
                showAlertMessage('error', 'Error', 'Failed to add student ID range');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEnrollmentPress = (enrollment: StudentEnrollment) => {
        setSelectedEnrollment(enrollment);
        setInviteStartId(enrollment.startId.toString());
        setInviteEndId(enrollment.endId.toString());
        setInviteSection(enrollment.section);
        setShowInviteModal(true);
    };

    const handleAddEnrollment = () => {
        setSelectedEnrollment(null);
        setInviteStartId('');
        setInviteEndId('');
        setInviteSection('');
        setInviteType('student');
        setShowInviteModal(true);
    };

    const handleUpdateEnrollment = async () => {
        if (!course || !user || !selectedEnrollment) return;

        const startId = parseInt(inviteStartId);
        const endId = parseInt(inviteEndId);

        if (isNaN(startId) || isNaN(endId) || startId > endId) {
            showAlertMessage('error', 'Error', 'Invalid student ID range');
            return;
        }

        if (!inviteSection.trim()) {
            showAlertMessage('error', 'Error', 'Please select a section');
            return;
        }

        try {
            setLoading(true);
            const success = await updateStudentIdRange(
                course.id,
                selectedEnrollment.id,
                startId,
                endId,
                inviteSection.trim().toUpperCase(),
                user.email!
            );

            if (success) {
                showAlertMessage('success', 'Success', 'Student ID range updated!');
                setShowInviteModal(false);
                setSelectedEnrollment(null);
                setInviteStartId('');
                setInviteEndId('');
                setInviteSection('');
                await loadCourseData();
            } else {
                showAlertMessage('error', 'Error', 'Failed to update student ID range');
            }
        } catch (error) {
            console.error('Error updating student ID range:', error);
            showAlertMessage('error', 'Error', 'Failed to update student ID range');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEnrollment = async () => {
        if (!course || !user || !selectedEnrollment) return;

        try {
            setLoading(true);
            const success = await removeStudentIdRange(
                course.id,
                selectedEnrollment.id,
                user.email!
            );

            if (success) {
                showAlertMessage('success', 'Success', 'Student ID range deleted!');
                setShowInviteModal(false);
                setSelectedEnrollment(null);
                await loadCourseData();
            } else {
                showAlertMessage('error', 'Error', 'Failed to delete student ID range');
            }
        } catch (error) {
            console.error('Error deleting student ID range:', error);
            showAlertMessage('error', 'Error', 'Failed to delete student ID range');
        } finally {
            setLoading(false);
        }
    };

    const calculateStudentBestCTAverage = (studentEmail: string): number => {
        // Use mock calculation function
        // TODO: Implement real best CT average calculation using service
        // return await calculateStudentBestCTAverage(courseId, studentEmail, course?.bestCTCount);
        return 0;
    };

    const calculateCTAverage = (ctId: string): number => {
        // Use mock calculation function
        // TODO: Implement real CT average calculation using service
        // return await calculateCTAverage(ctId);
        return 0;
    };

    return (
        <Container useSafeArea={false} style={styles.container}>
            <ScreenHeader
                title={course?.name || ''}
                subtitle={course?.code || ''}
                showBack={true}
                rightAction={{
                    icon: 'ellipsis-vertical',
                    onPress: () => setShowMenuModal(true),
                }}
            />

            {/* Tabs */}
            <View style={styles.tabs}>
                {[
                    { key: 'overview', label: 'Overview', icon: 'grid' },
                    { key: 'attendance', label: 'Attend', icon: 'checkmark-circle' },
                    { key: 'ct', label: 'CT', icon: 'document-text' },
                    { key: 'students', label: 'Students', icon: 'people' },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tab,
                            activeTab === tab.key && styles.tabActive
                        ]}
                        onPress={() => setActiveTab(tab.key as TabType)}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={20}
                            color={activeTab === tab.key ? colors.primary : colors.mutedForeground}
                        />
                        <Text style={[
                            styles.tabText,
                            activeTab === tab.key && styles.tabTextActive
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <OverviewTab
                    students={students}
                    attendanceSessions={attendanceSessions}
                    classTests={classTests}
                    studentAttendancePercentages={studentAttendancePercentages}
                    colors={colors}
                    onTakeAttendance={() => handleTakeAttendance()}
                    onCreateCT={() => setShowCreateCTModal(true)}
                    onEditCourse={() => handleEditCourse()}
                    onInviteMembers={() => setShowInviteModal(true)}
                    onViewAttendance={(session) => {
                        setSelectedAttendanceSession(session);
                        setAttendanceModalMode('view');
                        setShowAttendanceModal(true);
                    }}
                    onExportReport={() => handleExportCourseReport()}
                    refreshing={refreshing}
                    onRefresh={loadCourseData}
                />
            )}
            {activeTab === 'attendance' && (
                <AttendanceTab
                    attendanceSessions={attendanceSessions}
                    colors={colors}
                    onTakeAttendance={() => handleTakeAttendance()}
                    onViewSession={handleViewAttendanceSession}
                    refreshing={refreshing}
                    onRefresh={loadCourseData}
                />
            )}
            {activeTab === 'ct' && (
                <CTTab
                    classTests={classTests}
                    marks={marks}
                    colors={colors}
                    onCreateCT={() => setShowCreateCTModal(true)}
                    onCTClick={(ct) => {
                        router.push({
                            pathname: '/(teacher)/screens/ct_details',
                            params: { ctId: ct.id, courseId: course?.id || '' },
                        });
                    }}
                    onEditCT={(ct) => {
                        showAlertMessage('info', 'Info', 'Edit CT functionality - coming soon');
                    }}
                    onDeleteCT={async (ct) => {
                        try {
                            setLoading(true);
                            const { deleteClassTest } = await import('@/services/ct.service');
                            const success = await deleteClassTest(ct.id);

                            if (success) {
                                showAlertMessage('success', 'Success', 'CT deleted successfully!');
                                await loadCourseData();
                            } else {
                                showAlertMessage('error', 'Error', 'Failed to delete CT');
                            }
                        } catch (error) {
                            console.error('Error deleting CT:', error);
                            showAlertMessage('error', 'Error', 'Failed to delete CT');
                        } finally {
                            setLoading(false);
                        }
                    }}
                    onExportCT={(ct) => handleExportCTMarks(ct)}
                    refreshing={refreshing}
                    onRefresh={loadCourseData}
                />
            )}
            {activeTab === 'students' && (
                <StudentsTab
                    students={students}
                    studentAttendancePercentages={studentAttendancePercentages}
                    searchQuery={studentSearchQuery}
                    colors={colors}
                    onSearchChange={setStudentSearchQuery}
                    onStudentPress={(student) => {
                        setSelectedStudent(student);
                        setShowStudentProgressModal(true);
                    }}
                    calculateStudentBestCTAverage={calculateStudentBestCTAverage}
                    enrollments={studentEnrollments}
                    onEnrollmentPress={handleEnrollmentPress}
                    onAddEnrollment={handleAddEnrollment}
                    refreshing={refreshing}
                    onRefresh={loadCourseData}
                />
            )}

            {/* Attendance Modal */}
            <Modal
                visible={showAttendanceModal}
                onClose={() => {
                    setShowAttendanceModal(false);
                    setSelectedAttendanceSession(null);
                    setAttendanceModalMode('create');
                }}
                title={attendanceModalMode === 'view' ? 'Attendance Details' : attendanceModalMode === 'edit' ? 'Edit Attendance' : 'Take Attendance'}
                subtitle={selectedAttendanceSession && attendanceModalMode === 'view' ? selectedAttendanceSession.date.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : undefined}
                colors={colors}
            >
                {attendanceModalMode === 'view' && selectedAttendanceSession ? (
                    // View Mode - Grid Layout
                    <>
                        {/* Stats Bar */}
                        <View style={styles.attendanceStatsBar}>
                            <View style={styles.attendanceStatItem}>
                                <Text style={[styles.attendanceStatValue, { color: colors.chart3 }]}>
                                    {Object.values(selectedAttendanceSession.studentStatuses).filter(s => s === 'present').length}
                                </Text>
                                <Text style={styles.attendanceStatLabel}>Present</Text>
                            </View>
                            <View style={styles.attendanceStatDivider} />
                            <View style={styles.attendanceStatItem}>
                                <Text style={[styles.attendanceStatValue, { color: colors.destructive }]}>
                                    {Object.values(selectedAttendanceSession.studentStatuses).filter(s => s === 'absent').length}
                                </Text>
                                <Text style={styles.attendanceStatLabel}>Absent</Text>
                            </View>
                            <View style={styles.attendanceStatDivider} />
                            <View style={styles.attendanceStatItem}>
                                <Text style={[styles.attendanceStatValue, { color: colors.foreground }]}>
                                    {Object.keys(selectedAttendanceSession.studentStatuses).length}
                                </Text>
                                <Text style={styles.attendanceStatLabel}>Total</Text>
                            </View>
                        </View>

                        {/* Student Grid - Scrollable */}
                        <View style={{ flex: 1, maxHeight: 450 }}>
                            <ScrollView
                                showsVerticalScrollIndicator={true}
                                style={{ flex: 1 }}
                            >
                                <View style={styles.attendanceGridContainer}>
                                    {Object.entries(selectedAttendanceSession.studentStatuses)
                                        .sort((a, b) => {
                                            // Sort by student ID (key is studentId as string)
                                            const idA = parseInt(a[0]) || 0;
                                            const idB = parseInt(b[0]) || 0;
                                            return idA - idB;
                                        })
                                        .map(([studentIdStr, status]) => {
                                            const studentId = parseInt(studentIdStr) || 0;
                                            const roll = studentId > 0 ? String(studentId).slice(-3) : '???';
                                            const isPresent = status === 'present';

                                            return (
                                                <View
                                                    key={studentIdStr}
                                                    style={[
                                                        styles.attendanceTile,
                                                        {
                                                            backgroundColor: isPresent ? '#22c55e' : '#ef4444',
                                                        }
                                                    ]}
                                                >
                                                    <Text style={styles.attendanceTileText}>
                                                        {roll}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                </View>
                            </ScrollView>
                        </View>

                        <Button onPress={() => handleTakeAttendance(selectedAttendanceSession)} style={{ marginTop: 16 }}>
                            <Ionicons name="create-outline" size={20} color={colors.primaryForeground} />
                            <Text style={{ color: colors.primaryForeground, marginLeft: 8 }}>Edit Attendance</Text>
                        </Button>
                    </>
                ) : (
                    // Edit/Create Mode
                    <>
                        <View style={styles.dateSelector}>
                            <Ionicons name="calendar" size={20} color={colors.primary} />
                            <TextInput
                                style={styles.dateInput}
                                value={selectedDate}
                                onChangeText={setSelectedDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={colors.mutedForeground}
                            />
                        </View>

                        {students.map((student) => {
                            const isPresent = attendanceMarking.has(student.email);
                            return (
                                <TouchableOpacity
                                    key={student.email}
                                    style={styles.listItem}
                                    onPress={() => toggleAttendance(student.email)}
                                >
                                    <View style={styles.listItemInfo}>
                                        <View style={[
                                            styles.checkbox,
                                            isPresent && styles.checkboxChecked
                                        ]}>
                                            {isPresent && (
                                                <Ionicons name="checkmark" size={18} color={colors.primaryForeground} />
                                            )}
                                        </View>
                                        <View>
                                            <Text style={styles.listItemName}>{student.name}</Text>
                                            <Text style={styles.listItemId}>{student.studentId}</Text>
                                        </View>
                                    </View>
                                    <View style={[
                                        styles.badge,
                                        { backgroundColor: isPresent ? colors.chart3 + '20' : colors.destructive + '20' }
                                    ]}>
                                        <Text style={[
                                            styles.badgeText,
                                            { color: isPresent ? colors.chart3 : colors.destructive }
                                        ]}>
                                            {isPresent ? 'Present' : 'Absent'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        <Button onPress={saveAttendance} style={{ marginTop: 16 }}>
                            Save Attendance ({attendanceMarking.size}/{students.length})
                        </Button>
                    </>
                )}
            </Modal>

            {/* CT Marks Modal */}
            <Modal
                visible={showCTModal}
                onClose={() => setShowCTModal(false)}
                title={`${selectedCT?.name || 'CT'} Marks (Out of ${selectedCT?.totalMarks || 20})`}
                colors={colors}
            >
                {students.map((student) => {
                    const studentMark = ctMarksInput[student.email];
                    const isPresent = studentMark?.status === 'present';

                    return (
                        <View key={student.email} style={styles.marksItem}>
                            <View style={styles.marksInfo}>
                                <Text style={styles.marksName}>{student.name}</Text>
                                <Text style={styles.marksId}>{student.studentId}</Text>
                            </View>
                            <View style={styles.marksInputContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.statusToggle,
                                        { backgroundColor: isPresent ? colors.chart3 : colors.destructive }
                                    ]}
                                    onPress={() => {
                                        const newStatus = isPresent ? 'absent' : 'present';
                                        setCTMarksInput({
                                            ...ctMarksInput,
                                            [student.email]: {
                                                status: newStatus,
                                                marks: newStatus === 'present' ? studentMark?.marks : undefined,
                                            },
                                        });
                                    }}
                                >
                                    <Text style={styles.statusToggleText}>
                                        {isPresent ? 'P' : 'ABS'}
                                    </Text>
                                </TouchableOpacity>
                                {isPresent && (
                                    <TextInput
                                        style={styles.marksInput}
                                        value={studentMark?.marks?.toString() || ''}
                                        onChangeText={(text) => {
                                            const maxMarks = selectedCT?.totalMarks || 20;
                                            const value = text === '' ? undefined : parseInt(text) || 0;
                                            setCTMarksInput({
                                                ...ctMarksInput,
                                                [student.email]: {
                                                    status: 'present',
                                                    marks: value !== undefined ? Math.min(maxMarks, Math.max(0, value)) : undefined,
                                                },
                                            });
                                        }}
                                        keyboardType="number-pad"
                                        placeholder="0"
                                        placeholderTextColor={colors.mutedForeground}
                                        maxLength={3}
                                    />
                                )}
                            </View>
                        </View>
                    );
                })}

                <Button onPress={saveCTMarks} style={{ marginTop: 16 }}>
                    Save Marks
                </Button>
            </Modal>

            {/* Create CT Modal */}
            <Modal
                visible={showCreateCTModal}
                onClose={() => setShowCreateCTModal(false)}
                title="Create New CT"
                colors={colors}
                scrollable={false}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>CT Name <Text style={{ color: colors.destructive }}>*</Text></Text>
                        <TextInput
                            style={styles.textInput}
                            value={newCTName}
                            onChangeText={setNewCTName}
                            placeholder="e.g., CT 5 or Mid Term"
                            placeholderTextColor={colors.mutedForeground}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Maximum Marks <Text style={{ color: colors.destructive }}>*</Text></Text>
                        <TextInput
                            style={styles.textInput}
                            value={newCTMaxMarks}
                            onChangeText={setNewCTMaxMarks}
                            placeholder="20"
                            placeholderTextColor={colors.mutedForeground}
                            keyboardType="number-pad"
                        />
                    </View>

                    <View style={styles.rowInputs}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>Date <Text style={{ color: colors.destructive }}>*</Text></Text>
                            <TextInput
                                style={styles.textInput}
                                value={newCTDate}
                                onChangeText={setNewCTDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={colors.mutedForeground}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>Time <Text style={{ color: colors.destructive }}>*</Text></Text>
                            <TextInput
                                style={styles.textInput}
                                value={newCTTime}
                                onChangeText={setNewCTTime}
                                placeholder="HH:MM"
                                placeholderTextColor={colors.mutedForeground}
                            />
                        </View>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={newCTDescription}
                            onChangeText={setNewCTDescription}
                            placeholder="Add notes or instructions..."
                            placeholderTextColor={colors.mutedForeground}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.publishToggle, newCTPublishNow && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }]}
                        onPress={() => setNewCTPublishNow(!newCTPublishNow)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name={newCTPublishNow ? 'checkbox-outline' : 'square-outline'} size={20} color={newCTPublishNow ? colors.primary : colors.mutedForeground} />
                        <Text style={[styles.publishToggleText, { color: newCTPublishNow ? colors.primary : colors.mutedForeground }]}>Publish immediately (show in upcoming)</Text>
                    </TouchableOpacity>

                    <Button onPress={handleCreateCT} style={{ marginTop: 16 }}>
                        Create CT
                    </Button>
                </ScrollView>
            </Modal>

            {/* Course Actions Menu */}
            <Modal
                visible={showMenuModal}
                onClose={() => setShowMenuModal(false)}
                title="Course Actions"
                colors={colors}
                options={[
                    {
                        label: 'Edit Course',
                        icon: 'create-outline',
                        onPress: handleEditCourse,
                    },
                    {
                        label: 'Invite Members',
                        icon: 'person-add-outline',
                        onPress: () => setShowInviteModal(true),
                    },
                    {
                        label: 'Archive Course',
                        icon: 'archive-outline',
                        onPress: () => showAlertMessage('info', 'Info', 'Archive course functionality - coming soon'),
                    },
                    {
                        label: 'Delete Course',
                        icon: 'trash-outline',
                        destructive: true,
                        onPress: () => setShowDeleteCourseConfirm(true),
                    },
                ]}
            />

            {/* Edit Course Modal */}
            <Modal
                visible={showEditCourseModal}
                onClose={() => setShowEditCourseModal(false)}
                title="Edit Course"
                colors={colors}
                scrollable={false}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Course Code</Text>
                        <TextInput
                            style={[styles.textInput, { opacity: 0.6 }]}
                            value={course?.code || ''}
                            editable={false}
                            placeholderTextColor={colors.mutedForeground}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Course Name</Text>
                        <TextInput
                            style={styles.textInput}
                            value={editCourseName}
                            onChangeText={setEditCourseName}
                            placeholder="Enter course name"
                            placeholderTextColor={colors.mutedForeground}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Credit</Text>
                        <TextInput
                            style={styles.textInput}
                            value={editCourseCredit}
                            onChangeText={setEditCourseCredit}
                            keyboardType="decimal-pad"
                            placeholder="e.g., 3.0"
                            placeholderTextColor={colors.mutedForeground}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Best CT Count (Optional)</Text>
                        <TextInput
                            style={styles.textInput}
                            value={editBestCTCount}
                            onChangeText={setEditBestCTCount}
                            keyboardType="number-pad"
                            placeholder="Leave empty to count all CTs"
                            placeholderTextColor={colors.mutedForeground}
                        />
                        <Text style={styles.inputDescription}>
                            Number of best CTs to count for final grade (leave empty for all)
                        </Text>
                    </View>

                    <Button onPress={saveEditCourse} loading={loading} disabled={loading}>
                        Save Changes
                    </Button>
                </ScrollView>
            </Modal>

            {/* Student Progress Modal */}
            <Modal
                visible={showStudentProgressModal}
                onClose={() => setShowStudentProgressModal(false)}
                title="Student Progress"
                subtitle={selectedStudent?.name}
                colors={colors}
                scrollable={false}
            >
                {selectedStudent && (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Card style={[styles.infoCard, { borderWidth: 1 }]}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Student ID</Text>
                                <Text style={styles.infoValue}>{selectedStudent.studentId}</Text>
                            </View>
                        </Card>

                        <Card style={[styles.infoCard, { borderWidth: 1 }]}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Attendance</Text>
                                <Text style={styles.infoValue}>
                                    {(() => {
                                        const studentIdStr = String(selectedStudent.studentId);
                                        const total = attendanceSessions.length;
                                        const present = attendanceSessions.filter(s => s.studentStatuses[studentIdStr] === 'present').length;
                                        const percent = total > 0 ? Math.round((present / total) * 100) : 0;
                                        return `${present}/${total} (${percent}%)`;
                                    })()}
                                </Text>
                            </View>
                        </Card>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={styles.modalSectionTitle}>Class Tests</Text>
                            {classTests
                                .map(ct => {
                                    const ctMarks = marks[ct.id] || [];
                                    const m = ctMarks.find(x => x.studentEmail === selectedStudent.email);
                                    return { ct, m };
                                })
                                .filter(({ m }) => m && (m.status === 'absent' || (m.status === 'present' && m.marksObtained !== undefined)))
                                .map(({ ct, m }) => (
                                    <Card key={ct.id} style={{ padding: 12, marginBottom: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>{ct.name}</Text>
                                            <Text style={styles.infoValue}>
                                                {m!.status === 'present' && m!.marksObtained !== undefined ? `${m!.marksObtained}/${ct.totalMarks}` : 'Absent'}
                                            </Text>
                                        </View>
                                    </Card>
                                ))}
                        </View>
                    </ScrollView>
                )}
            </Modal>

            {/* Invite Members Modal */}
            <Modal
                visible={showInviteModal}
                onClose={() => {
                    setShowInviteModal(false);
                    setSelectedEnrollment(null);
                }}
                title={selectedEnrollment ? 'Edit Student Range' : 'Invite Members'}
                colors={colors}
                scrollable={false}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    {!selectedEnrollment && (
                        <View style={styles.typeToggle}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    inviteType === 'student' && styles.typeButtonActive,
                                ]}
                                onPress={() => setInviteType('student')}
                            >
                                <Text
                                    style={[
                                        styles.typeButtonText,
                                        inviteType === 'student' && styles.typeButtonTextActive,
                                    ]}
                                >
                                    Students
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    inviteType === 'teacher' && styles.typeButtonActive,
                                ]}
                                onPress={() => setInviteType('teacher')}
                            >
                                <Text
                                    style={[
                                        styles.typeButtonText,
                                        inviteType === 'teacher' && styles.typeButtonTextActive,
                                    ]}
                                >
                                    Teachers
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {inviteType === 'teacher' && !selectedEnrollment ? (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Teacher Email</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter teacher email"
                                placeholderTextColor={colors.mutedForeground}
                                value={inviteEmail}
                                onChangeText={setInviteEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    ) : (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Section</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g., A or B"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={inviteSection}
                                    onChangeText={setInviteSection}
                                    autoCapitalize="characters"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Start Student ID</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g., 1801001"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={inviteStartId}
                                    onChangeText={setInviteStartId}
                                    keyboardType="number-pad"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>End Student ID</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g., 1801050"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={inviteEndId}
                                    onChangeText={setInviteEndId}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </>
                    )}

                    {selectedEnrollment ? (
                        <>
                            <Button onPress={handleUpdateEnrollment}>
                                Update Range
                            </Button>
                            <Button
                                onPress={handleDeleteEnrollment}
                                style={{ backgroundColor: colors.destructive, marginTop: 12 }}
                            >
                                Delete Range
                            </Button>
                        </>
                    ) : (
                        <Button onPress={handleInviteMembers}>
                            {inviteType === 'teacher' ? 'Send Invitation' : 'Enroll Students'}
                        </Button>
                    )}
                </ScrollView>
            </Modal>

            {/* Section Selection Modal */}
            <Modal
                visible={showSectionSelectModal}
                onClose={() => setShowSectionSelectModal(false)}
                title="Select Section"
                colors={colors}
                scrollable={false}
            >
                <View style={styles.sectionsList}>
                    {availableSections.map((section) => (
                        <TouchableOpacity
                            key={section}
                            style={styles.sectionButton}
                            onPress={() => handleSectionSelected(section)}
                        >
                            <Text style={styles.sectionButtonText}>Section {section}</Text>
                            <Text style={styles.sectionButtonArrow}>→</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>

            <ConfirmDialog
                visible={showDeleteCourseConfirm}
                title="Delete Course"
                message="Are you sure you want to delete this course? This action cannot be undone and all data will be lost."
                onConfirm={async () => {
                    setShowDeleteCourseConfirm(false);
                    if (!course || !user?.email) return;

                    try {
                        setLoading(true);
                        const { deleteCourse } = await import('@/services/course.service');
                        const success = await deleteCourse(course.id, user.email);

                        if (success) {
                            showAlertMessage('success', 'Success', 'Course deleted successfully!');
                            setTimeout(() => router.back(), 1500);
                        } else {
                            showAlertMessage('error', 'Error', 'Failed to delete course. Only the owner can delete.');
                        }
                    } catch (error) {
                        console.error('Error deleting course:', error);
                        showAlertMessage('error', 'Error', 'Failed to delete course');
                    } finally {
                        setLoading(false);
                    }
                }}
                onCancel={() => setShowDeleteCourseConfirm(false)}
                confirmText="Delete"
                destructive
            />

            <AlertDialog
                visible={showAlert}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setShowAlert(false)}
            />
        </Container>
    );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 10,
        gap: 4,
    },
    tabActive: {
        backgroundColor: colors.primary + '15',
    },
    tabText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.mutedForeground,
    },
    tabTextActive: {
        color: colors.primary,
    },
    // Modal styles
    infoCard: {
        backgroundColor: colors.card,
        padding: 16,
        marginBottom: 12,
        borderColor: colors.border,
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
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 12,
        marginTop: 8,
    },
    studentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    studentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    studentAvatarText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    studentName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    studentId: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    statusBadge: {
        fontSize: 13,
        fontWeight: '600',
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        backgroundColor: colors.background,
        borderRadius: 8,
        marginBottom: 16,
    },
    dateInput: {
        flex: 1,
        fontSize: 14,
        color: colors.foreground,
        padding: 0,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.background,
        borderRadius: 8,
        marginBottom: 8,
    },
    listItemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    listItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    listItemId: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    marksItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.background,
        borderRadius: 8,
        marginBottom: 8,
    },
    marksInfo: {
        flex: 1,
    },
    marksName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    marksId: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    marksInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusToggle: {
        width: 40,
        height: 32,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusToggleText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    marksInput: {
        width: 60,
        height: 32,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        paddingHorizontal: 8,
        fontSize: 14,
        color: colors.foreground,
        backgroundColor: colors.card,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 8,
    },
    inputDescription: {
        fontSize: 13,
        color: colors.mutedForeground,
        marginBottom: 12,
    },
    textInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: colors.foreground,
        backgroundColor: colors.background,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 12,
    },
    publishToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        marginTop: 8,
    },
    publishToggleText: {
        fontSize: 13,
        fontWeight: '600',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: colors.background,
    },
    menuItemText: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.foreground,
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    counterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
        minWidth: 60,
        textAlign: 'center',
    },
    typeToggle: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    typeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    typeButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    typeButtonTextActive: {
        color: colors.primaryForeground,
    },
    sectionsList: {
        gap: 12,
    },
    sectionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
    },
    sectionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
    },
    sectionButtonArrow: {
        fontSize: 20,
        color: colors.primary,
    },
    attendanceStatsBar: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    attendanceStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    attendanceStatValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    attendanceStatLabel: {
        fontSize: 10,
        color: colors.mutedForeground,
        fontWeight: '500',
    },
    attendanceStatDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.border,
    },
    attendanceGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
        gap: 6,
    },
    attendanceTile: {
        width: '14%',
        aspectRatio: 1,
        borderRadius: 8,
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    attendanceTileText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
});