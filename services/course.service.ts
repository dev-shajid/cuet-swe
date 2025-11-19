import { db } from '@/config/firebase.config';
import {
    Course,
    Student,
    StudentEnrollment,
    StudentInactiveCourse,
    TeacherInvitation,
    TeacherMembership
} from '@/types';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

const generateRandomId = (): string => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
};

/**
 * Generate course code: 6-8 character alphanumeric
 */
const generateCourseCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// ========================================================================
// 1. COURSE CRUD - MINIMAL
// ========================================================================

/**
 * Create course with code, name, batch, credit, sessional, and bestCTCount
 * Code must be in CSE-XXX format
 */
export const createCourse = async (
    courseCode: string,
    teacherEmail: string,
    courseName?: string,
    batch?: number,
    credit?: number,
    isSessional: boolean = false,
    bestCTCount?: number
): Promise<Course | null> => {
    try {
        if (!courseCode || !teacherEmail) {
            console.log('❌ Course code and teacher email required');
            return null;
        }

        if (!credit || credit <= 0) {
            console.log('❌ Valid credit is required');
            return null;
        }

        // Validate course code format (CSE-211)
        const codePattern = /^[A-Z]{3}-\d{3}$/;
        if (!codePattern.test(courseCode)) {
            console.log('❌ Invalid course code format. Must be like CSE-211');
            return null;
        }

        const courseId = generateRandomId();

        const newCourse: Omit<Course, 'bestCTCount'> & {
            bestCTCount?: number;
            batch?: number;
            isSessional?: boolean;
        } = {
            id: courseId,
            name: courseName || courseCode,
            code: courseCode,
            ownerEmail: teacherEmail,
            credit: credit,
            createdAt: Timestamp.now(),
            ...(batch && { batch }),
            ...(isSessional !== undefined && { isSessional }),
            ...(!isSessional && bestCTCount && { bestCTCount }),
        };

        await setDoc(doc(db, 'courses', courseId), newCourse);

        // Create teacher membership
        const membershipRef = doc(
            db,
            'courses',
            courseId,
            'teacherMemberships',
            teacherEmail
        );
        await setDoc(membershipRef, {
            id: teacherEmail,
            teacherEmail,
            courseId,
            role: 'owner',
            isActive: true,
            joinedAt: Timestamp.now(),
        } as TeacherMembership);

        console.log(`✅ Course created: "${courseName || courseCode}", Code: ${courseCode}`);
        return newCourse as Course;
    } catch (error) {
        console.error('❌ Error creating course:', error);
        return null;
    }
};

/**
 * Get course by ID
 */
export const getCourseById = async (courseId: string): Promise<Course | null> => {
    try {
        if (!courseId) {
            console.log('❌ Course ID required');
            return null;
        }

        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            console.log('❌ Course not found');
            return null;
        }

        return { ...courseSnap.data(), id: courseSnap.id } as Course;
    } catch (error) {
        console.error('❌ Error fetching course:', error);
        return null;
    }
};

/**
 * Get all courses for teacher with optional active/inactive filter
 */
export const getTeacherCourses = async (
    teacherEmail: string,
    activeOnly: boolean = false
): Promise<Course[]> => {
    try {
        if (!teacherEmail) {
            console.log('❌ Teacher email required');
            return [];
        }

        // Get all courses
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const teacherCourses: Course[] = [];

        for (const courseDoc of coursesSnapshot.docs) {
            // Check if teacher has membership in this course
            const membershipRef = doc(
                db,
                'courses',
                courseDoc.id,
                'teacherMemberships',
                teacherEmail
            );
            const membershipSnap = await getDoc(membershipRef);

            if (membershipSnap.exists()) {
                const membership = membershipSnap.data() as TeacherMembership;

                // Filter by active status if requested
                if (activeOnly && !membership.isActive) {
                    continue;
                }

                teacherCourses.push({
                    ...courseDoc.data(),
                    id: courseDoc.id,
                } as Course);
            }
        }

        console.log(`✅ Fetched ${teacherCourses.length} courses for teacher`);
        return teacherCourses;
    } catch (error) {
        console.error('❌ Error fetching courses:', error);
        return [];
    }
};

/**
 * Get course by code (for student joining)
 */
