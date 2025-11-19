import { AttendanceSession, ClassTest, Course, Mark, Student, StudentEnrollment, TeacherMembership } from '@/types';
import { Timestamp } from 'firebase/firestore';

// ========================================================================
// COURSE DATA
// ========================================================================

export const mockCourse: Course = {
    id: 'course-cse100',
    name: 'Introduction to Programming',
    code: 'CSE-100',
    ownerEmail: 'prof.rahman@cuet.ac.bd',
    credit: 3.0,
    bestCTCount: 3, // Best 3 out of all CTs will be counted
    createdAt: Timestamp.fromDate(new Date('2024-09-01')),
};

// ========================================================================
// TEACHER MEMBERSHIPS
// ========================================================================

export const mockTeacherMemberships: TeacherMembership[] = [
    {
        id: 'teacher-1',
        teacherEmail: 'prof.rahman@cuet.ac.bd',
        courseId: 'course-cse100',
        role: 'owner',
        isActive: true,
        joinedAt: Timestamp.fromDate(new Date('2024-09-01')),
    },
    {
        id: 'teacher-2',
        teacherEmail: 'dr.ahmed@cuet.ac.bd',
        courseId: 'course-cse100',
        role: 'teacher',
        isActive: true,
        joinedAt: Timestamp.fromDate(new Date('2024-09-05')),
    },
];

// ========================================================================
// STUDENT ENROLLMENTS (ID RANGES)
// ========================================================================

export const mockStudentEnrollments: StudentEnrollment[] = [
    {
        id: 'enrollment-section-a',
        courseId: 'course-cse100',
        startId: 1,
        endId: 70,
        section: 'A',
        addedBy: 'prof.rahman@cuet.ac.bd',
        createdAt: Timestamp.fromDate(new Date('2024-09-01')),
    },
    {
        id: 'enrollment-section-b',
        courseId: 'course-cse100',
        startId: 71,
        endId: 140,
        section: 'B',
        addedBy: 'prof.rahman@cuet.ac.bd',
        createdAt: Timestamp.fromDate(new Date('2024-09-01')),
    },
];

// ========================================================================
// STUDENTS DATA (Section A: 1-70, Section B: 71-140)
// ========================================================================

const firstNames = [
    'Ahmed', 'Fatima', 'Rashid', 'Ayesha', 'Karim', 'Zara', 'Hassan', 'Nadia',
    'Ibrahim', 'Saima', 'Omar', 'Mariam', 'Yusuf', 'Laila', 'Tariq', 'Hana',
    'Bilal', 'Amina', 'Farhan', 'Sofia', 'Imran', 'Zainab', 'Arif', 'Noor',
    'Nasir', 'Rania', 'Salman', 'Dina', 'Waqar', 'Aisha', 'Hamza', 'Sana',
    'Faisal', 'Yasmin', 'Asad', 'Lubna', 'Rizwan', 'Maha', 'Kamran', 'Hira',
    'Naveed', 'Aliya', 'Shahid', 'Rabia', 'Zubair'
];

const lastNames = [
    'Khan', 'Ali', 'Hussain', 'Rahman', 'Ahmed', 'Hasan', 'Mahmud', 'Alam',
    'Islam', 'Chowdhury', 'Siddique', 'Karim', 'Malik', 'Aziz', 'Farooq'
];

export const mockStudents: Student[] = Array.from({ length: 140 }, (_, i) => {
    const studentId = i + 1;
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / 3) % lastNames.length];
    const section = studentId <= 70 ? 'A' : 'B'; // Section A: 1-70, Section B: 71-140

    return {
        email: `student${studentId}@cuet.ac.bd`,
        name: `${firstName} ${lastName}`,
        image: '',
        role: 'student',
        batch: '2024',
        department: 'CSE',
        studentId: studentId,
        section: section,
        createdAt: Timestamp.fromDate(new Date('2024-08-15')),
    };
});

