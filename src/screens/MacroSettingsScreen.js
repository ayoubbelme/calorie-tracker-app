import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../components/ProfileContext';
import { getMacroRecommendations, calculateMacros } from '../utils/nutritionCalculator';

export default function MacroSettingsScreen({ navigation }) {
    const {
        weight,
        calorieGoal,
        goal,
        proteinGoal,
        carbsGoal,
        fatGoal,
        updateProfile
    } = useProfile();

    const recommendations = getMacroRecommendations(goal);
    const calculatedMacros = calculateMacros(parseFloat(calorieGoal), weight, goal);

    const handleRecalculate = () => {
        Alert.alert(
            'Recalculate Macros',
            'This will update your macro goals based on your current weight and fitness goal.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Recalculate',
                    onPress: () => {
                        updateProfile({
                            proteinGoal: String(calculatedMacros.protein),
                            carbsGoal: String(calculatedMacros.carbs),
                            fatGoal: String(calculatedMacros.fat)
                        });
                        Alert.alert('✅ Updated', 'Your macro goals have been recalculated!');
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
                <Text style={styles.title}>Macro Settings</Text>
                <Text style={styles.subtitle}>Optimized for {goal}</Text>
            </View>

            {/* Current Macros */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Current Daily Goals</Text>

                <View style={styles.macroRow}>
                    <View style={styles.macroInfo}>
                        <Ionicons name="fitness" size={20} color="#3B82F6" />
                        <Text style={styles.macroLabel}>Protein</Text>
                    </View>
                    <Text style={styles.macroValue}>{proteinGoal}g</Text>
                </View>

                <View style={styles.macroRow}>
                    <View style={styles.macroInfo}>
                        <Ionicons name="nutrition" size={20} color="#F59E0B" />
                        <Text style={styles.macroLabel}>Carbs</Text>
                    </View>
                    <Text style={styles.macroValue}>{carbsGoal}g</Text>
                </View>

                <View style={styles.macroRow}>
                    <View style={styles.macroInfo}>
                        <Ionicons name="water" size={20} color="#EF4444" />
                        <Text style={styles.macroLabel}>Fat</Text>
                    </View>
                    <Text style={styles.macroValue}>{fatGoal}g</Text>
                </View>

                <TouchableOpacity style={styles.recalcBtn} onPress={handleRecalculate}>
                    <Ionicons name="refresh" size={18} color="#fff" />
                    <Text style={styles.recalcBtnText}>Recalculate for {weight}kg</Text>
                </TouchableOpacity>
            </View>

            {/* Recommendations */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Recommendations for {goal}</Text>

                <View style={styles.recommendationBox}>
                    <Text style={styles.recommendationFocus}>{recommendations.focus}</Text>
                    <Text style={styles.recommendationRange}>{recommendations.proteinRange}</Text>
                    <Text style={styles.recommendationReason}>{recommendations.reason}</Text>
                </View>

                <Text style={styles.tipsTitle}>Tips:</Text>
                {recommendations.tips.map((tip, i) => (
                    <View key={i} style={styles.tipRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                        <Text style={styles.tipText}>{tip}</Text>
                    </View>
                ))}
            </View>

            {/* Macro Breakdown */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Macro Breakdown</Text>

                <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Protein</Text>
                    <Text style={styles.breakdownValue}>
                        {calculatedMacros.proteinPercent}% · {calculatedMacros.protein}g · {calculatedMacros.protein * 4} kcal
                    </Text>
                </View>

                <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Carbs</Text>
                    <Text style={styles.breakdownValue}>
                        {calculatedMacros.carbsPercent}% · {calculatedMacros.carbs}g · {calculatedMacros.carbs * 4} kcal
                    </Text>
                </View>

                <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Fat</Text>
                    <Text style={styles.breakdownValue}>
                        {calculatedMacros.fatPercent}% · {calculatedMacros.fat}g · {calculatedMacros.fat * 9} kcal
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scroll: { padding: 20, paddingBottom: 40 },
    header: { marginBottom: 20, marginTop: 20 },
    title: { fontSize: 28, fontWeight: '800', color: '#111827' },
    subtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },

    macroRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    macroInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    macroLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
    macroValue: { fontSize: 18, fontWeight: '800', color: '#111827' },

    recalcBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        borderRadius: 14,
        marginTop: 16,
    },
    recalcBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

    recommendationBox: {
        backgroundColor: '#F0FDF4',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    recommendationFocus: { fontSize: 16, fontWeight: '800', color: '#166534', marginBottom: 4 },
    recommendationRange: { fontSize: 13, fontWeight: '600', color: '#16A34A', marginBottom: 8 },
    recommendationReason: { fontSize: 13, color: '#15803D', lineHeight: 18 },

    tipsTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
    tipText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 18 },

    breakdownRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    breakdownLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 4 },
    breakdownValue: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
});