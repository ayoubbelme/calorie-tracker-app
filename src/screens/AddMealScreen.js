import React, { useState } from 'react';
import {
    ScrollView, View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform, Alert, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useCalories } from '../components/CaloriesContext';
import { useProfile } from '../components/ProfileContext';

const screenWidth = Dimensions.get('window').width;

export default function AddMealScreen({ navigation }) {
    const { addMeal, todayCalories } = useCalories();
    const { calorieGoal } = useProfile();

    const [mealName, setMealName] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');

    // Auto-calculate calories from macros
    const calculatedCalories = protein && carbs && fat
        ? parseFloat(protein) * 4 + parseFloat(carbs) * 4 + parseFloat(fat) * 9
        : 0;

    const finalCalories = calories ? parseFloat(calories) : calculatedCalories;

    // After adding this meal
    const newTotal = todayCalories + finalCalories;
    const remaining = Math.max(0, parseFloat(calorieGoal) - newTotal);

    const handleAddMeal = () => {
        if (!protein || !carbs || !fat) {
            Alert.alert('Missing Info', 'Please fill in all macro fields (protein, carbs, fat)');
            return;
        }

        addMeal(finalCalories, protein, carbs, fat);

        // Reset form
        setMealName('');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFat('');

        Alert.alert(
            '✅ Meal Added!',
            `${mealName || 'Meal'} logged successfully.\n\nNew total: ${Math.round(newTotal)} / ${calorieGoal} kcal`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
    };

    const openCamera = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Camera access is needed to take photos.');
            return;
        }
        await ImagePicker.launchCameraAsync();
    };

    const openGallery = async () => {
        await ImagePicker.launchImageLibraryAsync();
    };

    const canSubmit = protein && carbs && fat;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : null}
            style={styles.container}
        >
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                   

                    <Text style={styles.headerTitle}>Add Meal</Text>

                    <View style={{ width: 24 }} />
                </View>

                {/* Main Form */}
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Add New Meal</Text>

                    {/* Meal Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Meal Name (optional)</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="restaurant-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                placeholder="e.g. Chicken Bowl"
                                placeholderTextColor="#D1D5DB"
                                style={styles.input}
                                value={mealName}
                                onChangeText={setMealName}
                            />
                        </View>
                    </View>

                    {/* Macros Grid */}
                    <View style={styles.macrosGrid}>
                        {/* Protein */}
                        <View style={[styles.macroInputCard, { borderTopColor: '#3B82F6' }]}>
                            <View style={styles.macroInputHeader}>
                                <Ionicons name="fitness" size={18} color="#3B82F6" />
                                <Text style={[styles.macroInputLabel, { color: '#3B82F6' }]}>Protein</Text>
                            </View>
                            <TextInput
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#D1D5DB"
                                style={styles.macroInput}
                                value={protein}
                                onChangeText={setProtein}
                            />
                            <Text style={styles.macroInputUnit}>grams</Text>
                        </View>

                        {/* Carbs */}
                        <View style={[styles.macroInputCard, { borderTopColor: '#F59E0B' }]}>
                            <View style={styles.macroInputHeader}>
                                <Ionicons name="nutrition" size={18} color="#F59E0B" />
                                <Text style={[styles.macroInputLabel, { color: '#F59E0B' }]}>Carbs</Text>
                            </View>
                            <TextInput
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#D1D5DB"
                                style={styles.macroInput}
                                value={carbs}
                                onChangeText={setCarbs}
                            />
                            <Text style={styles.macroInputUnit}>grams</Text>
                        </View>

                        {/* Fat */}
                        <View style={[styles.macroInputCard, { borderTopColor: '#EF4444' }]}>
                            <View style={styles.macroInputHeader}>
                                <Ionicons name="water" size={18} color="#EF4444" />
                                <Text style={[styles.macroInputLabel, { color: '#EF4444' }]}>Fat</Text>
                            </View>
                            <TextInput
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#D1D5DB"
                                style={styles.macroInput}
                                value={fat}
                                onChangeText={setFat}
                            />
                            <Text style={styles.macroInputUnit}>grams</Text>
                        </View>
                    </View>

                    {/* Manual Calorie Override */}
                    <TouchableOpacity style={styles.advancedToggle}>
                        <Ionicons name="calculator-outline" size={16} color="#9CA3AF" />
                        <Text style={styles.advancedText}>
                            Auto-calculated: <Text style={styles.advancedValue}>{Math.round(calculatedCalories)} kcal</Text>
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Manual Calorie Override (optional)</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="flame-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                keyboardType="numeric"
                                placeholder="Leave empty to auto-calculate"
                                placeholderTextColor="#D1D5DB"
                                style={styles.input}
                                value={calories}
                                onChangeText={setCalories}
                            />
                        </View>
                    </View>
                </View>

                {/* Preview Card */}
                {canSubmit && (
                    <View style={styles.previewCard}>
                        <View style={styles.previewHeader}>
                            <Ionicons name="eye-outline" size={20} color="#6B7280" />
                            <Text style={styles.previewTitle}>Preview After Adding</Text>
                        </View>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewLabel}>New Total</Text>
                            <Text style={styles.previewValue}>
                                {Math.round(newTotal)} <Text style={styles.previewUnit}>/ {calorieGoal} kcal</Text>
                            </Text>
                        </View>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewLabel}>Remaining</Text>
                            <Text style={[styles.previewValue, { color: remaining > 0 ? '#22C55E' : '#EF4444' }]}>
                                {Math.round(remaining)} <Text style={styles.previewUnit}>kcal</Text>
                            </Text>
                        </View>
                        <View style={styles.previewBar}>
                            <View style={[styles.previewBarFill, {
                                width: `${Math.min((newTotal / parseFloat(calorieGoal)) * 100, 100)}%`,
                                backgroundColor: newTotal > parseFloat(calorieGoal) ? '#EF4444' : '#22C55E',
                            }]} />
                        </View>
                    </View>
                )}


                {/* Image Actions */}
                <View style={styles.imageCard}>
                    <Text style={styles.imageTitle}>Scan Nutrition Label</Text>
                    <View style={styles.imageRow}>
                        <TouchableOpacity style={styles.imageBtn} onPress={openCamera}>
                            <View style={styles.imageBtnIcon}>
                                <Ionicons name="camera" size={24} color="#22C55E" />
                            </View>
                            <Text style={styles.imageBtnText}>Take Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.imageBtn} onPress={openGallery}>
                            <View style={styles.imageBtnIcon}>
                                <Ionicons name="images" size={24} color="#3B82F6" />
                            </View>
                            <Text style={styles.imageBtnText}>From Album</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

            {/* Floating Add Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.addButton, !canSubmit && styles.addButtonDisabled]}
                    onPress={handleAddMeal}
                    disabled={!canSubmit}
                >
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    <Text style={styles.addButtonText}>
                        Add {finalCalories > 0 ? `${Math.round(finalCalories)} kcal` : 'Meal'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scroll: { flex: 1 },
    scrollContent: { paddingTop: 20, paddingBottom: 120 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 16,
        backgroundColor: '#F9FAFB',
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },

    // Form Card
    formCard: {
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    formTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 20 },

    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        paddingHorizontal: 16,
    },
    inputIcon: { marginRight: 12 },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
    },

    // Macros Grid
    macrosGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    macroInputCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 18,
        padding: 14,
        borderTopWidth: 3,
        alignItems: 'center',
    },
    macroInputHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
    macroInputLabel: { fontSize: 12, fontWeight: '700' },
    macroInput: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        width: '100%',
        paddingVertical: 4,
    },
    macroInputUnit: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },

    advancedToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    advancedText: { fontSize: 13, color: '#92400E', fontWeight: '500' },
    advancedValue: { fontWeight: '700', color: '#F59E0B' },

    // Preview Card
    previewCard: {
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    previewTitle: { fontSize: 15, fontWeight: '700', color: '#374151' },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    previewLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    previewValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
    previewUnit: { fontSize: 13, fontWeight: '500', color: '#9CA3AF' },
    previewBar: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 12,
    },
    previewBarFill: { height: '100%', borderRadius: 8 },


    // Image Card
    imageCard: {
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    imageTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
    imageRow: { flexDirection: 'row', gap: 12 },
    imageBtn: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
    },
    imageBtnIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    imageBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#22C55E',
        paddingVertical: 16,
        borderRadius: 20,
        shadowColor: '#22C55E',
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 6,
    },
    addButtonDisabled: { backgroundColor: '#D1D5DB' },
    addButtonText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});