// ========================================================================
// CLASS TESTS DATA
// ========================================================================

export const mockClassTests: ClassTest[] = [
    {
        id: 'ct-1',
        courseId: 'course-cse100',
        name: 'CT 1: Variables & Data Types',
        description: 'Basic concepts of programming - variables, data types, and operators',
        date: Timestamp.fromDate(new Date('2024-09-20')),
        totalMarks: 20,
        isPublished: true,
        createdBy: 'prof.rahman@cuet.ac.bd',
        createdAt: Timestamp.fromDate(new Date('2024-09-15')),
    },
    {
        id: 'ct-2',
        courseId: 'course-cse100',
        name: 'CT 2: Control Structures',
        description: 'If-else statements, loops, and switch cases',
        date: Timestamp.fromDate(new Date('2024-10-10')),
        totalMarks: 25,
        isPublished: true,
        createdBy: 'prof.rahman@cuet.ac.bd',
        createdAt: Timestamp.fromDate(new Date('2024-10-05')),
    },
    {
        id: 'ct-3',
        courseId: 'course-cse100',
        name: 'CT 3: Functions & Arrays',
        description: 'Function definitions, parameters, return values, and array manipulation',
        date: Timestamp.fromDate(new Date('2024-10-28')),
        totalMarks: 30,
        isPublished: true,
        createdBy: 'dr.ahmed@cuet.ac.bd',
        createdAt: Timestamp.fromDate(new Date('2024-10-22')),
    },
    {
        id: 'ct-4',
        courseId: 'course-cse100',
        name: 'CT 4: Pointers & Memory',
        description: 'Pointer basics, dynamic memory allocation, and memory management',
        date: Timestamp.fromDate(new Date('2024-11-15')),
        totalMarks: 25,
        isPublished: false,
        createdBy: 'prof.rahman@cuet.ac.bd',
        createdAt: Timestamp.fromDate(new Date('2024-11-10')),
    },
];

// ========================================================================
// MARKS DATA (for each CT)
// ========================================================================

// Helper function to generate realistic marks with some variation
const generateMarks = (ctId: string, totalMarks: number, ctIndex: number): Mark[] => {
    return mockStudents.map((student, index) => {
        // Simulate some students performing better/worse in different CTs
        const performanceVariation = Math.sin(index * 0.5 + ctIndex) * 0.15; // -0.15 to +0.15
        const basePerformance = 0.65 + performanceVariation; // 50% to 80% range

        // 5% chance of being absent
        const isAbsent = Math.random() < 0.05;

        // Some students are consistently good/bad
        const studentConsistency = (index % 7) * 0.05; // 0 to 0.3
        const finalPerformance = Math.min(0.95, basePerformance + studentConsistency);

        const marksObtained = isAbsent
            ? undefined
            : Math.round(totalMarks * finalPerformance + (Math.random() - 0.5) * 4);

        return {
            id: student.email,
            courseId: 'course-cse100',
            ctId: ctId,
            studentId: student.studentId,
            studentEmail: student.email,
            marksObtained: marksObtained,
            status: isAbsent ? 'absent' : 'present',
            feedback: isAbsent ? undefined :
                (marksObtained! >= totalMarks * 0.8 ? 'Excellent work!' :
                    marksObtained! >= totalMarks * 0.6 ? 'Good effort!' :
                        'Need improvement'),
            createdAt: Timestamp.fromDate(new Date('2024-09-20')),
            updatedAt: Timestamp.fromDate(new Date('2024-09-20')),
        };
    });
};

export const mockMarks: Record<string, Mark[]> = {
    'ct-1': generateMarks('ct-1', 20, 0),
    'ct-2': generateMarks('ct-2', 25, 1),
    'ct-3': generateMarks('ct-3', 30, 2),
    'ct-4': generateMarks('ct-4', 25, 3),
};

// ========================================================================
// ATTENDANCE SESSIONS DATA
// ========================================================================

