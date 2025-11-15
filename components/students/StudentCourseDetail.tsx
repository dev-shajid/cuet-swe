import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Text } from '@/components/ui/text';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface Course {
    id: string;
    name: string;
    code: string;
    section: string;
    semester: string;
    studentCount: number;
    teacherCount: number;
    createdAt: Date;
    progress?: number;
    instructor?: string;
    description?: string;
    schedule?: string;
    location?: string;
}

interface CourseDetailProps {
    course: Course;
}

export const CourseDetailScreen: React.FC<CourseDetailProps> = ({ course }) => {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState<'overview' | 'announcements' | 'materials'>('overview');
    const styles = getStyles(colors);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'information' as const },
        { id: 'announcements', label: 'Announcements', icon: 'megaphone' as const },
        { id: 'materials', label: 'Materials', icon: 'document' as const },
    ];

    const announcements = [
        {
            id: '1',
            title: 'Welcome to the Course',
            message: 'Welcome everyone! Please read the syllabus carefully.',
            date: new Date(),
        },
    ];

    const materials = [
        {
            id: '1',
            name: 'Lecture 1 - Introduction',
            type: 'PDF',
            date: new Date(),
        },
        {
            id: '2',
            name: 'Chapter 1 Reading',
            type: 'PDF',
            date: new Date(),
        },
    ];

    return (
        <Container useSafeArea={false} style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={colors.foreground}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{course.code}</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {/* Course Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.courseIconLarge}>
                        <Ionicons name="book" size={48} color={colors.primary} />
                    </View>
                    <Text style={styles.courseTitle}>{course.name}</Text>
                    <Text style={styles.instructorName}>{course.instructor}</Text>
                </View>

                {/* Progress Card */}
                {course.progress !== undefined && (
                    <Card style={styles.progressCard}>
                        <View style={styles.progressCardHeader}>
                            <Text style={styles.progressCardTitle}>Your Progress</Text>
                            <Text style={styles.progressPercent}>
                                {Math.round(course.progress)}%
                            </Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${course.progress}%`,
                                        backgroundColor: colors.primary,
                                    },
                                ]}
                            />
                        </View>
                    </Card>
                )}

                {/* Tab Navigation */}
                <View style={styles.tabNavigation}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tab,
                                activeTab === tab.id && styles.tabActive,
                            ]}
                            onPress={() =>
                                setActiveTab(tab.id as 'overview' | 'announcements' | 'materials')
                            }
                        >
                            <Ionicons
                                name={tab.icon}
                                size={20}
                                color={
                                    activeTab === tab.id
                                        ? colors.primary
                                        : colors.mutedForeground
                                }
                            />
                            <Text
                                style={[
                                    styles.tabLabel,
                                    activeTab === tab.id && styles.tabLabelActive,
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <View style={styles.tabContent}>
                        <CourseOverviewTab course={course} colors={colors} />
                    </View>
                )}

                {activeTab === 'announcements' && (
                    <View style={styles.tabContent}>
                        <CourseannouncementTab
                            announcements={announcements}
                            colors={colors}
                        />
                    </View>
                )}

                {activeTab === 'materials' && (
                    <View style={styles.tabContent}>
                        <CourseMaterialsTab materials={materials} colors={colors} />
                    </View>
                )}
            </ScrollView>
        </Container>
    );
};

/* Overview Tab Component */
const CourseOverviewTab: React.FC<{
    course: Course;
    colors: ColorScheme;
}> = ({ course, colors }) => {
    const styles = getStyles(colors);

    return (
        <>
            {/* Course Details */}
            <Card style={styles.detailCard}>
                <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                        <Ionicons
                            name="code-slash"
                            size={20}
                            color={colors.primary}
                        />
                    </View>
                    <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Course Code</Text>
                        <Text style={styles.detailValue}>{course.code}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                        <Ionicons name="grid" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Section</Text>
                        <Text style={styles.detailValue}>{course.section}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                        <Ionicons
                            name="calendar"
                            size={20}
                            color={colors.primary}
                        />
                    </View>
                    <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Semester</Text>
                        <Text style={styles.detailValue}>{course.semester}</Text>
                    </View>
                </View>

                {course.schedule && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.detailItem}>
                            <View style={styles.detailIconContainer}>
                                <Ionicons
                                    name="time"
                                    size={20}
                                    color={colors.primary}
                                />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Schedule</Text>
                                <Text style={styles.detailValue}>
                                    {course.schedule}
                                </Text>
                            </View>
                        </View>
                    </>
                )}

                {course.location && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.detailItem}>
                            <View style={styles.detailIconContainer}>
                                <Ionicons
                                    name="location"
                                    size={20}
                                    color={colors.primary}
                                />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Location</Text>
                                <Text style={styles.detailValue}>
                                    {course.location}
                                </Text>
                            </View>
                        </View>
                    </>
                )}
            </Card>

            {/* Class Statistics */}
            <Card style={styles.statsCard}>
                <Text style={styles.statsTitle}>Class Statistics</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Ionicons
                            name="people"
                            size={24}
                            color={colors.primary}
                        />
                        <Text style={styles.statValue}>{course.studentCount}</Text>
                        <Text style={styles.statLabel}>Students</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Ionicons
                            name="person"
                            size={24}
                            color={colors.primary}
                        />
                        <Text style={styles.statValue}>{course.teacherCount}</Text>
                        <Text style={styles.statLabel}>Instructors</Text>
                    </View>
                </View>
            </Card>
        </>
    );
};

/* Announcements Tab Component */
const CourseannouncementTab: React.FC<{
    announcements: Array<{ id: string; title: string; message: string; date: Date }>;
    colors: ColorScheme;
}> = ({ announcements, colors }) => {
    const styles = getStyles(colors);

    if (announcements.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Ionicons
                    name="megaphone-outline"
                    size={48}
                    color={colors.mutedForeground}
                />
                <Text style={styles.emptyStateText}>No announcements yet</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={announcements}
            renderItem={({ item }) => (
                <Card style={styles.announcementCard}>
                    <Text style={styles.announcementTitle}>{item.title}</Text>
                    <Text style={styles.announcementMessage}>{item.message}</Text>
                    <Text style={styles.announcementDate}>
                        {new Date(item.date).toLocaleDateString()}
                    </Text>
                </Card>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 12 }}
        />
    );
};

/* Materials Tab Component */
const CourseMaterialsTab: React.FC<{
    materials: Array<{ id: string; name: string; type: string; date: Date }>;
    colors: ColorScheme;
}> = ({ materials, colors }) => {
    const styles = getStyles(colors);

    if (materials.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Ionicons
                    name="document-outline"
                    size={48}
                    color={colors.mutedForeground}
                />
                <Text style={styles.emptyStateText}>No materials yet</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={materials}
            renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.7}>
                    <Card style={styles.materialCard}>
                        <View style={styles.materialIcon}>
                            <Ionicons
                                name="document"
                                size={24}
                                color={colors.primary}
                            />
                        </View>
                        <View style={styles.materialInfo}>
                            <Text style={styles.materialName}>{item.name}</Text>
                            <Text style={styles.materialMeta}>
                                {item.type} •{' '}
                                {new Date(item.date).toLocaleDateString()}
                            </Text>
                        </View>
                        <Ionicons
                            name="download"
                            size={20}
                            color={colors.primary}
                        />
                    </Card>
                </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 12 }}
        />
    );
};

const getStyles = (colors: ColorScheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        backButton: {
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.foreground,
            flex: 1,
            textAlign: 'center',
        },
        headerSpacer: {
            width: 40,
        },
        content: {
            paddingHorizontal: 16,
            paddingVertical: 16,
            gap: 16,
        },
        heroSection: {
            alignItems: 'center',
            marginBottom: 8,
        },
        courseIconLarge: {
            width: 80,
            height: 80,
            borderRadius: 16,
            backgroundColor: colors.primary + '15',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
        },
        courseTitle: {
            fontSize: 22,
            fontWeight: '700',
            color: colors.foreground,
            textAlign: 'center',
            marginBottom: 8,
        },
        instructorName: {
            fontSize: 14,
            color: colors.mutedForeground,
            fontWeight: '500',
        },
        progressCard: {
            padding: 16,
            gap: 12,
        },
        progressCardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        progressCardTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
        },
        progressPercent: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.primary,
        },
        progressBar: {
            height: 8,
            backgroundColor: colors.background,
            borderRadius: 4,
            overflow: 'hidden',
        },
        progressFill: {
            height: '100%',
            borderRadius: 4,
        },
        tabNavigation: {
            flexDirection: 'row',
            gap: 8,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        tab: {
            flex: 1,
            flexDirection: 'column',
            alignItems: 'center',
            paddingVertical: 12,
            gap: 4,
            borderBottomWidth: 3,
            borderBottomColor: 'transparent',
        },
        tabActive: {
            borderBottomColor: colors.primary,
        },
        tabLabel: {
            fontSize: 11,
            fontWeight: '600',
            color: colors.mutedForeground,
        },
        tabLabelActive: {
            color: colors.primary,
        },
        tabContent: {
            gap: 16,
        },
        detailCard: {
            padding: 16,
        },
        detailItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        detailIconContainer: {
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: colors.primary + '10',
            justifyContent: 'center',
            alignItems: 'center',
        },
        detailContent: {
            flex: 1,
        },
        detailLabel: {
            fontSize: 12,
            color: colors.mutedForeground,
            fontWeight: '500',
            marginBottom: 4,
        },
        detailValue: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
        },
        divider: {
            height: 1,
            backgroundColor: colors.border,
            marginVertical: 12,
        },
        statsCard: {
            padding: 16,
        },
        statsTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 12,
        },
        statsGrid: {
            flexDirection: 'row',
            gap: 12,
        },
        statBox: {
            flex: 1,
            alignItems: 'center',
            padding: 12,
            backgroundColor: colors.primary + '10',
            borderRadius: 10,
            gap: 6,
        },
        statValue: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.primary,
        },
        statLabel: {
            fontSize: 12,
            color: colors.mutedForeground,
            fontWeight: '500',
        },
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 48,
            gap: 12,
        },
        emptyStateText: {
            fontSize: 14,
            color: colors.mutedForeground,
            fontWeight: '500',
        },
        announcementCard: {
            padding: 16,
        },
        announcementTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.foreground,
            marginBottom: 8,
        },
        announcementMessage: {
            fontSize: 13,
            color: colors.foreground,
            lineHeight: 18,
            marginBottom: 8,
        },
        announcementDate: {
            fontSize: 11,
            color: colors.mutedForeground,
            fontWeight: '500',
        },
        materialCard: {
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        materialIcon: {
            width: 44,
            height: 44,
            borderRadius: 8,
            backgroundColor: colors.primary + '10',
            justifyContent: 'center',
            alignItems: 'center',
        },
        materialInfo: {
            flex: 1,
        },
        materialName: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 4,
        },
        materialMeta: {
            fontSize: 11,
            color: colors.mutedForeground,
        },
    });