export const getCourseByCode = async (
    courseCode: string
): Promise<Course | null> => {
    try {
        if (!courseCode) {
            console.log('❌ Course code required');
            return null;
        }

        const q = query(
            collection(db, 'courses'),
            where('code', '==', courseCode),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('❌ Invalid course code');
            return null;
        }

        const courseDoc = snapshot.docs[0];
        return { ...courseDoc.data(), id: courseDoc.id } as Course;
    } catch (error) {
        console.error('❌ Error fetching course by code:', error);
        return null;
    }
};

// ========================================================================
// 2. TEACHER INVITATIONS - NO LINKS, LIST ONLY
// ========================================================================

/**
 * Invite teacher to course (no links, invitation shown in list)
 */
export const inviteTeacherToCourse = async (
    courseId: string,
    recipientEmail: string,
    senderEmail: string,
    senderName: string
): Promise<boolean> => {
    try {
        if (!courseId || !recipientEmail || !senderEmail) {
            console.log('❌ Missing required fields');
            return false;
        }

        // Get course details
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            console.log('❌ Course not found');
            return false;
        }

        const courseData = courseSnap.data() as Course;

        // Find recipient teacher by email
        const teachersRef = collection(db, 'teachers');
        const q = query(teachersRef, where('email', '==', recipientEmail), limit(1));
        const teacherSnap = await getDocs(q);

        if (teacherSnap.empty) {
            console.log('❌ Teacher not found with that email');
            return false;
        }

        const recipientId = teacherSnap.docs[0].id; // email as document ID

        // Check if already a teacher in course
        const membershipRef = doc(
            db,
            'courses',
            courseId,
            'teacherMemberships',
            recipientId
        );
        const membershipSnap = await getDoc(membershipRef);

        if (membershipSnap.exists()) {
            console.log('✅ Already a teacher in this course');
            return true;
        }

        // Create invitation
        const invitationId = generateRandomId();
        const invitation: TeacherInvitation = {
            id: invitationId,
            courseId,
            courseName: courseData.name,
            senderEmail,
            senderName,
            recipientEmail,
            status: 'pending',
            createdAt: Timestamp.now(),
        };

        await setDoc(
            doc(db, 'teacherInvitations', invitationId),
            invitation
        );

        console.log('✅ Invitation sent to teacher:', recipientEmail);
        return true;
    } catch (error) {
        console.error('❌ Error inviting teacher:', error);
        return false;
    }
};

/**
 * Get pending invitations for teacher
 */
export const getPendingInvitations = async (
    teacherEmail: string
): Promise<TeacherInvitation[]> => {
    try {
        if (!teacherEmail) {
            console.log('❌ Teacher email required');
            return [];
        }

        const q = query(
            collection(db, 'teacherInvitations'),
            where('recipientEmail', '==', teacherEmail),
            where('status', '==', 'pending')
        );

        const snapshot = await getDocs(q);
        const invitations = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        } as TeacherInvitation));

        console.log(`✅ Fetched ${invitations.length} pending invitations`);
        return invitations;
    } catch (error) {
        console.error('❌ Error fetching invitations:', error);
        return [];
    }
};

/**
 * Accept teacher invitation
 * When accepted:
 * 1. Teacher is added to course
 */
export const acceptTeacherInvitation = async (
    invitationId: string,
    teacherEmail: string
): Promise<boolean> => {
    try {
        const invitationRef = doc(db, 'teacherInvitations', invitationId);
        const invitationSnap = await getDoc(invitationRef);

        if (!invitationSnap.exists()) {
            console.log('❌ Invitation not found');
            return false;
        }

        const invitation = invitationSnap.data() as TeacherInvitation;

        // Verify this is for the current teacher
        if (invitation.recipientEmail !== teacherEmail) {
            console.log('❌ This invitation is not for you');
            return false;
        }

        if (invitation.status !== 'pending') {
            console.log('❌ Invitation already responded');
            return false;
        }

        const batch = writeBatch(db);
        const courseRef = doc(db, 'courses', invitation.courseId);

        // Create teacher membership
        const membershipRef = doc(
            db,
            'courses',
            invitation.courseId,
            'teacherMemberships',
            teacherEmail
        );
        batch.set(membershipRef, {
            id: teacherEmail,
            teacherEmail,
            courseId: invitation.courseId,
            role: 'teacher',
            isActive: true,
            joinedAt: Timestamp.now(),
        } as TeacherMembership);

        // Update invitation status
        batch.update(invitationRef, {
            status: 'accepted',
            respondedAt: Timestamp.now(),
        });

        await batch.commit();

        console.log('✅ Invitation accepted');
        return true;
    } catch (error) {
        console.error('❌ Error accepting invitation:', error);
        return false;
    }
};

