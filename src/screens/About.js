import React from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Linking, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useTheme } from '../components/ThemeContext';
export default function AboutAppScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const APP_VERSION = '1.0.0';
    const BUILD_NUMBER = '2026.03.08';
    const DEVELOPER_EMAIL = 'ayoubbelme2003@gmail.com';
    const WEBSITE = 'https://calomate.app';
    const PRIVACY_POLICY = 'https://calomate.app/privacy';
    const TERMS_OF_SERVICE = 'https://calomate.app/terms';

    const openLink = (url) => {
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Could not open link');
        });
    };

    const sendEmail = () => {
        Linking.openURL(`mailto:${DEVELOPER_EMAIL}?subject=CaloMate Feedback`);
    };

    const shareApp = () => {
        Alert.alert(
            'Share CaloMate',
            'Share this app with your friends to help them achieve their fitness goals!',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Share', onPress: () => Alert.alert('Share feature coming soon!') }
            ]
        );
    };

    const rateApp = () => {
        Alert.alert(
            '⭐ Rate CaloMate',
            'Enjoying CaloMate? Please take a moment to rate us on the App Store!',
            [
                { text: 'Later', style: 'cancel' },
                { text: 'Rate Now', onPress: () => Alert.alert('Redirecting to App Store...') }
            ]
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* App Header */}
            <View style={styles.headerCard}>
                <View style={styles.logoCircle}>
                    <Image
                        source={require('../../assets/logo1.png')}
                        style={styles.avatarLogo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.appName}>CaloMate</Text>
                <Text style={styles.tagline}>Your Personal Nutrition Companion</Text>
                <View style={styles.versionBadge}>
                    <Text style={styles.versionText}>Version {APP_VERSION}</Text>
                </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="information-circle" size={24} color={theme.primary} />
                    <Text style={styles.sectionTitle}>About CaloMate</Text>
                </View>
                <View style={styles.descriptionCard}>
                    <Text style={styles.description}>
                        CaloMate is a comprehensive nutrition tracking app designed to help you achieve your health and fitness goals.
                        Track calories, monitor macros, analyze meals with AI, and stay consistent with your nutrition plan.
                    </Text>
                </View>
            </View>

            {/* Key Features */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="star" size={24} color={theme.primary} />
                    <Text style={styles.sectionTitle}>Key Features</Text>
                </View>
                <View style={styles.featuresCard}>
                    {[
                        { icon: 'flame', title: 'Calorie Tracking', desc: 'Monitor daily calorie intake with precision' },
                        { icon: 'nutrition', title: 'Macro Management', desc: 'Track protein, carbs, and fats effortlessly' },
                        { icon: 'planet', title: 'AI Meal Analysis', desc: 'Powered by open food facts & USDA' },
                        { icon: 'barbell', title: 'Workout Tracker', desc: 'Log exercises and monitor performance' },
                        { icon: 'scale', title: 'Weight Tracking', desc: 'Monitor your progress over time' },
                        { icon: 'analytics', title: 'Detailed Analytics', desc: 'Comprehensive stats and insights' },
                        { icon: 'calendar', title: 'Progress Photos', desc: 'Visual journey documentation' },
                    ].map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name={feature.icon} size={20} color={theme.primary} />
                            </View>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDesc}>{feature.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Developer Info */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="code-slash" size={24} color={theme.primary} />
                    <Text style={styles.sectionTitle}>Developer</Text>
                </View>
                <View style={styles.developerCard}>
                    <View style={styles.developerHeader}>
                        <View style={styles.developerAvatar}>
                            <Ionicons name="person" size={32} color={theme.primary} />
                        </View>
                        <View style={styles.developerInfo}>
                            <Text style={styles.developerName}>AyoubBelme</Text>
                            <Text style={styles.developerRole}>Fitness & Nutrition Tech</Text>
                        </View>
                    </View>
                    <Text style={styles.developerBio}>
                        Built with passion by a developer who believes in making nutrition tracking simple, accurate, and accessible for everyone on their fitness journey.
                    </Text>
                </View>
            </View>

            {/* Contact & Support */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="mail" size={24} color={theme.primary} />
                    <Text style={styles.sectionTitle}>Contact & Support</Text>
                </View>

                <TouchableOpacity style={styles.contactCard} onPress={sendEmail}>
                    <View style={styles.contactLeft}>
                        <Ionicons name="mail-outline" size={24} color={theme.info} />
                        <View>
                            <Text style={styles.contactTitle}>Email Support</Text>
                            <Text style={styles.contactValue}>{DEVELOPER_EMAIL}</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                </TouchableOpacity>

                {/* <TouchableOpacity style={styles.contactCard} onPress={() => openLink(WEBSITE)}>
                    <View style={styles.contactLeft}>
                        <Ionicons name="globe-outline" size={24} color={theme.success} />
                        <View>
                            <Text style={styles.contactTitle}>Website</Text>
                            <Text style={styles.contactValue}>calomate.app</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={ theme.textTertiary} />
                </TouchableOpacity> */}
            </View>

            {/* Social Media */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="share-social" size={24} color={theme.primary} />
                    <Text style={styles.sectionTitle}>Follow Me</Text>
                </View>
                <View style={styles.socialRow}>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => openLink('https://www.instagram.com/ay.oub514/')}
                    >
                        <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                        <Text style={styles.socialText}>Instagram</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => openLink('https://www.facebook.com/ayoub.blm.810567')}
                    >
                        <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                        <Text style={styles.socialText}>Facebook</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Quick Actions */}
            {/* <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="settings" size={24} color={theme.primary} />
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>

                <TouchableOpacity style={styles.actionCard} onPress={rateApp}>
                    <View style={styles.actionLeft}>
                        <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="star" size={22} color={theme.warning} />
                        </View>
                        <Text style={styles.actionTitle}>Rate CaloMate</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={ theme.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={shareApp}>
                    <View style={styles.actionLeft}>
                        <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                            <Ionicons name="share-outline" size={22} color={ theme.info} />
                        </View>
                        <Text style={styles.actionTitle}>Share with Friends</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={ theme.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => openLink(PRIVACY_POLICY)}
                >
                    <View style={styles.actionLeft}>
                        <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                            <Ionicons name="shield-checkmark" size={22} color={theme.primary} />
                        </View>
                        <Text style={styles.actionTitle}>Privacy Policy</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={ theme.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => openLink(TERMS_OF_SERVICE)}
                >
                    <View style={styles.actionLeft}>
                        <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
                            <Ionicons name="document-text" size={22} color={theme.success} />
                        </View>
                        <Text style={styles.actionTitle}>Terms of Service</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={ theme.textTertiary} />
                </TouchableOpacity>
            </View> */}

            {/* Credits */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="heart" size={24} color={theme.primary} />
                    <Text style={styles.sectionTitle}>Credits & Thanks</Text>
                </View>
                <View style={styles.creditsCard}>
                    <Text style={styles.creditsTitle}>Powered By</Text>
                    <View style={styles.creditsList}>
                        {/* <View style={styles.creditItem}>
                            <Ionicons name="planet" size={16} color={theme.primary} />
                            <Text style={styles.creditText}>Claude AI by Anthropic</Text>
                        </View> */}
                        <View style={styles.creditItem}>
                            <Ionicons name="nutrition" size={16} color={theme.success} />
                            <Text style={styles.creditText}>open food facts</Text>
                        </View>
                        <View style={styles.creditItem}>
                            <Ionicons name="flask" size={16} color={theme.info} />
                            <Text style={styles.creditText}>USDA FoodData Central</Text>
                        </View>
                        <View style={styles.creditItem}>
                            <Ionicons name="logo-react" size={16} color="#61DAFB" />
                            <Text style={styles.creditText}>React Native</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* App Info */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="cog" size={24} color={theme.primary} />
                    <Text style={styles.sectionTitle}>App Information</Text>
                </View>
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Version</Text>
                        <Text style={styles.infoValue}>{APP_VERSION}</Text>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Build Number</Text>
                        <Text style={styles.infoValue}>{BUILD_NUMBER}</Text>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Platform</Text>
                        <Text style={styles.infoValue}>React Native</Text>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>License</Text>
                        <Text style={styles.infoValue}>Proprietary</Text>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Ionicons name="heart" size={16} color={theme.error} />
                <Text style={styles.footerText}>Made with love for sports enthusiast</Text>
            </View>

            <View style={styles.copyright}>
                <Text style={styles.copyrightText}>© 2026 CaloMate. All rights reserved.</Text>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },

    // Header
    headerCard: {
        backgroundColor: theme.primary,
        paddingVertical: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 20,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 4,
        borderColor: theme.surface,
    },


    avatarLogo: {
        width: '150%',
        height: '150%',
    },
    appName: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.surface,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 15,
        color: '#E9D5FF',
        marginBottom: 16,
    },
    versionBadge: {
        backgroundColor: theme.surface,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    versionText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.primary,
    },

    // Section
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.text,
    },

    // Description
    descriptionCard: {
        backgroundColor: theme.surface,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    description: {
        fontSize: 15,
        color: theme.textSecondary,
        lineHeight: 24,
    },

    // Features
    featuresCard: {
        backgroundColor: theme.surface,
        borderRadius: 20,
        padding: 20,
        gap: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 13,
        color: theme.textTertiary,
        lineHeight: 18,
    },

    // Developer
    developerCard: {
        backgroundColor: theme.surface,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    developerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    developerAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    developerInfo: {
        flex: 1,
    },
    developerName: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 4,
    },
    developerRole: {
        fontSize: 13,
        color: theme.primary,
        fontWeight: '600',
    },
    developerBio: {
        fontSize: 14,
        color: theme.textSecondary,
        lineHeight: 22,
    },

    // Contact
    contactCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    contactLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    contactTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 13,
        color: theme.textTertiary,
    },

    // Social
    socialRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    socialButton: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    socialText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.text,
    },

    // Actions
    actionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text,
    },

    // Credits
    creditsCard: {
        backgroundColor: theme.surface,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    creditsTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 16,
    },
    creditsList: {
        gap: 12,
    },
    creditItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    creditText: {
        fontSize: 14,
        color: theme.textSecondary,
        fontWeight: '600',
    },

    // Info
    infoCard: {
        backgroundColor: theme.surface,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoDivider: {
        height: 1,
        backgroundColor: theme.divider,
        marginVertical: 12,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.text,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20,
        marginBottom: 12,
    },
    footerText: {
        fontSize: 13,
        color: theme.textTertiary,
        fontWeight: '600',
    },
    copyright: {
        alignItems: 'center',
        marginBottom: 20,
    },
    copyrightText: {
        fontSize: 12,
        color: '#D1D5DB',
        fontWeight: '600',
    },
});