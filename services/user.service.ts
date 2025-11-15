import { db } from '@/config/firebase.config';
import { AppUser } from '@/types';
import { getRole } from '@/utils/role';
import { extractStudentIdFromEmail } from '@/utils/studentId';
import { User } from 'firebase/auth';
import { Timestamp, doc, getDoc, setDoc } from 'firebase/firestore';

// Persist user profile using email as the document ID.
// Email is the sole unique identifier across the app.
export const saveUserToFirestore = async (user: User): Promise<AppUser | null> => {
    try {
        if (!user?.email) {
            console.log('❌ No email provided');
            return null;
        }

        const role = getRole(user.email);
        if (!role) {
            console.log('❌ Invalid role for user:', user.email);
            return null;
        }

        // 🔥 Decide which collection to use based on role
        const collectionName = role === 'teacher' ? 'teachers' : 'students';
        const userRef = doc(db, collectionName, user.email);
        const userSnap = await getDoc(userRef);

        let userData: AppUser;

        if (!userSnap.exists()) {
            let newUserData: any = {
                email: user.email,
                name: user.displayName || '',
                image: user.photoURL || '',
                role,
                createdAt: Timestamp.now(),
            };

            if (role === 'teacher') {
                newUserData['department'] = 'CSE';
            } else {
                // Student specific fields
                newUserData['batch'] = '2021';
                newUserData['department'] = 'CSE';
                const extractedId = extractStudentIdFromEmail(user.email);
                if (extractedId) {
                    newUserData['studentId'] = extractedId;
                } else {
                    console.warn('⚠️ Could not extract studentId from email:', user.email);
                }
            }

            await setDoc(userRef, newUserData);
            userData = newUserData as AppUser;

            console.log(`✅ New ${role} created in Firestore:`, user.email);
        } else {
            userData = userSnap.data() as AppUser;
            console.log(`👤 ${role} already exists in Firestore:`, user.email);
        }

        return userData;
    } catch (error) {
        console.error('❌ Error saving user to Firestore:', error);
        return null;
    }
};

/**
 * Fetches user data from Firestore based on email
 * Returns null if user doesn't exist or role is invalid
 * 
 * @param email - User's email address
 * @returns AppUser object or null
 */
export const getUserFromFirestore = async (email: string): Promise<AppUser | null> => {
    try {
        if (!email) {
            console.log('❌ No email provided');
            return null;
        }

        // Get role from email
        const role = getRole(email);

        if (!role) {
            console.log('❌ Invalid role for user:', email);
            return null;
        }

        // Determine collection based on role
        const collectionName = role === 'teacher' ? 'teachers' : 'students';

        // Create document reference using email as document ID
        const userRef = doc(db, collectionName, email);

        // Fetch document
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.log(`❌ User not found in ${collectionName} collection:`, email);
            return null;
        }

        // Get data and cast to AppUser
        const userData = userSnap.data() as AppUser;

        console.log(`✅ User fetched from ${collectionName}:`, email);
        return userData;

    } catch (error) {
        console.error('❌ Error fetching user from Firestore:', error);
        return null;
    }
};