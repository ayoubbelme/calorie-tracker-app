import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Modal, Pressable, SafeAreaView, ActivityIndicator,
} from 'react-native';
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Drawer Menu ───────────────────────────────────────────────────────
function DrawerMenu({ visible, onClose, navigation }) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.drawerOverlay}>
                <Pressable style={styles.drawerBackdrop} onPress={onClose} />

                <View style={styles.drawerPanel}>
                    <SafeAreaView style={{ flex: 1 }}>
                        {/* Header */}
                        <View style={styles.drawerHeader}>
                            <View style={styles.drawerAvatar}>
                                <Text style={styles.drawerAvatarText}>💪</Text>
                            </View>
                            <Text style={styles.drawerName}>My Fitness</Text>
                            <Text style={styles.drawerSubtitle}>Track. Progress. Win.</Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Menu Items */}
                        {[
                            { icon: 'person-outline', label: 'Profile', screen: 'Profile' },
                            { icon: 'trophy-outline', label: 'Goals', screen: null },
                            { icon: 'notifications-outline', label: 'Reminders', screen: null },
                            { icon: 'nutrition-outline', label: 'Diet Plan', screen: null },
                            { icon: 'body-outline', label: 'Body Metrics', screen: null },
                        ].map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.drawerItem}
                                onPress={() => {
                                    onClose();
                                    if (item.screen) navigation.navigate(item.screen);
                                }}
                            >
                                <View style={styles.drawerItemIcon}>
                                    <Ionicons name={item.icon} size={20} color="#22C55E" />
                                </View>
                                <Text style={styles.drawerItemText}>{item.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                            </TouchableOpacity>
                        ))}

                        {/* Footer */}
                        <View style={styles.drawerFooter}>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.drawerItem} onPress={onClose}>
                                <View style={[styles.drawerItemIcon, { backgroundColor: '#FEF2F2' }]}>
                                    <Ionicons name="settings-outline" size={20} color="#9CA3AF" />
                                </View>
                                <Text style={styles.drawerItemText}>Settings</Text>
                                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>
            </View>
        </Modal>
    );
}

// ── Bottom Tabs ───────────────────────────────────────────────────────
function Tabs({ navigation }) {
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
                    headerStyle: styles.header,
                    headerShadowVisible: false,
                    headerTitleStyle: styles.headerTitle,
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => setDrawerOpen(true)}
                            style={styles.burgerBtn}
                        >
                            <Ionicons name="menu" size={26} color="#111827" />
                        </TouchableOpacity>
                    ),
                    tabBarShowLabel: false,
                    tabBarActiveTintColor: '#22C55E',
                    tabBarInactiveTintColor: '#9CA3AF',
                    tabBarStyle: styles.tabBar,
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        title: 'My Fitness',
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

    // Loading screen while checking onboarding status
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingCard}>
                    <Text style={styles.loadingEmoji}>💪</Text>
                    <ActivityIndicator size="large" color="#22C55E" style={{ marginTop: 20 }} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {!isOnboarded ? (
                    // Show onboarding first if not completed
                    <Stack.Screen
                        name="Onboarding"
                        component={OnboardingScreen}
                        options={{ headerShown: false }}
                    />
                ) : null}

                {/* Main app screens */}
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
                    name="ManualInput"
                    component={AddMealScreen}
                    options={{ title: 'Manual Input' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    header: { backgroundColor: '#F9FAFB', elevation: 0 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    burgerBtn: { marginLeft: 16, padding: 4 },
    tabBar: {
        borderTopWidth: 0,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },

    // Loading Screen
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingCard: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    loadingEmoji: { fontSize: 64 },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
    },

    // Drawer
    drawerOverlay: { flex: 1, flexDirection: 'row' },
    drawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    drawerPanel: {
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 300,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 20,
    },
    drawerHeader: {
        backgroundColor: '#111827',
        padding: 28,
        paddingTop: 52,
        alignItems: 'center',
    },
    drawerAvatar: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#1F2937',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
    },
    drawerAvatarText: { fontSize: 34 },
    drawerName: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
    drawerSubtitle: { fontSize: 12, color: '#9CA3AF' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 13,
        gap: 14,
    },
    drawerItemIcon: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: '#F0FDF4',
        alignItems: 'center', justifyContent: 'center',
    },
    drawerItemText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
    drawerFooter: { marginTop: 'auto', paddingBottom: 16 },
});