import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

// ========================================================================
// 1. USER & AUTHENTICATION TYPES
// ========================================================================

export type UserRole = 'student' | 'teacher' | null;

export interface BaseUser {
    email: string;
    name: string;
    image: string;
    role: UserRole;
    createdAt: Timestamp;
}

export interface Student extends BaseUser {
    role: 'student';
    batch: string;
    department: string;
    studentId: number;
}

export interface Teacher extends BaseUser {
    role: 'teacher';
    department: string;
}

export type AppUser = Student | Teacher;

export interface AuthUser {
    firebaseUser: FirebaseUser;
    userData: AppUser | null;
}

// ========================================================================
// 2. COURSE TYPES - ULTRA SIMPLIFIED
// ========================================================================

/**
 * Student ID range for automatic enrollment
 * Stored in course document
 */
export interface StudentIdRange {
    startId: number;
    endId: number;
}

/**
 * Course - Minimal Model
 * 
 * Features:
 * - Only name (code is system-generated internally)
 * - Teachers stored in subcollection (teacherMemberships)
 * - Students stored in subcollection (studentEnrollments) with ID ranges
 */
export interface Course {
    id: string;
    name: string;
    code: string; // System generated (6-8 chars), used for joining
    ownerEmail: string; // Teacher (email) who created course
    bestCTCount?: number; // Number of best CTs to count for final grade (default: all CTs)
    createdAt: Timestamp;
}

// ========================================================================
// 3. TEACHER INVITATION TYPES - SIMPLE, NO LINKS
// ========================================================================

export type TeacherInvitationStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Teacher Invitation - Shown in List, No Links
 * 
 * Workflow:
 * 1. Owner invites teacher (by email or user selection)
 * 2. Teacher sees invitation in their list (status: pending)
 * 3. Teacher accepts in app
 * 4. System adds teacher to course
 */
export interface TeacherInvitation {
    id: string;
    courseId: string;
    courseName: string; // denormalized for easy display in list
    senderEmail: string; // Email of teacher sending invitation
    senderName: string; // Name of teacher sending invitation
    recipientEmail: string; // Email of recipient (for display)
    status: TeacherInvitationStatus; // pending | accepted | rejected
    createdAt: Timestamp;
    respondedAt?: Timestamp; // when teacher accepted/rejected
}

// ========================================================================
// 4. STUDENT ENROLLMENT TYPES
// ========================================================================

/**
 * Student enrollment - stores ID ranges for automatic enrollment
 * Stored in subcollection: courses/{courseId}/studentEnrollments/{enrollmentId}
 */
export interface StudentEnrollment {
    id: string;
    courseId: string;
    startId: number;
    endId: number;
    addedBy: string; // Teacher who added this range
    createdAt: Timestamp;
}

/**
 * Student inactive course - tracks which courses student marked as inactive
 * Stored in subcollection: students/{studentId}/inactiveCourses/{courseId}
 * If document exists, course is inactive. If not, course is active.
 */
export interface StudentInactiveCourse {
    id: string;
    studentEmail: string;
    courseId: string;
    markedInactiveAt: Timestamp;
}

/**
 * Teacher membership in course
 * Stored in subcollection: courses/{courseId}/teacherMemberships/{teacherId}
 */
export interface TeacherMembership {
    id: string;
    teacherEmail: string;
    courseId: string;
    role: 'owner' | 'teacher';
    isActive: boolean; // Teacher can mark their course as active/inactive
    joinedAt: Timestamp;
    updatedAt?: Timestamp;
}

// ========================================================================
// 5. ATTENDANCE TYPES
// ========================================================================

export type AttendanceStatus = 'present' | 'absent';

export interface StudentStatusMap {
    [studentEmail: string]: AttendanceStatus;
}

export interface AttendanceSession {
    id: string;
    courseId: string;
    date: Timestamp;
    teacherId: string;
    studentStatuses: StudentStatusMap;
    notes?: string;
}

// ========================================================================
// 6. CLASS TEST & MARK TYPES
// ========================================================================

export interface ClassTest {
    id: string;
    courseId: string;
    name: string;
    description?: string;
    date: Timestamp;
    totalMarks: number;
    isPublished: boolean;
    createdBy: string;
    createdAt: Timestamp;
}

export type MarkStatus = 'present' | 'absent';

/**
 * Mark for a student in a class test
 * Stored in subcollection: classTests/{ctId}/marks/{studentUid}
 */
export interface Mark {
    id: string; // studentUid
    courseId: string;
    ctId: string;
    studentId: number; // Student ID number
    studentEmail: string; // Unique email identifier
    marksObtained?: number; // undefined if absent
    status: MarkStatus; // 'present' | 'absent'
    feedback?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ========================================================================
// 7. FORM DATA TYPES
// ========================================================================

export interface CreateCourseFormData {
    name: string;
}

export interface InviteTeacherFormData {
    teacherEmail: string;
}