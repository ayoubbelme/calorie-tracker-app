import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Switch, Alert, Linking, Modal, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from '../components/ProfileContext';
import { useTheme, THEMES } from '../components/ThemeContext';
import { useSound } from '../components/SoundContext';

const screenWidth = Dimensions.get('window').width;

export default function SettingsScreen({ navigation }) {
    const { soundEnabled, toggleSound } = useSound();
    const { name } = useProfile();
    const { theme, currentTheme, changeTheme } = useTheme();

    // Settings states
    const [notifications, setNotifications] = useState(true);
    const [weeklyReport, setWeeklyReport] = useState(true);
    const [soundEffects, setSoundEffects] = useState(true);
    const [hapticFeedback, setHapticFeedback] = useState(true);
    const [autoBackup, setAutoBackup] = useState(false);
    const [metricUnits, setMetricUnits] = useState(true);
    const [showThemeModal, setShowThemeModal] = useState(false);

    // Get all available themes
    const allThemes = Object.keys(THEMES);

    const handleClearData = () => {
        Alert.alert(
            '⚠️ Clear All Data',
            'This will permanently delete all your tracking data, progress photos, and settings. This action cannot be undone.\n\nAre you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Data',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.clear();
                            Alert.alert('Success', 'All data has been cleared. Please restart the app.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear data');
                        }
                    }
                }
            ]
        );
    };

    const handleExportData = () => {
        Alert.alert(
            'Export Data',
            'Choose export format',
            [
                { text: 'JSON', onPress: () => Alert.alert('Coming Soon', 'JSON export will be available soon') },
                { text: 'CSV', onPress: () => Alert.alert('Coming Soon', 'CSV export will be available soon') },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };



    const openURL = (url) => {
        Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link'));
    };

    const handleThemeChange = async (themeName) => {
        await changeTheme(themeName);
        setTimeout(() => setShowThemeModal(false), 200);
    };

    const styles = createStyles(theme);

    return (
        <>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
                    </View>
                    <Text style={styles.headerName}>{name || 'User'}</Text>
                    <Text style={styles.headerSubtitle}>Manage your preferences</Text>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACCOUNT</Text>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: theme.infoLight }]}>
                                <Ionicons name="person" size={20} color={theme.info} />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={styles.settingTitle}>Edit Profile</Text>
                                <Text style={styles.settingSubtitle}>Update your personal information</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => navigation.navigate('About')}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: theme.primaryLight }]}>
                                <Ionicons name="information-circle" size={20} color={theme.primary} />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={styles.settingTitle}>About</Text>
                                <Text style={styles.settingSubtitle}>App info & developer details</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>APPEARANCE</Text>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setShowThemeModal(true)}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: theme.primaryLight }]}>
                                <Ionicons name="color-palette" size={20} color={theme.primary} />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={styles.settingTitle}>Theme</Text>
                                <Text style={styles.settingSubtitle}>
                                    {THEMES[currentTheme]?.name || 'Light'} • Tap to change
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>
                </View>



                {/* Advanced Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ADVANCED</Text>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => navigation.navigate('Reminders')}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: theme.warningLight }]}>
                                <Ionicons name="time" size={20} color={theme.warning} />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={styles.settingTitle}>Reminders</Text>
                                <Text style={styles.settingSubtitle}>Manage notification reminders</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>


                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={handleClearData}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: theme.errorLight }]}>
                                <Ionicons name="trash" size={20} color={theme.error} />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={styles.settingTitle}>Clear All Data</Text>
                                <Text style={styles.settingSubtitle}>Delete all tracking data</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SUPPORT</Text>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => Linking.openURL('https://ayoubbelme.github.io/calomate-web/')}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: theme.infoLight }]}>
                                <Ionicons name="help-circle" size={20} color={theme.info} />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={styles.settingTitle}>Help & Support</Text>
                                <Text style={styles.settingSubtitle}>Get help or report issues</Text>
                            </View>
                        </View>
                        <Ionicons name="open-outline" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => Linking.openURL('https://ayoubbelme.github.io/calomate-web/#feedback')}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.settingIcon, { backgroundColor: theme.warningLight }]}>
                                <Ionicons name="star" size={20} color={theme.warning} />
                            </View>
                            <View style={styles.settingTextContainer}>
                                <Text style={styles.settingTitle}>Rate App</Text>
                                <Text style={styles.settingSubtitle}>Share your feedback</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>


                </View>



                {/* App Version */}
                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>CaloMate Version 1.0.0</Text>
                    <Text style={styles.versionSubtext}>Build 2026.03.08</Text>
                    <Text style={styles.madeWith}>Made with ❤️ for fitness enthusiasts</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Theme Selection Modal */}
            <Modal
                visible={showThemeModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowThemeModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowThemeModal(false)}
                >
                    <TouchableOpacity
                        style={styles.themeModalContent}
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.themeModalHeader}>
                            <View>
                                <Text style={styles.themeModalTitle}>Choose Theme</Text>
                                <Text style={styles.themeModalSubtitle}>Personalize your experience</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                                <Ionicons name="close-circle" size={32} color={theme.textTertiary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.themeScrollContent}
                        >
                            <View style={styles.themeGrid}>
                                {allThemes.map((themeName) => {
                                    const themeObj = THEMES[themeName];
                                    const isActive = currentTheme === themeName;

                                    return (
                                        <TouchableOpacity
                                            key={themeName}
                                            style={[
                                                styles.themeOption,
                                                {
                                                    borderColor: isActive ? themeObj.primary : theme.border,
                                                    borderWidth: isActive ? 3 : 2,
                                                }
                                            ]}
                                            onPress={() => handleThemeChange(themeName)}
                                            activeOpacity={0.7}
                                        >
                                            {/* Theme Preview */}
                                            <View style={styles.themePreview}>
                                                <View style={[styles.themePreviewTop, { backgroundColor: themeObj.background }]}>
                                                    <View style={[styles.themePreviewCard, { backgroundColor: themeObj.surface }]}>
                                                        <View style={[styles.themePreviewDot, { backgroundColor: themeObj.primary }]} />
                                                        <View style={[styles.themePreviewLine, { backgroundColor: themeObj.text }]} />
                                                        <View style={[styles.themePreviewLine, { backgroundColor: themeObj.textSecondary, width: '60%' }]} />
                                                    </View>
                                                </View>
                                                <View style={[styles.themePreviewColors, { backgroundColor: themeObj.surface }]}>
                                                    <View style={[styles.themeColorDot, { backgroundColor: themeObj.primary }]} />
                                                    <View style={[styles.themeColorDot, { backgroundColor: themeObj.calories }]} />
                                                    <View style={[styles.themeColorDot, { backgroundColor: themeObj.protein }]} />
                                                    <View style={[styles.themeColorDot, { backgroundColor: themeObj.carbs }]} />
                                                </View>
                                            </View>

                                            {/* Theme Name */}
                                            <View style={styles.themeNameContainer}>
                                                <Text style={[
                                                    styles.themeName,
                                                    { color: theme.text }
                                                ]}>
                                                    {themeObj.name}
                                                </Text>
                                                {themeObj.isDark && (
                                                    <Ionicons name="moon" size={14} color={theme.textTertiary} />
                                                )}
                                            </View>

                                            {/* Active Checkmark */}
                                            {isActive && (
                                                <View style={[styles.themeCheckmark, { backgroundColor: themeObj.primary }]}>
                                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },

    // Header
    header: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        backgroundColor: theme.surface,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: theme.shadowColor,
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: 20,
        elevation: 5,
        marginBottom: 20,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 4,
        borderColor: theme.primaryLight,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
    },
    headerName: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.text,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.textTertiary,
    },

    // Section
    section: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.textSecondary,
        letterSpacing: 1,
        marginBottom: 12,
    },

    // Setting Item
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    settingIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 13,
        color: theme.textTertiary,
    },

    // Danger Item
    dangerItem: {
        borderWidth: 1,
        borderColor: theme.errorLight,
    },

    // Version
    versionContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 40,
    },
    versionText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.textTertiary,
        marginBottom: 4,
    },
    versionSubtext: {
        fontSize: 11,
        color: theme.textTertiary,
        marginBottom: 16,
    },
    madeWith: {
        fontSize: 12,
        color: theme.textTertiary,
        fontStyle: 'italic',
    },

    // Theme Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    themeModalContent: {
        width: '100%',
        maxHeight: '85%',
        backgroundColor: theme.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    themeModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    themeModalTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.text,
        marginBottom: 4,
    },
    themeModalSubtitle: {
        fontSize: 14,
        color: theme.textTertiary,
    },
    themeScrollContent: {
        paddingBottom: 20,
    },
    themeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    themeOption: {
        width: (screenWidth - 64) / 2,
        backgroundColor: theme.background,
        borderRadius: 20,
        padding: 12,
        position: 'relative',
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    themePreview: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    themePreviewTop: {
        padding: 10,
        height: 90,
    },
    themePreviewCard: {
        borderRadius: 8,
        padding: 8,
        flex: 1,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        justifyContent: 'center',
    },
    themePreviewDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginBottom: 6,
    },
    themePreviewLine: {
        height: 5,
        borderRadius: 3,
        marginBottom: 4,
    },
    themePreviewColors: {
        flexDirection: 'row',
        gap: 6,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeColorDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    themeNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 40,
    },
    themeName: {
        fontSize: 15,
        fontWeight: '800',
        textAlign: 'center',
    },
    themeCheckmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
});