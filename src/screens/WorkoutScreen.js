import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, KeyboardAvoidingView, Platform, Alert, Modal, AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../components/ThemeContext';

const getTodayKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
};

export default function WorkoutScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const [exercise, setExercise] = useState('');
    const [currentSets, setCurrentSets] = useState([]);
    const [currentReps, setCurrentReps] = useState('');
    const [currentWeight, setCurrentWeight] = useState('');
    const [workouts, setWorkouts] = useState([]);
    const [previousWorkouts, setPreviousWorkouts] = useState([]);
    const [showPrevious, setShowPrevious] = useState(false);
    const [previousDate, setPreviousDate] = useState('');
    const [sessionActive, setSessionActive] = useState(false);
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [showSummary, setShowSummary] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [prHistory, setPrHistory] = useState({});

    const timerRef = useRef(null);
    const appStateRef = useRef(AppState.currentState);

    // ── Recalculate elapsed time from stored startTime ────────────────────────
    const recalcSeconds = (startTimeISO) => {
        if (!startTimeISO) return 0;
        return Math.floor((Date.now() - new Date(startTimeISO).getTime()) / 1000);
    };

    // ── Start the interval ticker ─────────────────────────────────────────────
    const startTicker = () => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setSessionSeconds(prev => prev + 1);
        }, 1000);
    };

    // ── AppState listener: recalc elapsed when app comes back to foreground ───
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (
                appStateRef.current.match(/inactive|background/) &&
                nextState === 'active'
            ) {
                // App came back to foreground — resync timer from stored startTime
                AsyncStorage.getItem('workout_sessions').then((stored) => {
                    if (!stored) return;
                    const history = JSON.parse(stored);
                    const todayKey = getTodayKey();
                    const session = history[todayKey];
                    if (session && !session.finished && session.startTime) {
                        const elapsed = recalcSeconds(session.startTime);
                        setSessionSeconds(elapsed);
                        startTicker();
                    }
                });
            }
            appStateRef.current = nextState;
        });

        return () => subscription.remove();
    }, []);

    // ── Load session on mount ─────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const stored = await AsyncStorage.getItem('workout_sessions');
                const history = stored ? JSON.parse(stored) : {};
                const todayKey = getTodayKey();

                if (history[todayKey] && !history[todayKey].finished) {
                    const session = history[todayKey];
                    setWorkouts(session.exercises || []);
                    setSessionActive(true);
                    setSessionStartTime(new Date(session.startTime));

                    // Always recalc from real start time — works even if app was killed
                    const elapsed = recalcSeconds(session.startTime);
                    setSessionSeconds(elapsed);
                    startTicker();
                }

                const keys = Object.keys(history)
                    .filter(k => k !== todayKey && history[k].finished)
                    .sort().reverse();
                if (keys.length > 0) {
                    setPreviousWorkouts(history[keys[0]].exercises || []);
                    setPreviousDate(keys[0]);
                }

                // Build PR history
                const prs = {};
                Object.values(history).forEach(session => {
                    (session.exercises || []).forEach(ex => {
                        ex.sets.forEach(s => {
                            if (s.weight) {
                                const w = parseFloat(s.weight);
                                if (!prs[ex.exercise] || w > prs[ex.exercise]) prs[ex.exercise] = w;
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

        return () => clearInterval(timerRef.current);
    }, []);

    // ── Session start/stop controls the ticker ────────────────────────────────
    useEffect(() => {
        if (sessionActive) {
            startTicker();
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [sessionActive]);

    // ── Storage helpers ───────────────────────────────────────────────────────
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

    // ── Session actions ───────────────────────────────────────────────────────
    const startSession = async () => {
        const now = new Date();
        setSessionStartTime(now);
        setSessionActive(true);
        setSessionSeconds(0);
        await saveSessionToStorage([], now, false);
    };

    const addSet = () => {
        if (!currentReps) return;
        setCurrentSets([...currentSets, { reps: currentReps, weight: currentWeight || null }]);
        setCurrentReps('');
        setCurrentWeight('');
    };

    const removeSet = (index) => setCurrentSets(currentSets.filter((_, i) => i !== index));

    const saveExercise = () => {
        if (!exercise || currentSets.length === 0) return;
        const newWorkout = { id: Date.now().toString(), exercise, sets: currentSets };
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

    const loadFromPreviousAll = (prev) => {
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

                    const totalVolume = workouts.reduce((acc, w) =>
                        acc + w.sets.reduce((a, s) =>
                            a + (parseInt(s.reps) * (parseFloat(s.weight) || 1)), 0), 0);

                    const newPRs = [];
                    workouts.forEach(w => {
                        const maxWeight = Math.max(
                            ...w.sets.filter(s => s.weight).map(s => parseFloat(s.weight)), 0
                        );
                        if (maxWeight > 0 && maxWeight > (prHistory[w.exercise] || 0)) {
                            newPRs.push({ exercise: w.exercise, weight: maxWeight });
                        }
                    });

                    // Use real elapsed time from startTime for accuracy
                    const finalDuration = sessionStartTime
                        ? recalcSeconds(sessionStartTime.toISOString())
                        : sessionSeconds;

                    const summary = {
                        duration: finalDuration,
                        totalVolume: Math.round(totalVolume),
                        totalExercises: workouts.length,
                        totalSets: workouts.reduce((a, w) => a + w.sets.length, 0),
                        prs: newPRs,
                        date: getTodayKey(),
                    };

                    setSummaryData(summary);
                    setShowSummary(true);
                    saveSessionToStorage(workouts, sessionStartTime, true, summary);

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

    // ── Derived stats ─────────────────────────────────────────────────────────
    const totalSets = workouts.reduce((acc, w) => acc + w.sets.length, 0);
    const totalReps = workouts.reduce((acc, w) =>
        acc + w.sets.reduce((a, s) => a + parseInt(s.reps), 0), 0);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    // ── Render ────────────────────────────────────────────────────────────────
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
                                <Text style={styles.summaryCellValue}>
                                    {formatDuration(summaryData?.duration || 0)}
                                </Text>
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
                            <Text style={styles.volumeValue}>
                                {summaryData?.totalVolume?.toLocaleString()} kg
                            </Text>
                        </View>

                        {summaryData?.prs?.length > 0 && (
                            <View style={styles.prBox}>
                                <Text style={styles.prTitle}>🏆 New Personal Records!</Text>
                                {summaryData.prs.map((pr, i) => (
                                    <View key={i} style={styles.prItem}>
                                        <Ionicons name="trophy" size={14} color={theme.warning} />
                                        <Text style={styles.prText}>{pr.exercise} — {pr.weight} kg</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.modalBtn}
                            activeOpacity={0.82}
                            onPress={closeSummaryAndReset}
                        >
                            <View style={styles.modalBtnInner}>
                                <View style={styles.modalBtnIconWrap}>
                                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                                </View>
                                <Text style={styles.modalBtnText}>Done</Text>
                                <Ionicons name="arrow-forward" size={15} color="rgba(255,255,255,0.9)" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Workout Tracker 🏋️</Text>
                        <Text style={styles.subtitle}>Build your session</Text>
                    </View>
                    {sessionActive ? (
                        <View style={styles.timerBadge}>
                            <Ionicons name="time-outline" size={14} color="#FFFFFF" />
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
                    <TouchableOpacity
                        style={styles.startBtn}
                        onPress={startSession}
                        activeOpacity={0.82}
                    >
                        <View style={styles.startBtnInner}>
                            <View style={styles.startBtnIconWrap}>
                                <Ionicons name="play" size={15} color="#FFFFFF" />
                            </View>
                            <Text style={styles.startBtnText}>Start Workout Session</Text>
                            <Ionicons name="arrow-forward" size={15} color="rgba(255,255,255,0.9)" />
                        </View>
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
                            <Ionicons name="time-outline" size={18} color={theme.info} />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.previousBannerTitle}>Last Session</Text>
                                <Text style={styles.previousBannerDate}>{formatDate(previousDate)}</Text>
                            </View>
                        </View>
                        <View style={styles.previousBannerRight}>
                            <Text style={styles.previousBannerCount}>{previousWorkouts.length} exercises</Text>
                            <Ionicons
                                name={showPrevious ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={theme.info}
                            />
                        </View>
                    </TouchableOpacity>
                )}

                {showPrevious && (
                    <View style={styles.previousList}>
                        <Text style={styles.previousListHint}>
                            Tap to load into form — edit before saving
                        </Text>
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
                                        {prev.sets.length} sets ·{' '}
                                        {prev.sets.map(s =>
                                            `${s.reps}${s.weight ? `×${s.weight}kg` : ' reps'}`
                                        ).join(', ')}
                                    </Text>
                                </View>
                                <View style={styles.loadBtn}>
                                    <Ionicons name="arrow-redo-outline" size={16} color={theme.info} />
                                    <Text style={styles.loadBtnText}>Load</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Input Card */}
                {sessionActive && (
                    <View style={styles.inputCard}>
                        <Text style={styles.inputCardTitle}>Add Exercise</Text>

                        <TextInput
                            placeholder="Exercise name"
                            placeholderTextColor={theme.textTertiary}
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
                                    <View
                                        key={i}
                                        style={[styles.setsPreviewRow, i % 2 === 0 && styles.setsPreviewRowAlt]}
                                    >
                                        <View style={styles.setBadge}>
                                            <Text style={styles.setBadgeText}>{i + 1}</Text>
                                        </View>
                                        <Text style={styles.setsPreviewCell}>{s.reps}</Text>
                                        <Text style={styles.setsPreviewCell}>
                                            {s.weight ? `${s.weight} kg` : '—'}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => removeSet(i)}
                                            style={{ flex: 0.5, alignItems: 'center' }}
                                        >
                                            <Ionicons name="close-circle-outline" size={18} color={theme.error} />
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
                                    placeholderTextColor={theme.textTertiary}
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
                                    placeholderTextColor={theme.textTertiary}
                                    style={styles.inputSmall}
                                    value={currentWeight}
                                    onChangeText={setCurrentWeight}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.addSetBtn, !currentReps && styles.addSetBtnDisabled]}
                                onPress={addSet}
                                activeOpacity={0.82}
                            >
                                <View style={styles.addSetBtnInner}>
                                    <View style={styles.addSetBtnIconWrap}>
                                        <Ionicons name="add" size={14} color="#FFFFFF" />
                                    </View>
                                    <Text style={styles.addSetBtnText}>Add Set</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                (!exercise || currentSets.length === 0) && styles.saveButtonDisabled
                            ]}
                            onPress={saveExercise}
                            activeOpacity={0.82}
                        >
                            <View style={styles.saveButtonInner}>
                                <View style={styles.saveButtonIconWrap}>
                                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                                </View>
                                <Text style={styles.saveButtonText}>
                                    Save Exercise {currentSets.length > 0 ? `(${currentSets.length} sets)` : ''}
                                </Text>
                                <Ionicons name="arrow-forward" size={15} color="rgba(255,255,255,0.9)" />
                            </View>
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
                                    <TouchableOpacity
                                        onPress={() => deleteWorkout(item.id)}
                                        style={styles.deleteBtn}
                                    >
                                        <Ionicons name="trash-outline" size={18} color={theme.error} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.setGrid}>
                                    <View style={styles.setRow}>
                                        <Text style={styles.setColHeader}>SET</Text>
                                        <Text style={styles.setColHeader}>REPS</Text>
                                        <Text style={styles.setColHeader}>WEIGHT</Text>
                                    </View>
                                    {item.sets.map((s, i) => (
                                        <View
                                            key={i}
                                            style={[styles.setRow, i % 2 === 0 && styles.setRowAlt]}
                                        >
                                            <View style={styles.setNumber}>
                                                <Text style={styles.setNumberText}>{i + 1}</Text>
                                            </View>
                                            <Text style={styles.setCell}>{s.reps}</Text>
                                            <Text style={styles.setCell}>
                                                {s.weight ? `${s.weight} kg` : '—'}
                                            </Text>
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
                                            <Text style={[styles.footerBadgeText, { color: theme.success }]}>
                                                {Math.max(
                                                    ...item.sets
                                                        .filter(s => s.weight)
                                                        .map(s => parseFloat(s.weight))
                                                )} kg max
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={styles.finishBtn}
                            onPress={finishWorkout}
                            activeOpacity={0.82}
                        >
                            <View style={styles.finishBtnInner}>
                                <View style={styles.finishBtnIconWrap}>
                                    <Ionicons name="flag" size={15} color="#FFFFFF" />
                                </View>
                                <Text style={styles.finishBtnText}>Finish Workout</Text>
                                <Ionicons name="arrow-forward" size={15} color="rgba(255,255,255,0.9)" />
                            </View>
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

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { padding: 20, paddingBottom: 40 },

    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginTop: 20, marginBottom: 20,
    },
    title: { fontSize: 26, fontWeight: 'bold', color: theme.text },
    subtitle: { fontSize: 14, color: theme.textTertiary, marginTop: 2 },

    statsBadge: {
        backgroundColor: theme.success, borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
    },
    statsNumber: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    statsLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)' },

    timerBadge: {
        backgroundColor: theme.primary, borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 8,
        flexDirection: 'row', alignItems: 'center', gap: 5,
    },
    timerText: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF' },

    startBtn: {
        borderRadius: 18, marginBottom: 20, overflow: 'hidden',
        backgroundColor: theme.success,
        shadowColor: theme.success, shadowOpacity: 0.45, shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    startBtnInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 15, paddingHorizontal: 24,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    startBtnIconWrap: {
        width: 26, height: 26, borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    startBtnText: {
        fontSize: 16, fontWeight: '700', color: '#FFFFFF',
        flex: 1, textAlign: 'center',
    },

    statsRow: {
        backgroundColor: theme.surfaceAlt, borderRadius: 16,
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        padding: 18, marginBottom: 20,
        borderWidth: 1, borderColor: theme.border,
    },
    statBox: { alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: 'bold', color: theme.success },
    statLabel: { fontSize: 11, color: theme.textTertiary, marginTop: 2 },
    statDivider: { width: 1, height: 30, backgroundColor: theme.border },

    previousBanner: {
        backgroundColor: theme.infoLight, borderRadius: 16, padding: 14,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12, borderWidth: 1, borderColor: theme.info,
    },
    previousBannerLeft: { flexDirection: 'row', alignItems: 'center' },
    previousBannerTitle: { fontSize: 13, fontWeight: '700', color: theme.info },
    previousBannerDate: { fontSize: 11, color: theme.info, marginTop: 1, opacity: 0.8 },
    previousBannerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    previousBannerCount: { fontSize: 12, fontWeight: '600', color: theme.info },

    previousList: {
        backgroundColor: theme.infoLight, borderRadius: 16, padding: 14,
        marginBottom: 16, borderWidth: 1, borderColor: theme.border,
    },
    previousListHint: {
        fontSize: 12, color: theme.textSecondary, marginBottom: 12, fontStyle: 'italic',
    },
    previousItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: theme.surface, borderRadius: 12, padding: 12,
        marginBottom: 8, borderWidth: 1, borderColor: theme.border,
    },
    previousItemLeft: { flex: 1 },
    previousItemName: {
        fontSize: 14, fontWeight: '700', color: theme.text,
        textTransform: 'capitalize', marginBottom: 3,
    },
    previousItemMeta: { fontSize: 12, color: theme.textSecondary },
    loadBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: theme.infoLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    },
    loadBtnText: { fontSize: 12, fontWeight: '700', color: theme.info },

    inputCard: {
        backgroundColor: theme.surface, borderRadius: 20, padding: 20, marginBottom: 24,
        shadowColor: theme.shadowColor, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4,
    },
    inputCardTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 14 },
    input: {
        backgroundColor: theme.background, padding: 14, borderRadius: 12,
        fontSize: 15, color: theme.text, marginBottom: 16,
        borderWidth: 1, borderColor: theme.border,
    },

    setsPreview: {
        backgroundColor: theme.background, borderRadius: 12, padding: 10, marginBottom: 16,
    },
    setsPreviewHeader: { flexDirection: 'row', paddingHorizontal: 4, marginBottom: 6 },
    setsPreviewCol: {
        flex: 1, fontSize: 10, fontWeight: '700', color: theme.textTertiary,
        letterSpacing: 0.8, textAlign: 'center',
    },
    setsPreviewRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 7, borderRadius: 8, paddingHorizontal: 4,
    },
    setsPreviewRowAlt: { backgroundColor: theme.divider },
    setsPreviewCell: {
        flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: theme.text,
    },
    setBadge: { flex: 1, alignItems: 'center' },
    setBadgeText: {
        width: 24, height: 24, borderRadius: 8, backgroundColor: theme.border,
        textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: '700',
        color: theme.textSecondary, overflow: 'hidden',
    },

    inputLabel: {
        fontSize: 12, fontWeight: '700', color: theme.textSecondary,
        marginBottom: 8, letterSpacing: 0.5,
    },
    inputRow: { flexDirection: 'row', gap: 10, marginBottom: 16, alignItems: 'flex-end' },
    inputGroupSmall: { flex: 1 },
    inputSubLabel: {
        fontSize: 10, fontWeight: '700', color: theme.textTertiary,
        marginBottom: 6, letterSpacing: 0.8,
    },
    inputSmall: {
        backgroundColor: theme.background, padding: 12, borderRadius: 12,
        fontSize: 16, color: theme.text, textAlign: 'center', fontWeight: '600',
        borderWidth: 1, borderColor: theme.border,
    },

    addSetBtn: {
        flex: 1, borderRadius: 12, overflow: 'hidden',
        backgroundColor: theme.primary,
        shadowColor: theme.primary, shadowOpacity: 0.35, shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    addSetBtnDisabled: { backgroundColor: theme.border, shadowOpacity: 0, elevation: 0 },
    addSetBtnInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 13, paddingHorizontal: 10,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    addSetBtnIconWrap: {
        width: 20, height: 20, borderRadius: 6,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    addSetBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

    saveButton: {
        borderRadius: 16, overflow: 'hidden',
        backgroundColor: theme.success,
        shadowColor: theme.success, shadowOpacity: 0.45, shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    saveButtonDisabled: { backgroundColor: theme.border, shadowOpacity: 0, elevation: 0 },
    saveButtonInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 15, paddingHorizontal: 24,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    saveButtonIconWrap: {
        width: 26, height: 26, borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF', fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'center',
    },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 14 },
    exerciseCard: {
        backgroundColor: theme.surface, borderRadius: 20, marginBottom: 14, overflow: 'hidden',
        shadowColor: theme.shadowColor, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4,
    },
    exerciseHeader: {
        flexDirection: 'row', alignItems: 'center', padding: 16,
        borderBottomWidth: 1, borderBottomColor: theme.divider, gap: 12,
    },
    exerciseIndexBadge: {
        width: 30, height: 30, borderRadius: 10,
        backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center',
    },
    exerciseIndex: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
    exerciseName: {
        flex: 1, fontSize: 16, fontWeight: '700', color: theme.text, textTransform: 'capitalize',
    },
    deleteBtn: { padding: 4 },

    setGrid: { paddingHorizontal: 16, paddingTop: 8 },
    setRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 8, borderRadius: 8, paddingHorizontal: 4,
    },
    setRowAlt: { backgroundColor: theme.background },
    setColHeader: {
        flex: 1, fontSize: 10, fontWeight: '700', color: theme.textTertiary,
        letterSpacing: 0.8, textAlign: 'center',
    },
    setNumber: { flex: 1, alignItems: 'center' },
    setNumberText: {
        width: 24, height: 24, borderRadius: 8, backgroundColor: theme.divider,
        textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: '700',
        color: theme.textSecondary, overflow: 'hidden',
    },
    setCell: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: theme.text },

    exerciseFooter: { flexDirection: 'row', gap: 8, padding: 14, paddingTop: 10 },
    footerBadge: {
        backgroundColor: theme.divider, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    },
    footerBadgeGreen: { backgroundColor: theme.successLight },
    footerBadgeText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },

    finishBtn: {
        borderRadius: 18, marginTop: 6, overflow: 'hidden',
        backgroundColor: theme.error,
        shadowColor: theme.error, shadowOpacity: 0.45, shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    finishBtnInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 15, paddingHorizontal: 24,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    finishBtnIconWrap: {
        width: 26, height: 26, borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    finishBtnText: {
        color: '#FFFFFF', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center',
    },

    emptyState: { alignItems: 'center', paddingVertical: 50 },
    emptyIcon: { fontSize: 48, marginBottom: 14 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 6 },
    emptyText: { fontSize: 14, color: theme.textTertiary, textAlign: 'center' },

    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center', padding: 20,
    },
    modalCard: {
        backgroundColor: theme.surface, borderRadius: 24, padding: 28,
        width: '100%', alignItems: 'center',
    },
    modalEmoji: { fontSize: 48, marginBottom: 8 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
    modalDate: { fontSize: 13, color: theme.textTertiary, marginBottom: 20 },

    summaryGrid: {
        flexDirection: 'row', backgroundColor: theme.surfaceAlt, borderRadius: 16,
        padding: 18, width: '100%', justifyContent: 'space-around', marginBottom: 16,
        borderWidth: 1, borderColor: theme.border,
    },
    summaryCell: { alignItems: 'center' },
    summaryCellValue: { fontSize: 18, fontWeight: 'bold', color: theme.success },
    summaryCellLabel: { fontSize: 11, color: theme.textTertiary, marginTop: 2 },
    summaryCellDivider: { width: 1, backgroundColor: theme.border },

    volumeBox: {
        backgroundColor: theme.background, borderRadius: 14, padding: 16,
        width: '100%', flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: theme.border,
    },
    volumeLabel: { fontSize: 14, color: theme.textSecondary, fontWeight: '600' },
    volumeValue: { fontSize: 20, fontWeight: 'bold', color: theme.text },

    prBox: {
        backgroundColor: theme.warningLight, borderRadius: 14, padding: 14,
        width: '100%', marginBottom: 16, borderWidth: 1, borderColor: theme.warning,
    },
    prTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 8 },
    prItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    prText: { fontSize: 13, color: theme.text, fontWeight: '600' },

    modalBtn: {
        borderRadius: 16, width: '100%', overflow: 'hidden',
        backgroundColor: theme.success,
        shadowColor: theme.success, shadowOpacity: 0.45, shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    modalBtnInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 15, paddingHorizontal: 24,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    modalBtnIconWrap: {
        width: 26, height: 26, borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    modalBtnText: {
        color: '#FFFFFF', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center',
    },
});