import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Dimensions, FlatList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../components/ThemeContext';

const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const screenWidth = Dimensions.get('window').width;
const PHOTO_LABELS = ['Front', 'Back', 'Side', 'Flex', 'Other'];

const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export default function WorkoutCalendarScreen() {
    const [workoutHistory, setWorkoutHistory] = useState({});
    const [macroHistory, setMacroHistory] = useState({});
    const [progressPhotos, setProgressPhotos] = useState({});
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSession, setSelectedSession] = useState(null);
    const { theme } = useTheme();
    const styles = createStyles(theme);

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                try {
                    const wStored = await AsyncStorage.getItem('workout_sessions');
                    const mStored = await AsyncStorage.getItem('macro_history');
                    const pStored = await AsyncStorage.getItem('progress_photos');
                    setWorkoutHistory(wStored ? JSON.parse(wStored) : {});
                    setMacroHistory(mStored ? JSON.parse(mStored) : {});
                    setProgressPhotos(pStored ? JSON.parse(pStored) : {});
                } catch (e) {
                    console.error(e);
                }
            };
            load();
        }, [])
    );

    const saveProgressPhoto = async (dateString, photoUri, label) => {
        try {
            const newPhoto = { id: generateId(), uri: photoUri, label, timestamp: Date.now() };
            const pStored = await AsyncStorage.getItem('progress_photos');
            const photos = pStored ? JSON.parse(pStored) : {};
            if (!photos[dateString]) photos[dateString] = [];
            photos[dateString].push(newPhoto);
            await AsyncStorage.setItem('progress_photos', JSON.stringify(photos));
            setProgressPhotos(photos);
            return true;
        } catch (e) {
            console.error('Failed to save photo', e);
            return false;
        }
    };

    const deleteProgressPhoto = async (dateString, photoId) => {
        Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        const updated = { ...progressPhotos };
                        updated[dateString] = updated[dateString].filter(p => p.id !== photoId);
                        if (updated[dateString].length === 0) delete updated[dateString];
                        await AsyncStorage.setItem('progress_photos', JSON.stringify(updated));
                        setProgressPhotos(updated);
                        Alert.alert('✅ Deleted', 'Photo removed successfully');
                    } catch (e) {
                        console.error('Failed to delete photo', e);
                    }
                }
            }
        ]);
    };

    const handleAddProgressPhoto = (dateString) => {
        Alert.alert('📸 Progress Photo', 'What type of photo?', [
            ...PHOTO_LABELS.map(label => ({ text: label, onPress: () => selectPhotoSource(dateString, label) })),
            { text: 'Cancel', style: 'cancel' }
        ]);
    };

    const selectPhotoSource = (dateString, label) => {
        Alert.alert(`${label} Photo`, 'Choose photo source', [
            {
                text: 'Take Photo',
                onPress: async () => {
                    const permission = await ImagePicker.requestCameraPermissionsAsync();
                    if (!permission.granted) { Alert.alert('Permission Required', 'Camera access is needed'); return; }
                    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [3, 4] });
                    if (!result.canceled) {
                        await saveProgressPhoto(dateString, result.assets[0].uri, label);
                        Alert.alert('✅ Photo Saved', `${label} photo added successfully!`);
                    }
                }
            },
            {
                text: 'Choose from Gallery',
                onPress: async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [3, 4] });
                    if (!result.canceled) {
                        await saveProgressPhoto(dateString, result.assets[0].uri, label);
                        Alert.alert('✅ Photo Saved', `${label} photo added successfully!`);
                    }
                }
            },
            { text: 'Cancel', style: 'cancel' }
        ]);
    };

    const markedDates = {};
    Object.keys(workoutHistory).forEach(date => {
        if (workoutHistory[date].finished) {
            markedDates[date] = {
                marked: true,
                dotColor: theme.success,
                selected: date === selectedDate,
                selectedColor: date === selectedDate ? theme.success : undefined,
            };
        }
    });

    Object.keys(progressPhotos).forEach(date => {
        if (markedDates[date]) {
            markedDates[date].dots = [
                { key: 'workout', color: theme.success },
                { key: 'photo', color: theme.primary }
            ];
            markedDates[date].marked = false;
        } else {
            markedDates[date] = {
                dots: [{ key: 'photo', color: theme.primary }],
                selected: date === selectedDate,
                selectedColor: date === selectedDate ? theme.primary : undefined,
            };
        }
    });

    if (selectedDate && !markedDates[selectedDate]) {
        markedDates[selectedDate] = { selected: true, selectedColor: theme.border };
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
    const photos = selectedDate ? progressPhotos[selectedDate] || [] : [];
    const totalWorkouts = Object.values(workoutHistory).filter(s => s.finished).length;
    const totalPhotos = Object.values(progressPhotos).reduce((sum, p) => sum + p.length, 0);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            <Text style={styles.title}>Calendar 📅</Text>
            <Text style={styles.subtitle}>Track workouts & progress photos</Text>

            {/* Calendar */}
            <View style={styles.calendarCard}>
                <Calendar
                    current={selectedDate}
                    onDayPress={onDayPress}
                    markedDates={markedDates}
                    markingType={'multi-dot'}
                    theme={{
                        backgroundColor: theme.surface,
                        calendarBackground: theme.surface,
                        textSectionTitleColor: theme.textSecondary,
                        selectedDayBackgroundColor: theme.primary,
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: theme.primary,
                        dayTextColor: theme.text,
                        textDisabledColor: theme.textTertiary,
                        dotColor: theme.primary,
                        selectedDotColor: '#ffffff',
                        arrowColor: theme.primary,
                        monthTextColor: theme.text,
                        indicatorColor: theme.primary,
                        textDayFontWeight: '500',
                        textMonthFontWeight: '700',
                        textDayHeaderFontWeight: '600',
                        textDayFontSize: 15,
                        textMonthFontSize: 18,
                        textDayHeaderFontSize: 13,
                    }}
                    style={styles.calendar}
                />
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
                        <Text style={styles.legendText}>Workout</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                        <Text style={styles.legendText}>Photo</Text>
                    </View>
                </View>
                <Text style={styles.legendTotal}>
                    {totalWorkouts} workouts · {totalPhotos} photos
                </Text>
            </View>

            {/* No selection */}
            {!selectedDate && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📸</Text>
                    <Text style={styles.emptyTitle}>Select a day</Text>
                    <Text style={styles.emptyText}>Tap any date to view workouts or add progress photos</Text>
                </View>
            )}

            {/* Selected day with no data */}
            {selectedDate && !selectedSession && photos.length === 0 && (
                <View style={styles.emptyDay}>
                    <Text style={styles.emptyDayTitle}>{formatDate(selectedDate)}</Text>
                    <Text style={styles.emptyDayText}>No workout or photos on this day</Text>
                    <TouchableOpacity
                        style={styles.addPhotoBtn}
                        activeOpacity={0.82}
                        onPress={() => handleAddProgressPhoto(selectedDate)}
                    >
                        <View style={styles.addPhotoBtnInner}>
                            <View style={styles.addPhotoBtnIconWrap}>
                                <Ionicons name="camera" size={15} color="#FFFFFF" />
                            </View>
                            <Text style={styles.addPhotoBtnText}>Add Progress Photo</Text>
                            <Ionicons name="arrow-forward" size={15} color="rgba(255,255,255,0.9)" />
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            {/* Progress Photos Gallery */}
            {selectedDate && photos.length > 0 && (
                <View style={styles.photoGalleryCard}>
                    <View style={styles.photoGalleryHeader}>
                        <View style={styles.photoHeaderLeft}>
                            <Ionicons name="images" size={20} color={theme.primary} />
                            <Text style={styles.photoGalleryTitle}>Progress Photos</Text>
                            <View style={styles.photoCountBadge}>
                                <Text style={styles.photoCountText}>{photos.length}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.addMoreBtn}
                            onPress={() => handleAddProgressPhoto(selectedDate)}
                        >
                            <Ionicons name="add" size={18} color={theme.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.photoDate}>{formatDate(selectedDate)}</Text>

                    <FlatList
                        data={photos}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.photoGalleryList}
                        renderItem={({ item }) => (
                            <View style={styles.photoItem}>
                                <View style={styles.photoLabelContainer}>
                                    <Text style={styles.photoLabel}>{item.label}</Text>
                                    <TouchableOpacity
                                        style={styles.photoDeleteBtn}
                                        onPress={() => deleteProgressPhoto(selectedDate, item.id)}
                                    >
                                        <Ionicons name="close-circle" size={24} color={theme.error} />
                                    </TouchableOpacity>
                                </View>
                                <Image source={{ uri: item.uri }} style={styles.photoImage} resizeMode="cover" />
                            </View>
                        )}
                    />
                </View>
            )}

            {/* Add first photo card */}
            {selectedDate && photos.length === 0 && selectedSession && (
                <TouchableOpacity
                    style={styles.addPhotoCard}
                    activeOpacity={0.82}
                    onPress={() => handleAddProgressPhoto(selectedDate)}
                >
                    <View style={styles.addPhotoIcon}>
                        <Ionicons name="camera-outline" size={28} color={theme.primary} />
                    </View>
                    <Text style={styles.addPhotoTitle}>Add Progress Photos</Text>
                    <Text style={styles.addPhotoSubtitle}>Front, back, side views & more</Text>
                </TouchableOpacity>
            )}

            {/* Workout Session Details */}
            {selectedSession && (
                <View style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                        <Ionicons name="barbell" size={20} color={theme.success} />
                        <Text style={styles.sessionTitle}>Workout Session</Text>
                    </View>
                    <Text style={styles.sessionDate}>{formatDate(selectedDate)}</Text>

                    <View style={styles.sessionStats}>
                        <View style={styles.sessionStat}>
                            <Ionicons name="time-outline" size={18} color={theme.success} />
                            <Text style={styles.sessionStatValue}>{formatDuration(selectedSession.summary?.duration || 0)}</Text>
                            <Text style={styles.sessionStatLabel}>Duration</Text>
                        </View>
                        <View style={styles.sessionStatDivider} />
                        <View style={styles.sessionStat}>
                            <Ionicons name="barbell-outline" size={18} color={theme.success} />
                            <Text style={styles.sessionStatValue}>{selectedSession.exercises?.length || 0}</Text>
                            <Text style={styles.sessionStatLabel}>Exercises</Text>
                        </View>
                        <View style={styles.sessionStatDivider} />
                        <View style={styles.sessionStat}>
                            <Ionicons name="layers-outline" size={18} color={theme.success} />
                            <Text style={styles.sessionStatValue}>{selectedSession.exercises?.reduce((a, w) => a + w.sets.length, 0) || 0}</Text>
                            <Text style={styles.sessionStatLabel}>Total Sets</Text>
                        </View>
                    </View>

                    {macros ? (
                        <View style={styles.macrosCard}>
                            <Text style={styles.macrosTitle}>🍽️ Nutrition That Day</Text>
                            <View style={styles.caloriesRow}>
                                <Text style={styles.caloriesLabel}>Calories</Text>
                                <Text style={styles.caloriesValue}>{Math.round(macros.calories)} kcal</Text>
                            </View>
                            <View style={styles.macrosRow}>
                                <View style={styles.macroItem}>
                                    <Text style={[styles.macroValue, { color: theme.info }]}>{Math.round(macros.protein)}g</Text>
                                    <Text style={styles.macroLabel}>Protein</Text>
                                </View>
                                <View style={styles.macroDivider} />
                                <View style={styles.macroItem}>
                                    <Text style={[styles.macroValue, { color: theme.warning }]}>{Math.round(macros.carbs)}g</Text>
                                    <Text style={styles.macroLabel}>Carbs</Text>
                                </View>
                                <View style={styles.macroDivider} />
                                <View style={styles.macroItem}>
                                    <Text style={[styles.macroValue, { color: theme.error }]}>{Math.round(macros.fat)}g</Text>
                                    <Text style={styles.macroLabel}>Fat</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.noMacros}>
                            <Ionicons name="nutrition-outline" size={16} color={theme.textTertiary} />
                            <Text style={styles.noMacrosText}>No nutrition logged that day</Text>
                        </View>
                    )}

                    {selectedSession.summary?.prs?.length > 0 && (
                        <View style={styles.prBox}>
                            <Text style={styles.prTitle}>🏆 Personal Records</Text>
                            {selectedSession.summary.prs.map((pr, i) => (
                                <View key={i} style={styles.prItem}>
                                    <Ionicons name="trophy" size={14} color={theme.warning} />
                                    <Text style={styles.prText}>{pr.exercise} — {pr.weight} kg</Text>
                                </View>
                            ))}
                        </View>
                    )}

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

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 26, fontWeight: 'bold', color: theme.text, marginTop: 20 },
    subtitle: { fontSize: 16, color: theme.textTertiary, marginBottom: 20 },

    calendarCard: {
        borderRadius: 20, overflow: 'hidden',
        shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity,
        shadowRadius: 10, elevation: 4,
    },
    calendar: { borderRadius: 20 },

    legend: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 14, marginBottom: 20, paddingHorizontal: 4,
    },
    legendRow: { flexDirection: 'row', gap: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
    legendTotal: { fontSize: 12, fontWeight: '700', color: theme.textSecondary },

    emptyState: {
        backgroundColor: theme.surface, borderRadius: 20, padding: 40, marginTop: 16, alignItems: 'center',
        shadowColor: theme.shadowColor, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 },
    emptyText: { fontSize: 14, color: theme.textTertiary, textAlign: 'center', lineHeight: 20 },

    emptyDay: {
        backgroundColor: theme.surface, borderRadius: 20, padding: 24, marginTop: 16, alignItems: 'center',
        shadowColor: theme.shadowColor, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    },
    emptyDayTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 8 },
    emptyDayText: { color: theme.textTertiary, fontSize: 14, marginBottom: 20 },

    // Add Progress Photo button — matches modern button style
    addPhotoBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.primary,
        shadowColor: theme.primary,
        shadowOpacity: 0.45,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    addPhotoBtnInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 13, paddingHorizontal: 22,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    addPhotoBtnIconWrap: {
        width: 26, height: 26, borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    addPhotoBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

    // Photo gallery card
    photoGalleryCard: {
        backgroundColor: theme.surface, borderRadius: 24, padding: 20,
        marginTop: 16, marginBottom: 16,
        shadowColor: theme.primary, shadowOpacity: 0.15, shadowRadius: 20, elevation: 6,
        borderWidth: 2, borderColor: theme.primaryLight,
    },
    photoGalleryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    photoHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    photoGalleryTitle: { fontSize: 16, fontWeight: '800', color: theme.primary },
    photoCountBadge: {
        backgroundColor: theme.primaryLight, paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    },
    photoCountText: { fontSize: 11, fontWeight: '800', color: theme.primary },
    addMoreBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: theme.border,
    },
    photoDate: { fontSize: 13, color: theme.textTertiary, marginBottom: 16, fontWeight: '600' },
    photoGalleryList: { gap: 12 },
    photoItem: {
        width: screenWidth - 80, borderRadius: 16, overflow: 'hidden',
        backgroundColor: theme.background, borderWidth: 2, borderColor: theme.border,
    },
    photoLabelContainer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 12, backgroundColor: theme.primaryLight,
    },
    photoLabel: { fontSize: 14, fontWeight: '800', color: theme.primary },
    photoDeleteBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    photoImage: { width: '100%', height: screenWidth - 80, backgroundColor: theme.divider },

    // Add photo card (dashed)
    addPhotoCard: {
        backgroundColor: theme.primaryLight, borderRadius: 20, padding: 24,
        marginTop: 16, marginBottom: 16, alignItems: 'center',
        borderWidth: 2, borderColor: theme.border, borderStyle: 'dashed',
    },
    addPhotoIcon: {
        width: 64, height: 64, borderRadius: 18, backgroundColor: theme.surface,
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        shadowColor: theme.primary, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
    },
    addPhotoTitle: { fontSize: 16, fontWeight: '800', color: theme.primary, marginBottom: 4 },
    addPhotoSubtitle: { fontSize: 13, color: theme.textTertiary, textAlign: 'center' },

    // Session card
    sessionCard: {
        backgroundColor: theme.surface, borderRadius: 24, padding: 20, marginTop: 16,
        shadowColor: theme.shadowColor, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4,
    },
    sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    sessionTitle: { fontSize: 16, fontWeight: '800', color: theme.success },
    sessionDate: { fontSize: 13, color: theme.textTertiary, marginBottom: 16, fontWeight: '600' },

    sessionStats: {
        backgroundColor: theme.surfaceAlt, borderRadius: 16,
        flexDirection: 'row', justifyContent: 'space-around',
        padding: 16, marginBottom: 16,
        borderWidth: 1, borderColor: theme.border,
    },
    sessionStat: { alignItems: 'center', gap: 4 },
    sessionStatValue: { fontSize: 15, fontWeight: 'bold', color: theme.text, marginTop: 2 },
    sessionStatLabel: { fontSize: 10, color: theme.textTertiary },
    sessionStatDivider: { width: 1, backgroundColor: theme.border },

    // Macros card
    macrosCard: {
        backgroundColor: theme.background, borderRadius: 16, padding: 16,
        marginBottom: 16, borderWidth: 1, borderColor: theme.border,
    },
    macrosTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 12 },
    caloriesRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    caloriesLabel: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
    caloriesValue: { fontSize: 20, fontWeight: 'bold', color: theme.success },
    macrosRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    macroItem: { alignItems: 'center' },
    macroValue: { fontSize: 16, fontWeight: 'bold' },
    macroLabel: { fontSize: 11, color: theme.textTertiary, marginTop: 2 },
    macroDivider: { width: 1, height: 28, backgroundColor: theme.border },

    noMacros: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: theme.background, borderRadius: 12, padding: 12,
        marginBottom: 16, borderWidth: 1, borderColor: theme.border,
    },
    noMacrosText: { fontSize: 13, color: theme.textTertiary },

    // PR box
    prBox: {
        backgroundColor: theme.warningLight, borderRadius: 14, padding: 14,
        marginBottom: 16, borderWidth: 1, borderColor: theme.warning,
    },
    prTitle: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 8 },
    prItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    prText: { fontSize: 13, color: theme.text, fontWeight: '600' },

    exercisesTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12 },
    exItem: { backgroundColor: theme.background, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
    exHeader: {
        flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
        borderBottomWidth: 1, borderBottomColor: theme.divider,
    },
    exIndexBadge: {
        width: 26, height: 26, borderRadius: 8,
        backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center',
    },
    exIndex: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
    exName: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.text, textTransform: 'capitalize' },
    exMeta: { fontSize: 12, color: theme.textTertiary },
    exSets: { padding: 10 },
    exSetRow: { flexDirection: 'row', paddingVertical: 5 },
    exSetNum: { flex: 1, fontSize: 12, fontWeight: '700', color: theme.textSecondary },
    exSetVal: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.text, textAlign: 'center' },
});