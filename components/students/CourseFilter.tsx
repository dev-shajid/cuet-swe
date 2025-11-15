import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CourseFilter {
    searchText: string;
    semester: string;
}

interface CourseFilterProps {
    filters: CourseFilter;
    onFiltersChange: (filters: CourseFilter) => void;
    colors: ColorScheme;
    semesters: string[];
}

export const CourseFilter: React.FC<CourseFilterProps> = ({
    filters,
    onFiltersChange,
    colors,
    semesters,
}) => {
    const styles = getStyles(colors);

    const handleSearchChange = (text: string) => {
        onFiltersChange({
            ...filters,
            searchText: text,
        });
    };

    const handleSemesterChange = (semester: string) => {
        onFiltersChange({
            ...filters,
            semester: filters.semester === semester ? '' : semester,
        });
    };

    const handleClearFilters = () => {
        onFiltersChange({
            searchText: '',
            semester: '',
        });
    };

    const hasActiveFilters = filters.searchText !== '' || filters.semester !== '';

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons
                    name="search"
                    size={18}
                    color={colors.mutedForeground}
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search courses..."
                    placeholderTextColor={colors.mutedForeground}
                    value={filters.searchText}
                    onChangeText={handleSearchChange}
                />
                {filters.searchText !== '' && (
                    <TouchableOpacity
                        onPress={() => handleSearchChange('')}
                    >
                        <Ionicons
                            name="close-circle"
                            size={18}
                            color={colors.mutedForeground}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Semester Filter */}
            {semesters.length > 0 && (
                <View style={styles.filterSection}>
                    <View style={styles.filterHeader}>
                        <Text style={styles.filterLabel}>Semester</Text>
                        {hasActiveFilters && (
                            <TouchableOpacity onPress={handleClearFilters}>
                                <Text style={styles.clearButton}>Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.semesterList}
                    >
                        {semesters.map((semester) => (
                            <TouchableOpacity
                                key={semester}
                                style={[
                                    styles.semesterChip,
                                    filters.semester === semester &&
                                    styles.semesterChipActive,
                                ]}
                                onPress={() => handleSemesterChange(semester)}
                            >
                                <Text
                                    style={[
                                        styles.semesterChipText,
                                        filters.semester === semester &&
                                        styles.semesterChipTextActive,
                                    ]}
                                >
                                    {semester}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const getStyles = (colors: ColorScheme) =>
    StyleSheet.create({
        container: {
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.background,
        },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            height: 44,
            marginBottom: 12,
            gap: 8,
        },
        searchInput: {
            flex: 1,
            fontSize: 14,
            color: colors.foreground,
        },
        filterSection: {
            gap: 8,
        },
        filterHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        filterLabel: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.foreground,
        },
        clearButton: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.primary,
        },
        semesterList: {
            marginHorizontal: -16,
            paddingHorizontal: 16,
        },
        semesterChip: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: colors.secondary,
            borderWidth: 1,
            borderColor: colors.border,
            marginRight: 8,
        },
        semesterChipActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        semesterChipText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.mutedForeground,
        },
        semesterChipTextActive: {
            color: colors.primaryForeground,
        },
    });