/**
 * Reject teacher invitation
 */
export const rejectTeacherInvitation = async (
    invitationId: string,
    teacherEmail: string
): Promise<boolean> => {
    try {
        const invitationRef = doc(db, 'teacherInvitations', invitationId);
        const invitationSnap = await getDoc(invitationRef);

        if (!invitationSnap.exists()) {
            console.log('❌ Invitation not found');
            return false;
        }

        const invitation = invitationSnap.data() as TeacherInvitation;

        if (invitation.recipientEmail !== teacherEmail) {
            console.log('❌ This invitation is not for you');
            return false;
        }

        if (invitation.status !== 'pending') {
            console.log('❌ Invitation already responded');
            return false;
        }

        await updateDoc(invitationRef, {
            status: 'rejected',
            respondedAt: Timestamp.now(),
        });

        console.log('✅ Invitation rejected');
        return true;
    } catch (error) {
        console.error('❌ Error rejecting invitation:', error);
        return false;
    }
};

// ========================================================================
// 3. STUDENT ENROLLMENT - AUTOMATIC BASED ON ID RANGE
// ========================================================================

/**
 * Get all courses for a student based on their student ID with optional active filter
 */
export const getStudentCourses = async (
    studentEmail: string,
    studentId: number,
    activeOnly: boolean = false
): Promise<Course[]> => {
    try {
        if (!studentId) {
            console.log('❌ Student ID required');
            return [];
        }

        // Get inactive course IDs if filtering
        let inactiveCourseIds: Set<string> = new Set();
        if (activeOnly || !activeOnly) {
            // Always fetch to filter correctly
            const inactiveSnapshot = await getDocs(
                collection(db, 'students', studentEmail, 'inactiveCourses')
            );
            inactiveCourseIds = new Set(inactiveSnapshot.docs.map(doc => doc.id));
        }

        // Get all courses
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const enrolledCourses: Course[] = [];

        for (const courseDoc of coursesSnapshot.docs) {
            const courseId = courseDoc.id;

            // Get all student enrollments for this course
            const enrollmentsSnapshot = await getDocs(
                collection(db, 'courses', courseId, 'studentEnrollments')
            );

            // Check if student ID falls within any enrollment range
            const isEnrolled = enrollmentsSnapshot.docs.some((enrollDoc) => {
                const enrollment = enrollDoc.data() as StudentEnrollment;
                return studentId >= enrollment.startId && studentId <= enrollment.endId;
            });

            if (isEnrolled) {
                // Skip inactive courses if filtering for active only
                if (activeOnly && inactiveCourseIds.has(courseId)) {
                    continue;
                }

                enrolledCourses.push({
                    ...courseDoc.data(),
                    id: courseDoc.id,
                } as Course);
            }
        }

        console.log(`✅ Found ${enrolledCourses.length} courses for student ID ${studentId}`);
        return enrolledCourses;
    } catch (error) {
        console.error('❌ Error fetching student courses:', error);
        return [];
    }
};

/**
 * Get all students enrolled in a course based on ID ranges
 */
export const getEnrolledStudents = async (
    courseId: string
): Promise<Student[]> => {
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            console.log('❌ Course not found');
            return [];
        }

        // Get all student enrollments for this course
        const enrollmentsSnapshot = await getDocs(
            collection(db, 'courses', courseId, 'studentEnrollments')
        );

        if (enrollmentsSnapshot.empty) {
            console.log('ℹ️ No student enrollments for this course');
            return [];
        }

        // Get all students
        const studentsRef = collection(db, 'students');
        const studentsSnapshot = await getDocs(studentsRef);

        const enrolledStudents: Student[] = [];

        // Check each student against all enrollment ranges
        for (const studentDoc of studentsSnapshot.docs) {
            const studentData = studentDoc.data() as Student;

            // Check if student ID is in any enrollment range
            const isEnrolled = enrollmentsSnapshot.docs.some((enrollDoc) => {
                const enrollment = enrollDoc.data() as StudentEnrollment;
                return studentData.studentId >= enrollment.startId && studentData.studentId <= enrollment.endId;
            });

            if (isEnrolled) {
                enrolledStudents.push(studentData as Student);
            }
        }

        console.log(`✅ Found ${enrolledStudents.length} students in course`);
        return enrolledStudents;
    } catch (error) {
        console.error('❌ Error fetching enrolled students:', error);
        return [];
    }
};

