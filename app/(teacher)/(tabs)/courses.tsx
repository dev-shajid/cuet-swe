import { CourseCard } from '@/components/teachers/CourseCard';
import { CreateCourseModal } from '@/components/teachers/CreateCourseModal';
import { EmptyCoursesState } from '@/components/teachers/EmptyCoursesState';
import { Container } from '@/components/ui/container';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAuth } from '@/hooks/use-auth';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import {
    createCourse,
    getCourseStats,
    getTeacherCourses,
} from '@/services/course.service';
import { Course, CreateCourseFormData } from '@/types';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    View,
} from 'react-native';

interface CourseWithStats extends Course {
    studentCount: number;
    teacherCount: number;
}

export default function TeacherCoursesScreen() {
    const { colors } = useTheme();
    const { session: { user } } = useAuth();
    const [courses, setCourses] = useState<CourseWithStats[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const createForm = useForm<CreateCourseFormData>({
        defaultValues: {
            name: '',
        },
    });

    // Load courses on mount
    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            setRefreshing(true);
            if (!user?.email) return;

            const teacherCourses = await getTeacherCourses(user.email, true);

            // Load stats for each course
            const coursesWithStats = await Promise.all(
                teacherCourses.map(async (course) => {
                    const stats = await getCourseStats(course.id);
                    return {
                        ...course,
                        studentCount: stats?.studentCount || 0,
                        teacherCount: stats?.teacherCount || 0,
                    };
                })
            );

            setCourses(coursesWithStats);
        } catch (error) {
            console.error('Error loading courses:', error);
            Alert.alert('Error', 'Failed to load courses');
        } finally {
            setRefreshing(false);
        }
    };

    const onCreateCourse = async (data: CreateCourseFormData) => {
        try {
            setLoading(true);
            if (!user?.email) {
                Alert.alert('Error', 'User not authenticated');
                return;
            }

            const newCourse = await createCourse(data.name, user.email);

            if (newCourse) {
                Alert.alert('Success', `Course created with code: ${newCourse.code}`);
                setShowCreateModal(false);
                createForm.reset();
                await loadCourses(); // Reload courses
            } else {
                Alert.alert('Error', 'Failed to create course');
            }
        } catch (error) {
            console.error('Error creating course:', error);
            Alert.alert('Error', 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    const handleCoursePress = (course: CourseWithStats) => {
        router.push(`/(teacher)/screens/course_details?courseId=${course.id}`);
    };

    const styles = getStyles(colors);

    const renderCourseCard = ({ item }: { item: CourseWithStats }) => (
        <CourseCard
            course={item}
            colors={colors}
            onPress={() => handleCoursePress(item)}
        />
    );

    if (refreshing && courses.length === 0) {
        return (
            <Container useSafeArea={false} style={styles.container}>
                <ScreenHeader
                    title="My Courses"
                    subtitle="Manage your courses and students"
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </Container>
        );
    }

    return (
        <Container useSafeArea={false} style={styles.container}>
            {/* Header */}
            <ScreenHeader
                title="My Courses"
                subtitle="Manage your courses and students"
                rightAction={{
                    icon: 'add',
                    onPress: () => setShowCreateModal(true),
                    variant: 'primary',
                }}
            />

            {/* Courses List */}
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

            {/* Create Course Modal */}
            <CreateCourseModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                form={createForm}
                onSubmit={onCreateCourse}
                loading={loading}
                colors={colors}
            />
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
        },
    });