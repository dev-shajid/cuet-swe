import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { Course } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { InviteMembersForm } from './InviteMembersForm';

interface CourseWithStats extends Course {
    studentCount: number;
    teacherCount: number;
}

interface InviteFormData {
    type: 'teacher' | 'student';
    email?: string;
    startId?: string;
    endId?: string;
}

interface InviteMembersModalProps {
    visible: boolean;
    onClose: () => void;
    form: UseFormReturn<InviteFormData>;
    onSubmit: (data: InviteFormData) => void;
    loading: boolean;
    colors: ColorScheme;
    selectedCourse: CourseWithStats | null;
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
    visible,
    onClose,
    form,
    onSubmit,
    loading,
    colors,
    selectedCourse,
}) => {
    const styles = getStyles(colors);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>Invite Members</Text>
                            {selectedCourse && (
                                <Text style={styles.modalSubtitle}>
                                    {selectedCourse.name} ({selectedCourse.code})
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons
                                name="close"
                                size={24}
                                color={colors.foreground}
                            />
                        </TouchableOpacity>
                    </View>

                    <InviteMembersForm
                        form={form}
                        onSubmit={onSubmit}
                        loading={loading}
                        colors={colors}
                    />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const getStyles = (colors: ColorScheme) =>
    StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingBottom: 40,
            maxHeight: '90%',
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            marginBottom: 20,
        },
        modalTitle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.foreground,
        },
        modalSubtitle: {
            fontSize: 14,
            color: colors.mutedForeground,
            marginTop: 4,
        },
    });