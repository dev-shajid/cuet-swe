import Button from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { CreateCourseFormData } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CreateCourseModalProps {
    visible: boolean;
    onClose: () => void;
    form: UseFormReturn<CreateCourseFormData>;
    onSubmit: (data: CreateCourseFormData) => void;
    loading: boolean;
    colors: ColorScheme;
}

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
    visible,
    onClose,
    form,
    onSubmit,
    loading,
    colors,
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
                        <Text style={styles.modalTitle}>Create New Course</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons
                                name="close"
                                size={24}
                                color={colors.foreground}
                            />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Course Name */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Course Name</Text>
                            <Controller
                                control={form.control}
                                name="name"
                                rules={{ required: 'Course name is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., Data Structures and Algorithms"
                                        placeholderTextColor={colors.mutedForeground}
                                        onChangeText={onChange}
                                        value={value}
                                    />
                                )}
                            />
                            {form.formState.errors.name && (
                                <Text style={styles.errorMessage}>
                                    {form.formState.errors.name.message}
                                </Text>
                            )}
                        </View>

                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle" size={20} color={colors.primary} />
                            <Text style={styles.infoText}>
                                Course code will be automatically generated for easy sharing
                            </Text>
                        </View>

                        <Button
                            onPress={form.handleSubmit(onSubmit)}
                            disabled={loading}
                            loading={loading}
                        >
                            Create Course
                        </Button>
                    </ScrollView>
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
            alignItems: 'center',
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
        inputContainer: {
            marginBottom: 20,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 8,
        },
        input: {
            width: '100%',
            height: 52,
            borderWidth: 2,
            borderColor: colors.border,
            borderRadius: 12,
            paddingHorizontal: 16,
            fontSize: 16,
            color: colors.foreground,
            backgroundColor: colors.background,
        },
        errorMessage: {
            color: colors.destructive,
            fontSize: 12,
            marginTop: 4,
            marginLeft: 4,
        },
        infoBox: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: 12,
            backgroundColor: colors.primary + '10',
            borderRadius: 8,
            marginBottom: 16,
        },
        infoText: {
            flex: 1,
            fontSize: 13,
            color: colors.mutedForeground,
        },
    });