import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, BorderRadius, Spacing } from '../theme';

interface DemoAccount {
    name: string;
    email: string;
    password: string;
    icon: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
    {
        name: 'Ramesh Patel',
        email: 'field.patel@vmc.gov.in',
        password: 'Field@123',
        icon: '👤',
    },
];

export function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setIsLoading(true);
        try {
            await login({ email: email.trim(), password });
        } catch (error: any) {
            const message = error.response?.data?.message || 'Login failed. Please verify the backend is running.';
            Alert.alert('Login Failed', message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickLogin = async (demo: DemoAccount) => {
        setEmail(demo.email);
        setPassword(demo.password);
        setLoadingEmail(demo.email);
        setIsLoading(true);

        try {
            await login({ email: demo.email, password: demo.password });
        } catch (error: any) {
            const message =
                error.response?.data?.message ||
                'Connection failed. Ensure backend is running and you executed: adb reverse tcp:3000 tcp:3000';
            Alert.alert('Login Failed', message);
        } finally {
            setIsLoading(false);
            setLoadingEmail(null);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logo}>🏛️</Text>
                        </View>
                        <Text style={styles.title}>VMC Field Engineer</Text>
                        <Text style={styles.subtitle}>Civic Grievance & Resolution Portal</Text>
                    </View>

                    {/* Quick 1-Tap Demo Logins */}
                    <View style={styles.demoSection}>
                        <View style={styles.demoHeader}>
                            <Text style={styles.demoSectionTitle}>Quick Demo Accounts</Text>
                            <Text style={styles.demoSectionBadge}>1-Tap Sign In</Text>
                        </View>

                        <View style={styles.demoList}>
                            {DEMO_ACCOUNTS.map((demo) => {
                                const isThisLoading = isLoading && loadingEmail === demo.email;
                                return (
                                    <TouchableOpacity
                                        key={demo.email}
                                        style={styles.demoCard}
                                        onPress={() => handleQuickLogin(demo)}
                                        disabled={isLoading}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.demoCardLeft}>
                                            <View style={styles.demoAvatar}>
                                                <Text style={styles.demoIcon}>{demo.icon}</Text>
                                            </View>
                                            <View style={styles.demoInfo}>
                                                <Text style={styles.demoName}>{demo.name}</Text>
                                                <Text style={styles.demoEmail}>{demo.email}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.demoArrow}>
                                            {isThisLoading ? (
                                                <ActivityIndicator size="small" color={Colors.primary} />
                                            ) : (
                                                <Text style={styles.demoArrowText}>→</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.orDivider}>
                        <View style={styles.orLine} />
                        <Text style={styles.orText}>OR CUSTOM SIGN IN</Text>
                        <View style={styles.orLine} />
                    </View>

                    {/* Manual Form */}
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, emailFocused && styles.labelFocused]}>
                                Official Email
                            </Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    emailFocused && styles.inputWrapperFocused,
                                ]}
                            >
                                <Text style={styles.inputIcon}>📧</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="officer@vmc.gov.in"
                                    placeholderTextColor={Colors.muted}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, passwordFocused && styles.labelFocused]}>
                                Password
                            </Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    passwordFocused && styles.inputWrapperFocused,
                                ]}
                            >
                                <Text style={styles.inputIcon}>🔒</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={Colors.muted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    editable={!isLoading}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading && !loadingEmail ? (
                                <ActivityIndicator color={Colors.white} size="small" />
                            ) : (
                                <Text style={styles.buttonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Vadodara Municipal Corporation · Automated AI Grievance System
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0a1e3d',
    },
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing['4xl'],
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    logoContainer: {
        width: 64,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
    },
    logo: {
        fontSize: 32,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: '#0f172a',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: Typography.fontSize.sm,
        color: '#64748b',
    },
    demoSection: {
        backgroundColor: '#ffffff',
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: Spacing.lg,
        elevation: 1,
    },
    demoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    demoSectionTitle: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.bold,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    demoSectionBadge: {
        fontSize: 10,
        fontWeight: Typography.fontWeight.bold,
        color: '#1A73E9',
        backgroundColor: '#E8F0FE',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    demoList: {
        gap: Spacing.sm,
    },
    demoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
    },
    demoCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    demoAvatar: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginRight: Spacing.md,
    },
    demoIcon: {
        fontSize: 18,
    },
    demoInfo: {
        flex: 1,
    },
    demoNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 1,
    },
    demoName: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.bold,
        color: '#0f172a',
    },
    roleBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
        borderWidth: 1,
    },
    roleBadgeText: {
        fontSize: 9,
        fontWeight: Typography.fontWeight.bold,
        textTransform: 'uppercase',
    },
    demoRole: {
        fontSize: Typography.fontSize.xs,
        color: '#334155',
        marginBottom: 1,
    },
    demoEmail: {
        fontSize: 10,
        color: '#94a3b8',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    demoArrow: {
        paddingLeft: Spacing.sm,
    },
    demoArrowText: {
        fontSize: 18,
        fontWeight: Typography.fontWeight.bold,
        color: '#1A73E9',
    },
    orDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.md,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#cbd5e1',
    },
    orText: {
        marginHorizontal: Spacing.md,
        fontSize: 10,
        fontWeight: Typography.fontWeight.bold,
        color: '#94a3b8',
        letterSpacing: 0.8,
    },
    form: {
        backgroundColor: '#ffffff',
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: Spacing.lg,
        elevation: 1,
    },
    inputContainer: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
        color: '#475569',
        marginBottom: Spacing.xs,
    },
    labelFocused: {
        color: '#1A73E9',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    inputWrapperFocused: {
        borderColor: '#1A73E9',
        backgroundColor: '#ffffff',
    },
    inputIcon: {
        fontSize: 14,
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        paddingVertical: Spacing.sm,
        fontSize: Typography.fontSize.sm,
        color: '#0f172a',
    },
    button: {
        marginTop: Spacing.xs,
        borderRadius: BorderRadius.lg,
        backgroundColor: '#1A73E9',
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: Colors.white,
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.bold,
    },
    footer: {
        alignItems: 'center',
        marginTop: Spacing.xs,
    },
    footerText: {
        color: '#94a3b8',
        fontSize: 10,
        textAlign: 'center',
    },
});
