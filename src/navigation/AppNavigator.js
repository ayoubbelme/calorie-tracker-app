import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Modal, Pressable, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from '../screens/HomeScreen';
import AddMealScreen from '../screens/AddMealScreen';
import PlotScreen from '../screens/PlotScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import WorkoutCalendarScreen from '../screens/WorkoutCalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MacroSettingsScreen from '../screens/MacroSettingsScreen';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RemindersScreen from '../screens/RemindersScreen';
import About from '../screens/About';
import AchievementsScreen from '../screens/AchievementsScreen';
import { useTheme } from '../components/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Drawer Menu ───────────────────────────────────────────────────────
function DrawerMenu({ visible, onClose, navigation }) {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    
    const menuItems = [
        { icon: 'person-outline', label: 'Profile', screen: 'Profile', color: theme.primary },
        { icon: 'trophy-outline', label: 'Achievements', screen: 'Achievements', color: theme.warning },
        { icon: 'information-circle-outline', label: 'About', screen: 'About', color: theme.info },
        { icon: 'notifications-outline', label: 'Reminders', screen: 'Reminders', color: theme.error },
        { icon: 'settings-outline', label: 'Settings', screen: 'Settings', color: theme.textSecondary },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.drawerOverlay}>
                <Pressable style={styles.drawerBackdrop} onPress={onClose} />

                <SafeAreaView style={styles.drawerPanel} edges={['top', 'bottom']}>
                    {/* Header */}
                    <View style={styles.drawerHeader}>
                        <View style={styles.drawerAvatar}>
                            <Image
                                source={require('../../assets/logo1.png')}
                                style={styles.drawerAvatarImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.drawerName}>CaloMate</Text>
                        <Text style={styles.drawerSubtitle}>Track your health journey</Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Menu Items */}
                    <View style={styles.menuContainer}>
                        {menuItems.map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.drawerItem}
                                onPress={() => {
                                    onClose();
                                    if (item.screen) navigation.navigate(item.screen);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.drawerItemIcon, { backgroundColor: item.color + '20' }]}>
                                    <Ionicons name={item.icon} size={22} color={item.color} />
                                </View>
                                <Text style={styles.drawerItemText}>{item.label}</Text>
                                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Footer */}
                    <View style={styles.drawerFooter}>
                        <View style={styles.footerDivider} />
                        <Text style={styles.footerText}>Version 1.0.0</Text>
                        <Text style={styles.footerSubtext}>Made with ❤️ for your health</Text>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
}

