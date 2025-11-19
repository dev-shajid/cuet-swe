import { ClassTest, Mark } from '@/types';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import * as XLSX from 'xlsx';
import { calculateAllStudentAttendancePercentages } from './attendance.service';
import { getCourseById, getEnrolledStudents } from './course.service';
import { getClassTestMarks } from './ct.service';

/**
 * Calculate attendance marks based on attendance percentage
 * Grading scale:
 * - Below 60%: 0 marks
 * - 60-69%: 20% of total
 * - 70-79%: 40% of total
 * - 80-89%: 60% of total
 * - 90-94%: 80% of total
 * - 95-100%: 100% of total
 */
export const calculateAttendanceMarks = (
    attendancePercentage: number,
    courseCredit: number
): number => {
    const totalMarks = courseCredit * 10;

    if (attendancePercentage < 60) return 0;
    if (attendancePercentage < 70) return totalMarks * 0.2;
    if (attendancePercentage < 80) return totalMarks * 0.4;
    if (attendancePercentage < 90) return totalMarks * 0.6;
    if (attendancePercentage < 95) return totalMarks * 0.8;
    return totalMarks;
};

/**
 * Export CT marks to Excel file
 * Fetches data from database
 */
export const exportCTMarks = async (ct: ClassTest): Promise<void> => {
    try {
        // Fetch data from database
        const marks = await getClassTestMarks(ct.id);
        const students = await getEnrolledStudents(ct.courseId);

        if (students.length === 0) {
            Alert.alert('No Students', 'No students enrolled in this course.');
            return;
        }

        // Prepare data for Excel
        const data = students
            .map((student) => {
                const mark = marks.find((m) => m.studentEmail === student.email);
                return {
                    'Student ID': student.studentId,
                    'Name': student.name,
                    'Email': student.email,
                    'Section': student.section || 'N/A',
                    'Status': mark?.status || 'absent',
                    'Marks Obtained': mark?.status === 'present' ? (mark.marksObtained ?? '-') : '-',
                    'Total Marks': ct.totalMarks,
                    'Percentage': mark?.status === 'present' && mark.marksObtained !== undefined
                        ? ((mark.marksObtained / ct.totalMarks) * 100).toFixed(2) + '%'
                        : '-',
                    'Feedback': mark?.feedback || '-',
                };
            })
            .sort((a, b) => a['Student ID'] - b['Student ID']);

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 12 }, // Student ID
            { wch: 25 }, // Name
            { wch: 30 }, // Email
            { wch: 10 }, // Status
            { wch: 15 }, // Marks Obtained
            { wch: 12 }, // Total Marks
            { wch: 12 }, // Percentage
            { wch: 30 }, // Feedback
        ];

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'CT Marks');

        // Generate Excel file
        const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

        // Save to file system
        const fileName = `${ct.name.replace(/[^a-z0-9]/gi, '_')}_marks.xlsx`;
        const file = new File(Paths.document, fileName);

        // Write base64 string to file
        await file.create();
        const buffer = Uint8Array.from(atob(wbout), c => c.charCodeAt(0));
        await file.write(buffer);

        // Share the file
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(file.uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: `Export ${ct.name} Marks`,
                UTI: 'com.microsoft.excel.xlsx',
            });
        } else {
            console.log('Sharing is not available on this device');
        } console.log('✅ CT marks exported successfully');
    } catch (error) {
        console.error('❌ Error exporting CT marks:', error);
        throw error;
    }
};

/**
 * Export comprehensive course report with attendance and CT marks
 * Fetches all data from database
 */
