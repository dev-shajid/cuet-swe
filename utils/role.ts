import { UserRole } from "@/types";

export const getRole = (email: string): UserRole => {
    if (!email) return null;
    const e = email.toLowerCase().trim();
    if (e.endsWith('@students.cuet.ac.bd')) {
        return 'student';
    }
    if (e === 'sajidislam729@gmail.com' || e.endsWith('@cuet.ac.bd')) {
        return 'teacher';
    }
    return null;
};