// Generate attendance for both sections over the semester
const generateAttendanceSessions = (): AttendanceSession[] => {
    const sessions: AttendanceSession[] = [];
    const startDate = new Date('2024-09-02');
    const sections = ['A', 'B'];

    // Generate sessions for Sundays, Tuesdays, and Thursdays for each section
    sections.forEach(section => {
        const sectionStudents = mockStudents.filter(s => s.section === section);

        for (let i = 0; i < 24; i++) {
            const sessionDate = new Date(startDate);

            // Calculate days to add based on class schedule (3 classes per week)
            const weeksElapsed = Math.floor(i / 3);
            const dayInWeek = i % 3;
            const daysToAdd = weeksElapsed * 7 + (dayInWeek === 0 ? 0 : dayInWeek === 1 ? 2 : 4);

            sessionDate.setDate(startDate.getDate() + daysToAdd);

            // Generate student attendance with realistic patterns
            const studentStatuses: Record<string, 'present' | 'absent'> = {};

            sectionStudents.forEach((student, index) => {
                // Each student has a base attendance rate between 70% and 95%
                const baseAttendanceRate = 0.70 + (index % 10) * 0.025;

                // Random fluctuation for each session
                const randomFactor = Math.random();

                // Some students have patterns (e.g., miss classes after midterms)
                const sessionFactor = i > 12 && i < 16 ? 0.85 : 1; // Dip during midterm period

                const isPresent = randomFactor < (baseAttendanceRate * sessionFactor);
                studentStatuses[student.email] = isPresent ? 'present' : 'absent';
            });

            sessions.push({
                id: `attendance-section-${section.toLowerCase()}-${i + 1}`,
                courseId: 'course-cse100',
                section: section,
                date: Timestamp.fromDate(sessionDate),
                teacherId: i % 3 === 0 ? 'prof.rahman@cuet.ac.bd' : 'dr.ahmed@cuet.ac.bd',
                studentStatuses,
                notes: i === 0 ? `First class - Introduction to course (Section ${section})` :
                    i === 12 ? `Mid-term review session (Section ${section})` :
                        i === 23 ? `Final review session (Section ${section})` :
                            undefined,
            });
        }
    });

    // Sort by date
    return sessions.sort((a, b) => a.date.toMillis() - b.date.toMillis());
};

export const mockAttendanceSessions: AttendanceSession[] = generateAttendanceSessions();

// ========================================================================
// HELPER FUNCTIONS FOR CALCULATIONS
// ========================================================================

/**
 * Calculate attendance percentage for a student
 */
export const calculateStudentAttendancePercentage = (studentEmail: string): number => {
    const student = mockStudents.find(s => s.email === studentEmail);
    if (!student || !student.section) return 0;

    // Only count sessions for the student's section
    const sectionSessions = mockAttendanceSessions.filter(
        session => session.section === student.section
    );
    const totalSessions = sectionSessions.length;
    const presentCount = sectionSessions.filter(
        session => session.studentStatuses[studentEmail] === 'present'
    ).length;

    return totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;
};

/**
 * Calculate all students' attendance percentages
 */
export const calculateAllStudentAttendancePercentages = (): Record<string, number> => {
    const percentages: Record<string, number> = {};

    mockStudents.forEach(student => {
        percentages[student.email] = calculateStudentAttendancePercentage(student.email);
    });

    return percentages;
};

/**
 * Calculate average marks for a CT
 */
export const calculateCTAverage = (ctId: string): number => {
    const ctMarks = mockMarks[ctId] || [];
    const presentMarks = ctMarks.filter(m => m.status === 'present' && m.marksObtained !== undefined);

    if (presentMarks.length === 0) return 0;

    const total = presentMarks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
    return total / presentMarks.length;
};

/**
 * Calculate student's best CT average (based on bestCTCount)
 */