export const exportCourseReport = async (courseId: string): Promise<void> => {
    try {
        // Fetch course data
        const course = await getCourseById(courseId);
        if (!course) {
            Alert.alert('Error', 'Course not found');
            return;
        }

        // Fetch students
        const students = await getEnrolledStudents(courseId);
        if (students.length === 0) {
            Alert.alert('No Students', 'No students enrolled in this course.');
            return;
        }

        // Fetch attendance data
        const attendancePercentages = await calculateAllStudentAttendancePercentages(courseId);

        // Fetch all published CTs and their marks
        const { getCourseClassTests } = await import('./ct.service');
        const allCTs = await getCourseClassTests(courseId);
        const publishedCTs = allCTs.filter(ct => ct.isPublished);

        // Fetch marks for all CTs
        const allMarks: Record<string, Mark[]> = {};
        for (const ct of publishedCTs) {
            allMarks[ct.id] = await getClassTestMarks(ct.id);
        }

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Calculate best CT count
        const bestCTCount = course.bestCTCount || publishedCTs.length;
        const maxMarksOut = course.credit * 10; // Attendance marks out of credit × 10

        // Prepare data rows
        const data = students.map(student => {
            const attendancePercentage = attendancePercentages[student.email] || 0;
            const attendanceMarks = calculateAttendanceMarks(attendancePercentage, course.credit);

            // Get CT marks for this student
            const ctScores: number[] = [];
            const ctRow: any = {
                'Student ID': student.studentId,
                'Name': student.name,
                'Email': student.email,
                'Section': student.section || 'N/A',
                'Attendance %': attendancePercentage.toFixed(2) + '%',
                'Attendance Marks': `${attendanceMarks.toFixed(2)}/${maxMarksOut}`
            };

            // Add individual CT marks
            publishedCTs.forEach((ct, index) => {
                const mark = allMarks[ct.id]?.find(m => m.studentEmail === student.email);
                if (mark && mark.status === 'present' && mark.marksObtained !== undefined) {
                    const percentage = (mark.marksObtained / ct.totalMarks) * 100;
                    ctRow[`CT ${index + 1}`] = `${mark.marksObtained}/${ct.totalMarks} (${percentage.toFixed(1)}%)`;
                    ctScores.push(percentage);
                } else {
                    ctRow[`CT ${index + 1}`] = 'Absent';
                }
            });

            // Calculate best CT average
            if (ctScores.length > 0) {
                ctScores.sort((a, b) => b - a); // Sort descending
                const bestScores = ctScores.slice(0, Math.min(bestCTCount, ctScores.length));
                const bestCTAvg = bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length;
                ctRow[`Best ${bestCTCount} CT Average`] = bestCTAvg.toFixed(2) + '%';
            } else {
                ctRow[`Best ${bestCTCount} CT Average`] = 'N/A';
            }

            return ctRow;
        });

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(data);

        // Set column widths
        const colWidths = [
            { wch: 12 }, // Student ID
            { wch: 25 }, // Name
            { wch: 30 }, // Email
            { wch: 10 }, // Section
            { wch: 15 }, // Attendance %
            { wch: 18 }  // Attendance Marks
        ];

        // Add CT column widths
        publishedCTs.forEach(() => {
            colWidths.push({ wch: 20 });
        });
        colWidths.push({ wch: 20 }); // Best CT Average

        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Course Report');

        // Add course info sheet
        const courseInfo = [
            ['Course Code', course.code],
            ['Course Name', course.name],
            ['Credit', course.credit],
            ['Best CT Count', course.bestCTCount || 'All'],
            ['Total Students', students.length],
            ['Total CTs', publishedCTs.length],
            ['Report Generated', new Date().toLocaleString()]
        ];

        const wsInfo = XLSX.utils.aoa_to_sheet(courseInfo);
        wsInfo['!cols'] = [{ wch: 20 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, wsInfo, 'Course Info');

        // Generate Excel file
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

        // Convert base64 to buffer
        const buffer = Uint8Array.from(atob(wbout), c => c.charCodeAt(0));

        // Save file
        const fileName = `${course.code}_Course_Report.xlsx`;
        const file = new File(Paths.document, fileName);
        await file.create();
        await file.write(buffer);

        // Share file
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(file.uri);
            Alert.alert('Success', 'Course report exported successfully!');
        } else {
            Alert.alert('Error', 'Sharing is not available on this device');
        }
    } catch (error) {
        console.error('Error exporting course report:', error);
        Alert.alert('Error', 'Failed to export course report');
    }
};
