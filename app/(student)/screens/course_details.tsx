import {
    AttendanceTab,
    CTTab,
    OverviewTab
} from '@/components/students/course-details';
import { Container } from '@/components/ui/container';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import {
    calculateAttendancePercentage,
    getCourseAttendance,
} from '@/services/attendance.service';
import {
    getCourseById,
    getEnrolledStudents,
} from '@/services/course.service';
import {
    getClassTestMarks,
    getCourseClassTests,
} from '@/services/ct.service';
import { AttendanceSession, ClassTest, Course, Mark, Student } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

type TabType = 'overview' | 'attendance' | 'ct';

export default function StudentCourseDetailScreen() {
    const { colors } = useTheme();
    const { session: { user } } = useAuth();
    const { courseId } = useLocalSearchParams<{ courseId: string }>();

    // State
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<Course | null>(null);
    const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
    const [classTests, setClassTests] = useState<ClassTest[]>([]);
    const [marks, setMarks] = useState<Record<string, Mark[]>>({});
    const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
    const [attendancePercentage, setAttendancePercentage] = useState(0);

    const styles = getStyles(colors);

    // Load data
    useEffect(() => {
        loadCourseData();
    }, [courseId]);

    const loadCourseData = async () => {
        try {
            setLoading(true);

            if (!courseId || typeof courseId !== 'string' || !user?.email) {
                console.error('Invalid course ID or user email');
                return;
            }

            // Load course
            const courseData = await getCourseById(courseId);
            if (!courseData) {
                console.error('Course not found');
                return;
            }
            setCourse(courseData);

            // Load current student info
            const students = await getEnrolledStudents(courseId);
            const student = students.find((s) => s.email === user.email);
            if (student) {
                setCurrentStudent(student);
            }

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

            // Load attendance percentage
            const percentage = await calculateAttendancePercentage(courseId, user.email);
            setAttendancePercentage(percentage);
        } catch (error) {
            console.error('Error loading course data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateAverageCTMarks = (): number => {
        if (!currentStudent) return 0;

        const studentMarks = classTests
            .map((ct) => {
                const ctMarks = marks[ct.id] || [];
                const mark = ctMarks.find((m) => m.studentEmail === currentStudent.email);
                return mark && mark.status === 'present' ? mark.marksObtained || 0 : null;
            })
            .filter((mark): mark is number => mark !== null);

        if (studentMarks.length === 0) return 0;

        // Apply best CT count if configured
        const sortedMarks = studentMarks.sort((a, b) => b - a);
        const marksToConsider = course?.bestCTCount
            ? sortedMarks.slice(0, course.bestCTCount)
            : sortedMarks;

        return marksToConsider.reduce((sum, mark) => sum + mark, 0) / marksToConsider.length;
    };

    if (loading) {
        return (
            <Container useSafeArea={false} style={styles.container}>
                <ScreenHeader
                    title="Course Details"
                    subtitle="Loading..."
                    showBack={true}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </Container>
        );
    }

    if (!course || !currentStudent) {
        return (
            <Container useSafeArea={false} style={styles.container}>
                <ScreenHeader
                    title="Course Details"
                    subtitle="Course not found"
                    showBack={true}
                />
            </Container>
        );
    }

    const totalClasses = attendanceSessions.length;
    const completedClasses = attendanceSessions.length;

    return (
        <Container useSafeArea={false} style={styles.container}>
            <ScreenHeader
                title={course.code}
                subtitle={course.name}
                showBack={true}
            />

            {/* Tabs */}
            <View style={styles.tabs}>
                {[
                    { key: 'overview', label: 'Overview', icon: 'grid' },
                    { key: 'attendance', label: 'Attendance', icon: 'checkmark-circle' },
                    { key: 'ct', label: 'CT Marks', icon: 'document-text' },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key as TabType)}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={20}
                            color={activeTab === tab.key ? colors.primary : colors.mutedForeground}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === tab.key && styles.tabTextActive,
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <OverviewTab
                    course={course}
                    currentStudent={currentStudent}
                    totalClasses={totalClasses}
                    completedClasses={completedClasses}
                    attendancePercentage={attendancePercentage}
                    averageCTMarks={calculateAverageCTMarks()}
                    colors={colors}
                />
            )}
            {activeTab === 'attendance' && (
                <AttendanceTab
                    sessions={attendanceSessions}
                    studentEmail={currentStudent.email}
                    attendancePercentage={attendancePercentage}
                    colors={colors}
                />
            )}
            {activeTab === 'ct' && (
                <CTTab
                    classTests={classTests}
                    marks={marks}
                    studentEmail={currentStudent.email}
                    bestCTCount={course.bestCTCount}
                    colors={colors}
                />
            )}
        </Container>
    );
}

const getStyles = (colors: ColorScheme) =>
    StyleSheet.create({
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
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
    });
