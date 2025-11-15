/**
 * Extract CUET student numeric ID from official student email.
 * Pattern example: u2104095@students.cuet.ac.bd -> 2104095
 * Returns null if email does not match expected student pattern.
 */
export const extractStudentIdFromEmail = (email: string): number | null => {
    if (!email) return null;
    const lower = email.toLowerCase().trim();
    // Strict pattern: leading 'u' followed by 7 digits then domain
    const match = lower.match(/^u(\d{7})@students\.cuet\.ac\.bd$/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
};