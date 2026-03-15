import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Image,
    Animated,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '../components/ProfileContext';

const { width: screenWidth } = Dimensions.get('window');

const GOALS = ['Lose Weight', 'Maintain', 'Gain Muscle'];
const ACTIVITY = [
    { key: 'Sedentary', label: 'Sedentary', desc: 'Little or no exercise', icon: 'bed-outline' },
    { key: 'Light', label: 'Light', desc: '1–3 days/week', icon: 'walk-outline' },
    { key: 'Moderate', label: 'Moderate', desc: '3–5 days/week', icon: 'bicycle-outline' },
    { key: 'Active', label: 'Active', desc: '6–7 days/week', icon: 'barbell-outline' },
    { key: 'Very Active', label: 'Very Active', desc: 'Hard training daily', icon: 'flame-outline' },
];
const GENDERS = [
    { key: 'Male', icon: 'male' },
    { key: 'Female', icon: 'female' },
];
const GOAL_ICONS = {
    'Lose Weight': { icon: 'trending-down', color: '#3B82F6' },
    'Maintain': { icon: 'analytics', color: '#10B981' },
    'Gain Muscle': { icon: 'trending-up', color: '#F59E0B' },
};

export default function OnboardingScreen({ navigation }) {
    const { updateProfile } = useProfile();
    const insets = useSafeAreaInsets();
    const [step, setStep] = useState(0);
    const scrollRef = useRef(null);
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Form state
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [gender, setGender] = useState('Male');
    const [goal, setGoal] = useState('Maintain');
    const [activity, setActivity] = useState('Moderate');

    const [focusedField, setFocusedField] = useState(null);

    const calcCalories = () => {
        const w = parseFloat(weight || 70);
        const h = parseFloat(height || 175);
        const a = parseFloat(age || 25);
        const bmr = gender === 'Male'
            ? 10 * w + 6.25 * h - 5 * a + 5
            : 10 * w + 6.25 * h - 5 * a - 161;
        const mult = { Sedentary: 1.2, Light: 1.375, Moderate: 1.55, Active: 1.725, 'Very Active': 1.9 }[activity];
        const adj = goal === 'Gain Muscle' ? 300 : goal === 'Lose Weight' ? -500 : 0;
        return Math.round(bmr * mult + adj);
    };

    const handleComplete = async () => {
        updateProfile({ name, age, weight, height, gender, goal, activity, calorieGoal: String(calcCalories()) });
        await AsyncStorage.setItem('onboarding_complete', 'true');
        navigation.replace('Main');
    };

    const goNext = () => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
        setStep(s => s + 1);
    };
    const goPrev = () => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
        setStep(s => s - 1);
    };

    const canProceed = () => {
        if (step === 2) return name.trim() && age && weight && height;
        return true;
    };

    const inputStyle = (field) => [
        styles.input,
        focusedField === field && styles.inputFocused,
    ];

    const STEPS = [
        // Step 0 – Welcome
        <View style={styles.stepContainer} key="0">
            <View style={styles.logoWrap}>
                <Image source={require('../../assets/1.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Welcome to{'\n'}CaloMate</Text>
            <Text style={styles.description}>Your personal fitness companion for tracking calories, macros, and workouts.</Text>
            <View style={styles.featureList}>
                {[
                    { icon: 'flame', text: 'Track daily calories & macros', color: '#F97316' },
                    { icon: 'bar-chart', text: 'Visualize your progress', color: '#6366F1' },
                    { icon: 'barbell', text: 'Plan your workouts', color: '#3B82F6' },
                    { icon: 'trophy', text: 'Achieve your fitness goals', color: '#F59E0B' },
                ].map((item, i) => (
                    <View key={i} style={styles.featureItem}>
                        <View style={[styles.featureIcon, { backgroundColor: item.color + '15' }]}>
                            <Ionicons name={item.icon} size={22} color={item.color} />
                        </View>
                        <Text style={styles.featureText}>{item.text}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                    </View>
                ))}
            </View>
        </View>,

        // Step 1 – Features
        <View style={styles.stepContainer} key="1">
            <View style={styles.logoWrap}>
                <Image source={require('../../assets/1.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Powerful{'\n'}Insights</Text>
            <Text style={styles.description}>Beautiful analytics to track your nutrition and fitness journey.</Text>
            <View style={styles.cardGrid}>
                {[
                    { icon: 'analytics', label: 'Weekly Stats', color: '#6366F1', bg: '#EEF2FF' },
                    { icon: 'calendar', label: 'Daily Tracking', color: '#10B981', bg: '#ECFDF5' },
                    { icon: 'restaurant', label: 'Meal Logging', color: '#F59E0B', bg: '#FFFBEB' },
                    { icon: 'fitness', label: 'Workout Plans', color: '#EF4444', bg: '#FEF2F2' },
                ].map((item, i) => (
                    <View key={i} style={[styles.featureCard, { backgroundColor: item.bg }]}>
                        <View style={[styles.featureCardIcon, { backgroundColor: item.color + '20' }]}>
                            <Ionicons name={item.icon} size={30} color={item.color} />
                        </View>
                        <Text style={[styles.featureCardLabel, { color: item.color }]}>{item.label}</Text>
                    </View>
                ))}
            </View>
        </View>,

        // Step 2 – Basic Info
        <View style={styles.stepContainer} key="2">
            <Text style={styles.stepBadge}>Step 1 of 2</Text>
            <Text style={styles.title}>Tell Us{'\n'}About You</Text>
            <Text style={styles.description}>We'll personalize your calorie goal based on your info.</Text>

            <View style={styles.form}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                    style={inputStyle('name')}
                    placeholder="enter your name"
                    placeholderTextColor="#B0B8C4"
                    value={name}
                    onChangeText={setName}
                    returnKeyType="next"
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                />

                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderRow}>
                    {GENDERS.map(g => (
                        <TouchableOpacity
                            key={g.key}
                            style={[styles.genderCard, gender === g.key && styles.genderCardActive]}
                            onPress={() => setGender(g.key)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={g.icon} size={28} color={gender === g.key ? '#22C55E' : '#9CA3AF'} />
                            <Text style={[styles.genderLabel, gender === g.key && styles.genderLabelActive]}>{g.key}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Age</Text>
                        <TextInput
                            style={inputStyle('age')}
                            placeholder="25"
                            placeholderTextColor="#B0B8C4"
                            keyboardType="numeric"
                            value={age}
                            onChangeText={setAge}
                            returnKeyType="next"
                            onFocus={() => setFocusedField('age')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>
                    <View style={styles.rowSpacer} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Weight (kg)</Text>
                        <TextInput
                            style={inputStyle('weight')}
                            placeholder="70"
                            placeholderTextColor="#B0B8C4"
                            keyboardType="numeric"
                            value={weight}
                            onChangeText={setWeight}
                            returnKeyType="next"
                            onFocus={() => setFocusedField('weight')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>
                </View>

                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                    style={inputStyle('height')}
                    placeholder="175"
                    placeholderTextColor="#B0B8C4"
                    keyboardType="numeric"
                    value={height}
                    onChangeText={setHeight}
                    returnKeyType="done"
                    onFocus={() => setFocusedField('height')}
                    onBlur={() => setFocusedField(null)}
                />
            </View>
        </View>,

        // Step 3 – Goal & Activity
        <View style={styles.stepContainer} key="3">
            <Text style={styles.stepBadge}>Step 2 of 2</Text>
            <Text style={styles.title}>Your Fitness{'\n'}Goal</Text>
            <Text style={styles.description}>Tell us what you want to achieve and how active you are.</Text>

            <View style={styles.form}>
                <Text style={styles.label}>Primary Goal</Text>
                <View style={styles.goalRow}>
                    {GOALS.map(g => {
                        const meta = GOAL_ICONS[g];
                        const active = goal === g;
                        return (
                            <TouchableOpacity
                                key={g}
                                style={[styles.goalCard, active && { borderColor: meta.color, backgroundColor: meta.color + '10' }]}
                                onPress={() => setGoal(g)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name={meta.icon} size={22} color={active ? meta.color : '#9CA3AF'} />
                                <Text style={[styles.goalLabel, active && { color: meta.color }]}>{g}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={[styles.label, { marginTop: 24 }]}>Activity Level</Text>
                {ACTIVITY.map(a => {
                    const active = activity === a.key;
                    return (
                        <TouchableOpacity
                            key={a.key}
                            style={[styles.activityCard, active && styles.activityCardActive]}
                            onPress={() => setActivity(a.key)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.activityIconWrap, active && styles.activityIconWrapActive]}>
                                <Ionicons name={a.icon} size={20} color={active ? '#22C55E' : '#9CA3AF'} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.activityTitle, active && styles.activityTitleActive]}>{a.label}</Text>
                                <Text style={styles.activityDesc}>{a.desc}</Text>
                            </View>
                            {active && (
                                <View style={styles.checkCircle}>
                                    <Ionicons name="checkmark" size={14} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>,

        // Step 4 – Summary
        <View style={styles.stepContainer} key="4">
            <View style={styles.successRing}>
                <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
            </View>
            <Text style={styles.title}>You're All{'\n'}Set! 🎉</Text>
            <Text style={styles.description}>Here's your personalized nutrition plan based on your info.</Text>

            <View style={styles.calorieCard}>
                <Text style={styles.calorieLabel}>Your Daily Goal</Text>
                <Text style={styles.calorieValue}>{calcCalories()}</Text>
                <Text style={styles.calorieUnit}>calories / day</Text>
            </View>

            <View style={styles.summaryCard}>
                {[
                    { label: 'Name', value: name || '—' },
                    { label: 'Goal', value: goal },
                    { label: 'Activity', value: activity },
                    { label: 'Gender', value: gender },
                    { label: 'Age', value: age ? `${age} yrs` : '—' },
                    { label: 'Weight', value: weight ? `${weight} kg` : '—' },
                    { label: 'Height', value: height ? `${height} cm` : '—' },
                ].map((row, i, arr) => (
                    <View key={i} style={[styles.summaryRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                        <Text style={styles.summaryLabel}>{row.label}</Text>
                        <Text style={styles.summaryValue}>{row.value}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
                {[
                    'Log meals consistently for best results',
                    'Track workouts to stay motivated',
                    'Review your stats weekly to see progress',
                ].map((tip, i) => (
                    <View key={i} style={styles.tipRow}>
                        <View style={styles.tipDot} />
                        <Text style={styles.tipText}>{tip}</Text>
                    </View>
                ))}
            </View>
        </View>,
    ];

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FAFBFF" />

            {/* Progress Bar */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.progressTrack}>
                    {[0, 1, 2, 3, 4].map(i => (
                        <View
                            key={i}
                            style={[
                                styles.progressSegment,
                                i <= step && styles.progressSegmentFilled,
                                i === step && styles.progressSegmentActive,
                            ]}
                        />
                    ))}
                </View>
                <Text style={styles.progressText}>{step + 1} / 5</Text>
            </View>

            <ScrollView
                ref={scrollRef}
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
            >
                {STEPS[step]}
            </ScrollView>

            {/* Footer with safe area */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <View style={styles.footerInner}>
                    {step > 0 && step < 4 ? (
                        <TouchableOpacity style={styles.backBtn} onPress={goPrev} activeOpacity={0.8}>
                            <Ionicons name="chevron-back" size={20} color="#6B7280" />
                            <Text style={styles.backText}>Back</Text>
                        </TouchableOpacity>
                    ) : (
                        step > 0 && step === 4 ? (
                            <TouchableOpacity style={styles.backBtn} onPress={goPrev} activeOpacity={0.8}>
                                <Ionicons name="chevron-back" size={20} color="#6B7280" />
                                <Text style={styles.backText}>Back</Text>
                            </TouchableOpacity>
                        ) : null
                    )}

                    {step < 4 ? (
                        <TouchableOpacity
                            style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
                            onPress={goNext}
                            disabled={!canProceed()}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.nextText}>
                                {step === 0 ? "Let's Start" : 'Continue'}
                            </Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.85}>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.completeText}>Start Your Journey</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FAFBFF' },

    // Header / Progress
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
        gap: 12,
        backgroundColor: '#FAFBFF',
    },
    progressTrack: { flex: 1, flexDirection: 'row', gap: 6 },
    progressSegment: {
        flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB',
    },
    progressSegmentFilled: { backgroundColor: '#86EFAC' },
    progressSegmentActive: { backgroundColor: '#22C55E' },
    progressText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', width: 32, textAlign: 'right' },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 12 },

    // Step containers
    stepContainer: { paddingTop: 8 },
    stepBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0FDF4',
        color: '#16A34A',
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
    },

    // Logo / Welcome
    logoWrap: {
        width: 120, height: 120,
        borderRadius: 32,
        backgroundColor: '#fff',
        marginBottom: 24, alignSelf: 'center',
        overflow: 'hidden',
        shadowColor: '#22C55E',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 6,
    },
    logoImage: { width: '100%', height: '100%' },

    title: {
        fontSize: 32, fontWeight: '800', color: '#0F172A',
        lineHeight: 38, marginBottom: 10,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 15, color: '#64748B', lineHeight: 23, marginBottom: 28,
    },

    // Feature List
    featureList: { gap: 10 },
    featureItem: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16,
        borderRadius: 16,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    featureIcon: {
        width: 44, height: 44, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    featureText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },

    // Card Grid
    cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    featureCard: {
        width: (screenWidth - 52) / 2,
        padding: 20, borderRadius: 20,
        alignItems: 'center',
    },
    featureCardIcon: {
        width: 60, height: 60, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    },
    featureCardLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

    // Form
    form: { width: '100%' },
    row: { flexDirection: 'row' },
    rowSpacer: { width: 12 },
    label: {
        fontSize: 13, color: '#64748B', fontWeight: '600',
        marginBottom: 8, marginTop: 16, letterSpacing: 0.3,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 15,
        fontSize: 16,
        color: '#0F172A',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        fontWeight: '500',
    },
    inputFocused: {
        borderColor: '#22C55E',
        backgroundColor: '#F0FDF4',
        shadowColor: '#22C55E',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 2,
    },

    // Gender
    genderRow: { flexDirection: 'row', gap: 12 },
    genderCard: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 20, borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 2, borderColor: '#E2E8F0',
        gap: 6,
    },
    genderCardActive: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
    genderLabel: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
    genderLabelActive: { color: '#22C55E' },

    // Goal Cards
    goalRow: { flexDirection: 'row', gap: 8 },
    goalCard: {
        flex: 1, alignItems: 'center', paddingVertical: 16,
        borderRadius: 14, backgroundColor: '#fff',
        borderWidth: 2, borderColor: '#E2E8F0', gap: 6,
    },
    goalLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textAlign: 'center' },

    // Activity Cards
    activityCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 8,
        borderWidth: 2, borderColor: '#E2E8F0',
    },
    activityCardActive: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
    activityIconWrap: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: '#F1F5F9',
        alignItems: 'center', justifyContent: 'center',
    },
    activityIconWrapActive: { backgroundColor: '#DCFCE7' },
    activityTitle: { fontSize: 14, fontWeight: '700', color: '#475569' },
    activityTitleActive: { color: '#16A34A' },
    activityDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    checkCircle: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: '#22C55E',
        alignItems: 'center', justifyContent: 'center',
    },

    // Summary / Complete
    successRing: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#F0FDF4',
        alignItems: 'center', justifyContent: 'center',
        alignSelf: 'center', marginBottom: 20,
        borderWidth: 4, borderColor: '#DCFCE7',
    },
    calorieCard: {
        backgroundColor: '#22C55E', borderRadius: 20, padding: 24,
        alignItems: 'center', marginBottom: 14,
        shadowColor: '#22C55E', shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
    },
    calorieLabel: { fontSize: 13, color: '#fff', fontWeight: '600', opacity: 0.85, marginBottom: 4 },
    calorieValue: { fontSize: 52, fontWeight: '900', color: '#fff', lineHeight: 58 },
    calorieUnit: { fontSize: 13, color: '#fff', opacity: 0.75, marginTop: 2 },

    summaryCard: {
        backgroundColor: '#fff', borderRadius: 18, padding: 4,
        marginBottom: 14,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    summaryRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 12, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    summaryLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
    summaryValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },

    tipsCard: {
        backgroundColor: '#FFFBEB', borderRadius: 18, padding: 18,
        borderWidth: 1, borderColor: '#FDE68A',
        marginBottom: 12,
    },
    tipsTitle: { fontSize: 14, fontWeight: '800', color: '#92400E', marginBottom: 10 },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
    tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B', marginTop: 6 },
    tipText: { flex: 1, fontSize: 13, color: '#78350F', lineHeight: 19 },

    // Footer
    footer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
        paddingHorizontal: 20,
    },
    footerInner: {
        flexDirection: 'row',
        gap: 12,
    },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5, borderColor: '#E2E8F0',
    },
    backText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
    nextBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 17, borderRadius: 16,
        backgroundColor: '#22C55E',
        shadowColor: '#22C55E', shadowOpacity: 0.35, shadowRadius: 12, elevation: 5,
    },
    nextBtnDisabled: {
        backgroundColor: '#CBD5E1',
        shadowOpacity: 0,
        elevation: 0,
    },
    nextText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    completeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 17, borderRadius: 16,
        backgroundColor: '#22C55E',
        shadowColor: '#22C55E', shadowOpacity: 0.35, shadowRadius: 12, elevation: 5,
    },
    completeText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});