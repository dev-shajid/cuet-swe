import { CourseCard } from '@/components/teachers/CourseCard';
import { CreateCourseModal } from '@/components/teachers/CreateCourseModal';
import { Modal } from '@/components/ui';
import { Container } from '@/components/ui/container';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import {
    createCourse,
    getCourseStats,
    getTeacherCourses,
    getTeacherCourseStatus,
    toggleTeacherCourseStatus,
} from '@/services/course.service';
import { Course, CreateCourseFormData } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CourseWithStats extends Course {
    studentCount: number;
    teacherCount: number;
}

// Include user-specific active status
interface CourseWithStatsAndStatus extends CourseWithStats {
    isActive: boolean;
}

type TabType = 'active' | 'archived';

export default function TeacherCoursesScreen() {
    const { colors } = useTheme();
    const { session: { user } } = useAuth();
    const [courses, setCourses] = useState<CourseWithStatsAndStatus[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [selectedCourse, setSelectedCourse] = useState<CourseWithStatsAndStatus | null>(null);
    const [showActionsModal, setShowActionsModal] = useState(false);

    const createForm = useForm<CreateCourseFormData>({
        defaultValues: {
            code: '',
            name: '',
            batch: new Date().getFullYear(),
            credit: 3.0,
            isSessional: false,
            bestCTCount: 3,
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

            // Load all courses (active + archived)
            const teacherCourses = await getTeacherCourses(user.email, false);

            // Load stats and active status for each course
            const coursesWithStatsAndStatus = await Promise.all(
                teacherCourses.map(async (course) => {
                    const stats = await getCourseStats(course.id);
                    const isActive = await getTeacherCourseStatus(course.id, user.email!);
                    return {
                        ...course,
                        studentCount: stats?.studentCount || 0,
                        teacherCount: stats?.teacherCount || 0,
                        isActive,
                    };
                })
            );

            setCourses(coursesWithStatsAndStatus);
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

            const newCourse = await createCourse(
                data.code,
                user.email,
                data.name,
                data.batch,
                data.credit,
                data.isSessional,
                data.bestCTCount
            );

            if (newCourse) {
                Alert.alert('Success', `Course created: ${data.code}`);
                setShowCreateModal(false);
                createForm.reset();
                await loadCourses();
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

    const handleCoursePress = (course: CourseWithStatsAndStatus) => {
        router.push(`/(teacher)/screens/course_details?courseId=${course.id}`);
    };

    const handleEditCourse = () => {
        setShowActionsModal(false);
        // TODO: Navigate to edit screen or show edit modal
        Alert.alert('Coming Soon', 'Course editing will be available soon');
    };

    const handleToggleArchive = async (course?: CourseWithStatsAndStatus) => {
        const targetCourse = course || selectedCourse;
        if (!targetCourse || !user?.email) return;

        try {
            setShowActionsModal(false);

            const success = await toggleTeacherCourseStatus(
                targetCourse.id,
                user.email,
                !targetCourse.isActive
            );

            if (success) {
                await loadCourses();
            } else {
                Alert.alert('Error', 'Failed to update course status');
            }
        } catch (error) {
            console.error('Error toggling archive:', error);
            Alert.alert('Error', 'Failed to update course status');
        }
    };

    // Filter courses based on search and active tab
    const filteredCourses = courses.filter((course) => {
        const matchesSearch =
            course.name.toLowerCase().includes(searchText.toLowerCase()) ||
            course.code.toLowerCase().includes(searchText.toLowerCase());

        const matchesTab = activeTab === 'active' ? course.isActive : !course.isActive;

        return matchesSearch && matchesTab;
    });

    const styles = getStyles(colors);

    const renderCourseCard = ({ item }: { item: CourseWithStatsAndStatus }) => (
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

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons
                        name="search"
                        size={20}
                        color={colors.mutedForeground}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search courses..."
                        placeholderTextColor={colors.mutedForeground}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons
                                name="close-circle"
                                size={20}
                                color={colors.mutedForeground}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'active' && styles.tabActive,
                    ]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'active' && styles.tabTextActive,
                        ]}
                    >
                        Active
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'archived' && styles.tabActive,
                    ]}
                    onPress={() => setActiveTab('archived')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'archived' && styles.tabTextActive,
                        ]}
                    >
                        Archived
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Courses List */}
            <FlatList
                data={filteredCourses}
                renderItem={renderCourseCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onRefresh={loadCourses}
                refreshing={refreshing}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons
                            name={activeTab === 'active' ? 'book-outline' : 'archive-outline'}
                            size={64}
                            color={colors.mutedForeground}
                        />
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'active' ? 'No active courses' : 'No archived courses'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === 'active'
                                ? 'Create a new course to get started'
                                : 'Long-press a course to archive it'}
                        </Text>
                    </View>
                }
            />

            {/* Course Actions Modal */}
            <Modal
                visible={showActionsModal}
                onClose={() => setShowActionsModal(false)}
                title={selectedCourse?.name || selectedCourse?.code || 'Course Actions'}
                colors={colors}
                options={[
                    {
                        label: 'Edit Course',
                        icon: 'pencil',
                        onPress: handleEditCourse,
                    },
                    {
                        label: selectedCourse?.isActive ? 'Archive' : 'Unarchive',
                        icon: selectedCourse?.isActive ? 'archive' : 'arrow-undo',
                        onPress: () => handleToggleArchive(),
                    },
                ]}
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
        searchContainer: {
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            backgroundColor: colors.background,
        },
        searchInputWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
            height: 48,
        },
        searchIcon: {
            marginRight: 8,
        },
        searchInput: {
            flex: 1,
            fontSize: 15,
            color: colors.foreground,
        },
        tabsContainer: {
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingBottom: 12,
            gap: 8,
        },
        tab: {
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 10,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
        },
        tabActive: {
            backgroundColor: colors.primary + '15',
            borderColor: colors.primary,
        },
        tabText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.mutedForeground,
        },
        tabTextActive: {
            color: colors.primary,
        },
        listContent: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            gap: 12,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 48,
            paddingHorizontal: 32,
        },
        emptyTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.foreground,
            marginTop: 16,
            marginBottom: 8,
        },
        emptySubtitle: {
            fontSize: 14,
            color: colors.mutedForeground,
            textAlign: 'center',
        },
    });