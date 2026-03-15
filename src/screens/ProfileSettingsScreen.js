import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../components/ProfileContext';
import { useTheme } from '../components/ThemeContext';

export default function ProfileSettingsScreen({ navigation }) {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const {
        name,
        age,
        weight,
        height,
        gender,
        goal,
        activity,
        calorieGoal,
        proteinGoal,
        carbsGoal,
        fatGoal,
        bmr,
        tdee,
        updateProfile
    } = useProfile();

    const [editName, setEditName] = useState(name);
    const [editAge, setEditAge] = useState(age);
    const [editWeight, setEditWeight] = useState(weight);
    const [editHeight, setEditHeight] = useState(height);
    const [editGender, setEditGender] = useState(gender);
    const [editGoal, setEditGoal] = useState(goal);
    const [editActivity, setEditActivity] = useState(activity);

    const goals = [
        { value: 'Weight Loss', icon: 'trending-down', color: '#22C55E', desc: '500 cal deficit' },
        { value: 'Extreme Weight Loss', icon: 'arrow-down-circle', color: '#EF4444', desc: '750 cal deficit' },
        { value: 'Maintain Weight', icon: 'remove-circle', color: '#3B82F6', desc: 'Maintain current' },
        { value: 'Muscle Gain', icon: 'trending-up', color: '#8B5CF6', desc: '300 cal surplus' },
    ];

    const activities = [
        { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise', multiplier: '1.2x' },
        { value: 'light', label: 'Light', desc: 'Exercise 1-3 days/week', multiplier: '1.375x' },
        { value: 'moderate', label: 'Moderate', desc: 'Exercise 3-5 days/week', multiplier: '1.55x' },
        { value: 'active', label: 'Active', desc: 'Exercise 6-7 days/week', multiplier: '1.725x' },
        { value: 'veryActive', label: 'Very Active', desc: 'Intense exercise daily', multiplier: '1.9x' },
    ];

    const handleSave = () => {
        if (!editName || !editAge || !editWeight || !editHeight) {
            Alert.alert('Missing Information', 'Please fill in all required fields');
            return;
        }

        updateProfile({
            name: editName,
            age: editAge,
            weight: editWeight,
            height: editHeight,
            gender: editGender,
            goal: editGoal,
            activity: editActivity,
        });

        Alert.alert(
            '✅ Settings Updated',
            'Your profile has been updated!\n\n✨ Calorie goal and macros have been automatically recalculated.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
    };

    const hasChanges =
        editName !== name ||
        editAge !== age ||
        editWeight !== weight ||
        editHeight !== height ||
        editGender !== gender ||
        editGoal !== goal ||
        editActivity !== activity;

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile Settings</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Current Goals Preview */}
                <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>Current Daily Goals</Text>
                    <View style={styles.previewRow}>
                        <View style={styles.previewItem}>
                            <Ionicons name="flame" size={20} color="#22C55E" />
                            <Text style={styles.previewLabel}>Calories</Text>
                            <Text style={styles.previewValue}>{calorieGoal}</Text>
                        </View>
                        <View style={styles.previewItem}>
                            <Ionicons name="fitness" size={20} color="#3B82F6" />
                            <Text style={styles.previewLabel}>Protein</Text>
                            <Text style={styles.previewValue}>{proteinGoal}g</Text>
                        </View>
                        <View style={styles.previewItem}>
                            <Ionicons name="nutrition" size={20} color="#F59E0B" />
                            <Text style={styles.previewLabel}>Carbs</Text>
                            <Text style={styles.previewValue}>{carbsGoal}g</Text>
                        </View>
                        <View style={styles.previewItem}>
                            <Ionicons name="water" size={20} color="#EF4444" />
                            <Text style={styles.previewLabel}>Fat</Text>
                            <Text style={styles.previewValue}>{fatGoal}g</Text>
                        </View>
                    </View>
                    {bmr && tdee && bmr !== '0' && (
                        <View style={styles.metabolismInfo}>
                            <View style={styles.metabolismRow}>
                                <Text style={styles.metabolismLabel}>BMR (Basal):</Text>
                                <Text style={styles.metabolismValue}>{bmr} kcal/day</Text>
                            </View>
                            <View style={styles.metabolismRow}>
                                <Text style={styles.metabolismLabel}>TDEE (Active):</Text>
                                <Text style={styles.metabolismValue}>{tdee} kcal/day</Text>
                            </View>
                        </View>
                    )}
                    <View style={styles.autoCalcBanner}>
                        <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                        <Text style={styles.autoCalcText}>Auto-calculated based on your profile</Text>
                    </View>
                </View>

                {/* Basic Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>

                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Your name"
                                />
                            </View>
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Age</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                                    <TextInput
                                        style={styles.input}
                                        value={editAge}
                                        onChangeText={setEditAge}
                                        placeholder="Age"
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.inputUnit}>years</Text>
                                </View>
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Gender</Text>
                                <View style={styles.genderRow}>
                                    <TouchableOpacity
                                        style={[styles.genderBtn, editGender === 'male' && styles.genderBtnActive]}
                                        onPress={() => setEditGender('male')}
                                    >
                                        <Ionicons
                                            name="male"
                                            size={18}
                                            color={editGender === 'male' ? theme.surface : '#6B7280'}
                                        />
                                        <Text style={[styles.genderText, editGender === 'male' && styles.genderTextActive]}>
                                            Male
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.genderBtn, editGender === 'female' && styles.genderBtnActive]}
                                        onPress={() => setEditGender('female')}
                                    >
                                        <Ionicons
                                            name="female"
                                            size={18}
                                            color={editGender === 'female' ? theme.surface : '#6B7280'}
                                        />
                                        <Text style={[styles.genderText, editGender === 'female' && styles.genderTextActive]}>
                                            Female
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Weight</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="scale-outline" size={20} color="#9CA3AF" />
                                    <TextInput
                                        style={styles.input}
                                        value={editWeight}
                                        onChangeText={setEditWeight}
                                        placeholder="Weight"
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.inputUnit}>kg</Text>
                                </View>
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Height</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="resize-outline" size={20} color="#9CA3AF" />
                                    <TextInput
                                        style={styles.input}
                                        value={editHeight}
                                        onChangeText={setEditHeight}
                                        placeholder="Height"
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.inputUnit}>cm</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Fitness Goal */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Fitness Goal</Text>
                    <Text style={styles.sectionSubtitle}>This affects your calorie target</Text>

                    <View style={styles.card}>
                        {goals.map((item, index) => (
                            <TouchableOpacity
                                key={item.value}
                                style={[
                                    styles.optionItem,
                                    editGoal === item.value && styles.optionItemActive,
                                    index === goals.length - 1 && { borderBottomWidth: 0 }
                                ]}
                                onPress={() => setEditGoal(item.value)}
                            >
                                <View style={styles.optionLeft}>
                                    <View style={[styles.optionIcon, { backgroundColor: item.color + '20' }]}>
                                        <Ionicons name={item.icon} size={20} color={item.color} />
                                    </View>
                                    <View>
                                        <Text style={styles.optionLabel}>{item.value}</Text>
                                        <Text style={styles.optionDesc}>{item.desc}</Text>
                                    </View>
                                </View>
                                <View style={[styles.radio, editGoal === item.value && styles.radioActive]}>
                                    {editGoal === item.value && <View style={styles.radioDot} />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Activity Level */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Activity Level</Text>
                    <Text style={styles.sectionSubtitle}>How active are you?</Text>

                    <View style={styles.card}>
                        {activities.map((item, index) => (
                            <TouchableOpacity
                                key={item.value}
                                style={[
                                    styles.optionItem,
                                    editActivity === item.value && styles.optionItemActive,
                                    index === activities.length - 1 && { borderBottomWidth: 0 }
                                ]}
                                onPress={() => setEditActivity(item.value)}
                            >
                                <View style={styles.optionLeft}>
                                    <View>
                                        <View style={styles.activityHeader}>
                                            <Text style={styles.optionLabel}>{item.label}</Text>
                                            <Text style={styles.multiplierBadge}>{item.multiplier}</Text>
                                        </View>
                                        <Text style={styles.optionDesc}>{item.desc}</Text>
                                    </View>
                                </View>
                                <View style={[styles.radio, editActivity === item.value && styles.radioActive]}>
                                    {editActivity === item.value && <View style={styles.radioDot} />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Save Button */}
            {hasChanges && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Ionicons name="checkmark-circle" size={22} color="#fff" />
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 40 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: theme.surface,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },

    previewCard: {
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: theme.surface,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    previewTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    previewItem: { alignItems: 'center', flex: 1 },
    previewLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 4 },
    previewValue: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 2 },

    metabolismInfo: {
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    metabolismRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    metabolismLabel: { fontSize: 12, color: '#166534', fontWeight: '600' },
    metabolismValue: { fontSize: 12, color: '#15803D', fontWeight: '800' },

    autoCalcBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F5F3FF',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    autoCalcText: { fontSize: 12, color: '#7C3AED', fontWeight: '600' },

    section: { marginTop: 24, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
    sectionSubtitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 12 },

    card: {
        backgroundColor: theme.surface,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },

    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 10,
    },
    input: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '600' },
    inputUnit: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },

    inputRow: { flexDirection: 'row', gap: 12 },

    genderRow: { flexDirection: 'row', gap: 10 },
    genderBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: theme.background,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        paddingVertical: 12,
    },
    genderBtnActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    genderText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
    genderTextActive: { color: theme.surface },

    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    optionItemActive: {
        backgroundColor: '#F0FDF4',
        marginHorizontal: -16,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderBottomWidth: 0,
    },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
    optionDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

    activityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    multiplierBadge: {
        fontSize: 10,
        fontWeight: '800',
        color: '#3B82F6',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },

    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioActive: { borderColor: '#22C55E' },
    radioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22C55E',
    },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.surface,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#22C55E',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#22C55E',
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 6,
    },
    saveBtnText: { fontSize: 16, fontWeight: '800', color: theme.surface },
});