/**
 * Check if a student is enrolled in a course
 */
export const isStudentEnrolled = async (
    courseId: string,
    studentId: number
): Promise<boolean> => {
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            return false;
        }

        // Get all student enrollments for this course
        const enrollmentsSnapshot = await getDocs(
            collection(db, 'courses', courseId, 'studentEnrollments')
        );

        // Check if student ID falls within any enrollment range
        return enrollmentsSnapshot.docs.some((enrollDoc) => {
            const enrollment = enrollDoc.data() as StudentEnrollment;
            return studentId >= enrollment.startId && studentId <= enrollment.endId;
        });
    } catch (error) {
        console.error('❌ Error checking enrollment:', error);
        return false;
    }
};

// ========================================================================
// 4. COURSE MANAGEMENT
// ========================================================================

/**
 * Add a student ID range for automatic enrollment with section
 */
export const addStudentIdRange = async (
    courseId: string,
    startId: number,
    endId: number,
    section: string,
    userEmail: string
): Promise<boolean> => {
    try {
        if (startId > endId) {
            console.log('❌ Start ID cannot be greater than end ID');
            return false;
        }

        if (!section || section.trim() === '') {
            console.log('❌ Section is required');
            return false;
        }

        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            console.log('❌ Course not found');
            return false;
        }

        const courseData = courseSnap.data() as Course;

        // Only owner or teachers can add student ID ranges
        const membershipRef = doc(
            db,
            'courses',
            courseId,
            'teacherMemberships',
            userEmail
        );
        const membershipSnap = await getDoc(membershipRef);

        if (courseData.ownerEmail !== userEmail && !membershipSnap.exists()) {
            console.log('❌ Only teachers can add student ID ranges');
            return false;
        }

        // Get existing enrollments to check for overlaps
        const enrollmentsSnapshot = await getDocs(
            collection(db, 'courses', courseId, 'studentEnrollments')
        );

        // Check for overlapping ranges
        const hasOverlap = enrollmentsSnapshot.docs.some((enrollDoc) => {
            const enrollment = enrollDoc.data() as StudentEnrollment;
            return (
                (startId >= enrollment.startId && startId <= enrollment.endId) ||
                (endId >= enrollment.startId && endId <= enrollment.endId) ||
                (startId <= enrollment.startId && endId >= enrollment.endId)
            );
        });

        if (hasOverlap) {
            console.log('❌ This range overlaps with an existing range');
            return false;
        }

        // Create new enrollment
        const enrollmentId = generateRandomId();
        const enrollment: StudentEnrollment = {
            id: enrollmentId,
            courseId,
            startId,
            endId,
            section: section.trim().toUpperCase(),
            addedBy: userEmail,
            createdAt: Timestamp.now(),
        };

        await setDoc(
            doc(db, 'courses', courseId, 'studentEnrollments', enrollmentId),
            enrollment
        );

        console.log(`✅ Student ID range added: ${startId}-${endId} (Section ${section})`);
        return true;
    } catch (error) {
        console.error('❌ Error adding student ID range:', error);
        return false;
    }
};

/**
 * Update an existing student ID range
 */
