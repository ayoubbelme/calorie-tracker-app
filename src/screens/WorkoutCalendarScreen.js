import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
};

export default function WorkoutCalendarScreen() {
    const [workoutHistory, setWorkoutHistory] = useState({});
    const [macroHistory, setMacroHistory] = useState({});
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSession, setSelectedSession] = useState(null);

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                try {
                    const wStored = await AsyncStorage.getItem('workout_sessions');
                    const mStored = await AsyncStorage.getItem('macro_history');
                    setWorkoutHistory(wStored ? JSON.parse(wStored) : {});
                    setMacroHistory(mStored ? JSON.parse(mStored) : {});
                } catch (e) {
                    console.error(e);
                }
            };
            load();
        }, [])
    );

    const markedDates = {};
    Object.keys(workoutHistory).forEach(date => {
        if (workoutHistory[date].finished) {
            markedDates[date] = {
                marked: true,
                dotColor: '#22C55E',
                selected: date === selectedDate,
                selectedColor: date === selectedDate ? '#22C55E' : undefined,
            };
        }
    });
    if (selectedDate && !markedDates[selectedDate]) {
        markedDates[selectedDate] = { selected: true, selectedColor: '#E5E7EB' };
    }

    const onDayPress = (day) => {
        const key = day.dateString;
        setSelectedDate(key);
        if (workoutHistory[key] && workoutHistory[key].finished) {
            setSelectedSession(workoutHistory[key]);
        } else {
            setSelectedSession(null);
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const macros = selectedDate ? macroHistory[selectedDate] : null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            <Text style={styles.title}>Workout Calendar 📅</Text>
            <Text style={styles.subtitle}>Tap a day to see your session</Text>

            <Calendar
                onDayPress={onDayPress}
                markedDates={markedDates}
                theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    selectedDayBackgroundColor: '#22C55E',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#22C55E',
                    dotColor: '#22C55E',
                    arrowColor: '#22C55E',
                    monthTextColor: '#111827',
                    textDayFontWeight: '600',
                    textMonthFontWeight: 'bold',
                    textMonthFontSize: 16,
                }}
                style={styles.calendar}
            />

            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={styles.legendDot} />
                    <Text style={styles.legendText}>Workout logged</Text>
                </View>
                <Text style={styles.legendTotal}>
                    {Object.values(workoutHistory).filter(s => s.finished).length} sessions total
                </Text>
            </View>

            {/* No workout on selected day */}
            {selectedDate && !selectedSession && (
                <View style={styles.emptyDay}>
                    <Text style={styles.emptyDayText}>No workout on {formatDate(selectedDate)}</Text>
                </View>
            )}

            {selectedSession && (
                <View style={styles.sessionCard}>
                    <Text style={styles.sessionDate}>{formatDate(selectedDate)}</Text>

                    {/* Workout Stats — no volume */}
                    <View style={styles.sessionStats}>
                        <View style={styles.sessionStat}>
                            <Ionicons name="time-outline" size={18} color="#22C55E" />
                            <Text style={styles.sessionStatValue}>
                                {formatDuration(selectedSession.summary?.duration || 0)}
                            </Text>
                            <Text style={styles.sessionStatLabel}>Duration</Text>
                        </View>
                        <View style={styles.sessionStatDivider} />
                        <View style={styles.sessionStat}>
                            <Ionicons name="barbell-outline" size={18} color="#22C55E" />
                            <Text style={styles.sessionStatValue}>
                                {selectedSession.exercises?.length || 0}
                            </Text>
                            <Text style={styles.sessionStatLabel}>Exercises</Text>
                        </View>
                        <View style={styles.sessionStatDivider} />
                        <View style={styles.sessionStat}>
                            <Ionicons name="layers-outline" size={18} color="#22C55E" />
                            <Text style={styles.sessionStatValue}>
                                {selectedSession.exercises?.reduce((a, w) => a + w.sets.length, 0) || 0}
                            </Text>
                            <Text style={styles.sessionStatLabel}>Total Sets</Text>
                        </View>
                    </View>

                    {/* Calories & Macros for that day */}
                    {macros ? (
                        <View style={styles.macrosCard}>
                            <Text style={styles.macrosTitle}>🍽️ Nutrition That Day</Text>

                            {/* Calories */}
                            <View style={styles.caloriesRow}>
                                <Text style={styles.caloriesLabel}>Calories</Text>
                                <Text style={styles.caloriesValue}>
                                    {Math.round(macros.calories)} kcal
                                </Text>
                            </View>

                            {/* Macros Row */}
                            <View style={styles.macrosRow}>
                                <View style={styles.macroItem}>
                                    <Text style={[styles.macroValue, { color: '#3B82F6' }]}>
                                        {Math.round(macros.protein)}g
                                    </Text>
                                    <Text style={styles.macroLabel}>Protein</Text>
                                </View>
                                <View style={styles.macroDivider} />
                                <View style={styles.macroItem}>
                                    <Text style={[styles.macroValue, { color: '#F59E0B' }]}>
                                        {Math.round(macros.carbs)}g
                                    </Text>
                                    <Text style={styles.macroLabel}>Carbs</Text>
                                </View>
                                <View style={styles.macroDivider} />
                                <View style={styles.macroItem}>
                                    <Text style={[styles.macroValue, { color: '#EF4444' }]}>
                                        {Math.round(macros.fat)}g
                                    </Text>
                                    <Text style={styles.macroLabel}>Fat</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.noMacros}>
                            <Ionicons name="nutrition-outline" size={16} color="#9CA3AF" />
                            <Text style={styles.noMacrosText}>No nutrition logged that day</Text>
                        </View>
                    )}

                    {/* PRs */}
                    {selectedSession.summary?.prs?.length > 0 && (
                        <View style={styles.prBox}>
                            <Text style={styles.prTitle}>🏆 Personal Records</Text>
                            {selectedSession.summary.prs.map((pr, i) => (
                                <View key={i} style={styles.prItem}>
                                    <Ionicons name="trophy" size={14} color="#F59E0B" />
                                    <Text style={styles.prText}>{pr.exercise} — {pr.weight} kg</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Exercises */}
                    <Text style={styles.exercisesTitle}>Exercises</Text>
                    {selectedSession.exercises?.map((ex, i) => (
                        <View key={i} style={styles.exItem}>
                            <View style={styles.exHeader}>
                                <View style={styles.exIndexBadge}>
                                    <Text style={styles.exIndex}>{i + 1}</Text>
                                </View>
                                <Text style={styles.exName}>{ex.exercise}</Text>
                                <Text style={styles.exMeta}>{ex.sets.length} sets</Text>
                            </View>
                            <View style={styles.exSets}>
                                {ex.sets.map((s, j) => (
                                    <View key={j} style={styles.exSetRow}>
                                        <Text style={styles.exSetNum}>Set {j + 1}</Text>
                                        <Text style={styles.exSetVal}>{s.reps} reps</Text>
                                        <Text style={styles.exSetVal}>{s.weight ? `${s.weight} kg` : '—'}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>
            )}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scroll: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginTop: 20 },
    subtitle: { fontSize: 16, color: '#9CA3AF', marginBottom: 20 },

    calendar: { borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },

    legend: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 6, paddingHorizontal: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
    legendText: { fontSize: 12, color: '#6B7280' },
    legendTotal: { fontSize: 12, fontWeight: '700', color: '#374151' },

    emptyDay: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 16, alignItems: 'center' },
    emptyDayText: { color: '#9CA3AF', fontSize: 14 },

    sessionCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
    sessionDate: { fontSize: 17, fontWeight: 'bold', color: '#111827', marginBottom: 16 },

    sessionStats: { backgroundColor: '#111827', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-around', padding: 16, marginBottom: 16 },
    sessionStat: { alignItems: 'center', gap: 4 },
    sessionStatValue: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginTop: 2 },
    sessionStatLabel: { fontSize: 10, color: '#9CA3AF' },
    sessionStatDivider: { width: 1, backgroundColor: '#374151' },

    // Macros Card
    macrosCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    macrosTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
    caloriesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    caloriesLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    caloriesValue: { fontSize: 20, fontWeight: 'bold', color: '#22C55E' },
    macrosRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    macroItem: { alignItems: 'center' },
    macroValue: { fontSize: 16, fontWeight: 'bold' },
    macroLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    macroDivider: { width: 1, height: 28, backgroundColor: '#E5E7EB' },
    noMacros: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    noMacrosText: { fontSize: 13, color: '#9CA3AF' },

    prBox: { backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FDE68A' },
    prTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 8 },
    prItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    prText: { fontSize: 13, color: '#92400E', fontWeight: '600' },

    exercisesTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
    exItem: { backgroundColor: '#F9FAFB', borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
    exHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    exIndexBadge: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
    exIndex: { color: '#22C55E', fontWeight: 'bold', fontSize: 12 },
    exName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
    exMeta: { fontSize: 12, color: '#9CA3AF' },
    exSets: { padding: 10 },
    exSetRow: { flexDirection: 'row', paddingVertical: 5 },
    exSetNum: { flex: 1, fontSize: 12, fontWeight: '700', color: '#6B7280' },
    exSetVal: { flex: 1, fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'center' },
});