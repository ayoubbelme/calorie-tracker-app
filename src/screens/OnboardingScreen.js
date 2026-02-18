import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, TextInput, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from '../components/ProfileContext';

const screenWidth = Dimensions.get('window').width;

const GOALS = ['Lose Weight', 'Maintain', 'Gain Muscle'];
const ACTIVITY = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'];
const GENDERS = ['Male', 'Female'];

export default function OnboardingScreen({ navigation }) {
    const { updateProfile } = useProfile();
    const [step, setStep] = useState(0);

    // Form state
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [gender, setGender] = useState('Male');
    const [goal, setGoal] = useState('Maintain');
    const [activity, setActivity] = useState('Moderate');

    const handleComplete = async () => {
        // Calculate calorie goal based on inputs
        const bmr = gender === 'Male'
            ? 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseFloat(age) + 5
            : 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseFloat(age) - 161;

        const activityMultiplier = {
            'Sedentary': 1.2,
            'Light': 1.375,
            'Moderate': 1.55,
            'Active': 1.725,
            'Very Active': 1.9,
        }[activity];

        let calorieGoal = Math.round(bmr * activityMultiplier);

        // Adjust for goal
        if (goal === 'Lose Weight') calorieGoal -= 500;
        if (goal === 'Gain Muscle') calorieGoal += 300;

        // Save ALL profile data
        updateProfile({
            name,
            age,
            weight,
            height,
            gender,
            goal,
            activity,
            calorieGoal: String(calorieGoal),
        });
        // Mark onboarding complete
        await AsyncStorage.setItem('onboarding_complete', 'true');

        // Navigate to main app
        navigation.replace('Main');
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const canProceed = () => {
        if (step === 2) return name && age && weight && height;
        return true;
    };

    return (
        <View style={styles.container}>
            {/* Progress Dots */}
            <View style={styles.progressContainer}>
                {[0, 1, 2, 3, 4].map((i) => (
                    <View
                        key={i}
                        style={[
                            styles.progressDot,
                            i === step && styles.progressDotActive,
                            i < step && styles.progressDotComplete,
                        ]}
                    />
                ))}
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Step 0 - Welcome */}
                {step === 0 && (
                    <View style={styles.stepContainer}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconEmoji}>💪</Text>
                        </View>
                        <Text style={styles.title}>Welcome to MyFitness</Text>
                        <Text style={styles.description}>
                            Your personal fitness companion for tracking calories, macros, and workouts. Let's get you started!
                        </Text>
                        <View style={styles.featureList}>
                            {[
                                { icon: 'flame', text: 'Track daily calories & macros' },
                                { icon: 'bar-chart', text: 'Visualize your progress' },
                                { icon: 'barbell', text: 'Plan your workouts' },
                                { icon: 'trophy', text: 'Achieve your fitness goals' },
                            ].map((item, i) => (
                                <View key={i} style={styles.featureItem}>
                                    <View style={styles.featureIcon}>
                                        <Ionicons name={item.icon} size={20} color="#22C55E" />
                                    </View>
                                    <Text style={styles.featureText}>{item.text}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Step 1 - Features */}
                {step === 1 && (
                    <View style={styles.stepContainer}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconEmoji}>📊</Text>
                        </View>
                        <Text style={styles.title}>Powerful Insights</Text>
                        <Text style={styles.description}>
                            Get detailed analytics and track your nutrition journey with beautiful visualizations.
                        </Text>
                        <View style={styles.cardGrid}>
                            {[
                                { icon: 'analytics', label: 'Weekly Stats', color: '#6366F1' },
                                { icon: 'calendar', label: 'Daily Tracking', color: '#22C55E' },
                                { icon: 'restaurant', label: 'Meal Logging', color: '#F59E0B' },
                                { icon: 'fitness', label: 'Workout Plans', color: '#EF4444' },
                            ].map((item, i) => (
                                <View key={i} style={styles.featureCard}>
                                    <View style={[styles.featureCardIcon, { backgroundColor: item.color + '20' }]}>
                                        <Ionicons name={item.icon} size={28} color={item.color} />
                                    </View>
                                    <Text style={styles.featureCardLabel}>{item.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Step 2 - Basic Info */}
                {step === 2 && (
                    <View style={styles.stepContainer}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconEmoji}>👤</Text>
                        </View>
                        <Text style={styles.title}>Tell Us About You</Text>
                        <Text style={styles.description}>
                            We'll use this to calculate your personalized calorie goal.
                        </Text>

                        <View style={styles.form}>
                            <Text style={styles.label}>Your Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. John Smith"
                                placeholderTextColor="#9CA3AF"
                                value={name}
                                onChangeText={setName}
                            />

                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.chipRow}>
                                {GENDERS.map(g => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[styles.chip, gender === g && styles.chipActive]}
                                        onPress={() => setGender(g)}
                                    >
                                        <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Age</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="25"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        value={age}
                                        onChangeText={setAge}
                                    />
                                </View>
                                <View style={{ width: 12 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Weight (kg)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="70"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        value={weight}
                                        onChangeText={setWeight}
                                    />
                                </View>
                            </View>

                            <Text style={styles.label}>Height (cm)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="175"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={height}
                                onChangeText={setHeight}
                            />
                        </View>
                    </View>
                )}

                {/* Step 3 - Goals & Activity */}
                {step === 3 && (
                    <View style={styles.stepContainer}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconEmoji}>🎯</Text>
                        </View>
                        <Text style={styles.title}>Your Fitness Goal</Text>
                        <Text style={styles.description}>
                            What do you want to achieve?
                        </Text>

                        <View style={styles.form}>
                            <Text style={styles.label}>Primary Goal</Text>
                            <View style={styles.chipRow}>
                                {GOALS.map(g => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[styles.chip, goal === g && styles.chipActive]}
                                        onPress={() => setGoal(g)}
                                    >
                                        <Text style={[styles.chipText, goal === g && styles.chipTextActive]}>{g}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Activity Level</Text>
                            {ACTIVITY.map(a => (
                                <TouchableOpacity
                                    key={a}
                                    style={[styles.activityOption, activity === a && styles.activityOptionActive]}
                                    onPress={() => setActivity(a)}
                                >
                                    <View style={styles.activityLeft}>
                                        <View style={[
                                            styles.activityRadio,
                                            activity === a && styles.activityRadioActive
                                        ]}>
                                            {activity === a && <View style={styles.activityRadioDot} />}
                                        </View>
                                        <Text style={[styles.activityLabel, activity === a && styles.activityLabelActive]}>
                                            {a}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Step 4 - Complete */}
                {step === 4 && (
                    <View style={styles.stepContainer}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconEmoji}>🎉</Text>
                        </View>
                        <Text style={styles.title}>You're All Set!</Text>
                        <Text style={styles.description}>
                            Based on your information, we've calculated your personalized nutrition plan.
                        </Text>

                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Daily Calorie Goal</Text>
                                <Text style={styles.summaryValue}>
                                    {Math.round(
                                        (gender === 'Male'
                                            ? 10 * parseFloat(weight || 70) + 6.25 * parseFloat(height || 175) - 5 * parseFloat(age || 25) + 5
                                            : 10 * parseFloat(weight || 70) + 6.25 * parseFloat(height || 175) - 5 * parseFloat(age || 25) - 161)
                                        * { 'Sedentary': 1.2, 'Light': 1.375, 'Moderate': 1.55, 'Active': 1.725, 'Very Active': 1.9 }[activity]
                                        + (goal === 'Gain Muscle' ? 300 : goal === 'Lose Weight' ? -500 : 0)
                                    )} kcal
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Goal</Text>
                                <Text style={styles.summaryValue}>{goal}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Activity Level</Text>
                                <Text style={styles.summaryValue}>{activity}</Text>
                            </View>
                        </View>

                        <View style={styles.tipsCard}>
                            <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
                            {[
                                'Log your meals consistently for best results',
                                'Track your workouts to stay motivated',
                                'Review your stats weekly to see progress',
                            ].map((tip, i) => (
                                <View key={i} style={styles.tipRow}>
                                    <View style={styles.tipDot} />
                                    <Text style={styles.tipText}>{tip}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.footer}>
                {step > 0 && step < 4 && (
                    <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
                        <Ionicons name="chevron-back" size={20} color="#6B7280" />
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>
                )}

                {step < 4 && (
                    <TouchableOpacity
                        style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
                        onPress={nextStep}
                        disabled={!canProceed()}
                    >
                        <Text style={styles.nextText}>
                            {step === 0 ? "Let's Start" : 'Continue'}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                )}

                {step === 4 && (
                    <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.completeText}>Start Your Journey</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },

    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 20,
        paddingTop: 60,
    },
    progressDot: {
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB',
        transition: 'all 0.3s',
    },
    progressDotActive: { width: 24, backgroundColor: '#22C55E' },
    progressDotComplete: { backgroundColor: '#22C55E' },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },

    stepContainer: { alignItems: 'center', paddingTop: 20 },

    iconCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
    },
    iconEmoji: { fontSize: 48 },

    title: {
        fontSize: 28, fontWeight: '800', color: '#111827',
        marginBottom: 12, textAlign: 'center',
    },
    description: {
        fontSize: 15, color: '#6B7280', textAlign: 'center',
        lineHeight: 22, marginBottom: 32, paddingHorizontal: 20,
    },

    // Features List
    featureList: { width: '100%', gap: 16 },
    featureItem: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        backgroundColor: '#fff', padding: 16, borderRadius: 16,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    featureIcon: {
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: '#F0FDF4',
        alignItems: 'center', justifyContent: 'center',
    },
    featureText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#374151' },

    // Feature Cards Grid
    cardGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 12,
        width: '100%', justifyContent: 'center',
    },
    featureCard: {
        width: (screenWidth - 52) / 2,
        backgroundColor: '#fff', padding: 20, borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    featureCardIcon: {
        width: 64, height: 64, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
    },
    featureCardLabel: { fontSize: 14, fontWeight: '700', color: '#374151', textAlign: 'center' },

    // Form
    form: { width: '100%' },
    row: { flexDirection: 'row' },
    label: {
        fontSize: 13, color: '#6B7280', fontWeight: '600',
        marginBottom: 8, marginTop: 16,
    },
    input: {
        backgroundColor: '#fff', borderRadius: 14, padding: 16,
        fontSize: 16, color: '#111827',
        borderWidth: 1.5, borderColor: '#E5E7EB',
        shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20,
        backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: 'transparent',
    },
    chipActive: { backgroundColor: '#F0FDF4', borderColor: '#22C55E' },
    chipText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    chipTextActive: { color: '#22C55E' },

    // Activity Options
    activityOption: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 8,
        borderWidth: 2, borderColor: '#E5E7EB',
    },
    activityOptionActive: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
    activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    activityRadio: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: '#D1D5DB',
        alignItems: 'center', justifyContent: 'center',
    },
    activityRadioActive: { borderColor: '#22C55E' },
    activityRadioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E' },
    activityLabel: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
    activityLabelActive: { color: '#22C55E' },

    // Summary
    summaryCard: {
        width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 20,
        marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    summaryRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    summaryLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    summaryValue: { fontSize: 14, fontWeight: '700', color: '#111827' },

    tipsCard: {
        width: '100%', backgroundColor: '#FFF7ED', borderRadius: 20, padding: 20,
        borderWidth: 1, borderColor: '#FDBA74',
    },
    tipsTitle: { fontSize: 15, fontWeight: '700', color: '#9A3412', marginBottom: 12 },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
    tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B', marginTop: 6 },
    tipText: { flex: 1, fontSize: 14, color: '#9A3412', lineHeight: 20 },

    // Footer
    footer: {
        flexDirection: 'row', padding: 20, gap: 12,
        borderTopWidth: 1, borderTopColor: '#F3F4F6',
        backgroundColor: '#fff',
    },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16,
        backgroundColor: '#F3F4F6',
    },
    backText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
    nextBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 16, borderRadius: 16,
        backgroundColor: '#22C55E',
        shadowColor: '#22C55E', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
    },
    nextBtnDisabled: { backgroundColor: '#D1D5DB' },
    nextText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    completeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 16, borderRadius: 16,
        backgroundColor: '#22C55E',
        shadowColor: '#22C55E', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
    },
    completeText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});