export const updateStudentIdRange = async (
    courseId: string,
    enrollmentId: string,
    startId: number,
    endId: number,
    section: string,
    userEmail: string
): Promise<boolean> => {
    try {
        if (startId > endId) {
            console.log('❌ Start ID cannot be greater than end ID');
            return false;
        }

        if (!section || section.trim() === '') {
            console.log('❌ Section is required');
            return false;
        }

        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            console.log('❌ Course not found');
            return false;
        }

        const courseData = courseSnap.data() as Course;

        // Only owner or teachers can update student ID ranges
        const membershipRef = doc(
            db,
            'courses',
            courseId,
            'teacherMemberships',
            userEmail
        );
        const membershipSnap = await getDoc(membershipRef);

        if (courseData.ownerEmail !== userEmail && !membershipSnap.exists()) {
            console.log('❌ Only teachers can update student ID ranges');
            return false;
        }

        // Get existing enrollments to check for overlaps (excluding current)
        const enrollmentsSnapshot = await getDocs(
            collection(db, 'courses', courseId, 'studentEnrollments')
        );

        // Check for overlapping ranges (excluding the current enrollment)
        const hasOverlap = enrollmentsSnapshot.docs.some((enrollDoc) => {
            if (enrollDoc.id === enrollmentId) return false; // Skip current enrollment

            const enrollment = enrollDoc.data() as StudentEnrollment;
            return (
                (startId >= enrollment.startId && startId <= enrollment.endId) ||
                (endId >= enrollment.startId && endId <= enrollment.endId) ||
                (startId <= enrollment.startId && endId >= enrollment.endId)
            );
        });

        if (hasOverlap) {
            console.log('❌ This range overlaps with an existing range');
            return false;
        }

        // Update the enrollment
        const enrollmentRef = doc(db, 'courses', courseId, 'studentEnrollments', enrollmentId);
        await updateDoc(enrollmentRef, {
            startId,
            endId,
            section: section.trim().toUpperCase(),
        });

        console.log(`✅ Student ID range updated: ${startId}-${endId} (Section ${section})`);
        return true;
    } catch (error) {
        console.error('❌ Error updating student ID range:', error);
        return false;
    }
};

/**
 * Remove a student ID range from a course
 */
export const removeStudentIdRange = async (
    courseId: string,
    enrollmentId: string,
    userEmail: string
): Promise<boolean> => {
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            console.log('❌ Course not found');
            return false;
        }

        const courseData = courseSnap.data() as Course;

        // Only owner or teachers can remove student ID ranges
        const membershipRef = doc(
            db,
            'courses',
            courseId,
            'teacherMemberships',
            userEmail
        );
        const membershipSnap = await getDoc(membershipRef);

        if (courseData.ownerEmail !== userEmail && !membershipSnap.exists()) {
            console.log('❌ Only teachers can remove student ID ranges');
            return false;
        }

        // Delete the enrollment document
        await deleteDoc(
            doc(db, 'courses', courseId, 'studentEnrollments', enrollmentId)
        );

        console.log(`✅ Student ID range removed`);
        return true;
    } catch (error) {
        console.error('❌ Error removing student ID range:', error);
        return false;
    }
};

/**
 * Get all student enrollments (ID ranges) for a course
 */
export const getStudentEnrollments = async (
    courseId: string
): Promise<StudentEnrollment[]> => {
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            console.log('❌ Course not found');
            return [];
        }

        const enrollmentsSnapshot = await getDocs(
            collection(db, 'courses', courseId, 'studentEnrollments')
        );

        return enrollmentsSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        } as StudentEnrollment));
    } catch (error) {
        console.error('❌ Error fetching student enrollments:', error);
        return [];
    }
};

/**
 * Get course statistics
 */
export const getCourseStats = async (
    courseId: string
): Promise<{ studentCount: number; teacherCount: number } | null> => {
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            return null;
        }

        // Get all student enrollments
        const enrollmentsSnapshot = await getDocs(
            collection(db, 'courses', courseId, 'studentEnrollments')
        );

        // Calculate student count based on enrollment ranges
        let studentCount = 0;
        if (!enrollmentsSnapshot.empty) {
            const studentsSnapshot = await getDocs(collection(db, 'students'));

            studentCount = studentsSnapshot.docs.filter((doc) => {
                const student = doc.data() as Student;
                return enrollmentsSnapshot.docs.some((enrollDoc) => {
                    const enrollment = enrollDoc.data() as StudentEnrollment;
                    return student.studentId >= enrollment.startId && student.studentId <= enrollment.endId;
                });
            }).length;
        }

        // Get teacher count
        const teachersSnapshot = await getDocs(
            collection(db, 'courses', courseId, 'teacherMemberships')
        );

        return {
            studentCount,
            teacherCount: teachersSnapshot.size,
        };
    } catch (error) {
        console.error('❌ Error getting stats:', error);
        return null;
    }
};

