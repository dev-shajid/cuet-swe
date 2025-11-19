import Button from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';
import { CreateCourseFormData } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
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
    const [isSessional, setIsSessional] = useState(false);

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
                        {/* Course Code */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>
                                Course Code <Text style={styles.required}>*</Text>
                            </Text>
                            <Controller
                                control={form.control}
                                name="code"
                                rules={{
                                    required: 'Course code is required',
                                    pattern: {
                                        value: /^[A-Z]{3}-\d{3}$/,
                                        message: 'Format must be like CSE-211'
                                    }
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., CSE-211"
                                        placeholderTextColor={colors.mutedForeground}
                                        onChangeText={(text) => onChange(text.toUpperCase())}
                                        value={value}
                                        autoCapitalize="characters"
                                        maxLength={7}
                                    />
                                )}
                            />
                            {form.formState.errors.code && (
                                <Text style={styles.errorMessage}>
                                    {form.formState.errors.code.message}
                                </Text>
                            )}
                        </View>

                        {/* Course Name (Optional) */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Course Name (Optional)</Text>
                            <Controller
                                control={form.control}
                                name="name"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., Data Structures"
                                        placeholderTextColor={colors.mutedForeground}
                                        onChangeText={onChange}
                                        value={value}
                                    />
                                )}
                            />
                        </View>

                        {/* Batch */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>
                                Batch <Text style={styles.required}>*</Text>
                            </Text>
                            <Controller
                                control={form.control}
                                name="batch"
                                rules={{
                                    required: 'Batch is required',
                                    pattern: {
                                        value: /^\d{4}$/,
                                        message: 'Must be 4 digits (e.g., 2024)'
                                    }
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., 2024"
                                        placeholderTextColor={colors.mutedForeground}
                                        onChangeText={onChange}
                                        value={value?.toString()}
                                        keyboardType="number-pad"
                                        maxLength={4}
                                    />
                                )}
                            />
                            {form.formState.errors.batch && (
                                <Text style={styles.errorMessage}>
                                    {form.formState.errors.batch.message}
                                </Text>
                            )}
                        </View>

                        {/* Credit */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>
                                Credit <Text style={styles.required}>*</Text>
                            </Text>
                            <Controller
                                control={form.control}
                                name="credit"
                                rules={{
                                    required: 'Credit is required',
                                    validate: (value) => {
                                        const num = parseFloat(value?.toString() || '0');
                                        if (isNaN(num) || num <= 0) return 'Must be a positive number';
                                        if (num > 10) return 'Credit cannot exceed 10';
                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g., 3.0"
                                        placeholderTextColor={colors.mutedForeground}
                                        onChangeText={onChange}
                                        value={value?.toString()}
                                        keyboardType="decimal-pad"
                                    />
                                )}
                            />
                            {form.formState.errors.credit && (
                                <Text style={styles.errorMessage}>
                                    {form.formState.errors.credit.message}
                                </Text>
                            )}
                        </View>

                        {/* Sessional Course Toggle */}
                        <View style={styles.switchContainer}>
                            <View style={styles.switchLabel}>
                                <Text style={styles.label}>Sessional Course</Text>
                                <Text style={styles.switchHint}>Lab/Project based course</Text>
                            </View>
                            <Controller
                                control={form.control}
                                name="isSessional"
                                render={({ field: { onChange, value } }) => (
                                    <Switch
                                        value={value || isSessional}
                                        onValueChange={(val) => {
                                            setIsSessional(val);
                                            onChange(val);
                                        }}
                                        trackColor={{ false: colors.border, true: colors.primary + '80' }}
                                        thumbColor={value || isSessional ? colors.primary : colors.mutedForeground}
                                    />
                                )}
                            />
                        </View>

                        {/* Best CT Count (Only if not sessional) */}
                        {!isSessional && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Best CT Count</Text>
                                <Controller
                                    control={form.control}
                                    name="bestCTCount"
                                    defaultValue={3}
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={styles.input}
                                            placeholder="3"
                                            placeholderTextColor={colors.mutedForeground}
                                            onChangeText={(text) => onChange(text ? parseInt(text) : 3)}
                                            value={value?.toString() || '3'}
                                            keyboardType="number-pad"
                                            maxLength={2}
                                        />
                                    )}
                                />
                                <Text style={styles.hint}>
                                    Number of best CTs to count for final grade
                                </Text>
                            </View>
                        )}

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
        required: {
            color: '#EF4444',
        },
        hint: {
            fontSize: 12,
            color: colors.mutedForeground,
            marginTop: 4,
        },
        switchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            paddingVertical: 8,
        },
        switchLabel: {
            flex: 1,
        },
        switchHint: {
            fontSize: 12,
            color: colors.mutedForeground,
            marginTop: 2,
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