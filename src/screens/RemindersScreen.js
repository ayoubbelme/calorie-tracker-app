import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Switch, Alert, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../components/ThemeContext';
import Constants from 'expo-constants';

// ─── Only register notification handler in a real build (not Expo Go) ─────────
// expo-notifications remote/push features are not supported in Expo Go SDK 53+.
// Local scheduled notifications still work, but we guard the handler to avoid
// the warning and any runtime issues in Expo Go.
const IS_EXPO_GO = Constants.appOwnership === 'expo';

if (!IS_EXPO_GO) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,   // replaces deprecated shouldShowAlert
            shouldShowList: true,     // replaces deprecated shouldShowAlert
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
} else {
    // In Expo Go: minimal handler for local notifications
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,   // replaces deprecated shouldShowAlert
            shouldShowList: true,     // replaces deprecated shouldShowAlert
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

// ─── Reminder definitions ────────────────────────────────────────────────────
const REMINDER_TYPES = [
    {
        id: 'breakfast',
        title: 'Breakfast Time',
        desc: 'Never skip the most important meal',
        icon: 'sunny',
        color: '#F59E0B',
        defaultTime: '08:00',
        emoji: '🌅',
    },
    {
        id: 'lunch',
        title: 'Lunch Time',
        desc: 'Stay energized throughout the day',
        icon: 'restaurant',
        color: '#22C55E',
        defaultTime: '12:30',
        emoji: '🍽️',
    },
    {
        id: 'dinner',
        title: 'Dinner Time',
        desc: 'End your day with a healthy meal',
        icon: 'moon',
        color: '#8B5CF6',
        defaultTime: '19:00',
        emoji: '🌙',
    },
   
    {
        id: 'workout',
        title: 'Workout Time',
        desc: 'Time to move and stay active',
        icon: 'barbell',
        color: '#EF4444',
        defaultTime: '17:00',
        emoji: '💪',
    },
    {
        id: 'sleep',
        title: 'Bedtime',
        desc: 'Get quality rest for recovery',
        icon: 'bed',
        color: '#6B7280',
        defaultTime: '22:00',
        emoji: '😴',
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parseTime = (timeString) => {
    const safe = timeString || '09:00';
    const [hours, minutes] = safe.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
};

const formatTime = (timeString) => {
    const safe = timeString || '09:00';
    const [hours, minutes] = safe.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const display = hour % 12 || 12;
    return `${display}:${minutes} ${ampm}`;
};

const timeToHM = (date) => ({
    hours: date.getHours(),
    minutes: date.getMinutes(),
});

// ─── Main component ───────────────────────────────────────────────────────────
export default function RemindersScreen({ navigation }) {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const [reminders, setReminders] = useState({});
    const [showTimePicker, setShowTimePicker] = useState(null); // reminder id or null
    const [tempTime, setTempTime] = useState(new Date());
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initScreen();
    }, []);

    const initScreen = async () => {
        await checkPermissions();
        await loadReminders();
        setLoading(false);
    };

    // ── Permissions ────────────────────────────────────────────────────────────
    const checkPermissions = async () => {
        try {
            // Local scheduled notifications work in Expo Go, but permission
            // API behaves differently — treat Expo Go as always-granted for
            // local notifications so the UI doesn't block the user.
            if (IS_EXPO_GO) {
                setPermissionGranted(true);
                return true;
            }
            const { status } = await Notifications.getPermissionsAsync();
            if (status === 'granted') {
                setPermissionGranted(true);
                return true;
            }
            const { status: newStatus } = await Notifications.requestPermissionsAsync();
            const granted = newStatus === 'granted';
            setPermissionGranted(granted);
            return granted;
        } catch (error) {
            console.error('Permission check error:', error);
            // Fallback: assume granted so local notifications can still work
            setPermissionGranted(true);
            return true;
        }
    };

    // ── Storage ────────────────────────────────────────────────────────────────
    const loadReminders = async () => {
        try {
            const stored = await AsyncStorage.getItem('reminders');
            if (stored) {
                setReminders(JSON.parse(stored));
            } else {
                const defaults = {};
                REMINDER_TYPES.forEach(type => {
                    defaults[type.id] = { enabled: false, time: type.defaultTime };
                });
                setReminders(defaults);
                await AsyncStorage.setItem('reminders', JSON.stringify(defaults));
            }
        } catch (e) {
            console.error('Failed to load reminders:', e);
        }
    };

    const persistReminders = async (newReminders) => {
        try {
            await AsyncStorage.setItem('reminders', JSON.stringify(newReminders));
            setReminders(newReminders);
        } catch (e) {
            console.error('Failed to save reminders:', e);
        }
    };

    // ── Toggle ─────────────────────────────────────────────────────────────────
    const toggleReminder = async (id, enabled) => {
        // Gate on permission
        if (enabled) {
            const granted = await checkPermissions();
            if (!granted) {
                Alert.alert(
                    'Notifications Disabled',
                    'Please enable notifications in your device Settings to use reminders.',
                    [{ text: 'OK' }]
                );
                return;
            }
        }

        const reminderType = REMINDER_TYPES.find(r => r.id === id);
        const currentTime = reminders[id]?.time || reminderType?.defaultTime || '09:00';

        const newReminders = {
            ...reminders,
            [id]: { time: currentTime, enabled },
        };

        try {
            if (enabled) {
                await scheduleNotification(id, currentTime);
            } else {
                await cancelNotification(id);
            }
        } catch (e) {
            console.error(`Error ${enabled ? 'scheduling' : 'cancelling'} notification:`, e);
            Alert.alert('Error', `Failed to ${enabled ? 'enable' : 'disable'} reminder. Please try again.`);
            return; // Don't save state if scheduling failed
        }

        await persistReminders(newReminders);
    };

    // ── Time update ────────────────────────────────────────────────────────────
    const updateTime = async (id, time) => {
        const newReminders = {
            ...reminders,
            [id]: { ...reminders[id], time },
        };

        // Reschedule only if enabled
        if (reminders[id]?.enabled) {
            try {
                await cancelNotification(id);
                await scheduleNotification(id, time);
            } catch (e) {
                console.error('Failed to reschedule notification:', e);
                Alert.alert('Error', 'Failed to update reminder time. Please try again.');
                return;
            }
        }

        await persistReminders(newReminders);
        setShowTimePicker(null);
    };

    // ── Schedule notification ──────────────────────────────────────────────────
    const scheduleNotification = async (id, time) => {
        const reminder = REMINDER_TYPES.find(r => r.id === id);
        if (!reminder) throw new Error(`Unknown reminder id: ${id}`);

        // expo-notifications local scheduling works in Expo Go,
        // but SchedulableTriggerInputTypes may not exist in older SDKs —
        // fall back to the legacy object format when needed.
        const hasTriggerTypes = !!(
            Notifications.SchedulableTriggerInputTypes &&
            Notifications.SchedulableTriggerInputTypes.DAILY
        );

        // Always cancel existing first to avoid duplicates
        await cancelNotification(id);

        const { hours, minutes } = timeToHM(parseTime(time));

        if (reminder.recurring) {
            // Water reminder — schedule 5 notifications spaced 2 hours apart
            const offsets = [0, 2, 4, 6, 8];
            for (const offset of offsets) {
                const triggerHour = (hours + offset) % 24;
                await Notifications.scheduleNotificationAsync({
                    identifier: `${id}_${offset}`,
                    content: {
                        title: '💧 Hydration Time!',
                        body: 'Time to drink a glass of water. Stay hydrated!',
                        sound: 'default',
                    },
                    trigger: hasTriggerTypes
                        ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: triggerHour, minute: minutes }
                        : { hour: triggerHour, minute: minutes, repeats: true },
                });
            }
        } else if (reminder.weekly) {
            // Weekly reminder — every Monday (weekday 2 in expo = Monday)
            await Notifications.scheduleNotificationAsync({
                identifier: id,
                content: {
                    title: `${reminder.emoji} ${reminder.title}`,
                    body: reminder.desc,
                    sound: 'default',
                },
                trigger: hasTriggerTypes
                    ? { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 2, hour: hours, minute: minutes }
                    : { weekday: 2, hour: hours, minute: minutes, repeats: true },
            });
        } else {
            // Daily reminder
            await Notifications.scheduleNotificationAsync({
                identifier: id,
                content: {
                    title: `${reminder.emoji} ${reminder.title}`,
                    body: reminder.desc,
                    sound: 'default',
                },
                trigger: hasTriggerTypes
                    ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: hours, minute: minutes }
                    : { hour: hours, minute: minutes, repeats: true },
            });
        }
    };

    // ── Cancel notification ────────────────────────────────────────────────────
    const cancelNotification = async (id) => {
        const reminder = REMINDER_TYPES.find(r => r.id === id);
        if (!reminder) return;

        if (reminder.recurring) {
            const offsets = [0, 2, 4, 6, 8];
            await Promise.all(
                offsets.map(offset =>
                    Notifications.cancelScheduledNotificationAsync(`${id}_${offset}`).catch(() => { })
                )
            );
        } else {
            await Notifications.cancelScheduledNotificationAsync(id).catch(() => { });
        }
    };

    // ── Test notification ──────────────────────────────────────────────────────
    const testNotification = async () => {
        const granted = await checkPermissions();
        if (!granted) {
            Alert.alert('Notifications Disabled', 'Please enable notifications in Settings first.');
            return;
        }

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '✅ Test Notification',
                    body: 'Your reminders are working perfectly!',
                    sound: 'default',
                },
                trigger: (Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL)
                    ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 }
                    : { seconds: 3 },
            });
            Alert.alert('✅ Sent!', 'You should receive a test notification in 3 seconds.');
        } catch (error) {
            console.error('Test notification error:', error);
            Alert.alert('Error', 'Failed to send test notification. Make sure notifications are enabled.');
        }
    };

    // ── Time picker handlers ───────────────────────────────────────────────────
    const openTimePicker = (reminderId) => {
        const time = reminders[reminderId]?.time || REMINDER_TYPES.find(r => r.id === reminderId)?.defaultTime || '09:00';
        setTempTime(parseTime(time));
        setShowTimePicker(reminderId);
    };

    const handleTimeChange = (event, selectedDate) => {
        // On Android the picker closes itself; on iOS it stays open
        if (event.type === 'dismissed') {
            setShowTimePicker(null);
            return;
        }

        if (!selectedDate) return;

        if (Platform.OS === 'android') {
            // Android: picker already closed — commit the time immediately
            setShowTimePicker(null);
            const h = selectedDate.getHours().toString().padStart(2, '0');
            const m = selectedDate.getMinutes().toString().padStart(2, '0');
            if (showTimePicker) updateTime(showTimePicker, `${h}:${m}`);
        } else {
            // iOS: just update tempTime; user presses Done to commit
            setTempTime(selectedDate);
        }
    };

    const handleDone = () => {
        if (!showTimePicker) return;
        const h = tempTime.getHours().toString().padStart(2, '0');
        const m = tempTime.getMinutes().toString().padStart(2, '0');
        updateTime(showTimePicker, `${h}:${m}`);
    };

    // ── Derived ────────────────────────────────────────────────────────────────
    const enabledCount = Object.values(reminders).filter(r => r.enabled).length;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Permission banner */}
                {!permissionGranted && (
                    <View style={styles.permissionBanner}>
                        <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                        <View style={styles.permissionTextContainer}>
                            <Text style={styles.permissionTitle}>Notifications Disabled</Text>
                            <Text style={styles.permissionDesc}>Enable notifications to receive reminders</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.enableBtn}
                            onPress={async () => {
                                const granted = await checkPermissions();
                                if (!granted) {
                                    Alert.alert(
                                        'Enable in Settings',
                                        'Go to Settings → Notifications and allow notifications for this app.',
                                        [{ text: 'OK' }]
                                    );
                                }
                            }}
                        >
                            <Text style={styles.enableBtnText}>Enable</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Stats */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: theme.successLight || '#F0FDF4' }]}>
                            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                        </View>
                        <Text style={styles.statValue}>{enabledCount}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: theme.infoLight || '#EFF6FF' }]}>
                            <Ionicons name="time" size={20} color="#3B82F6" />
                        </View>
                        <Text style={styles.statValue}>{REMINDER_TYPES.length}</Text>
                        <Text style={styles.statLabel}>Available</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: '#F5F3FF' }]}>
                            <Ionicons name="notifications" size={20} color="#8B5CF6" />
                        </View>
                        <Text style={[styles.statValue, { color: permissionGranted ? '#22C55E' : '#EF4444' }]}>
                            {permissionGranted ? 'On' : 'Off'}
                        </Text>
                        <Text style={styles.statLabel}>Status</Text>
                    </View>
                </View>

                {/* Section title */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Daily Reminders</Text>
                    <Text style={styles.sectionSubtitle}>Stay on track with smart notifications</Text>
                </View>

                {/* Reminder cards */}
                {REMINDER_TYPES.map((reminder) => {
                    const data = reminders[reminder.id] || { enabled: false, time: reminder.defaultTime };

                    return (
                        <View key={reminder.id} style={styles.reminderCard}>
                            <View style={styles.reminderHeader}>
                                {/* Left: icon + info */}
                                <View style={styles.reminderLeft}>
                                    <View style={[styles.reminderIcon, { backgroundColor: reminder.color + '20' }]}>
                                        <Ionicons name={reminder.icon} size={24} color={reminder.color} />
                                    </View>
                                    <View style={styles.reminderInfo}>
                                        <View style={styles.reminderTitleRow}>
                                            <Text style={styles.reminderTitle}>{reminder.title}</Text>
                                            {reminder.recurring && (
                                                <View style={styles.recurringBadge}>
                                                    <Ionicons name="repeat" size={10} color="#3B82F6" />
                                                    <Text style={styles.recurringText}>Every 2hr</Text>
                                                </View>
                                            )}
                                            {reminder.weekly && (
                                                <View style={styles.weeklyBadge}>
                                                    <Ionicons name="calendar" size={10} color="#8B5CF6" />
                                                    <Text style={styles.weeklyText}>Weekly</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.reminderDesc}>{reminder.desc}</Text>
                                    </View>
                                </View>

                                {/* Right: time button + switch */}
                                <View style={styles.reminderRight}>
                                    {data.enabled && (
                                        <TouchableOpacity
                                            style={styles.timeBtn}
                                            onPress={() => openTimePicker(reminder.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="time-outline" size={14} color="#6B7280" />
                                            <Text style={styles.timeText}>{formatTime(data.time)}</Text>
                                        </TouchableOpacity>
                                    )}
                                    <Switch
                                        value={data.enabled}
                                        onValueChange={(value) => toggleReminder(reminder.id, value)}
                                        trackColor={{ false: '#E5E7EB', true: reminder.color + '60' }}
                                        thumbColor={data.enabled ? reminder.color : '#fff'}
                                        ios_backgroundColor="#E5E7EB"
                                    />
                                </View>
                            </View>

                            {/* Inline time picker */}
                            {showTimePicker === reminder.id && (
                                <View style={styles.timePickerContainer}>
                                    <DateTimePicker
                                        value={tempTime}
                                        mode="time"
                                        is24Hour={false}
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={handleTimeChange}
                                        themeVariant={theme.dark ? 'dark' : 'light'}
                                    />
                                    {Platform.OS === 'ios' && (
                                        <View style={styles.pickerActions}>
                                            <TouchableOpacity
                                                style={styles.cancelPickerBtn}
                                                onPress={() => setShowTimePicker(null)}
                                            >
                                                <Text style={styles.cancelPickerText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.doneBtn, { backgroundColor: reminder.color }]}
                                                onPress={handleDone}
                                            >
                                                <Text style={styles.doneBtnText}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* Pro tips */}
                <View style={styles.tipsCard}>
                    <View style={styles.tipsHeader}>
                        <Ionicons name="bulb" size={20} color="#F59E0B" />
                        <Text style={styles.tipsTitle}>Pro Tips</Text>
                    </View>
                    <View style={styles.tipsList}>
                        {[
                            'Set meal reminders to maintain a consistent eating schedule',
                            'Bedtime reminders ensure proper recovery and rest',
                        ].map((tip, i) => (
                            <View key={i} style={styles.tipItem}>
                                <View style={styles.tipDot} />
                                <Text style={styles.tipText}>{tip}</Text>
                            </View>
                        ))}
                    </View>
                </View>

               
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { flex: 1 },

    // Permission banner
    permissionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: '#FFFBEB',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#FDE68A',
    },
    permissionTextContainer: { flex: 1, marginLeft: 12 },
    permissionTitle: { fontSize: 14, fontWeight: '800', color: '#92400E', marginBottom: 2 },
    permissionDesc: { fontSize: 12, color: '#B45309' },
    enableBtn: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    enableBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

    // Stats
    statsCard: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: theme.surface,
        borderRadius: 20,
        padding: 20,
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 4 },
    statLabel: { fontSize: 11, color: theme.textTertiary, fontWeight: '600' },
    statDivider: { width: 1, backgroundColor: theme.divider },

    // Section header
    sectionHeader: {
        marginHorizontal: 20,
        marginTop: 28,
        marginBottom: 16,
    },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 4 },
    sectionSubtitle: { fontSize: 13, color: theme.textTertiary },

    // Reminder card
    reminderCard: {
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: theme.surface,
        borderRadius: 20,
        padding: 16,
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    reminderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    reminderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    reminderIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    reminderInfo: { flex: 1 },
    reminderTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    reminderTitle: { fontSize: 15, fontWeight: '800', color: theme.text },
    recurringBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    recurringText: { fontSize: 9, fontWeight: '800', color: '#3B82F6' },
    weeklyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F5F3FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    weeklyText: { fontSize: 9, fontWeight: '800', color: '#8B5CF6' },
    reminderDesc: { fontSize: 13, color: theme.textTertiary, lineHeight: 18 },

    reminderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    timeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.background,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: theme.border,
    },
    timeText: { fontSize: 12, fontWeight: '700', color: theme.text },

    // Time picker
    timePickerContainer: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: theme.divider,
    },
    pickerActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    cancelPickerBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: theme.divider,
        alignItems: 'center',
    },
    cancelPickerText: { fontSize: 14, fontWeight: '700', color: theme.textSecondary },
    doneBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    doneBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

    // Tips
    tipsCard: {
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: '#FFFBEB',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1.5,
        borderColor: '#FDE68A',
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    tipsTitle: { fontSize: 16, fontWeight: '800', color: '#92400E' },
    tipsList: { gap: 12 },
    tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    tipDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B',
        marginTop: 6,
    },
    tipText: { flex: 1, fontSize: 13, color: '#B45309', lineHeight: 20 },

    // Test card
    testCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginTop: 16,
        backgroundColor: theme.surface,
        borderRadius: 20,
        padding: 18,
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 2,
        borderColor: '#F5F3FF',
    },
    testLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    testIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F5F3FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    testTitle: { fontSize: 15, fontWeight: '800', color: theme.text, marginBottom: 4 },
    testDesc: { fontSize: 12, color: theme.textTertiary, lineHeight: 16 },
});