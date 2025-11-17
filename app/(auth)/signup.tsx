import Button from '@/components/ui/button';
import { Card, CardDescription } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Text } from '@/components/ui/text';
import { auth } from '@/config/firebase.config';
import { useAuth } from '@/hooks/use-auth';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import { getRole } from '@/utils/role';
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithCredential, updateProfile } from '@firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
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

export interface SignUpFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export default function SignUpScreen() {
    const { colors } = useTheme();
    const { session, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors }, watch } = useForm<SignUpFormData>({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        }
    });

    const password = watch('password');

    const signUpWithGoogle = async () => {
        try {
            setLoading(true);
            setError(null);

            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            const googleUser = await GoogleSignin.signIn();

            if (!googleUser.data?.idToken) {
                throw new Error('Failed to get authentication token. Please try again.');
            }

            const googleCredential = GoogleAuthProvider.credential(googleUser.data.idToken);
            const userCredential = await signInWithCredential(auth, googleCredential);
            const email = userCredential.user.email;

            if (!email) {
                setError('Email not found in your account.');
                await signOut();
                setLoading(false);
                return;
            }

            const role = getRole(email);
            if (!role) {
                setError('Access denied. Only CUET students or teachers are allowed.');
                await signOut();
                setLoading(false);
                return;
            }

            console.log('✅ Google sign-up successful:', email);
            console.log('⏳ Waiting for auth state change listener to set session...');
        } catch (err: any) {
            console.log('❌ Google sign-up error:', err);

            let errorMessage = 'An unexpected error occurred. Please try again.';

            if (err.code === statusCodes.SIGN_IN_CANCELLED) {
                errorMessage = 'Sign-up was cancelled. Please try again to continue.';
            } else if (err.code === statusCodes.IN_PROGRESS) {
                errorMessage = 'Sign-up is already in progress. Please wait.';
            } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                errorMessage = 'Google Play Services is not available or outdated. Please update it from the Play Store.';
            } else if (err.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Too many attempts. Please try again later.';
            } else if (err.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled. Please contact support.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setLoading(false);
        }
    };

    const onSubmit = async (data: SignUpFormData) => {
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

            // Create new user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            // Update user profile with name
            await updateProfile(userCredential.user, {
                displayName: data.name,
            });

            console.log('✅ Sign up successful:', data.email);
            console.log('⏳ Waiting for auth state change listener to set session...');
        } catch (err: any) {
            console.log('❌ Registration error:', err);

            let errorMessage = 'An unexpected error occurred. Please try again.';

            // Handle specific Firebase error codes
            switch (err.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address format.';
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = 'An account with this email already exists. Please sign in.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password should be at least 6 characters.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Email/password accounts are not enabled. Please contact support.';
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
                    Creating your account...
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
            <Container>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.scrollContent}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <Image
                                style={{ width: 100, height: 100, resizeMode: 'contain' }}
                                source={require('@/assets/images/logo.png')}
                            />
                        </View>

                        {/* Header Text */}
                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>
                                Sign up to get started with your courses and academic resources
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

                            {/* Name Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Full Name</Text>
                                <Controller
                                    control={control}
                                    name="name"
                                    rules={{
                                        required: 'Name is required',
                                        minLength: {
                                            value: 2,
                                            message: 'Name must be at least 2 characters'
                                        },
                                        pattern: {
                                            value: /^[a-zA-Z\s]+$/,
                                            message: 'Name can only contain letters and spaces'
                                        }
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            style={[
                                                styles.input,
                                                errors.name && styles.inputError
                                            ]}
                                            placeholder="Enter your full name"
                                            placeholderTextColor={colors.mutedForeground}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                            autoCapitalize="words"
                                            editable={!loading}
                                        />
                                    )}
                                />
                                {errors.name && (
                                    <Text style={styles.errorMessage}>{errors.name.message}</Text>
                                )}
                            </View>

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
                                            placeholder="Create a password"
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

                            {/* Confirm Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <Controller
                                    control={control}
                                    name="confirmPassword"
                                    rules={{
                                        required: 'Please confirm your password',
                                        validate: (value) =>
                                            value === password || 'Passwords do not match'
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            style={[
                                                styles.input,
                                                errors.confirmPassword && styles.inputError
                                            ]}
                                            placeholder="Confirm your password"
                                            placeholderTextColor={colors.mutedForeground}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                            secureTextEntry
                                            editable={!loading}
                                        />
                                    )}
                                />
                                {errors.confirmPassword && (
                                    <Text style={styles.errorMessage}>
                                        {errors.confirmPassword.message}
                                    </Text>
                                )}
                            </View>

                            <Button
                                onPress={handleSubmit(onSubmit)}
                                activeOpacity={0.7}
                                disabled={loading}
                                loading={loading}
                            >
                                Sign Up
                            </Button>

                            {/* Divider */}
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Google Sign Up Button */}
                            <TouchableOpacity
                                onPress={signUpWithGoogle}
                                style={styles.googleButton}
                                activeOpacity={0.7}
                                disabled={loading}
                            >
                                <Image
                                    style={styles.googleIcon}
                                    source={{ uri: 'https://img.clerk.com/static/google.png?width=160' }}
                                />
                                <Text style={styles.googleButtonText}>
                                    Continue with Google
                                </Text>
                            </TouchableOpacity>

                            {/* Navigate to Sign In */}
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={styles.toggleContainer}
                                disabled={loading}
                            >
                                <Text style={styles.toggleText}>
                                    Already have an account?{' '}
                                    <Text style={styles.toggleLink}>Sign In</Text>
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
    scrollContent: {
        paddingVertical: 32,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    headerContainer: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
        color: colors.foreground,
    },
    subtitle: {
        textAlign: 'center',
        color: colors.mutedForeground,
        fontSize: 15,
        lineHeight: 22,
    },
    mainContent: {
        paddingHorizontal: 16,
    },
    inputContainer: {
        marginBottom: 18,
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
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    toggleContainer: {
        marginTop: 24,
        marginBottom: 16,
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
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: colors.mutedForeground,
        fontWeight: '500',
    },
    googleButton: {
        width: '100%',
        borderWidth: 2,
        borderRadius: 12,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderColor: colors.border,
        backgroundColor: colors.background,
    },
    googleIcon: {
        width: 24,
        height: 24,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
    },
});