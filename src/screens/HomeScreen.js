import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useCalories } from '../components/CaloriesContext';
import { useProfile } from '../components/ProfileContext';

const screenWidth = Dimensions.get('window').width;

// Large calorie ring component
const CalorieRing = ({ current, goal }) => {
    const size = 200;
    const radius = 85;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(current / goal, 1);
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <View style={styles.ringContainer}>
            <Svg width={size} height={size}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#F3F4F6"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#22C55E"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>
            <View style={styles.ringCenter}>
                <Text style={styles.ringCalories}>{Math.round(current)}</Text>
                <Text style={styles.ringLabel}>kcal</Text>
                <View style={styles.ringDivider} />
                <Text style={styles.ringGoal}>{goal} goal</Text>
            </View>
        </View>
    );
};

// Compact macro bar
const MacroBar = ({ label, value, goal, color, icon }) => {
    const progress = Math.min((value / goal) * 100, 100);
    return (
        <View style={styles.macroBar}>
            <View style={styles.macroBarHeader}>
                <View style={styles.macroBarLeft}>
                    <View style={[styles.macroIcon, { backgroundColor: color + '20' }]}>
                        <Ionicons name={icon} size={16} color={color} />
                    </View>
                    <Text style={styles.macroBarLabel}>{label}</Text>
                </View>
                <Text style={styles.macroBarValue}>
                    <Text style={{ color, fontWeight: '800' }}>{Math.round(value)}</Text>
                    <Text style={{ color: '#9CA3AF' }}> / {goal}g</Text>
                </Text>
            </View>
            <View style={styles.macroBarBg}>
                <View style={[styles.macroBarFill, { width: `${progress}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
};

// Quick stat card
const StatCard = ({ icon, label, value, color }) => (
    <View style={styles.statCard}>
        <View style={[styles.statIconBox, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

export default function HomeScreen({ navigation }) {
    const { todayCalories, todayProtein, todayCarbs, todayFat, history } = useCalories();
    const { name, calorieGoal, weight, height, goal, isLoaded } = useProfile();

    // Show loading while profile loads
    if (!isLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
            </View>
        );
    }

    // Calculate dynamic macro goals based on calorie goal
    const proteinGoal = Math.round((parseFloat(calorieGoal) * 0.30) / 4);
    const carbsGoal = Math.round((parseFloat(calorieGoal) * 0.40) / 4);
    const fatGoal = Math.round((parseFloat(calorieGoal) * 0.30) / 9);

    // Stats from history
    const historyKeys = Object.keys(history);
    const totalDays = historyKeys.length;

    // Current streak
    let streak = 0;
    let checkDate = new Date();
    while (true) {
        const key = checkDate.toISOString().split('T')[0];
        if (history[key]) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    // Average calories
    const allCalories = historyKeys.map(k => history[k].calories || 0);
    const avgCalories = totalDays ? Math.round(allCalories.reduce((a, b) => a + b, 0) / totalDays) : 0;

    // Remaining calories
    const remaining = Math.max(0, parseFloat(calorieGoal) - todayCalories);

    // Calculate BMI
    const bmi = weight && height
        ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)
        : '--';

    const firstName = name.split(' ')[0];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
        >
            {/* Greeting */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
                    <Text style={styles.date}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.profileBtn}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.profileEmoji}>💪</Text>
                </TouchableOpacity>
            </View>

            {/* Hero Card - Main Calorie Ring */}
            <View style={styles.heroCard}>
                <CalorieRing current={todayCalories} goal={parseFloat(calorieGoal)} />

                <View style={styles.heroFooter}>
                    <View style={styles.heroStat}>
                        <Ionicons name="flame" size={18} color="#22C55E" />
                        <Text style={styles.heroStatValue}>{Math.round(remaining)}</Text>
                        <Text style={styles.heroStatLabel}>remaining</Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStat}>
                        <Ionicons name="trending-up" size={18} color="#3B82F6" />
                        <Text style={styles.heroStatValue}>{streak}</Text>
                        <Text style={styles.heroStatLabel}>day streak</Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStat}>
                        <Ionicons name="analytics" size={18} color="#F59E0B" />
                        <Text style={styles.heroStatValue}>{avgCalories}</Text>
                        <Text style={styles.heroStatLabel}>avg/day</Text>
                    </View>
                </View>

                {/* Goal indicator */}
                <View style={styles.goalBadge}>
                    <Ionicons name="trophy" size={14} color="#F59E0B" />
                    <Text style={styles.goalBadgeText}>{goal}</Text>
                </View>
            </View>

            {/* Quick Stats Row */}
            <View style={styles.statsRow}>
                <StatCard icon="calendar" label="Days" value={totalDays} color="#6366F1" />
                <StatCard icon="scale" label="Weight" value={`${weight}kg`} color="#3B82F6" />
                <StatCard icon="body" label="BMI" value={bmi} color="#F59E0B" />
            </View>

            {/* Macros Card */}
            <View style={styles.macrosCard}>
                <View style={styles.macrosHeader}>
                    <Text style={styles.macrosTitle}>Today's Macros</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Plots')}>
                        <Text style={styles.macrosLink}>View Stats →</Text>
                    </TouchableOpacity>
                </View>
                <MacroBar
                    label="Protein"
                    value={todayProtein}
                    goal={proteinGoal}
                    color="#3B82F6"
                    icon="fitness"
                />
                <MacroBar
                    label="Carbs"
                    value={todayCarbs}
                    goal={carbsGoal}
                    color="#F59E0B"
                    icon="nutrition"
                />
                <MacroBar
                    label="Fat"
                    value={todayFat}
                    goal={fatGoal}
                    color="#EF4444"
                    icon="water"
                />
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsCard}>
                <Text style={styles.actionsTitle}>Quick Actions</Text>
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('Add')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                            <Ionicons name="add-circle" size={24} color="#22C55E" />
                        </View>
                        <Text style={styles.actionLabel}>Add Meal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('Plots')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="bar-chart" size={24} color="#3B82F6" />
                        </View>
                        <Text style={styles.actionLabel}>View Stats</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('Workout')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                            <Ionicons name="barbell" size={24} color="#EF4444" />
                        </View>
                        <Text style={styles.actionLabel}>Workout</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scroll: { paddingBottom: 40 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: { fontSize: 28, fontWeight: '800', color: '#111827' },
    date: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
    profileBtn: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    profileEmoji: { fontSize: 24 },

    // Hero Card
    heroCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6,
        position: 'relative',
    },
    ringContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
    ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    ringCalories: { fontSize: 44, fontWeight: '900', color: '#111827', letterSpacing: -1 },
    ringLabel: { fontSize: 14, color: '#9CA3AF', fontWeight: '600', marginTop: -4 },
    ringDivider: { width: 40, height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
    ringGoal: { fontSize: 13, color: '#6B7280', fontWeight: '600' },

    heroFooter: {
        flexDirection: 'row',
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        width: '100%',
        justifyContent: 'space-around',
    },
    heroStat: { alignItems: 'center', gap: 4 },
    heroStatValue: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 4 },
    heroStatLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
    heroStatDivider: { width: 1, backgroundColor: '#F3F4F6' },

    goalBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    goalBadgeText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },

    // Quick Stats Row
    statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
    statIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
    statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },

    // Macros Card
    macrosCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
    macrosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    macrosTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    macrosLink: { fontSize: 13, fontWeight: '600', color: '#22C55E' },

    macroBar: { marginBottom: 16 },
    macroBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    macroBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    macroIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    macroBarLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
    macroBarValue: { fontSize: 14 },
    macroBarBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 8, overflow: 'hidden' },
    macroBarFill: { height: '100%', borderRadius: 8 },

    // Actions
    actionsCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
    actionsTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    actionBtn: { alignItems: 'center', gap: 8 },
    actionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    actionLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
});