// ── Bottom Tabs ───────────────────────────────────────────────────────
function Tabs({ navigation }) {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <>
            <DrawerMenu
                visible={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                navigation={navigation}
            />
            <Tab.Navigator
                screenOptions={{
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: theme.surface,
                        borderBottomColor: theme.border,
                        borderBottomWidth: 1,
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    headerShadowVisible: false,
                    headerTitleStyle: {
                        fontSize: 18,
                        fontWeight: '800',
                        color: theme.text,
                    },
                    headerTintColor: theme.text,
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => setDrawerOpen(true)}
                            style={styles.burgerBtn}
                        >
                            <Ionicons name="menu" size={26} color={theme.text} />
                        </TouchableOpacity>
                    ),
                    tabBarShowLabel: false,
                    tabBarActiveTintColor: theme.primary,
                    tabBarInactiveTintColor: theme.textTertiary,
                    tabBarStyle: {
                        backgroundColor: theme.surface,
                        borderTopColor: theme.border,
                        borderTopWidth: 1,
                        elevation: 0,
                        shadowOpacity: 0,
                    }
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        title: 'CaloMate',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="home" size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Calendar"
                    component={WorkoutCalendarScreen}
                    options={{
                        title: 'Calendar',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="calendar-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Add"
                    component={AddMealScreen}
                    options={{
                        title: 'Add Meal',
                        headerShown: false,
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="add-circle" size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Workout"
                    component={WorkoutScreen}
                    options={{
                        title: 'Workout',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="barbell-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Plots"
                    component={PlotScreen}
                    options={{
                        title: 'Stats',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="bar-chart" size={size} color={color} />
                        ),
                    }}
                />
            </Tab.Navigator>
        </>
    );
}

// ── Root Navigator ────────────────────────────────────────────────────
export default function AppNavigator() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const [isOnboarded, setIsOnboarded] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const completed = await AsyncStorage.getItem('onboarding_complete');
            setIsOnboarded(completed === 'true');
        } catch (error) {
            console.error('Failed to check onboarding status', error);
            setIsOnboarded(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingCard}>
                    <Image
                        source={require('../../assets/logo1.png')}
                        style={styles.loadingLogo}
                        resizeMode="contain"
                    />
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: theme.surface,
                        borderBottomColor: theme.border,
                    },
                    headerTintColor: theme.text,
                    headerTitleStyle: {
                        fontWeight: '700',
                        color: theme.text,
                    },
                    headerShadowVisible: false,
                }}
            >
                {!isOnboarded ? (
                    <Stack.Screen
                        name="Onboarding"
                        component={OnboardingScreen}
                        options={{ headerShown: false }}
                    />
                ) : null}

                <Stack.Screen
                    name="Main"
                    component={Tabs}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ title: 'Profile' }}
                />
                <Stack.Screen
                    name="About"
                    component={About}
                    options={{ title: 'About' }}
                />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ title: 'Settings' }}
                />
                <Stack.Screen
                    name="Achievements"
                    component={AchievementsScreen}
                    options={{ title: '🏆 Achievements' }}
                />
                <Stack.Screen
                    name="Reminders"
                    component={RemindersScreen}
                    options={{ title: 'Reminders' }}
                />
                <Stack.Screen
                    name="ManualInput"
                    component={AddMealScreen}
                    options={{ title: 'Manual Input' }}
                />
                <Stack.Screen
                    name="MacroSettings"
                    component={MacroSettingsScreen}
                    options={{ title: 'Macro Settings' }}
                />
                <Stack.Screen
                    name="ProfileSettings"
                    component={ProfileSettingsScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const createStyles = (theme) => StyleSheet.create({
    // Header
    burgerBtn: {
        marginLeft: 16,
        padding: 8,
        borderRadius: 12,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        backgroundColor: theme.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingCard: {
        backgroundColor: theme.surface,
        borderRadius: 28,
        padding: 40,
        alignItems: 'center',
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    loadingLogo: {
        width: 200,
        height: 200,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.textSecondary,
        marginTop: 16,
    },

    // Drawer
    drawerOverlay: {
        flex: 1,
        flexDirection: 'row',
    },
    drawerBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawerPanel: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 300,
        backgroundColor: theme.surface,
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },

    // Drawer Header
    drawerHeader: {
        backgroundColor: theme.primaryLight,
        padding: 28,
        paddingTop: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.primary + '40',
    },
    drawerAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 3,
        borderColor: theme.primary,
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    drawerAvatarImage: {
        width: 150,
        height: 150,
        overflow: 'hidden',
    },
    drawerName: {
        fontSize: 20,
        fontWeight: '900',
        color: theme.primary,
        marginBottom: 4,
    },
    drawerSubtitle: {
        fontSize: 13,
        color: theme.textSecondary,
        fontWeight: '600',
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: theme.divider,
        marginVertical: 12,
    },

    // Menu Items
    menuContainer: {
        flex: 1,
        paddingVertical: 8,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 14,
        borderRadius: 12,
        marginHorizontal: 12,
        marginVertical: 4,
    },
    drawerItemIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      
    },
    drawerItemText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
    },

    // Drawer Footer
    drawerFooter: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 12,
    },
    footerDivider: {
        height: 1,
        backgroundColor: theme.divider,
        marginBottom: 12,
    },
    footerText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.textTertiary,
        textAlign: 'center',
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 11,
        color: theme.textTertiary,
        textAlign: 'center',
        fontWeight: '600',
    },
});