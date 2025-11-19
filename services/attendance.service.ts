import { db } from '@/config/firebase.config';
import { AttendanceSession, AttendanceStatus } from '@/types';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    Timestamp,
    where
} from 'firebase/firestore';

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

const generateRandomId = (): string => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
};

// ========================================================================
// 1. ATTENDANCE MANAGEMENT
// ========================================================================

/**
 * Create or update attendance session for a specific date and section
 * @param courseId - The course ID
 * @param section - The section (e.g., 'A', 'B')
 * @param date - The date of attendance (will be normalized to start of day)
 * @param teacherEmail - The teacher (email) taking attendance
 * @param studentStatuses - Map of student email to attendance status
 * @param notes - Optional notes for the session
 */
export const takeAttendance = async (
    courseId: string,
    section: string,
    date: Date,
    teacherEmail: string,
    studentStatuses: Record<string, AttendanceStatus>,
    notes?: string
): Promise<boolean> => {
    try {
        if (!courseId || !section || !date || !teacherEmail || !studentStatuses) {
            console.error('❌ Missing required fields');
            return false;
        }

        // Normalize date to start of day
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        // Create session ID from course, section, and date
        const sessionId = `${courseId}_${section}_${normalizedDate.getTime()}`;

        const attendanceSession: Omit<AttendanceSession, 'notes'> & { notes?: string } = {
            id: sessionId,
            courseId,
            section,
            date: Timestamp.fromDate(normalizedDate),
            teacherId: teacherEmail,
            studentStatuses,
        };

        // Only add notes if provided
        if (notes) {
            attendanceSession.notes = notes;
        }

        await setDoc(doc(db, 'attendanceSessions', sessionId), attendanceSession);

        console.log(`✅ Attendance recorded for ${normalizedDate.toDateString()} (Section ${section})`);
        return true;
    } catch (error) {
        console.error('❌ Error recording attendance:', error);
        return false;
    }
};

/**
 * Get attendance session for a specific date and section
 */
export const getAttendanceByDate = async (
    courseId: string,
    section: string,
    date: Date
): Promise<AttendanceSession | null> => {
    try {
        if (!courseId || !section || !date) {
            console.error('❌ Missing required fields');
            return null;
        }

        // Normalize date to start of day
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        const sessionId = `${courseId}_${section}_${normalizedDate.getTime()}`;
        const sessionRef = doc(db, 'attendanceSessions', sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (!sessionSnap.exists()) {
            return null;
        }

        return { ...sessionSnap.data(), id: sessionSnap.id } as AttendanceSession;
    } catch (error) {
        console.error('❌ Error fetching attendance:', error);
        return null;
    }
};

/**
 * Get all attendance sessions for a course (optionally filter by section)
 */
export const getCourseAttendance = async (
    courseId: string,
    section?: string
): Promise<AttendanceSession[]> => {
    try {
        if (!courseId) {
            console.error('❌ Missing courseId');
            return [];
        }

        let q;
        if (section) {
            q = query(
                collection(db, 'attendanceSessions'),
                where('courseId', '==', courseId),
                where('section', '==', section)
            );
        } else {
            q = query(
                collection(db, 'attendanceSessions'),
                where('courseId', '==', courseId)
            );
        }

        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        } as AttendanceSession));

        // Sort by date in JavaScript (descending order - newest first)
        sessions.sort((a, b) => b.date.toMillis() - a.date.toMillis());

        console.log(`✅ Fetched ${sessions.length} attendance sessions${section ? ` for section ${section}` : ''}`);
        return sessions;
    } catch (error) {
        console.error('❌ Error fetching course attendance:', error);
        return [];
    }
};

/**
 * Get attendance records for a specific student in a course
 * Only includes sessions for the student's section
 */
export const getStudentAttendance = async (
    courseId: string,
    studentEmail: string,
    studentSection?: string,
    studentId?: number
): Promise<AttendanceSession[]> => {
    try {
        if (!courseId || !studentEmail) {
            console.error('❌ Missing required fields');
            return [];
        }

        const allSessions = await getCourseAttendance(courseId, studentSection);

        // Use studentId if provided, otherwise fall back to email
        const lookupKey = studentId !== undefined ? String(studentId) : studentEmail;
        // Filter sessions where this student has a record
        const studentSessions = allSessions.filter(
            session => lookupKey in session.studentStatuses
        );

        console.log(`✅ Fetched ${studentSessions.length} attendance records for student`);
        return studentSessions;
    } catch (error) {
        console.error('❌ Error fetching student attendance:', error);
        return [];
    }
};

/**
 * Calculate attendance percentage for a student
 * Only counts sessions for the student's section
 */
export const calculateAttendancePercentage = async (
    courseId: string,
    studentEmail: string,
    studentSection?: string,
    studentId?: number
): Promise<number> => {
    try {
        const sessions = await getStudentAttendance(courseId, studentEmail, studentSection, studentId);

        if (sessions.length === 0) {
            return 0;
        }

        // Use studentId if provided, otherwise fall back to email
        const lookupKey = studentId !== undefined ? String(studentId) : studentEmail;
        const presentCount = sessions.filter(
            session => session.studentStatuses[lookupKey] === 'present'
        ).length;

        return Math.round((presentCount / sessions.length) * 100);
    } catch (error) {
        console.error('❌ Error calculating attendance percentage:', error);
        return 0;
    }
};

/**
 * Calculate attendance percentages for all students in a course
 * Groups students by section
 */
export const calculateAllStudentAttendancePercentages = async (
    courseId: string
): Promise<Record<string, number>> => {
    try {
        const allSessions = await getCourseAttendance(courseId);
        const percentages: Record<string, number> = {};

        // Get unique student emails from all sessions
        const studentEmails = new Set<string>();
        allSessions.forEach(session => {
            Object.keys(session.studentStatuses).forEach(email => studentEmails.add(email));
        });

        // Calculate percentage for each student
        for (const email of studentEmails) {
            const studentSessions = allSessions.filter(
                session => email in session.studentStatuses
            );

            if (studentSessions.length > 0) {
                const presentCount = studentSessions.filter(
                    session => session.studentStatuses[email] === 'present'
                ).length;
                percentages[email] = (presentCount / studentSessions.length) * 100;
            }
        }

        return percentages;
    } catch (error) {
        console.error('❌ Error calculating all attendance percentages:', error);
        return {};
    }
};

/**
 * Get attendance statistics for a course
 */
export const getCourseAttendanceStats = async (
    courseId: string
): Promise<{
    totalSessions: number;
    averageAttendance: number;
    lastSessionDate?: Date;
} | null> => {
    try {
        const sessions = await getCourseAttendance(courseId);

        if (sessions.length === 0) {
            return {
                totalSessions: 0,
                averageAttendance: 0,
            };
        }

        // Calculate average attendance across all sessions
        let totalPresentCount = 0;
        let totalStudentCount = 0;

        sessions.forEach(session => {
            const statuses = Object.values(session.studentStatuses);
            totalStudentCount += statuses.length;
            totalPresentCount += statuses.filter(status => status === 'present').length;
        });

        const averageAttendance = totalStudentCount > 0
            ? Math.round((totalPresentCount / totalStudentCount) * 100)
            : 0;

        return {
            totalSessions: sessions.length,
            averageAttendance,
            lastSessionDate: sessions[0]?.date.toDate(),
        };
    } catch (error) {
        console.error('❌ Error calculating course attendance stats:', error);
        return null;
    }
};
