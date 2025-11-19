import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import {
  calculateAttendancePercentage,
  getCourseAttendance,
} from '@/services/attendance.service';
import {
  getStudentCourses,
  getStudentCourseStatus
} from '@/services/course.service';
import { getCourseClassTests, getStudentCourseMarks } from '@/services/ct.service';
import { ClassTest, Course } from '@/types';
import { extractStudentIdFromEmail } from '@/utils/role';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface CourseWithStats {
  course: Course;
  attendancePercentage: number;
  totalClasses: number;
  ctAverage: number;
  totalCTs: number;
  upcomingCTs: ClassTest[];
}

export default function StudentHomeTab() {
  const { colors } = useTheme();
  const { session: { user } } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coursesWithStats, setCoursesWithStats] = useState<CourseWithStats[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [avgAttendance, setAvgAttendance] = useState(0);
  const [upcomingCTs, setUpcomingCTs] = useState<{ course: Course; ct: ClassTest }[]>([]);

  const styles = getStyles(colors);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (!user?.email) return;

      const studentId = extractStudentIdFromEmail(user.email);
      if (!studentId) return;

      // Get all active courses
      const allCourses = await getStudentCourses(user.email, studentId, false);

      // Filter for active courses only
      const activeCourses = [];
      for (const course of allCourses) {
        const isActive = await getStudentCourseStatus(user.email, course.id);
        if (isActive) {
          activeCourses.push(course);
        }
      }

      setTotalCourses(activeCourses.length);

      // Get stats for each course
      const statsPromises = activeCourses.map(async (course) => {
        try {
          // Get student's section and ID for this course
          const studentData = user as any;
          const studentSection = studentData.section || undefined;
          const studentId = studentData.studentId || undefined;

          // Get attendance with section filter and studentId
          const attendancePercentage = await calculateAttendancePercentage(
            course.id,
            user.email!,
            studentSection,
            studentId
          );
          const allSessions = await getCourseAttendance(course.id, studentSection);
          const studentIdStr = studentId ? String(studentId) : user.email!;
          const totalClasses = allSessions.filter(
            session => studentIdStr in session.studentStatuses
          ).length;

          // Get CTs and marks
          const classTests = await getCourseClassTests(course.id);
          const publishedCTs = classTests.filter((ct) => ct.isPublished);
          const marks = await getStudentCourseMarks(course.id, user.email!);

          // Calculate average CT marks
          let ctAverage = 0;
          if (marks.length > 0 && marks.some((m) => m.status === 'present')) {
            const validMarks = marks
              .filter((m) => m.status === 'present' && m.marksObtained !== undefined)
              .map((m) => {
                const ct = publishedCTs.find((c) => c.id === m.ctId);
                return ct ? (m.marksObtained! / ct.totalMarks) * 100 : 0;
              });
            if (validMarks.length > 0) {
              ctAverage =
                validMarks.reduce((sum, mark) => sum + mark, 0) /
                validMarks.length;
            }
          }

          // Get upcoming CTs (published but not attempted)
          const attemptedCTIds = marks.map((m) => m.ctId);
          const upcomingCourseCTs = publishedCTs
            .filter((ct) => !attemptedCTIds.includes(ct.id))
            .slice(0, 2);

          return {
            course,
            attendancePercentage,
            totalClasses,
            ctAverage,
            totalCTs: publishedCTs.length,
            upcomingCTs: upcomingCourseCTs,
          };
        } catch (error) {
          console.error('Error loading stats for course:', error);
          return {
            course,
            attendancePercentage: 0,
            totalClasses: 0,
            ctAverage: 0,
            totalCTs: 0,
            upcomingCTs: [],
          };
        }
      });

      const stats = await Promise.all(statsPromises);
      setCoursesWithStats(stats);

      // Calculate overall average attendance
      if (stats.length > 0) {
        const totalAvg =
          stats.reduce((sum, s) => sum + s.attendancePercentage, 0) / stats.length;
        setAvgAttendance(Math.round(totalAvg));
      }

      // Collect all upcoming CTs across all courses
      const allUpcomingCTs: { course: Course; ct: ClassTest }[] = [];
      stats.forEach((s) => {
        s.upcomingCTs.forEach((ct) => {
          allUpcomingCTs.push({ course: s.course, ct });
        });
      });
      // Sort by date and take top 3
      allUpcomingCTs.sort(
        (a, b) => a.ct.date.toMillis() - b.ct.date.toMillis()
      );
      setUpcomingCTs(allUpcomingCTs.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleCoursePress = (courseId: string) => {
    router.push(`/(student)/screens/course_details?courseId=${courseId}`);
  };

  if (loading && !refreshing) {
    return (
      <Container style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color={colors.primary} />
            </View>
            <View style={styles.greeting}>
              <Text style={styles.greetingText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name || user?.email || 'Student'}</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="book" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{totalCourses}</Text>
            <Text style={styles.statLabel}>Active Courses</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color="#10B981"
              />
            </View>
            <Text style={styles.statValue}>{avgAttendance}%</Text>
            <Text style={styles.statLabel}>Avg Attendance</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="document-text" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{upcomingCTs.length}</Text>
            <Text style={styles.statLabel}>Upcoming CTs</Text>
          </Card>
        </View>

        {/* Upcoming Class Tests */}
        {upcomingCTs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Class Tests</Text>
              <Ionicons
                name="alert-circle"
                size={20}
                color="#F59E0B"
              />
            </View>
            {upcomingCTs.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleCoursePress(item.course.id)}
              >
                <Card style={styles.ctCard}>
                  <View style={styles.ctIconContainer}>
                    <Ionicons
                      name="document-text"
                      size={22}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.ctInfo}>
                    <Text style={styles.ctCourseName}>
                      {item.course.name}
                    </Text>
                    <Text style={styles.ctName}>{item.ct.name}</Text>
                    <Text style={styles.ctDate}>
                      {item.ct.date.toDate().toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* My Courses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Courses</Text>
            <TouchableOpacity onPress={() => router.push('/(student)/(tabs)/courses')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {coursesWithStats.length === 0 ? (
            <Card style={styles.courseCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="information-circle" size={20} color={colors.mutedForeground} />
                <Text style={[styles.courseStatText, { marginLeft: 8 }]}>No active courses yet. Enroll to see insights.</Text>
              </View>
            </Card>
          ) : (
            coursesWithStats.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.course.id}
                onPress={() => handleCoursePress(item.course.id)}
              >
                <Card style={styles.courseCard}>
                  <View style={styles.courseHeader}>
                    <View style={styles.courseIconContainer}>
                      <Ionicons
                        name="book"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseName}>
                        {item.course.name}
                      </Text>
                      <Text style={styles.courseCode}>
                        {item.course.code}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.courseStats}>
                    <View style={styles.courseStat}>
                      <Ionicons
                        name="calendar"
                        size={16}
                        color={colors.mutedForeground}
                      />
                      <Text style={styles.courseStatText}>
                        {item.totalClasses} classes
                      </Text>
                    </View>
                    <View style={styles.courseStat}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#10B981"
                      />
                      <Text style={styles.courseStatText}>
                        {item.attendancePercentage}% attendance
                      </Text>
                    </View>
                    {item.totalCTs > 0 && (
                      <View style={styles.courseStat}>
                        <Ionicons
                          name="document-text"
                          size={16}
                          color={colors.mutedForeground}
                        />
                        <Text style={styles.courseStatText}>
                          {item.ctAverage.toFixed(1)}% avg CT
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </Container>
  );
}

const getStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.mutedForeground,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 20,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary + '30',
    },
    greeting: {
      marginLeft: 12,
      flex: 1,
    },
    greetingText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontWeight: '500',
    },
    userName: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.foreground,
      marginTop: 2,
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      padding: 16,
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statIconContainer: {
      marginBottom: 8,
    },
    statValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontWeight: '500',
    },
    section: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
    },
    viewAllText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    ctCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      marginBottom: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    ctIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#F59E0B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    ctInfo: {
      flex: 1,
    },
    ctCourseName: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontWeight: '500',
    },
    ctName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      marginTop: 2,
    },
    ctDate: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    courseCard: {
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    courseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    courseIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    courseInfo: {
      flex: 1,
    },
    courseName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 2,
    },
    courseCode: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '500',
    },
    courseStats: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    courseStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    courseStatText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontWeight: '500',
    },
  });