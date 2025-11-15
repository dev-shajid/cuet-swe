import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { Course } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface StudentCourseCardProps {
    course: Course;
    colors: ColorScheme;
    onCoursePress: (course: Course) => void;
}

export const StudentCourseCard: React.FC<StudentCourseCardProps> = ({
    course,
    colors,
    onCoursePress,
}) => {
    const styles = getStyles(colors);

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onCoursePress(course)}
        >
            <Card style={styles.courseCard}>
                <View style={styles.courseIconContainer}>
                    <Ionicons name="book" size={24} color={colors.primary} />
                </View>
                <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>{course.name}</Text>
                    <Text style={styles.courseCode}>{course.code}</Text>
                </View>
                <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.mutedForeground}
                />
            </Card>
        </TouchableOpacity>
    );
};

const getStyles = (colors: ColorScheme) =>
    StyleSheet.create({
        courseCard: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 12,
        },
        courseIconContainer: {
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: colors.primary + '15',
            justifyContent: 'center',
            alignItems: 'center',
        },
        courseInfo: {
            flex: 1,
        },
        courseName: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 4,
        },
        courseCode: {
            fontSize: 13,
            color: colors.primary,
            fontWeight: '500',
        },
    });