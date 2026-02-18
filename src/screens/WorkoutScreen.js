import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, KeyboardAvoidingView, Platform, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getTodayKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
};

export default function WorkoutScreen() {
    const [exercise, setExercise] = useState('');
    const [currentSets, setCurrentSets] = useState([]);
    const [currentReps, setCurrentReps] = useState('');
    const [currentWeight, setCurrentWeight] = useState('');
    const [workouts, setWorkouts] = useState([]);
    const [previousWorkouts, setPreviousWorkouts] = useState([]);
    const [showPrevious, setShowPrevious] = useState(false);
    const [previousDate, setPreviousDate] = useState('');

    // Session timer
    const [sessionActive, setSessionActive] = useState(false);
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const timerRef = useRef(null);

    // Summary modal
    const [showSummary, setShowSummary] = useState(false);
    const [summaryData, setSummaryData] = useState(null);

    // PR history (all-time best per exercise)
    const [prHistory, setPrHistory] = useState({});

    useEffect(() => {
        const load = async () => {
            try {
                const stored = await AsyncStorage.getItem('workout_sessions');
                const history = stored ? JSON.parse(stored) : {};
                const todayKey = getTodayKey();

                if (history[todayKey] && !history[todayKey].finished) {
                    setWorkouts(history[todayKey].exercises || []);
                    setSessionActive(true);
                    const start = new Date(history[todayKey].startTime);
                    setSessionStartTime(start);
                    const elapsed = Math.floor((Date.now() - start.getTime()) / 1000);
                    setSessionSeconds(elapsed);
                }

                // Find last finished session
                const keys = Object.keys(history)
                    .filter(k => k !== todayKey && history[k].finished)
                    .sort().reverse();
                if (keys.length > 0) {
                    setPreviousWorkouts(history[keys[0]].exercises || []);
                    setPreviousDate(keys[0]);
                }

                // Build PR history from all sessions
                const prs = {};
                Object.values(history).forEach(session => {
                    (session.exercises || []).forEach(ex => {
                        ex.sets.forEach(s => {
                            if (s.weight) {
                                const w = parseFloat(s.weight);
                                if (!prs[ex.exercise] || w > prs[ex.exercise]) {
                                    prs[ex.exercise] = w;
                                }
                            }
                        });
                    });
                });
                setPrHistory(prs);
            } catch (e) {
                console.error('Failed to load workouts', e);
            }
        };
        load();
    }, []);

    // Timer
    useEffect(() => {
        if (sessionActive) {
            timerRef.current = setInterval(() => {
                setSessionSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [sessionActive]);

    const startSession = () => {
        const now = new Date();
        setSessionStartTime(now);
        setSessionActive(true);
        setSessionSeconds(0);
        saveSessionToStorage([], now, false);
    };

    const saveSessionToStorage = async (exercises, startTime, finished, summary = null) => {
        try {
            const stored = await AsyncStorage.getItem('workout_sessions');
            const history = stored ? JSON.parse(stored) : {};
            const todayKey = getTodayKey();
            history[todayKey] = {
                exercises,
                startTime: startTime?.toISOString() || sessionStartTime?.toISOString(),
                finished,
                summary,
                date: todayKey,
            };
            await AsyncStorage.setItem('workout_sessions', JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save session', e);
        }
    };

    const addSet = () => {
        if (!currentReps) return;
        setCurrentSets([...currentSets, {
            reps: currentReps,
            weight: currentWeight || null,
        }]);
        setCurrentReps('');
        setCurrentWeight('');
    };

    const removeSet = (index) => {
        setCurrentSets(currentSets.filter((_, i) => i !== index));
    };

    const saveExercise = () => {
        if (!exercise || currentSets.length === 0) return;
        const newWorkout = {
            id: Date.now().toString(),
            exercise,
            sets: currentSets,
        };
        const updated = [newWorkout, ...workouts];
        setWorkouts(updated);
        saveSessionToStorage(updated, sessionStartTime, false);
        setExercise('');
        setCurrentSets([]);
        setCurrentReps('');
        setCurrentWeight('');
    };

    const deleteWorkout = (id) => {
        Alert.alert('Delete Exercise', 'Remove this exercise?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    const updated = workouts.filter(w => w.id !== id);
                    setWorkouts(updated);
                    saveSessionToStorage(updated, sessionStartTime, false);
                }
            },
        ]);
    };

    const loadFromPrevious = (prev) => {
        setExercise(prev.exercise);
        setCurrentSets(prev.sets.map(s => ({ reps: s.reps, weight: s.weight })));
        setShowPrevious(false);
    };

    const finishWorkout = () => {
        if (workouts.length === 0) {
            Alert.alert('No exercises', 'Add at least one exercise before finishing.');
            return;
        }

        Alert.alert('Finish Workout?', 'This will save your session.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Finish 🏁', onPress: () => {
                    setSessionActive(false);
                    clearInterval(timerRef.current);

                    // Calculate volume
                    const totalVolume = workouts.reduce((acc, w) =>
                        acc + w.sets.reduce((a, s) =>
                            a + (parseInt(s.reps) * (parseFloat(s.weight) || 1)), 0), 0);

                    // Detect PRs
                    const newPRs = [];
                    workouts.forEach(w => {
                        const maxWeight = Math.max(...w.sets
                            .filter(s => s.weight)
                            .map(s => parseFloat(s.weight)), 0);
                        if (maxWeight > 0) {
                            const prevBest = prHistory[w.exercise] || 0;
                            if (maxWeight > prevBest) {
                                newPRs.push({ exercise: w.exercise, weight: maxWeight });
                            }
                        }
                    });

                    const summary = {
                        duration: sessionSeconds,
                        totalVolume: Math.round(totalVolume),
                        totalExercises: workouts.length,
                        totalSets: workouts.reduce((a, w) => a + w.sets.length, 0),
                        prs: newPRs,
                        date: getTodayKey(),
                    };

                    setSummaryData(summary);
                    setShowSummary(true);
                    saveSessionToStorage(workouts, sessionStartTime, true, summary);

                    // Update PR history
                    const updatedPRs = { ...prHistory };
                    newPRs.forEach(pr => { updatedPRs[pr.exercise] = pr.weight; });
                    setPrHistory(updatedPRs);
                }
            },
        ]);
    };

    const closeSummaryAndReset = () => {
        setShowSummary(false);
        setWorkouts([]);
        setSessionSeconds(0);
        setSessionStartTime(null);
        setSummaryData(null);
    };

    const loadFromPreviousAll = (prev) => {
        setExercise(prev.exercise);
        setCurrentSets(prev.sets.map(s => ({ reps: s.reps, weight: s.weight })));
        setShowPrevious(false);
    };

    const totalSets = workouts.reduce((acc, w) => acc + w.sets.length, 0);
    const totalReps = workouts.reduce((acc, w) => acc + w.sets.reduce((a, s) => a + parseInt(s.reps), 0), 0);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : null}
            style={styles.container}
        >
            {/* Summary Modal */}
            <Modal visible={showSummary} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalEmoji}>🏁</Text>
                        <Text style={styles.modalTitle}>Workout Complete!</Text>
                        <Text style={styles.modalDate}>{formatDate(getTodayKey())}</Text>

                        <View style={styles.summaryGrid}>
                            <View style={styles.summaryCell}>
                                <Text style={styles.summaryCellValue}>{formatDuration(summaryData?.duration || 0)}</Text>
                                <Text style={styles.summaryCellLabel}>Duration</Text>
                            </View>
                            <View style={styles.summaryCellDivider} />
                            <View style={styles.summaryCell}>
                                <Text style={styles.summaryCellValue}>{summaryData?.totalExercises}</Text>
                                <Text style={styles.summaryCellLabel}>Exercises</Text>
                            </View>
                            <View style={styles.summaryCellDivider} />
                            <View style={styles.summaryCell}>
                                <Text style={styles.summaryCellValue}>{summaryData?.totalSets}</Text>
                                <Text style={styles.summaryCellLabel}>Sets</Text>
                            </View>
                        </View>

                        <View style={styles.volumeBox}>
                            <Text style={styles.volumeLabel}>Total Volume</Text>
                            <Text style={styles.volumeValue}>{summaryData?.totalVolume?.toLocaleString()} kg</Text>
                        </View>

                        {summaryData?.prs?.length > 0 && (
                            <View style={styles.prBox}>
                                <Text style={styles.prTitle}>🏆 New Personal Records!</Text>
                                {summaryData.prs.map((pr, i) => (
                                    <View key={i} style={styles.prItem}>
                                        <Ionicons name="trophy" size={14} color="#F59E0B" />
                                        <Text style={styles.prText}>
                                            {pr.exercise} — {pr.weight} kg
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity style={styles.modalBtn} onPress={closeSummaryAndReset}>
                            <Text style={styles.modalBtnText}>Done ✓</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Workout Tracker 🏋️</Text>
                        <Text style={styles.subtitle}>Build your session</Text>
                    </View>
                    {sessionActive ? (
                        <View style={styles.timerBadge}>
                            <Ionicons name="time-outline" size={14} color="#fff" />
                            <Text style={styles.timerText}>{formatDuration(sessionSeconds)}</Text>
                        </View>
                    ) : (
                        <View style={styles.statsBadge}>
                            <Text style={styles.statsNumber}>{workouts.length}</Text>
                            <Text style={styles.statsLabel}>exercises</Text>
                        </View>
                    )}
                </View>

                {/* Start Session */}
                {!sessionActive && (
                    <TouchableOpacity style={styles.startBtn} onPress={startSession} activeOpacity={0.85}>
                        <Ionicons name="play-circle-outline" size={22} color="#fff" />
                        <Text style={styles.startBtnText}>Start Workout Session</Text>
                    </TouchableOpacity>
                )}

                {/* Stats Row */}
                {workouts.length > 0 && (
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{workouts.length}</Text>
                            <Text style={styles.statLabel}>Exercises</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{totalSets}</Text>
                            <Text style={styles.statLabel}>Total Sets</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{totalReps}</Text>
                            <Text style={styles.statLabel}>Total Reps</Text>
                        </View>
                    </View>
                )}

                {/* Previous Session Banner */}
                {previousWorkouts.length > 0 && (
                    <TouchableOpacity
                        style={styles.previousBanner}
                        onPress={() => setShowPrevious(!showPrevious)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.previousBannerLeft}>
                            <Ionicons name="time-outline" size={18} color="#3B82F6" />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.previousBannerTitle}>Last Session</Text>
                                <Text style={styles.previousBannerDate}>{formatDate(previousDate)}</Text>
                            </View>
                        </View>
                        <View style={styles.previousBannerRight}>
                            <Text style={styles.previousBannerCount}>{previousWorkouts.length} exercises</Text>
                            <Ionicons name={showPrevious ? 'chevron-up' : 'chevron-down'} size={16} color="#3B82F6" />
                        </View>
                    </TouchableOpacity>
                )}

                {showPrevious && (
                    <View style={styles.previousList}>
                        <Text style={styles.previousListHint}>Tap to load into form — edit before saving</Text>
                        {previousWorkouts.map((prev, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.previousItem}
                                onPress={() => loadFromPreviousAll(prev)}
                                activeOpacity={0.75}
                            >
                                <View style={styles.previousItemLeft}>
                                    <Text style={styles.previousItemName}>{prev.exercise}</Text>
                                    <Text style={styles.previousItemMeta}>
                                        {prev.sets.length} sets · {prev.sets.map(s =>
                                            `${s.reps}${s.weight ? `×${s.weight}kg` : ' reps'}`
                                        ).join(', ')}
                                    </Text>
                                </View>
                                <View style={styles.loadBtn}>
                                    <Ionicons name="arrow-redo-outline" size={16} color="#3B82F6" />
                                    <Text style={styles.loadBtnText}>Load</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Input Card — only when session active */}
                {sessionActive && (
                    <View style={styles.inputCard}>
                        <Text style={styles.inputCardTitle}>Add Exercise</Text>

                        <TextInput
                            placeholder="Exercise name"
                            placeholderTextColor="#6B7280"
                            style={styles.input}
                            value={exercise}
                            onChangeText={setExercise}
                        />

                        {currentSets.length > 0 && (
                            <View style={styles.setsPreview}>
                                <View style={styles.setsPreviewHeader}>
                                    <Text style={styles.setsPreviewCol}>SET</Text>
                                    <Text style={styles.setsPreviewCol}>REPS</Text>
                                    <Text style={styles.setsPreviewCol}>WEIGHT</Text>
                                    <Text style={[styles.setsPreviewCol, { flex: 0.5 }]}> </Text>
                                </View>
                                {currentSets.map((s, i) => (
                                    <View key={i} style={[styles.setsPreviewRow, i % 2 === 0 && styles.setsPreviewRowAlt]}>
                                        <View style={styles.setBadge}>
                                            <Text style={styles.setBadgeText}>{i + 1}</Text>
                                        </View>
                                        <Text style={styles.setsPreviewCell}>{s.reps}</Text>
                                        <Text style={styles.setsPreviewCell}>{s.weight ? `${s.weight} kg` : '—'}</Text>
                                        <TouchableOpacity onPress={() => removeSet(i)} style={{ flex: 0.5, alignItems: 'center' }}>
                                            <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        <Text style={styles.inputLabel}>SET {currentSets.length + 1}</Text>
                        <View style={styles.inputRow}>
                            <View style={styles.inputGroupSmall}>
                                <Text style={styles.inputSubLabel}>REPS</Text>
                                <TextInput
                                    placeholder="12"
                                    keyboardType="numeric"
                                    placeholderTextColor="#6B7280"
                                    style={styles.inputSmall}
                                    value={currentReps}
                                    onChangeText={setCurrentReps}
                                />
                            </View>
                            <View style={styles.inputGroupSmall}>
                                <Text style={styles.inputSubLabel}>KG (opt)</Text>
                                <TextInput
                                    placeholder="60"
                                    keyboardType="numeric"
                                    placeholderTextColor="#6B7280"
                                    style={styles.inputSmall}
                                    value={currentWeight}
                                    onChangeText={setCurrentWeight}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.addSetBtn, !currentReps && styles.addSetBtnDisabled]}
                                onPress={addSet}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="add" size={22} color="#fff" />
                                <Text style={styles.addSetBtnText}>Add Set</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, (!exercise || currentSets.length === 0) && styles.saveButtonDisabled]}
                            onPress={saveExercise}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>
                                Save Exercise {currentSets.length > 0 ? `(${currentSets.length} sets)` : ''}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Exercise List */}
                {workouts.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Today's Exercises</Text>
                        {workouts.map((item, index) => (
                            <View key={item.id} style={styles.exerciseCard}>
                                <View style={styles.exerciseHeader}>
                                    <View style={styles.exerciseIndexBadge}>
                                        <Text style={styles.exerciseIndex}>{workouts.length - index}</Text>
                                    </View>
                                    <Text style={styles.exerciseName}>{item.exercise}</Text>
                                    <TouchableOpacity onPress={() => deleteWorkout(item.id)} style={styles.deleteBtn}>
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.setGrid}>
                                    <View style={styles.setRow}>
                                        <Text style={styles.setColHeader}>SET</Text>
                                        <Text style={styles.setColHeader}>REPS</Text>
                                        <Text style={styles.setColHeader}>WEIGHT</Text>
                                    </View>
                                    {item.sets.map((s, i) => (
                                        <View key={i} style={[styles.setRow, i % 2 === 0 && styles.setRowAlt]}>
                                            <View style={styles.setNumber}>
                                                <Text style={styles.setNumberText}>{i + 1}</Text>
                                            </View>
                                            <Text style={styles.setCell}>{s.reps}</Text>
                                            <Text style={styles.setCell}>{s.weight ? `${s.weight} kg` : '—'}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.exerciseFooter}>
                                    <View style={styles.footerBadge}>
                                        <Text style={styles.footerBadgeText}>{item.sets.length} sets</Text>
                                    </View>
                                    <View style={styles.footerBadge}>
                                        <Text style={styles.footerBadgeText}>
                                            {item.sets.reduce((a, s) => a + parseInt(s.reps), 0)} total reps
                                        </Text>
                                    </View>
                                    {item.sets.some(s => s.weight) && (
                                        <View style={[styles.footerBadge, styles.footerBadgeGreen]}>
                                            <Text style={[styles.footerBadgeText, { color: '#22C55E' }]}>
                                                {Math.max(...item.sets.filter(s => s.weight).map(s => parseFloat(s.weight)))} kg max
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}

                        {/* Finish Workout Button */}
                        <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout} activeOpacity={0.85}>
                            <Ionicons name="flag" size={20} color="#fff" />
                            <Text style={styles.finishBtnText}>Finish Workout</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {workouts.length === 0 && !sessionActive && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🏃</Text>
                        <Text style={styles.emptyTitle}>No session started</Text>
                        <Text style={styles.emptyText}>Tap "Start Workout Session" to begin</Text>
                    </View>
                )}

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scroll: { padding: 20, paddingBottom: 40 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
    subtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 2 },
    statsBadge: { backgroundColor: '#22C55E', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
    statsNumber: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    statsLabel: { fontSize: 10, color: '#fff', opacity: 0.85 },
    timerBadge: { backgroundColor: '#111827', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
    timerText: { fontSize: 15, fontWeight: 'bold', color: '#22C55E' },

    startBtn: { backgroundColor: '#22C55E', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20, shadowColor: '#22C55E', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
    startBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    statsRow: { backgroundColor: '#111827', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: 18, marginBottom: 20 },
    statBox: { alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: 'bold', color: '#22C55E' },
    statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    statDivider: { width: 1, height: 30, backgroundColor: '#374151' },

    previousBanner: { backgroundColor: '#EFF6FF', borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#BFDBFE' },
    previousBannerLeft: { flexDirection: 'row', alignItems: 'center' },
    previousBannerTitle: { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },
    previousBannerDate: { fontSize: 11, color: '#3B82F6', marginTop: 1 },
    previousBannerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    previousBannerCount: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },

    previousList: { backgroundColor: '#F8FAFF', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE' },
    previousListHint: { fontSize: 12, color: '#6B7280', marginBottom: 12, fontStyle: 'italic' },
    previousItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    previousItemLeft: { flex: 1 },
    previousItemName: { fontSize: 14, fontWeight: '700', color: '#111827', textTransform: 'capitalize', marginBottom: 3 },
    previousItemMeta: { fontSize: 12, color: '#6B7280' },
    loadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    loadBtnText: { fontSize: 12, fontWeight: '700', color: '#3B82F6' },

    inputCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
    inputCardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 14 },
    input: { backgroundColor: '#F3F4F6', padding: 14, borderRadius: 12, fontSize: 15, color: '#111827', marginBottom: 16 },

    setsPreview: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10, marginBottom: 16 },
    setsPreviewHeader: { flexDirection: 'row', paddingHorizontal: 4, marginBottom: 6 },
    setsPreviewCol: { flex: 1, fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, textAlign: 'center' },
    setsPreviewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderRadius: 8, paddingHorizontal: 4 },
    setsPreviewRowAlt: { backgroundColor: '#F3F4F6' },
    setsPreviewCell: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#111827' },
    setBadge: { flex: 1, alignItems: 'center' },
    setBadgeText: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#E5E7EB', textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: '700', color: '#374151', overflow: 'hidden' },

    inputLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8, letterSpacing: 0.5 },
    inputRow: { flexDirection: 'row', gap: 10, marginBottom: 16, alignItems: 'flex-end' },
    inputGroupSmall: { flex: 1 },
    inputSubLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginBottom: 6, letterSpacing: 0.8 },
    inputSmall: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, fontSize: 16, color: '#111827', textAlign: 'center', fontWeight: '600' },

    addSetBtn: { flex: 1, backgroundColor: '#111827', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
    addSetBtnDisabled: { backgroundColor: '#E5E7EB' },
    addSetBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    saveButton: { backgroundColor: '#22C55E', borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#22C55E', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
    saveButtonDisabled: { backgroundColor: '#D1FAE5', shadowOpacity: 0, elevation: 0 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 14 },
    exerciseCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
    exerciseHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 },
    exerciseIndexBadge: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
    exerciseIndex: { color: '#22C55E', fontWeight: 'bold', fontSize: 13 },
    exerciseName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
    deleteBtn: { padding: 4 },
    setGrid: { paddingHorizontal: 16, paddingTop: 8 },
    setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderRadius: 8, paddingHorizontal: 4 },
    setRowAlt: { backgroundColor: '#F9FAFB' },
    setColHeader: { flex: 1, fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, textAlign: 'center' },
    setNumber: { flex: 1, alignItems: 'center' },
    setNumberText: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#F3F4F6', textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: '700', color: '#374151', overflow: 'hidden' },
    setCell: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#111827' },
    exerciseFooter: { flexDirection: 'row', gap: 8, padding: 14, paddingTop: 10 },
    footerBadge: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    footerBadgeGreen: { backgroundColor: '#DCFCE7' },
    footerBadgeText: { fontSize: 12, fontWeight: '600', color: '#374151' },

    finishBtn: { backgroundColor: '#EF4444', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6, shadowColor: '#EF4444', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
    finishBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    emptyState: { alignItems: 'center', paddingVertical: 50 },
    emptyIcon: { fontSize: 48, marginBottom: 14 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
    emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', alignItems: 'center' },
    modalEmoji: { fontSize: 48, marginBottom: 8 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    modalDate: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
    summaryGrid: { flexDirection: 'row', backgroundColor: '#111827', borderRadius: 16, padding: 18, width: '100%', justifyContent: 'space-around', marginBottom: 16 },
    summaryCell: { alignItems: 'center' },
    summaryCellValue: { fontSize: 18, fontWeight: 'bold', color: '#22C55E' },
    summaryCellLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    summaryCellDivider: { width: 1, backgroundColor: '#374151' },
    volumeBox: { backgroundColor: '#F3F4F6', borderRadius: 14, padding: 16, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    volumeLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
    volumeValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    prBox: { backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, width: '100%', marginBottom: 16, borderWidth: 1, borderColor: '#FDE68A' },
    prTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 8 },
    prItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    prText: { fontSize: 13, color: '#92400E', fontWeight: '600' },
    modalBtn: { backgroundColor: '#22C55E', borderRadius: 14, padding: 15, width: '100%', alignItems: 'center', shadowColor: '#22C55E', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
    modalBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});