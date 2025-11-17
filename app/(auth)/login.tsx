import { Card, CardDescription } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Text } from '@/components/ui/text';
import { auth } from '@/config/firebase.config';
import { useAuth } from '@/hooks/use-auth';
import { ColorScheme, useTheme } from '@/hooks/use-theme';
import { getRole } from '@/utils/role';
import { GoogleAuthProvider, signInWithCredential } from '@firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const { colors } = useTheme();
    const { session, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const signIn = async () => {
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

            console.log('✅ Login successful:', email);
            console.log('⏳ Waiting for auth state change listener to set session...');
        } catch (err: any) {
            console.log('❌ Sign-in error:', err);

            let errorMessage = 'An unexpected error occurred. Please try again.';

            // Handle specific error codes
            if (err.code === statusCodes.SIGN_IN_CANCELLED) {
                errorMessage = 'Sign-in was cancelled. Please try again to continue.';
            } else if (err.code === statusCodes.IN_PROGRESS) {
                errorMessage = 'Sign-in is already in progress. Please wait.';
            } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                errorMessage = 'Google Play Services is not available or outdated. Please update it from the Play Store.';
            } else if (err.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Too many attempts. Please try again later.';
            } else if (err.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled. Please contact support.';
            } else if (err.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign-in window was closed. Please try again.';
            } else if (err.message) {
                errorMessage = err.message;
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
        <Container>
            <View>
                {/* Logo/Icon Area */}
                <View style={styles.logoContainer}>
                    <Image
                        style={{ width: 140, height: 150, resizeMode: 'contain' }}
                        source={require('@/assets/images/logo.png')}
                    />
                </View>

                {/* Header Text */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>
                        Welcome Back
                    </Text>
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

                    {/* Google Sign In Button */}
                    <TouchableOpacity
                        onPress={signIn}
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

                    {/* Optional: Link to email/password signin */}
                    <TouchableOpacity
                        onPress={() => router.push('/signin')}
                        style={styles.toggleContainer}
                        disabled={loading}
                    >
                        <Text style={styles.toggleText}>
                            Use email and password instead
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Container>
    );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
    logoContainer: {
        paddingTop: 48,
        paddingBottom: 32,
        alignItems: 'center',
    },
    mainContent: {
        paddingHorizontal: 16,
        marginTop: 16,
    },
    headerContainer: {
        marginBottom: 24,
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
        paddingHorizontal: 16,
    },
    googleButton: {
        width: '100%',
        borderWidth: 2,
        borderRadius: 16,
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
    errorCard: {
        backgroundColor: colors.destructive + '10',
        borderColor: colors.destructive + '40',
        marginBottom: 16,
    },
    errorText: {
        color: colors.destructive,
        textAlign: 'center'
    },
    toggleContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    toggleText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '500',
    },
});