// ========================================================================
// 5. ACTIVE/INACTIVE STATUS MANAGEMENT
// ========================================================================

/**
 * Toggle course active/inactive status for teacher
 */
export const toggleTeacherCourseStatus = async (
    courseId: string,
    teacherEmail: string,
    isActive: boolean
): Promise<boolean> => {
    try {
        const membershipRef = doc(
            db,
            'courses',
            courseId,
            'teacherMemberships',
            teacherEmail
        );
        const membershipSnap = await getDoc(membershipRef);

        if (!membershipSnap.exists()) {
            console.log('❌ Teacher is not a member of this course');
            return false;
        }

        await updateDoc(membershipRef, {
            isActive,
            updatedAt: Timestamp.now(),
        });

        console.log(`✅ Course status updated to ${isActive ? 'active' : 'inactive'}`);
        return true;
    } catch (error) {
        console.error('❌ Error toggling course status:', error);
        return false;
    }
};

/**
 * Toggle course active/inactive status for student
 * If isActive = false, creates document in inactiveCourses
 * If isActive = true, removes document from inactiveCourses
 */
export const toggleStudentCourseStatus = async (
    studentEmail: string,
    courseId: string,
    isActive: boolean
): Promise<boolean> => {
    try {
        const inactiveCourseRef = doc(
            db,
            'students',
            studentEmail,
            'inactiveCourses',
            courseId
        );

        if (isActive) {
            // Remove from inactive courses (make active)
            const inactiveSnap = await getDoc(inactiveCourseRef);
            if (inactiveSnap.exists()) {
                await deleteDoc(inactiveCourseRef);
            }
        } else {
            // Add to inactive courses
            await setDoc(inactiveCourseRef, {
                id: courseId,
                studentEmail: studentEmail,
                courseId,
                markedInactiveAt: Timestamp.now(),
            } as StudentInactiveCourse);
        }

        console.log(`✅ Course status updated to ${isActive ? 'active' : 'inactive'}`);
        return true;
    } catch (error) {
        console.error('❌ Error toggling course status:', error);
        return false;
    }
};

/**
 * Get course status for student
 * Returns true if active (no document in inactiveCourses)
 * Returns false if inactive (document exists in inactiveCourses)
 */
export const getStudentCourseStatus = async (
    studentEmail: string,
    courseId: string
): Promise<boolean> => {
    try {
        const inactiveCourseRef = doc(
            db,
            'students',
            studentEmail,
            'inactiveCourses',
            courseId
        );
        const inactiveSnap = await getDoc(inactiveCourseRef);

        // If document exists in inactiveCourses, it's inactive
        return !inactiveSnap.exists();
    } catch (error) {
        console.error('❌ Error getting course status:', error);
        return true; // Default to active on error
    }
};

/**
 * Get all inactive course IDs for a student
 */
export const getStudentInactiveCourses = async (
    studentEmail: string
): Promise<string[]> => {
    try {
        const inactiveSnapshot = await getDocs(
            collection(db, 'students', studentEmail, 'inactiveCourses')
        );

        return inactiveSnapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error('❌ Error getting inactive courses:', error);
        return [];
    }
};

/**
 * Get course status for teacher
 */
export const getTeacherCourseStatus = async (
    courseId: string,
    teacherEmail: string
): Promise<boolean> => {
    try {
        const membershipRef = doc(
            db,
            'courses',
            courseId,
            'teacherMemberships',
            teacherEmail
        );
        const membershipSnap = await getDoc(membershipRef);

        if (!membershipSnap.exists()) {
            return false; // Not a member
        }

        const membership = membershipSnap.data() as TeacherMembership;
        return membership.isActive;
    } catch (error) {
        console.error('❌ Error getting course status:', error);
        return false;
    }
};

// ========================================================================
// 6. COURSE UPDATE
// ========================================================================

/**
 * Update course information (name and bestCTCount)
 * @param courseId - The course ID
 * @param updates - Object containing name and/or bestCTCount
 * @param userId - Teacher updating the course
 */
