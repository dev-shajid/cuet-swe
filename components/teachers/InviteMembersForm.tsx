import React from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TextInput as RNTextInput,
    TouchableOpacity,
} from 'react-native';
import { UseFormReturn, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ColorScheme } from '@/hooks/use-theme';

interface InviteFormData {
    type: 'teacher' | 'student';
    email?: string;
    startId?: string;
    endId?: string;
}

interface InviteMembersFormProps {
    form: UseFormReturn<InviteFormData>;
    onSubmit: (data: InviteFormData) => void;
    loading: boolean;
    colors: ColorScheme;
}

export const InviteMembersForm: React.FC<InviteMembersFormProps> = ({
    form,
    onSubmit,
    loading,
    colors,
}) => {
    const styles = getStyles(colors);
    const inviteType = form.watch('type');

    return (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
            {/* Type Selector */}
            <View style={styles.typeSelector}>
                <TouchableOpacity
                    style={[
                        styles.typeButton,
                        inviteType === 'teacher' && styles.typeButtonActive,
                    ]}
                    onPress={() => form.setValue('type', 'teacher')}
                >
                    <Ionicons
                        name="person"
                        size={20}
                        color={
                            inviteType === 'teacher'
                                ? colors.primaryForeground
                                : colors.mutedForeground
                        }
                    />
                    <Text
                        style={[
                            styles.typeButtonText,
                            inviteType === 'teacher' && styles.typeButtonTextActive,
                        ]}
                    >
                        Teacher
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.typeButton,
                        inviteType === 'student' && styles.typeButtonActive,
                    ]}
                    onPress={() => form.setValue('type', 'student')}
                >
                    <Ionicons
                        name="people"
                        size={20}
                        color={
                            inviteType === 'student'
                                ? colors.primaryForeground
                                : colors.mutedForeground
                        }
                    />
                    <Text
                        style={[
                            styles.typeButtonText,
                            inviteType === 'student' && styles.typeButtonTextActive,
                        ]}
                    >
                        Students
                    </Text>
                </TouchableOpacity>
            </View>

            {/* TEACHER MODE */}
            {inviteType === 'teacher' ? (
                <View>
                    {/* Teacher Email Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Teacher Email</Text>
                        <Controller
                            control={form.control}
                            name="email"
                            rules={{
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address',
                                },
                            }}
                            render={({ field: { onChange, value } }) => (
                                <RNTextInput
                                    style={styles.input}
                                    placeholder="teacher@cuet.ac.bd"
                                    placeholderTextColor={colors.mutedForeground}
                                    onChangeText={onChange}
                                    value={value}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            )}
                        />
                        {form.formState.errors.email && (
                            <Text style={styles.errorMessage}>
                                {form.formState.errors.email.message}
                            </Text>
                        )}
                    </View>

                    <Button
                        onPress={form.handleSubmit(onSubmit)}
                        disabled={loading}
                        loading={loading}
                    >
                        Send Invitations
                    </Button>
                </View>
            ) : (
                /* STUDENT MODE */
                <View>
                    {/* Starting Student ID */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Starting Student ID</Text>
                        <Controller
                            control={form.control}
                            name="startId"
                            rules={{
                                required: 'Starting ID is required',
                                pattern: {
                                    value: /^\d+$/,
                                    message: 'Must be a valid number',
                                },
                            }}
                            render={({ field: { onChange, value } }) => (
                                <RNTextInput
                                    style={styles.input}
                                    placeholder="e.g., 2101001"
                                    placeholderTextColor={colors.mutedForeground}
                                    onChangeText={onChange}
                                    value={value}
                                    keyboardType="number-pad"
                                />
                            )}
                        />
                        {form.formState.errors.startId && (
                            <Text style={styles.errorMessage}>
                                {form.formState.errors.startId.message}
                            </Text>
                        )}
                    </View>

                    {/* Ending Student ID */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Ending Student ID</Text>
                        <Controller
                            control={form.control}
                            name="endId"
                            rules={{
                                required: 'Ending ID is required',
                                pattern: {
                                    value: /^\d+$/,
                                    message: 'Must be a valid number',
                                },
                                validate: (value) => {
                                    const start = parseInt(
                                        form.getValues('startId') || '0'
                                    );
                                    const end = parseInt(value || '0');
                                    return (
                                        end >= start ||
                                        'Must be greater than or equal to starting ID'
                                    );
                                },
                            }}
                            render={({ field: { onChange, value } }) => (
                                <RNTextInput
                                    style={styles.input}
                                    placeholder="e.g., 2101050"
                                    placeholderTextColor={colors.mutedForeground}
                                    onChangeText={onChange}
                                    value={value}
                                    keyboardType="number-pad"
                                />
                            )}
                        />
                        {form.formState.errors.endId && (
                            <Text style={styles.errorMessage}>
                                {form.formState.errors.endId.message}
                            </Text>
                        )}
                    </View>

                    {/* Student Count Preview */}
                    {form.watch('startId') && form.watch('endId') && (
                        <Card style={styles.infoCard}>
                            <Text style={styles.infoText}>
                                This will invite{' '}
                                <Text style={styles.infoTextBold}>
                                    {Math.max(
                                        0,
                                        parseInt(form.watch('endId') || '0') -
                                            parseInt(form.watch('startId') || '0') +
                                            1
                                    )}
                                </Text>
                                {' '}students to the course
                            </Text>
                        </Card>
                    )}

                    <Button
                        onPress={form.handleSubmit(onSubmit)}
                        disabled={loading}
                        loading={loading}
                    >
                        Send Invitations
                    </Button>
                </View>
            )}
        </ScrollView>
    );
};

const getStyles = (colors: ColorScheme) =>
    StyleSheet.create({
        container: {
            paddingHorizontal: 20,
            paddingVertical: 16,
        },
        typeSelector: {
            flexDirection: 'row',
            gap: 12,
            marginBottom: 24,
        },
        typeButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: colors.secondary,
            borderWidth: 2,
            borderColor: colors.border,
            gap: 8,
        },
        typeButtonActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        typeButtonText: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.mutedForeground,
        },
        typeButtonTextActive: {
            color: colors.primaryForeground,
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
        infoCard: {
            backgroundColor: colors.primary + '10',
            borderColor: colors.primary + '40',
            padding: 16,
            marginBottom: 20,
        },
        infoText: {
            fontSize: 14,
            color: colors.foreground,
            textAlign: 'center',
        },
        infoTextBold: {
            fontWeight: '700',
            color: colors.primary,
        },
    });