export const calculateStudentBestCTAverage = (studentEmail: string): number => {
    const publishedCTs = mockClassTests.filter(ct => ct.isPublished);

    // Get student's marks for all published CTs
    const studentMarks = publishedCTs
        .map(ct => {
            const mark = mockMarks[ct.id]?.find(m => m.studentEmail === studentEmail);
            if (!mark || mark.status === 'absent' || mark.marksObtained === undefined) {
                return null;
            }
            // Convert to percentage
            return (mark.marksObtained / ct.totalMarks) * 100;
        })
        .filter((mark): mark is number => mark !== null)
        .sort((a, b) => b - a); // Sort descending

    if (studentMarks.length === 0) return 0;

    // Take best N CTs (or all if less than bestCTCount)
    const bestCount = Math.min(mockCourse.bestCTCount || studentMarks.length, studentMarks.length);
    const bestMarks = studentMarks.slice(0, bestCount);

    return bestMarks.reduce((sum, mark) => sum + mark, 0) / bestMarks.length;
};

/**
 * Get student's progress details
 */
export const getStudentProgress = (studentEmail: string) => {
    const student = mockStudents.find(s => s.email === studentEmail);
    if (!student) return null;

    const attendancePercentage = calculateStudentAttendancePercentage(studentEmail);
    const bestCTAverage = calculateStudentBestCTAverage(studentEmail);

    // Get individual CT marks
    const ctMarks = mockClassTests
        .filter(ct => ct.isPublished)
        .map(ct => {
            const mark = mockMarks[ct.id]?.find(m => m.studentEmail === studentEmail);
            return {
                ctName: ct.name,
                totalMarks: ct.totalMarks,
                marksObtained: mark?.marksObtained,
                status: mark?.status || 'absent',
                percentage: mark?.marksObtained
                    ? (mark.marksObtained / ct.totalMarks) * 100
                    : 0,
            };
        });

    // Count sessions for student's section only
    const sectionSessions = mockAttendanceSessions.filter(
        s => s.section === student.section
    );

    return {
        student,
        attendancePercentage,
        bestCTAverage,
        ctMarks,
        totalClassesHeld: sectionSessions.length,
        presentCount: sectionSessions.filter(
            s => s.studentStatuses[studentEmail] === 'present'
        ).length,
    };
};

/**
 * Get course statistics
 */
export const getCourseStatistics = () => {
    const attendancePercentages = calculateAllStudentAttendancePercentages();
    const avgAttendance = Object.values(attendancePercentages).reduce((a, b) => a + b, 0) / mockStudents.length;

    return {
        totalStudents: mockStudents.length,
        sectionA: mockStudents.filter(s => s.section === 'A').length,
        sectionB: mockStudents.filter(s => s.section === 'B').length,
        totalClassesHeld: mockAttendanceSessions.length,
        totalCTs: mockClassTests.length,
        publishedCTs: mockClassTests.filter(ct => ct.isPublished).length,
        avgAttendance,
        bestCTCount: mockCourse.bestCTCount,
    };
};

/**
 * Get available sections in the course
 */
export const getCourseSections = (): string[] => {
    const sections = new Set(mockStudents.map(s => s.section).filter(s => s !== undefined));
    return Array.from(sections).sort();
};

/**
 * Get students by section
 */
export const getStudentsBySection = (section: string): Student[] => {
    return mockStudents.filter(s => s.section === section);
};

// Export all data in a single object for easy importing
export const mockCourseData = {
    course: mockCourse,
    teacherMemberships: mockTeacherMemberships,
    studentEnrollments: mockStudentEnrollments,
    students: mockStudents,
    classTests: mockClassTests,
    marks: mockMarks,
    attendanceSessions: mockAttendanceSessions,

    // Helper functions
    calculateStudentAttendancePercentage,
    calculateAllStudentAttendancePercentages,
    calculateCTAverage,
    calculateStudentBestCTAverage,
    getStudentProgress,
    getCourseStatistics,
    getCourseSections,
    getStudentsBySection,
};
