import { StudentCourseCard } from '@/components/students/StudentCourseCard';
import { EmptyCoursesState } from '@/components/teachers/EmptyCoursesState';
import { Container } from '@/components/ui/container';
import { useAuth } from '@/hooks/use-auth';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import { getStudentCourses } from '@/services/course.service';
import { Course } from '@/types';
import { extractStudentIdFromEmail } from '@/utils/studentId';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    View,
} from 'react-native';

export default function StudentCoursesScreen() {
    const { colors } = useTheme();
    const { session: { user } } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Load courses on mount
    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            setRefreshing(true);
            if (!user?.email) return;

            // Extract student ID from email
            const studentId = extractStudentIdFromEmail(user.email);
            if (!studentId) {
                console.error('Invalid student email format');
                return;
            }

            const studentCourses = await getStudentCourses(user.email, studentId);
            setCourses(studentCourses);
        } catch (error) {
            console.error('Error loading courses:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleCoursePress = (course: Course) => {
        router.push(`/(student)/screens/course_details?courseId=${course.id}`);
    };

    const styles = getStyles(colors);

    const renderCourseCard = ({ item }: { item: Course }) => (
        <StudentCourseCard
            course={item}
            colors={colors}
            onCoursePress={handleCoursePress}
        />
    );

    return (
        <Container style={styles.container}>

            {/* Courses List */}
            {refreshing && courses.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={courses}
                    renderItem={renderCourseCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onRefresh={loadCourses}
                    refreshing={refreshing}
                    ListEmptyComponent={<EmptyCoursesState colors={colors} />}
                />
            )}
        </Container>
    );
}

const getStyles = (colors: ColorScheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        listContent: {
            paddingHorizontal: 16,
            paddingVertical: 16,
            gap: 12,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 48,
        },
    });