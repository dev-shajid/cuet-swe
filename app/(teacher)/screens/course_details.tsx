import {
    AttendanceTab,
    CTTab,
    OverviewTab,
    StudentsTab
} from '@/components/teachers/course-details';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Modal } from '@/components/ui/modal';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import {
    calculateAttendancePercentage,
    getCourseAttendance,
    takeAttendance,
} from '@/services/attendance.service';
import {
    addStudentIdRange,
    getCourseById,
    getEnrolledStudents,
    inviteTeacherToCourse,
    updateCourseInfo
} from '@/services/course.service';
import {
    batchUpdateMarks,
    createClassTest,
    getClassTestMarks,
    getCourseClassTests,
} from '@/services/ct.service';
import { AttendanceSession, AttendanceStatus, ClassTest, Course, Mark, MarkStatus, Student } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
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

    // Modals
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showCTModal, setShowCTModal] = useState(false);
    const [showCreateCTModal, setShowCreateCTModal] = useState(false);
    const [showEditCourseModal, setShowEditCourseModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showStudentProgressModal, setShowStudentProgressModal] = useState(false);
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
    const [bestCTCountInput, setBestCTCountInput] = useState<number | undefined>(undefined);

    // Edit course state
    const [editCourseName, setEditCourseName] = useState('');
    const [editBestCTCount, setEditBestCTCount] = useState<number | undefined>(undefined);

    // Invite members state
    const [inviteType, setInviteType] = useState<'teacher' | 'student'>('student');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteStartId, setInviteStartId] = useState('');
    const [inviteEndId, setInviteEndId] = useState('');

    const styles = getStyles(colors);

    // Load data
    useEffect(() => {
        loadCourseData();
    }, [courseId]);

    const loadCourseData = async () => {
        try {
            setLoading(true);

            if (!courseId || typeof courseId !== 'string') {
                console.error('Invalid course ID');
                return;
            }

            // Load course
            const courseData = await getCourseById(courseId);
            if (!courseData) {
                console.error('Course not found');
                return;
            }
            setCourse(courseData);
            setBestCTCountInput(courseData.bestCTCount);
            setEditCourseName(courseData.name);
            setEditBestCTCount(courseData.bestCTCount);

            // Load students
            const studentsData = await getEnrolledStudents(courseId);
            setStudents(studentsData);

            // Load class tests
            const classTestsData = await getCourseClassTests(courseId);
            setClassTests(classTestsData);

            // Load marks for each class test
            const marksData: Record<string, Mark[]> = {};
            for (const ct of classTestsData) {
                const ctMarks = await getClassTestMarks(ct.id);
                marksData[ct.id] = ctMarks;
            }
            setMarks(marksData);

            // Load attendance sessions
            const attendance = await getCourseAttendance(courseId);
            setAttendanceSessions(attendance);

            // Load attendance percentages for each student
            const percentages: Record<string, number> = {};
            for (const student of studentsData) {
                const percentage = await calculateAttendancePercentage(courseId, student.email);
                percentages[student.email] = percentage;
            }
            setStudentAttendancePercentages(percentages);
        } catch (error) {
            console.error('Error loading course data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTakeAttendance = (session?: AttendanceSession) => {
        if (session) {
            // Edit existing session
            setSelectedAttendanceSession(session);
            setAttendanceModalMode('edit');
            setSelectedDate(session.date.toDate().toISOString().split('T')[0]);
            const presentEmails = Object.entries(session.studentStatuses)
                .filter(([_, status]) => status === 'present')
                .map(([email]) => email);
            setAttendanceMarking(new Set(presentEmails));
        } else {
            // Create new session - mark all as present initially
            setSelectedAttendanceSession(null);
            setAttendanceModalMode('create');
            setSelectedDate(new Date().toISOString().split('T')[0]);
            setAttendanceMarking(new Set(students.map(s => s.email)));
        }
        setShowAttendanceModal(true);
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

        const success = await takeAttendance(
            course.id,
            new Date(selectedDate),
            user.email,
            studentStatuses
        );

        if (success) {
            await loadCourseData();
            setShowAttendanceModal(false);
            setSelectedAttendanceSession(null);
            setAttendanceModalMode('create');
        }
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

    const saveCTMarks = async () => {
        if (!selectedCT || !course) return;

        const marksToSave = students.map(student => ({
            studentEmail: student.email,
            studentId: student.studentId,
            status: ctMarksInput[student.email]?.status || 'present',
            marksObtained: ctMarksInput[student.email]?.status === 'present'
                ? ctMarksInput[student.email]?.marks
                : undefined,
        }));

        const success = await batchUpdateMarks(
            selectedCT.id,
            course.id,
            marksToSave
        );

        if (success) {
            const updatedMarks = await getClassTestMarks(selectedCT.id);
            setMarks({ ...marks, [selectedCT.id]: updatedMarks });
            setShowCTModal(false);
        }
    };

    const handleCreateCT = async () => {
        if (!newCTName.trim() || !newCTMaxMarks || !course || !user?.email) {
            return;
        }

        const maxMarks = parseInt(newCTMaxMarks);
        if (isNaN(maxMarks) || maxMarks <= 0) {
            return;
        }

        const newCT = await createClassTest(
            course.id,
            newCTName.trim(),
            maxMarks,
            user.email,
            undefined,
            newCTDescription.trim() || undefined
        );

        if (newCT) {
            setClassTests([...classTests, newCT]);
            setMarks({ ...marks, [newCT.id]: [] });
            setNewCTName('');
            setNewCTDescription('');
            setNewCTMaxMarks('20');
            setShowCreateCTModal(false);
        }
    };

    const handleEditCourse = () => {
        if (course) {
            setEditCourseName(course.name);
            setEditBestCTCount(course.bestCTCount);
            setShowEditCourseModal(true);
        }
    };

    const saveEditCourse = async () => {
        if (!course || !user?.email) return;

        const success = await updateCourseInfo(
            course.id,
            {
                name: editCourseName,
                bestCTCount: editBestCTCount,
            },
            user.email
        );

        if (success) {
            setCourse({
                ...course,
                name: editCourseName,
                bestCTCount: editBestCTCount,
            });
            setShowEditCourseModal(false);
            await loadCourseData();
        }
    };

    const handleInviteMembers = async () => {
        if (!course || !user) return;

        if (inviteType === 'teacher') {
            if (!inviteEmail.trim()) {
                alert('Please enter teacher email');
                return;
            }

            const success = await inviteTeacherToCourse(
                course.id,
                inviteEmail.trim(),
                user.email,
                user.name
            );

            if (success) {
                alert('Teacher invitation sent successfully');
                setShowInviteModal(false);
                setInviteEmail('');
            } else {
                alert('Failed to send invitation');
            }
        } else {
            // Student enrollment
            if (!inviteStartId.trim() || !inviteEndId.trim()) {
                alert('Please enter student ID range');
                return;
            }

            const startId = parseInt(inviteStartId);
            const endId = parseInt(inviteEndId);

            if (isNaN(startId) || isNaN(endId)) {
                alert('Invalid student ID range');
                return;
            }

            if (startId > endId) {
                alert('Start ID must be less than or equal to End ID');
                return;
            }

            const success = await addStudentIdRange(
                course.id,
                startId,
                endId,
                user.email
            );

            if (success) {
                alert('Students enrolled successfully');
                setShowInviteModal(false);
                setInviteStartId('');
                setInviteEndId('');
                await loadCourseData();
            } else {
                alert('Failed to enroll students');
            }
        }
    };

    const calculateStudentBestCTAverage = (studentEmail: string): number => {
        const studentMarks = Object.entries(marks)
            .flatMap(([_, ctMarks]) => ctMarks)
            .filter(mark => mark.studentEmail === studentEmail && mark.status === 'present' && mark.marksObtained !== undefined)
            .map(mark => mark.marksObtained!);

        if (studentMarks.length === 0) return 0;

        studentMarks.sort((a, b) => b - a);

        const marksToConsider = course?.bestCTCount
            ? studentMarks.slice(0, Math.min(course.bestCTCount, studentMarks.length))
            : studentMarks;

        return marksToConsider.reduce((a, b) => a + b, 0) / marksToConsider.length;
    };

    const calculateCTAverage = (ctId: string): number => {
        const ctMarks = marks[ctId] || [];
        const presentMarks = ctMarks.filter(m => m.status === 'present' && m.marksObtained !== undefined);

        if (presentMarks.length === 0) return 0;

        const sum = presentMarks.reduce((acc, m) => acc + (m.marksObtained || 0), 0);
        return sum / presentMarks.length;
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
                />
            )}
            {activeTab === 'attendance' && (
                <AttendanceTab
                    attendanceSessions={attendanceSessions}
                    colors={colors}
                    onTakeAttendance={() => handleTakeAttendance()}
                    onViewSession={(session) => {
                        setSelectedAttendanceSession(session);
                        setAttendanceModalMode('view');
                        setShowAttendanceModal(true);
                    }}
                />
            )}
            {activeTab === 'ct' && (
                <CTTab
                    classTests={classTests}
                    marks={marks}
                    colors={colors}
                    onCreateCT={() => setShowCreateCTModal(true)}
                    onAddMarks={(ct) => handleAddCTMarks(ct)}
                    calculateCTAverage={calculateCTAverage}
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
                    // View Mode
                    <>
                        <Card style={[styles.infoCard, { borderWidth: 1, marginBottom: 16 }]}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Date</Text>
                                <Text style={styles.infoValue}>
                                    {selectedAttendanceSession.date.toDate().toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </View>
                            <View style={[styles.infoRow, { marginTop: 8 }]}>
                                <Text style={styles.infoLabel}>Present</Text>
                                <Text style={[styles.infoValue, { color: colors.chart3 }]}>
                                    {Object.values(selectedAttendanceSession.studentStatuses).filter(s => s === 'present').length}
                                </Text>
                            </View>
                            <View style={[styles.infoRow, { marginTop: 8 }]}>
                                <Text style={styles.infoLabel}>Absent</Text>
                                <Text style={[styles.infoValue, { color: colors.destructive }]}>
                                    {Object.values(selectedAttendanceSession.studentStatuses).filter(s => s === 'absent').length}
                                </Text>
                            </View>
                        </Card>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={styles.modalSectionTitle}>Students</Text>
                            {students.map((stu) => {
                                const status = selectedAttendanceSession.studentStatuses[stu.email];
                                return (
                                    <Card key={stu.email} style={{ padding: 12, marginBottom: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                                        <View style={styles.studentRow}>
                                            <View style={styles.studentInfo}>
                                                <View style={styles.studentAvatar}>
                                                    <Text style={styles.studentAvatarText}>
                                                        {stu.name.split(' ').map(n => n[0]).join('')}
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.studentName}>{stu.name}</Text>
                                                    <Text style={styles.studentId}>{stu.studentId}</Text>
                                                </View>
                                            </View>
                                            <Text style={[
                                                styles.statusBadge,
                                                { color: status === 'present' ? colors.chart3 : colors.destructive }
                                            ]}>
                                                {status === 'present' ? 'Present' : 'Absent'}
                                            </Text>
                                        </View>
                                    </Card>
                                );
                            })}
                        </View>

                        <Button onPress={() => handleTakeAttendance(selectedAttendanceSession)}>
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

                    <Button onPress={handleCreateCT} style={{ marginTop: 16 }}>
                        Create CT
                    </Button>
                </ScrollView>
            </Modal>

            {/* Menu Modal */}
            <Modal
                visible={showMenuModal}
                onClose={() => setShowMenuModal(false)}
                title="Course Actions"
                colors={colors}
                maxHeight="40%"
            >
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                        setShowMenuModal(false);
                        handleEditCourse();
                    }}
                >
                    <Ionicons name="create-outline" size={20} color={colors.foreground} />
                    <Text style={styles.menuItemText}>Edit Course</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                        setShowMenuModal(false);
                        setShowInviteModal(true);
                    }}
                >
                    <Ionicons name="person-add-outline" size={20} color={colors.foreground} />
                    <Text style={styles.menuItemText}>Invite Members</Text>
                </TouchableOpacity>
            </Modal>

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
                        <Text style={styles.inputLabel}>Best CT Count</Text>
                        <Text style={styles.inputDescription}>
                            Select how many best CTs to count for final grade
                        </Text>
                        <View style={styles.counterContainer}>
                            <TouchableOpacity
                                style={styles.counterButton}
                                onPress={() => setEditBestCTCount(editBestCTCount ? Math.max(1, editBestCTCount - 1) : classTests.length)}
                            >
                                <Ionicons name="remove" size={24} color={colors.primary} />
                            </TouchableOpacity>
                            <Text style={styles.counterValue}>
                                {editBestCTCount || 'All'}
                            </Text>
                            <TouchableOpacity
                                style={styles.counterButton}
                                onPress={() => setEditBestCTCount((editBestCTCount || 0) + 1)}
                            >
                                <Ionicons name="add" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                        {editBestCTCount && (
                            <TouchableOpacity
                                style={{ alignSelf: 'center', marginTop: 8 }}
                                onPress={() => setEditBestCTCount(undefined)}
                            >
                                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                                    Reset to all CTs
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <Button onPress={saveEditCourse}>
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
                                        const total = attendanceSessions.length;
                                        const present = attendanceSessions.filter(s => s.studentStatuses[selectedStudent.email] === 'present').length;
                                        const percent = total > 0 ? Math.round((present / total) * 100) : 0;
                                        return `${present}/${total} (${percent}%)`;
                                    })()}
                                </Text>
                            </View>
                        </Card>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={styles.modalSectionTitle}>Class Tests</Text>
                            {classTests.map(ct => {
                                const ctMarks = marks[ct.id] || [];
                                const m = ctMarks.find(x => x.studentEmail === selectedStudent.email);
                                return (
                                    <Card key={ct.id} style={{ padding: 12, marginBottom: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>{ct.name}</Text>
                                            <Text style={styles.infoValue}>
                                                {m ? (m.status === 'present' && m.marksObtained !== undefined ? `${m.marksObtained}/${ct.totalMarks}` : m.status === 'absent' ? 'Absent' : '—') : '—'}
                                            </Text>
                                        </View>
                                    </Card>
                                );
                            })}
                        </View>
                    </ScrollView>
                )}
            </Modal>

            {/* Invite Members Modal */}
            <Modal
                visible={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                title="Invite Members"
                colors={colors}
                scrollable={false}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
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

                    {inviteType === 'teacher' ? (
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

                    <Button onPress={handleInviteMembers}>
                        {inviteType === 'teacher' ? 'Send Invitation' : 'Enroll Students'}
                    </Button>
                </ScrollView>
            </Modal>
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
});