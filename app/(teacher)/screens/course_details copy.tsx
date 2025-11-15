import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    TextInput as RNTextInput,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

// Types
interface CourseSettings {
    id: string;
    name: string;
    code: string;
    section: string;
    semester: string;
    credits: number;
    totalClasses: number;
    completedClasses: number;
}

interface Student {
    id: string;
    name: string;
    studentId: string;
    email: string;
    attendance: number;
    ctMarks: Record<string, number>;
}

interface AttendanceRecord {
    id: string;
    date: string;
    time: string;
    presentCount: number;
    absentCount: number;
}

interface CTConfig {
    bestCTsToCount: number;
}

type TabType = 'overview' | 'attendance' | 'cts' | 'students' | 'settings';

// Attendance Modal Component
const AttendanceModal: React.FC<{
    visible: boolean;
    students: Student[];
    onClose: () => void;
    onSave: (present: string[]) => void;
    colors: ColorScheme;
}> = ({ visible, students, onClose, onSave, colors }) => {
    const [attendance, setAttendance] = useState<Set<string>>(
        new Set(students.map(s => s.id))
    );
    const styles = getStyles(colors);

    const toggleAttendance = (studentId: string) => {
        const newSet = new Set(attendance);
        if (newSet.has(studentId)) {
            newSet.delete(studentId);
        } else {
            newSet.add(studentId);
        }
        setAttendance(newSet);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Mark Attendance</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.foreground} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.attendanceSummary}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Present:</Text>
                            <Text style={[styles.summaryValue, { color: colors.chart3 }]}>
                                {attendance.size}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Absent:</Text>
                            <Text style={[styles.summaryValue, { color: colors.destructive }]}>
                                {students.length - attendance.size}
                            </Text>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {students.map((student) => {
                            const isPresent = attendance.has(student.id);
                            return (
                                <TouchableOpacity
                                    key={student.id}
                                    style={[
                                        styles.attendanceRow,
                                        isPresent && { backgroundColor: colors.chart3 + '10' },
                                    ]}
                                    onPress={() => toggleAttendance(student.id)}
                                >
                                    <View style={styles.attendanceRowLeft}>
                                        <View
                                            style={[
                                                styles.checkbox,
                                                isPresent && {
                                                    backgroundColor: colors.chart3,
                                                    borderColor: colors.chart3,
                                                },
                                            ]}
                                        >
                                            {isPresent && (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={16}
                                                    color={colors.card}
                                                />
                                            )}
                                        </View>
                                        <View>
                                            <Text style={styles.attendanceRowName}>
                                                {student.name}
                                            </Text>
                                            <Text style={styles.attendanceRowId}>
                                                {student.studentId}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text
                                        style={[
                                            styles.attendanceStatus,
                                            {
                                                color: isPresent
                                                    ? colors.chart3
                                                    : colors.destructive,
                                            },
                                        ]}
                                    >
                                        {isPresent ? 'Present' : 'Absent'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <Button
                            variant="outline"
                            onPress={onClose}
                            style={{ flex: 1 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onPress={() => {
                                onSave(Array.from(attendance));
                                onClose();
                            }}
                            style={{ flex: 1 }}
                        >
                            Save Attendance
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Main Screen
export default function TeacherCourseDetailScreen() {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [inviteType, setInviteType] = useState<'teacher' | 'student'>('student');
    const [inviteInput, setInviteInput] = useState('');

    // Mock Data
    const [course, setCourse] = useState<CourseSettings>({
        id: '1',
        name: 'Data Structures and Algorithms',
        code: 'CSE 201',
        section: 'A',
        semester: 'Spring 2025',
        credits: 3,
        totalClasses: 28,
        completedClasses: 18,
    });

    const [students, setStudents] = useState<Student[]>([
        {
            id: '1',
            name: 'Ahmed Hassan',
            studentId: '2101001',
            email: 'ahmed@cuet.ac.bd',
            attendance: 85,
            ctMarks: { ct1: 18, ct2: 15, ct3: 20 },
        },
        {
            id: '2',
            name: 'Fatima Rahman',
            studentId: '2101002',
            email: 'fatima@cuet.ac.bd',
            attendance: 92,
            ctMarks: { ct1: 20, ct2: 19, ct3: 18 },
        },
        {
            id: '3',
            name: 'Mohammad Ali',
            studentId: '2101003',
            email: 'mohammad@cuet.ac.bd',
            attendance: 78,
            ctMarks: { ct1: 14, ct2: 16, ct3: 17 },
        },
    ]);

    const [attendance, setAttendance] = useState<AttendanceRecord[]>([
        {
            id: '1',
            date: '2025-11-10',
            time: '09:00 AM',
            presentCount: 28,
            absentCount: 2,
        },
        {
            id: '2',
            date: '2025-11-08',
            time: '10:30 AM',
            presentCount: 29,
            absentCount: 1,
        },
    ]);

    const [cts, setCTs] = useState<string[]>(['CT 1', 'CT 2', 'CT 3']);
    const [ctConfig, setCtConfig] = useState<CTConfig>({ bestCTsToCount: 3 });

    const styles = getStyles(colors);

    // Handlers
    const handleSaveAttendance = (presentStudents: string[]) => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

        const newRecord: AttendanceRecord = {
            id: String(attendance.length + 1),
            date,
            time,
            presentCount: presentStudents.length,
            absentCount: students.length - presentStudents.length,
        };

        setAttendance([newRecord, ...attendance]);
        Alert.alert('Success', 'Attendance saved successfully');
    };

    const handleAddCT = () => {
        const newCtName = `CT ${cts.length + 1}`;
        setCTs([...cts, newCtName]);
        Alert.alert('Success', `${newCtName} added successfully`);
    };

    const handleInviteMembers = () => {
        if (!inviteInput.trim()) {
            Alert.alert('Error', 'Please enter valid input');
            return;
        }

        if (inviteType === 'student') {
            Alert.alert('Success', `Students ${inviteInput} invited successfully`);
        } else {
            Alert.alert('Success', `Teacher ${inviteInput} invited successfully`);
        }
        setInviteInput('');
        setShowInviteModal(false);
    };

    const handleExportResults = () => {
        Alert.alert('Success', 'Results exported as Excel sheet');
    };

    // Render functions
    const renderOverview = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Course Stats */}
            <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                    <Text style={styles.statLabel}>Students</Text>
                    <Text style={styles.statValue}>{students.length}</Text>
                </Card>
                <Card style={styles.statCard}>
                    <Text style={styles.statLabel}>Classes</Text>
                    <Text style={styles.statValue}>
                        {course.completedClasses}/{course.totalClasses}
                    </Text>
                </Card>
                <Card style={styles.statCard}>
                    <Text style={styles.statLabel}>Credits</Text>
                    <Text style={styles.statValue}>{course.credits}</Text>
                </Card>
                <Card style={styles.statCard}>
                    <Text style={styles.statLabel}>CTs</Text>
                    <Text style={styles.statValue}>{cts.length}</Text>
                </Card>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <Button
                    onPress={() => setShowAttendanceModal(true)}
                    style={styles.actionButton}
                    variant="outline"
                >
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    <Text style={{ color: colors.primary, marginLeft: 8 }}>
                        Take Attendance
                    </Text>
                </Button>

                <Button
                    onPress={handleAddCT}
                    style={[styles.actionButton, { marginTop: 12 }]}
                    variant="outline"
                >
                    <Ionicons name="add-circle" size={20} color={colors.primary} />
                    <Text style={{ color: colors.primary, marginLeft: 8 }}>
                        Add New CT
                    </Text>
                </Button>

                <Button
                    onPress={() => setShowInviteModal(true)}
                    style={[styles.actionButton, { marginTop: 12 }]}
                    variant="outline"
                >
                    <Ionicons name="person-add" size={20} color={colors.primary} />
                    <Text style={{ color: colors.primary, marginLeft: 8 }}>
                        Invite Members
                    </Text>
                </Button>
            </View>
        </ScrollView>
    );

    const renderAttendance = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Attendance Records</Text>
                    <Button
                        onPress={() => setShowAttendanceModal(true)}
                        size="sm"
                    >
                        <Ionicons name="add" size={18} color={colors.primaryForeground} />
                    </Button>
                </View>

                {attendance.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Ionicons name="calendar-outline" size={32} color={colors.mutedForeground} />
                        <Text style={styles.emptyText}>No attendance records yet</Text>
                    </Card>
                ) : (
                    attendance.map((record) => (
                        <TouchableOpacity key={record.id} style={styles.attendanceRecordCard}>
                            <Card style={styles.cardContent}>
                                <View style={styles.attendanceRecordHeader}>
                                    <View>
                                        <Text style={styles.attendanceRecordDate}>
                                            {new Date(record.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </Text>
                                        <Text style={styles.attendanceRecordTime}>
                                            {record.time}
                                        </Text>
                                    </View>
                                    <View style={styles.attendanceRecordStats}>
                                        <View style={styles.statPill}>
                                            <Text style={[styles.statPillText, { color: colors.chart3 }]}>
                                                ✓ {record.presentCount}
                                            </Text>
                                        </View>
                                        <View style={styles.statPill}>
                                            <Text style={[styles.statPillText, { color: colors.destructive }]}>
                                                ✕ {record.absentCount}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.editButton}>
                                    <Ionicons name="pencil" size={16} color={colors.primary} />
                                    <Text style={[styles.editButtonText, { color: colors.primary }]}>
                                        Edit
                                    </Text>
                                </TouchableOpacity>
                            </Card>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </ScrollView>
    );

    const renderCTs = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Class Tests ({cts.length})</Text>
                    <Button
                        onPress={handleAddCT}
                        size="sm"
                    >
                        <Ionicons name="add" size={18} color={colors.primaryForeground} />
                    </Button>
                </View>

                <Card style={styles.configCard}>
                    <View style={styles.configRow}>
                        <View>
                            <Text style={styles.configLabel}>
                                Best CTs to Count
                            </Text>
                            <Text style={styles.configDescription}>
                                Select how many best CT marks to use for grading
                            </Text>
                        </View>
                        <View style={styles.configSelector}>
                            <TouchableOpacity
                                onPress={() =>
                                    setCtConfig({
                                        bestCTsToCount: Math.max(
                                            1,
                                            ctConfig.bestCTsToCount - 1
                                        ),
                                    })
                                }
                            >
                                <Ionicons name="remove" size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <Text style={styles.configValue}>
                                {ctConfig.bestCTsToCount}
                            </Text>
                            <TouchableOpacity
                                onPress={() =>
                                    setCtConfig({
                                        bestCTsToCount: Math.min(
                                            cts.length,
                                            ctConfig.bestCTsToCount + 1
                                        ),
                                    })
                                }
                            >
                                <Ionicons name="add" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Card>

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Tests List</Text>
                {cts.map((ct, index) => (
                    <Card key={index} style={styles.ctListItem}>
                        <View style={styles.ctListItemContent}>
                            <View
                                style={[
                                    styles.ctNumber,
                                    { backgroundColor: colors.primary + '20' },
                                ]}
                            >
                                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                                    {index + 1}
                                </Text>
                            </View>
                            <Text style={styles.ctName}>{ct}</Text>
                        </View>
                        <TouchableOpacity>
                            <Ionicons name="ellipsis-horizontal" size={20} color={colors.mutedForeground} />
                        </TouchableOpacity>
                    </Card>
                ))}
            </View>
        </ScrollView>
    );

    const renderStudents = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Students ({students.length})</Text>
                    <Button
                        onPress={handleExportResults}
                        size="sm"
                    >
                        <Ionicons name="download" size={18} color={colors.primaryForeground} />
                    </Button>
                </View>

                {students.map((student) => (
                    <TouchableOpacity
                        key={student.id}
                        onPress={() => {
                            setSelectedStudent(student);
                            setShowStudentDetailsModal(true);
                        }}
                    >
                        <Card style={styles.studentCard}>
                            <View style={styles.studentCardLeft}>
                                <View
                                    style={[
                                        styles.studentAvatar,
                                        { backgroundColor: colors.primary + '20' },
                                    ]}
                                >
                                    <Text style={styles.studentAvatarText}>
                                        {student.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.studentName}>{student.name}</Text>
                                    <Text style={styles.studentId}>{student.studentId}</Text>
                                </View>
                            </View>
                            <View style={styles.studentCardRight}>
                                <View style={styles.badge}>
                                    <Text style={[styles.badgeText, { color: colors.chart3 }]}>
                                        {student.attendance}%
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color={colors.mutedForeground}
                                />
                            </View>
                        </Card>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );

    const renderSettings = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Course Information</Text>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Course Name</Text>
                    <Card style={styles.settingValueCard}>
                        <Text style={styles.settingValue}>{course.name}</Text>
                        <TouchableOpacity>
                            <Ionicons name="pencil" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    </Card>
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Course Code</Text>
                    <Card style={styles.settingValueCard}>
                        <Text style={styles.settingValue}>{course.code}</Text>
                        <TouchableOpacity>
                            <Ionicons name="pencil" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    </Card>
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Section</Text>
                    <Card style={styles.settingValueCard}>
                        <Text style={styles.settingValue}>{course.section}</Text>
                        <TouchableOpacity>
                            <Ionicons name="pencil" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    </Card>
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Credits</Text>
                    <Card style={styles.settingValueCard}>
                        <Text style={styles.settingValue}>{course.credits}</Text>
                        <TouchableOpacity>
                            <Ionicons name="pencil" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    </Card>
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Total Classes</Text>
                    <Card style={styles.settingValueCard}>
                        <Text style={styles.settingValue}>{course.totalClasses}</Text>
                        <TouchableOpacity>
                            <Ionicons name="pencil" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    </Card>
                </View>
            </View>
        </ScrollView>
    );


    // Tab Configuration
    const tabs = [
        { key: 'overview', label: 'Overview', icon: 'grid' },
        { key: 'attendance', label: 'Attendance', icon: 'checkmark-circle' },
        { key: 'cts', label: 'CTs', icon: 'document-text' },
        { key: 'students', label: 'Students', icon: 'people' },
        { key: 'settings', label: 'Settings', icon: 'settings' },
    ];

    return (
        <Container useSafeArea={false} style={styles.container}>
            <ScreenHeader
                title={course.code}
                subtitle={`${course.name}`}
                showBack={true}
            />

            {/* Tabs */}

                <View style={styles.tabBarContainer}>
                    <View style={styles.tabBar}>
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[
                                    styles.tabBarItem,
                                    activeTab === tab.key && styles.tabBarItemActive,
                                ]}
                                onPress={() => setActiveTab(tab.key as TabType)}
                            >
                                <Ionicons
                                    name={tab.icon as any}
                                    size={22}
                                    color={
                                        activeTab === tab.key
                                            ? colors.primary
                                            : colors.mutedForeground
                                    }
                                />
                                <Text
                                    style={[
                                        styles.tabLabel,
                                        activeTab === tab.key && styles.tabLabelActive,
                                    ]}
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>


            {/* Content */}
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'attendance' && renderAttendance()}
            {activeTab === 'cts' && renderCTs()}
            {activeTab === 'students' && renderStudents()}
            {activeTab === 'settings' && renderSettings()}

            {/* Attendance Modal */}
            <AttendanceModal
                visible={showAttendanceModal}
                students={students}
                onClose={() => setShowAttendanceModal(false)}
                onSave={handleSaveAttendance}
                colors={colors}
            />

            {/* Student Details Modal */}
            <Modal
                visible={showStudentDetailsModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowStudentDetailsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Student Details</Text>
                            <TouchableOpacity onPress={() => setShowStudentDetailsModal(false)}>
                                <Ionicons name="close" size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        {selectedStudent && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Card style={styles.studentDetailCard}>
                                    <View
                                        style={[
                                            styles.studentDetailAvatar,
                                            { backgroundColor: colors.primary + '20' },
                                        ]}
                                    >
                                        <Text style={styles.studentDetailAvatarText}>
                                            {selectedStudent.name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')}
                                        </Text>
                                    </View>
                                    <Text style={styles.studentDetailName}>
                                        {selectedStudent.name}
                                    </Text>
                                    <Text style={styles.studentDetailId}>
                                        {selectedStudent.studentId}
                                    </Text>
                                </Card>

                                <Card style={styles.detailSection}>
                                    <Text style={styles.detailSectionTitle}>Attendance</Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Overall Attendance</Text>
                                        <Text
                                            style={[
                                                styles.detailValue,
                                                { color: colors.chart3 },
                                            ]}
                                        >
                                            {selectedStudent.attendance}%
                                        </Text>
                                    </View>
                                </Card>

                                <Card style={styles.detailSection}>
                                    <Text style={styles.detailSectionTitle}>CT Marks</Text>
                                    {cts.map((ct, index) => (
                                        <View key={index} style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{ct}</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedStudent.ctMarks[`ct${index + 1}`] || 'N/A'}
                                            </Text>
                                        </View>
                                    ))}
                                </Card>

                                <Button
                                    onPress={() => setShowStudentDetailsModal(false)}
                                    style={{ marginTop: 16 }}
                                >
                                    Close
                                </Button>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Invite Members Modal */}
            <Modal
                visible={showInviteModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowInviteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Invite Members</Text>
                            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                                <Ionicons name="close" size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    inviteType === 'teacher' && styles.typeButtonActive,
                                ]}
                                onPress={() => setInviteType('teacher')}
                            >
                                <Ionicons name="person" size={18} color={colors.foreground} />
                                <Text style={styles.typeButtonText}>Teacher</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    inviteType === 'student' && styles.typeButtonActive,
                                ]}
                                onPress={() => setInviteType('student')}
                            >
                                <Ionicons name="people" size={18} color={colors.foreground} />
                                <Text style={styles.typeButtonText}>Students</Text>
                            </TouchableOpacity>
                        </View>

                        {inviteType === 'teacher' ? (
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Teacher Email</Text>
                                <RNTextInput
                                    style={styles.input}
                                    placeholder="teacher@university.ac.bd"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={inviteInput}
                                    onChangeText={setInviteInput}
                                />
                            </View>
                        ) : (
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Student ID Range</Text>
                                <Text style={styles.inputHint}>e.g., 2104001-2104050</Text>
                                <RNTextInput
                                    style={styles.input}
                                    placeholder="e.g., 2104001-2104050"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={inviteInput}
                                    onChangeText={setInviteInput}
                                />
                            </View>
                        )}

                        <Button
                            onPress={handleInviteMembers}
                            style={{ marginTop: 16 }}
                        >
                            Send Invitation
                        </Button>
                    </View>
                </View>
            </Modal>
        </Container>
    );
}

const getStyles = (colors: ColorScheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        tabBarContainer: {
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        tabBar: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingVertical: 12,
        },
        tabBarItem: {
            alignItems: 'center',
            gap: 4,
        },
        tabBarItemActive: {},
        tabLabel: {
            fontSize: 10,
            color: colors.mutedForeground,
            fontWeight: '500',
        },
        tabLabelActive: {
            color: colors.primary,
            fontWeight: '600',
        },
        tabContent: {
            flex: 1,
            padding: 16,
        },
        section: {
            marginBottom: 24,
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
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
            flex: 1,
            minWidth: '47%',
            padding: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        statLabel: {
            fontSize: 12,
            color: colors.mutedForeground,
            marginBottom: 8,
        },
        statValue: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.primary,
        },
        actionButton: {
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        emptyCard: {
            padding: 32,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        emptyText: {
            fontSize: 14,
            color: colors.mutedForeground,
            marginTop: 12,
        },
        attendanceRecordCard: {
            marginBottom: 12,
        },
        cardContent: {
            padding: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        attendanceRecordHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        attendanceRecordDate: {
            fontSize: 15,
            fontWeight: '700',
            color: colors.foreground,
        },
        attendanceRecordTime: {
            fontSize: 12,
            color: colors.mutedForeground,
            marginTop: 2,
        },
        attendanceRecordStats: {
            flexDirection: 'row',
            gap: 12,
        },
        statPill: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: colors.background,
        },
        statPillText: {
            fontSize: 13,
            fontWeight: '600',
        },
        editButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: colors.primary + '10',
            alignSelf: 'flex-start',
            gap: 6,
        },
        editButtonText: {
            fontSize: 12,
            fontWeight: '600',
        },
        configCard: {
            padding: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        configRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        configLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
        },
        configDescription: {
            fontSize: 12,
            color: colors.mutedForeground,
            marginTop: 4,
        },
        configSelector: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        configValue: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.primary,
            minWidth: 40,
            textAlign: 'center',
        },
        ctListItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            marginBottom: 12,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        ctListItemContent: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            flex: 1,
        },
        ctNumber: {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
        },
        ctName: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.foreground,
        },
        studentCard: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            marginBottom: 12,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        studentCardLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            flex: 1,
        },
        studentCardRight: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        studentAvatar: {
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
        },
        studentAvatarText: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.primary,
        },
        studentName: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.foreground,
        },
        studentId: {
            fontSize: 12,
            color: colors.mutedForeground,
            marginTop: 2,
        },
        badge: {
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: colors.chart3 + '20',
        },
        badgeText: {
            fontSize: 13,
            fontWeight: '700',
        },
        settingItem: {
            marginBottom: 16,
        },
        settingLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 8,
        },
        settingValueCard: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        settingValue: {
            fontSize: 14,
            color: colors.foreground,
            fontWeight: '500',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingBottom: 40,
            maxHeight: '85%',
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            marginBottom: 20,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.foreground,
        },
        attendanceSummary: {
            flexDirection: 'row',
            gap: 12,
            marginBottom: 20,
        },
        summaryItem: {
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 12,
            backgroundColor: colors.background,
            borderRadius: 8,
        },
        summaryLabel: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.mutedForeground,
        },
        summaryValue: {
            fontSize: 18,
            fontWeight: '700',
        },
        attendanceRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 8,
            marginBottom: 10,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
        },
        attendanceRowLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            flex: 1,
        },
        checkbox: {
            width: 28,
            height: 28,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
        },
        attendanceRowName: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
        },
        attendanceRowId: {
            fontSize: 12,
            color: colors.mutedForeground,
            marginTop: 2,
        },
        attendanceStatus: {
            fontSize: 12,
            fontWeight: '700',
        },
        modalActions: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 20,
        },
        typeSelector: {
            flexDirection: 'row',
            gap: 12,
            marginBottom: 20,
        },
        typeButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: colors.background,
            borderWidth: 2,
            borderColor: colors.border,
            gap: 8,
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
        inputContainer: {
            marginBottom: 20,
        },
        inputLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 8,
        },
        inputHint: {
            fontSize: 12,
            color: colors.mutedForeground,
            marginBottom: 8,
        },
        input: {
            width: '100%',
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: colors.foreground,
            backgroundColor: colors.background,
            borderWidth: 2,
            borderColor: colors.border,
            borderRadius: 8,
        },
        studentDetailCard: {
            alignItems: 'center',
            padding: 20,
            marginBottom: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        studentDetailAvatar: {
            width: 80,
            height: 80,
            borderRadius: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
        },
        studentDetailAvatarText: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.primary,
        },
        studentDetailName: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.foreground,
            marginBottom: 4,
        },
        studentDetailId: {
            fontSize: 14,
            color: colors.mutedForeground,
        },
        detailSection: {
            padding: 16,
            marginBottom: 12,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        detailSectionTitle: {
            fontSize: 15,
            fontWeight: '700',
            color: colors.foreground,
            marginBottom: 12,
        },
        detailRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        detailLabel: {
            fontSize: 13,
            color: colors.mutedForeground,
        },
        detailValue: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.foreground,
        },
    });