export const updateCourseInfo = async (
    courseId: string,
    updates: { name?: string; bestCTCount?: number; credit?: number },
    userEmail: string
): Promise<boolean> => {
    try {
        if (!courseId || !userEmail || !updates) {
            console.error('❌ Missing required fields');
            return false;
        }

        // Verify user is owner or teacher
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            console.error('❌ Course not found');
            return false;
        }

        const courseData = courseSnap.data() as Course;

        // Check if user is owner or teacher
        const membershipRef = doc(
            db,
            'courses',
            courseId,
            'teacherMemberships',
            userEmail
        );
        const membershipSnap = await getDoc(membershipRef);

        if (courseData.ownerEmail !== userEmail && !membershipSnap.exists()) {
            console.error('❌ User is not authorized to update course');
            return false;
        }

        // Build update object - only include defined fields
        const updateData: Partial<Course> = {};
        if (updates.name !== undefined && updates.name.trim() !== '') {
            updateData.name = updates.name.trim();
        }
        if (updates.bestCTCount !== undefined) {
            updateData.bestCTCount = updates.bestCTCount;
        }
        if (updates.credit !== undefined) {
            const creditNum = Number(updates.credit);
            if (!isNaN(creditNum) && creditNum > 0 && creditNum <= 10) {
                updateData.credit = creditNum;
            } else {
                console.error('❌ Invalid credit value provided');
            }
        }

        if (Object.keys(updateData).length === 0) {
            console.error('❌ No valid updates provided');
            return false;
        }

        await updateDoc(courseRef, updateData);

        console.log(`✅ Course updated successfully`);
        return true;
    } catch (error) {
        console.error('❌ Error updating course:', error);
        return false;
    }
};

/**
 * Update the best CT count configuration for a course
 * @param courseId - The course ID
 * @param bestCTCount - Number of best CTs to count (undefined = all CTs count)
 * @param userId - Teacher updating the configuration
 */
export const updateBestCTCount = async (
    courseId: string,
    bestCTCount: number | undefined,
    userEmail: string
): Promise<boolean> => {
    try {
        if (!courseId || !userEmail) {
            console.error('❌ Missing required fields');
            return false;
        }

        // Verify user is owner or teacher
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            console.error('❌ Course not found');
            return false;
        }

        const courseData = courseSnap.data() as Course;

        // Check if user is owner or teacher
        const membershipRef = doc(
            db,
            'courses',
            courseId,
            'teacherMemberships',
            userEmail
        );
        const membershipSnap = await getDoc(membershipRef);

        if (courseData.ownerEmail !== userEmail && !membershipSnap.exists()) {
            console.error('❌ User is not authorized to update course configuration');
            return false;
        }

        // Update best CT count
        await updateDoc(courseRef, {
            bestCTCount: bestCTCount,
        });

        console.log(`✅ Best CT count updated to: ${bestCTCount ?? 'all'}`);
        return true;
    } catch (error) {
        console.error('❌ Error updating best CT count:', error);
        return false;
    }
};

// ========================================================================
// 7. COURSE DELETION
// ========================================================================

/**
 * Delete a course and all its related data
 * @param courseId - The course ID
 * @param userEmail - User attempting to delete (must be owner)
 */
export const deleteCourse = async (
    courseId: string,
    userEmail: string
): Promise<boolean> => {
    try {
        if (!courseId || !userEmail) {
            console.error('❌ Missing required fields');
            return false;
        }

        // Verify user is owner
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            console.error('❌ Course not found');
            return false;
        }

        const courseData = courseSnap.data() as Course;

        if (courseData.ownerEmail !== userEmail) {
            console.error('❌ Only the course owner can delete the course');
            return false;
        }

        // Use batch to delete all related data
        const batch = writeBatch(db);

        // Delete course document
        batch.delete(courseRef);

        // Delete student enrollments
        const enrollmentsQuery = query(
            collection(db, 'courses', courseId, 'studentEnrollments')
        );
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        enrollmentsSnap.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Delete teacher memberships
        const membershipsQuery = query(
            collection(db, 'courses', courseId, 'teacherMemberships')
        );
        const membershipsSnap = await getDocs(membershipsQuery);
        membershipsSnap.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Commit the batch
        await batch.commit();

        console.log(`✅ Course deleted successfully`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting course:', error);
        return false;
    }
};