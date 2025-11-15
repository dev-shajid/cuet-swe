import Button from '@/components/ui/button';
import { Card, CardDescription } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Text } from '@/components/ui/text';
import { auth } from '@/config/firebase.config';
import { useAuth } from '@/hooks/use-auth';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import { getRole } from '@/utils/role';
import { signInWithEmailAndPassword } from '@firebase/auth';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface SignInFormData {
    email: string;
    password: string;
}

export default function SignInScreen() {
    const { colors } = useTheme();
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',
        }
    });

    const onSubmit = async (data: SignInFormData) => {
        try {
            setLoading(true);
            setError(null);

            // Check if email is valid
            const role = getRole(data.email);
            if (!role) {
                setError('Access denied. Only CUET students or teachers are allowed.');
                setLoading(false);
                return;
            }

            // Sign in existing user
            await signInWithEmailAndPassword(auth, data.email, data.password);
            console.log('✅ Login successful:', data.email);
            console.log('⏳ Waiting for auth state change listener to set session...');
        } catch (err: any) {
            console.log('❌ Authentication error:', err);

            let errorMessage = 'An unexpected error occurred. Please try again.';

            // Handle specific Firebase error codes
            switch (err.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address format.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email. Please sign up.';
                    break;
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = 'Incorrect password. Please try again.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many attempts. Please try again later.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection.';
                    break;
                default:
                    errorMessage = err.message || errorMessage;
            }

            setError(errorMessage);
            setLoading(false);
        }
    };

    // Show session errors if any
    useEffect(() => {
        if (session.error && session.status === 'unauthenticated') {
            setError(session.error);
        }
    }, [session.error, session.status]);

    if (loading || session.status === 'loading') {
        return (
            <Container style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={{ marginTop: 10, color: colors.mutedForeground }}>
                    Signing you in...
                </Text>
            </Container>
        );
    }

    const styles = getStyles(colors);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <Container style={styles.container}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.scrollContent}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <Image
                                style={{ width: 120, height: 120, resizeMode: 'contain' }}
                                source={require('@/assets/images/logo.png')}
                            />
                        </View>

                        {/* Header Text */}
                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>
                                Sign in to access your courses, notices, and academic resources
                            </Text>
                        </View>

                        {/* Main Content */}
                        <View style={styles.mainContent}>
                            {/* Error Card */}
                            {error && (
                                <Card style={styles.errorCard}>
                                    <CardDescription style={styles.errorText}>
                                        {error}
                                    </CardDescription>
                                </Card>
                            )}

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <Controller
                                    control={control}
                                    name="email"
                                    rules={{
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address'
                                        }
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            style={[
                                                styles.input,
                                                errors.email && styles.inputError
                                            ]}
                                            placeholder="your.email@cuet.ac.bd"
                                            placeholderTextColor={colors.mutedForeground}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            editable={!loading}
                                        />
                                    )}
                                />
                                {errors.email && (
                                    <Text style={styles.errorMessage}>{errors.email.message}</Text>
                                )}
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <Controller
                                    control={control}
                                    name="password"
                                    rules={{
                                        required: 'Password is required',
                                        minLength: {
                                            value: 6,
                                            message: 'Password must be at least 6 characters'
                                        }
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            style={[
                                                styles.input,
                                                errors.password && styles.inputError
                                            ]}
                                            placeholder="Enter your password"
                                            placeholderTextColor={colors.mutedForeground}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                            secureTextEntry
                                            editable={!loading}
                                        />
                                    )}
                                />
                                {errors.password && (
                                    <Text style={styles.errorMessage}>{errors.password.message}</Text>
                                )}
                            </View>

                            {/* Sign In Button */}
                            <Button
                                onPress={handleSubmit(onSubmit)}
                                activeOpacity={0.7}
                                disabled={loading}
                                loading={loading}
                            >
                                Sign In
                            </Button>
                            {/* Navigate to Sign Up */}
                            <TouchableOpacity
                                onPress={() => router.push('/signup')}
                                style={styles.toggleContainer}
                                disabled={loading}
                            >
                                <Text style={styles.toggleText}>
                                    Don't have an account?{' '}
                                    <Text style={styles.toggleLink}>Sign Up</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </Container>
        </KeyboardAvoidingView>
    );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100%',
    },
    scrollContent: {
        paddingVertical: 48,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    headerContainer: {
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
        color: colors.foreground,
    },
    subtitle: {
        textAlign: 'center',
        color: colors.mutedForeground,
        fontSize: 16,
        lineHeight: 24,
    },
    mainContent: {
        paddingHorizontal: 16,
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
        height: 56,
        borderWidth: 2,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: colors.foreground,
        backgroundColor: colors.background,
    },
    inputError: {
        borderColor: colors.destructive,
    },
    errorMessage: {
        color: colors.destructive,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    submitButton: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        backgroundColor: '#4285F4',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    toggleContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    toggleText: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
    toggleLink: {
        color: '#4285F4',
        fontWeight: '600',
    },
    errorCard: {
        backgroundColor: colors.destructive + '10',
        borderColor: colors.destructive + '40',
        marginBottom: 16,
        padding: 12,
    },
    errorText: {
        color: colors.destructive,
        textAlign: 'center',
    },
});