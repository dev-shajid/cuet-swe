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
 * Create or update attendance session for a specific date
 * @param courseId - The course ID
 * @param date - The date of attendance (will be normalized to start of day)
 * @param teacherEmail - The teacher (email) taking attendance
 * @param studentStatuses - Map of student email to attendance status
 * @param notes - Optional notes for the session
 */
export const takeAttendance = async (
    courseId: string,
    date: Date,
    teacherEmail: string,
    studentStatuses: Record<string, AttendanceStatus>,
    notes?: string
): Promise<boolean> => {
    try {
        if (!courseId || !date || !teacherEmail || !studentStatuses) {
            console.error('❌ Missing required fields');
            return false;
        }

        // Normalize date to start of day
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        // Create session ID from course and date
        const sessionId = `${courseId}_${normalizedDate.getTime()}`;

        const attendanceSession: Omit<AttendanceSession, 'notes'> & { notes?: string } = {
            id: sessionId,
            courseId,
            date: Timestamp.fromDate(normalizedDate),
            teacherId: teacherEmail,
            studentStatuses,
        };

        // Only add notes if provided
        if (notes) {
            attendanceSession.notes = notes;
        }

        await setDoc(doc(db, 'attendanceSessions', sessionId), attendanceSession);

        console.log(`✅ Attendance recorded for ${normalizedDate.toDateString()}`);
        return true;
    } catch (error) {
        console.error('❌ Error recording attendance:', error);
        return false;
    }
};

/**
 * Get attendance session for a specific date
 */
export const getAttendanceByDate = async (
    courseId: string,
    date: Date
): Promise<AttendanceSession | null> => {
    try {
        if (!courseId || !date) {
            console.error('❌ Missing required fields');
            return null;
        }

        // Normalize date to start of day
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        const sessionId = `${courseId}_${normalizedDate.getTime()}`;
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
 * Get all attendance sessions for a course
 */
export const getCourseAttendance = async (
    courseId: string
): Promise<AttendanceSession[]> => {
    try {
        if (!courseId) {
            console.error('❌ Missing courseId');
            return [];
        }

        const q = query(
            collection(db, 'attendanceSessions'),
            where('courseId', '==', courseId)
        );

        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        } as AttendanceSession));

        // Sort by date in JavaScript (descending order - newest first)
        sessions.sort((a, b) => b.date.toMillis() - a.date.toMillis());

        console.log(`✅ Fetched ${sessions.length} attendance sessions`);
        return sessions;
    } catch (error) {
        console.error('❌ Error fetching course attendance:', error);
        return [];
    }
};

/**
 * Get attendance records for a specific student in a course
 */
export const getStudentAttendance = async (
    courseId: string,
    studentEmail: string
): Promise<AttendanceSession[]> => {
    try {
        if (!courseId || !studentEmail) {
            console.error('❌ Missing required fields');
            return [];
        }

        const allSessions = await getCourseAttendance(courseId);

        // Filter sessions where this student has a record
        const studentSessions = allSessions.filter(
            session => studentEmail in session.studentStatuses
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
 */
export const calculateAttendancePercentage = async (
    courseId: string,
    studentEmail: string
): Promise<number> => {
    try {
        const sessions = await getStudentAttendance(courseId, studentEmail);

        if (sessions.length === 0) {
            return 0;
        }

        const presentCount = sessions.filter(
            session => session.studentStatuses[studentEmail] === 'present'
        ).length;

        return Math.round((presentCount / sessions.length) * 100);
    } catch (error) {
        console.error('❌ Error calculating attendance percentage:', error);
        return 0;
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
