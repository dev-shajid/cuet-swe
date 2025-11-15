import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    TextInput,
    Modal
} from 'react-native';
import { useState } from 'react';
import { Container } from '@/components/ui/container';

interface Note {
    id: string;
    title: string;
    description?: string;
    priority: 'high' | 'medium' | 'low';
    completed: boolean;
    dueDate?: string;
    createdAt: string;
}

export default function NotesScreen() {
    const { isDarkMode } = useTheme();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [notes, setNotes] = useState<Note[]>([
        {
            id: '1',
            title: 'Publish CT-2 marks for CSE 301',
            description: 'Need to finalize and publish marks',
            priority: 'high',
            completed: false,
            dueDate: 'Today',
            createdAt: '2025-10-28',
        },
        {
            id: '2',
            title: 'Prepare CT-3 questions for CSE 303',
            priority: 'medium',
            completed: false,
            dueDate: 'Tomorrow',
            createdAt: '2025-10-27',
        },
        {
            id: '3',
            title: 'Review attendance records',
            description: 'Check last week attendance',
            priority: 'low',
            completed: true,
            dueDate: 'Yesterday',
            createdAt: '2025-10-26',
        },
        {
            id: '4',
            title: 'Update course materials for CSE 305',
            priority: 'medium',
            completed: false,
            dueDate: 'In 3 days',
            createdAt: '2025-10-25',
        },
        {
            id: '5',
            title: 'Schedule midterm exam',
            description: 'Coordinate with department',
            priority: 'high',
            completed: false,
            dueDate: 'Next week',
            createdAt: '2025-10-24',
        },
    ]);

    const filteredNotes = notes.filter(note => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'pending') return !note.completed;
        if (selectedFilter === 'completed') return note.completed;
        return true;
    });

    const toggleNoteCompletion = (noteId: string) => {
        setNotes(notes.map(note => 
            note.id === noteId ? { ...note, completed: !note.completed } : note
        ));
    };

    const deleteNote = (noteId: string) => {
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => {
                        setNotes(notes.filter(note => note.id !== noteId));
                    }
                }
            ]
        );
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#EF4444';
            case 'medium': return '#F59E0B';
            case 'low': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getPriorityBgColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#FEE2E2';
            case 'medium': return '#FEF3C7';
            case 'low': return '#D1FAE5';
            default: return '#F3F4F6';
        }
    };

    const stats = {
        total: notes.length,
        pending: notes.filter(n => !n.completed).length,
        completed: notes.filter(n => n.completed).length,
    };

    return (
        <Container useSafeArea={false}>
            <ScreenHeader 
                title="Notes & Tasks"
                subtitle={`${stats.pending} pending`}
                rightAction={{
                    icon: 'add',
                    onPress: () => setShowAddModal(true)
                }}
            />

            <View style={styles.container}>
                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={[
                        styles.statCard,
                        isDarkMode ? styles.cardDark : styles.cardLight
                    ]}>
                        <Text style={[styles.statValue, isDarkMode && styles.statValueDark]}>
                            {stats.total}
                        </Text>
                        <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>
                            Total
                        </Text>
                    </View>

                    <View style={[
                        styles.statCard,
                        isDarkMode ? styles.cardDark : styles.cardLight
                    ]}>
                        <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                            {stats.pending}
                        </Text>
                        <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>
                            Pending
                        </Text>
                    </View>

                    <View style={[
                        styles.statCard,
                        isDarkMode ? styles.cardDark : styles.cardLight
                    ]}>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>
                            {stats.completed}
                        </Text>
                        <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>
                            Done
                        </Text>
                    </View>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterTabs}>
                    {(['all', 'pending', 'completed'] as const).map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterTab,
                                selectedFilter === filter && (isDarkMode ? styles.filterTabActiveDark : styles.filterTabActiveLight)
                            ]}
                            onPress={() => setSelectedFilter(filter)}
                        >
                            <Text style={[
                                styles.filterTabText,
                                isDarkMode && styles.filterTabTextDark,
                                selectedFilter === filter && styles.filterTabTextActive
                            ]}>
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Notes List */}
                <ScrollView 
                    style={styles.notesList}
                    showsVerticalScrollIndicator={false}
                >
                    {filteredNotes.length > 0 ? (
                        filteredNotes.map((note) => (
                            <View
                                key={note.id}
                                style={[
                                    styles.noteCard,
                                    isDarkMode ? styles.cardDark : styles.cardLight,
                                    note.completed && styles.noteCardCompleted
                                ]}
                            >
                                {/* Checkbox */}
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => toggleNoteCompletion(note.id)}
                                >
                                    <View style={[
                                        styles.checkboxInner,
                                        note.completed && styles.checkboxChecked
                                    ]}>
                                        {note.completed && (
                                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                        )}
                                    </View>
                                </TouchableOpacity>

                                {/* Note Content */}
                                <View style={styles.noteContent}>
                                    <View style={styles.noteHeader}>
                                        <Text style={[
                                            styles.noteTitle,
                                            isDarkMode && styles.noteTitleDark,
                                            note.completed && styles.noteTitleCompleted
                                        ]}>
                                            {note.title}
                                        </Text>
                                        
                                        <View style={[
                                            styles.priorityBadge,
                                            { backgroundColor: getPriorityBgColor(note.priority) }
                                        ]}>
                                            <Text style={[
                                                styles.priorityText,
                                                { color: getPriorityColor(note.priority) }
                                            ]}>
                                                {note.priority}
                                            </Text>
                                        </View>
                                    </View>

                                    {note.description && (
                                        <Text style={[
                                            styles.noteDescription,
                                            isDarkMode && styles.noteDescriptionDark
                                        ]}>
                                            {note.description}
                                        </Text>
                                    )}

                                    <View style={styles.noteFooter}>
                                        {note.dueDate && (
                                            <View style={styles.dueDateContainer}>
                                                <Ionicons 
                                                    name="calendar-outline" 
                                                    size={14} 
                                                    color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                                                />
                                                <Text style={[
                                                    styles.dueDate,
                                                    isDarkMode && styles.dueDateDark
                                                ]}>
                                                    Due: {note.dueDate}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Delete Button */}
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => deleteNote(note.id)}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={[
                            styles.emptyState,
                            isDarkMode ? styles.cardDark : styles.cardLight
                        ]}>
                            <Ionicons 
                                name="clipboard-outline" 
                                size={64} 
                                color={isDarkMode ? '#64748B' : '#D1D5DB'} 
                            />
                            <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
                                No {selectedFilter === 'all' ? '' : selectedFilter} notes
                            </Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => setShowAddModal(true)}
                            >
                                <Text style={styles.addButtonText}>Add Your First Note</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.bottomSpacing} />
                </ScrollView>
            </View>
        </Container>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cardLight: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardDark: {
        backgroundColor: '#1E293B',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    statValueDark: {
        color: '#FFFFFF',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    statLabelDark: {
        color: '#9CA3AF',
    },
    filterTabs: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    filterTabActiveLight: {
        backgroundColor: '#2563EB',
    },
    filterTabActiveDark: {
        backgroundColor: '#3B82F6',
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    filterTabTextDark: {
        color: '#9CA3AF',
    },
    filterTabTextActive: {
        color: '#FFFFFF',
    },
    notesList: {
        flex: 1,
    },
    noteCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        gap: 12,
    },
    noteCardCompleted: {
        opacity: 0.6,
    },
    checkbox: {
        paddingTop: 2,
    },
    checkboxInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    noteContent: {
        flex: 1,
    },
    noteHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 8,
        gap: 8,
    },
    noteTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    noteTitleDark: {
        color: '#FFFFFF',
    },
    noteTitleCompleted: {
        textDecorationLine: 'line-through',
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    noteDescription: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
    },
    noteDescriptionDark: {
        color: '#9CA3AF',
    },
    noteFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dueDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dueDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    dueDateDark: {
        color: '#9CA3AF',
    },
    deleteButton: {
        padding: 4,
    },
    emptyState: {
        padding: 48,
        borderRadius: 16,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 16,
        marginBottom: 16,
    },
    emptyTextDark: {
        color: '#9CA3AF',
    },
    addButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    bottomSpacing: {
        height: 80,
    },
});