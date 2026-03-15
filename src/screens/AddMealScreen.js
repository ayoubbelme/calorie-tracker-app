import React, { useState, useRef, useEffect } from 'react';
import {
    ScrollView, View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform, Alert,
    Dimensions, ActivityIndicator, Animated, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCalories } from '../components/CaloriesContext';
import { useProfile } from '../components/ProfileContext';
import { useTheme } from '../components/ThemeContext';
import { useAchievements } from '../components/AchievementsContext';
import * as Haptics from 'expo-haptics';

const USDA_API_KEY = 'iq5Z4V5K3MOi6b2oyrRcQPEsckNTn9crm0qzpZAh'; // https://fdc.nal.usda.gov/api-key-signup

// ─── Animated Example Chip ─────────────────────────────────────────────────
function ExampleChip({ label, onPress, disabled, theme }) {
    const scale = useRef(new Animated.Value(1)).current;
    const press = () => {
        Animated.sequence([
            Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 40 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }),
        ]).start();
        onPress();
    };
    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                onPress={press} disabled={disabled}
                style={{
                    backgroundColor: theme.primaryLight, paddingHorizontal: 12, paddingVertical: 6,
                    borderRadius: 12, borderWidth: 1.5, borderColor: theme.border,
                }}
                activeOpacity={1}
            >
                <Text style={{ fontSize: 12, color: theme.primaryDark, fontWeight: '700' }}>{label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Macro Input Card ──────────────────────────────────────────────────────
function MacroCard({ icon, label, color, softBg, value, onChange, goal, theme }) {
    const [focused, setFocused] = useState(false);
    const glow = useRef(new Animated.Value(0)).current;

    const onFocus = () => { setFocused(true); Animated.spring(glow, { toValue: 1, useNativeDriver: false, speed: 20 }).start(); };
    const onBlur = () => { setFocused(false); Animated.spring(glow, { toValue: 0, useNativeDriver: false, speed: 20 }).start(); };

    const borderColor = glow.interpolate({ inputRange: [0, 1], outputRange: [theme.border, color] });
    const progress = goal ? Math.min(parseFloat(value || 0) / parseFloat(goal), 1) : 0;

    return (
        <Animated.View style={{ flex: 1, backgroundColor: theme.background, borderRadius: 18, padding: 13, alignItems: 'center', borderWidth: 2, borderColor }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: softBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 }}>
                <Ionicons name={icon} size={15} color={color} />
                <Text style={{ fontSize: 11, fontWeight: '800', color, letterSpacing: 0.2 }}>{label}</Text>
            </View>
            <TextInput
                keyboardType="numeric" placeholder="0" placeholderTextColor={theme.textTertiary}
                style={{ fontSize: 26, fontWeight: '800', color: focused ? color : theme.text, textAlign: 'center', width: '100%', paddingVertical: 4 }}
                value={value} onChangeText={onChange} onFocus={onFocus} onBlur={onBlur}
            />
            <Text style={{ fontSize: 10, color: theme.textTertiary, fontWeight: '600', marginTop: 2 }}>grams</Text>
            <View style={{ width: '100%', height: 3, backgroundColor: theme.divider, borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: color, borderRadius: 3 }} />
            </View>
            <Text style={{ fontSize: 10, color: theme.textTertiary, fontWeight: '600', marginTop: 4 }}>/{goal}g goal</Text>
        </Animated.View>
    );
}

// ─── Barcode Scanner Overlay ───────────────────────────────────────────────
function BarcodeScanner({ onScan, onClose, theme }) {
    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => { if (!permission?.granted) requestPermission(); }, []);

    if (!permission?.granted) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <Ionicons name="camera-outline" size={48} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Camera permission required</Text>
                <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CameraView
                style={{ flex: 1 }}
                facing="back"
                onBarcodeScanned={({ data }) => onScan(data)}
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
            />
            {/* Viewfinder overlay */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{
                    width: 260, height: 160, borderWidth: 2, borderColor: theme.primary, borderRadius: 16,
                    shadowColor: theme.primary, shadowOpacity: 0.8, shadowRadius: 12
                }} />
                <Text style={{ color: '#fff', marginTop: 20, fontSize: 14, fontWeight: '600', opacity: 0.9 }}>
                    Point at a barcode
                </Text>
            </View>
            {/* Close button */}
            <TouchableOpacity
                onPress={onClose}
                style={{
                    position: 'absolute', top: 56, right: 20, width: 44, height: 44, borderRadius: 22,
                    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center'
                }}
            >
                <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function AddMealScreen({ navigation }) {
    const { logMeal } = useAchievements();
    const { theme } = useTheme();
    const { addMeal, todayCalories, todayProtein, todayCarbs, todayFat } = useCalories();
    const { calorieGoal, proteinGoal, carbsGoal, fatGoal } = useProfile();

    const [mealName, setMealName] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [activeTab, setActiveTab] = useState('search');
    const [showScanner, setShowScanner] = useState(false);
    const [searchSource, setSearchSource] = useState(''); // which API returned result

    const fadeIn = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(28)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeIn, { toValue: 1, duration: 420, useNativeDriver: true }),
            Animated.spring(slideUp, { toValue: 0, speed: 14, bounciness: 4, useNativeDriver: true }),
        ]).start();
    }, []);

    const calcCals = protein && carbs && fat
        ? parseFloat(protein) * 4 + parseFloat(carbs) * 4 + parseFloat(fat) * 9 : 0;
    const finalCals = calories ? parseFloat(calories) : calcCals;
    const newTotal = todayCalories + finalCals;
    const remaining = Math.max(0, parseFloat(calorieGoal) - newTotal);

    const newProteinTotal = todayProtein + (parseFloat(protein) || 0);
    const newCarbsTotal = todayCarbs + (parseFloat(carbs) || 0);
    const newFatTotal = todayFat + (parseFloat(fat) || 0);

    const canSubmit = protein && carbs && fat;

    // ── Helper: validate macros are complete and sensible ─────────────────
    const isValidResult = (p, c, f) => !(p === 0 && c === 0 && f === 0);

    // ── 1. Open Food Facts — best for packaged/branded foods ──────────────
    const searchOpenFoodFacts = async (query) => {
        try {
            const res = await fetch(
                `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,nutriments,serving_size,brands`
            );
            if (!res.ok) throw new Error(`OFF responded with ${res.status}`);
            const data = await res.json();

            const products = data.products?.filter(p => {
                const n = p.nutriments;
                // Only accept entries that have all three macros populated
                return n &&
                    n['energy-kcal_100g'] > 0 &&
                    n['proteins_100g'] !== undefined &&
                    n['carbohydrates_100g'] !== undefined &&
                    n['fat_100g'] !== undefined;
            });

            if (!products?.length) throw new Error('No valid OFF results');

            const product = products[0];
            const n = product.nutriments;

            const p = Math.round(n['proteins_100g'] || 0);
            const c = Math.round(n['carbohydrates_100g'] || 0);
            const f = Math.round(n['fat_100g'] || 0);
            const cal = Math.round(n['energy-kcal_100g'] || (p * 4 + c * 4 + f * 9));

            if (!isValidResult(p, c, f)) throw new Error('OFF macros all zero');

            return {
                success: true,
                name: product.product_name || query,
                calories: cal, protein: p, carbs: c, fat: f,
                serving: '100g',
                source: 'Open Food Facts',
            };
        } catch (error) {
            console.log('OFF search failed:', error.message);
            return { success: false };
        }
    };

    // ── 2. Open Food Facts barcode lookup ─────────────────────────────────
    const lookupBarcode = async (barcode) => {
        try {
            const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            if (!res.ok) throw new Error(`OFF barcode responded with ${res.status}`);
            const data = await res.json();

            if (data.status !== 1 || !data.product) throw new Error('Product not found');

            const product = data.product;
            const n = product.nutriments;

            if (!n) throw new Error('No nutriment data');

            // Prefer per-serving values if available, fall back to per 100g
            const hasServing = n['energy-kcal_serving'] > 0;
            const suffix = hasServing ? '_serving' : '_100g';
            const servingLabel = hasServing
                ? (product.serving_size || 'per serving')
                : '100g';

            const p = Math.round(n[`proteins${suffix}`] || n['proteins_100g'] || 0);
            const c = Math.round(n[`carbohydrates${suffix}`] || n['carbohydrates_100g'] || 0);
            const f = Math.round(n[`fat${suffix}`] || n['fat_100g'] || 0);
            const cal = Math.round(n[`energy-kcal${suffix}`] || n['energy-kcal_100g'] || (p * 4 + c * 4 + f * 9));

            if (!isValidResult(p, c, f)) throw new Error('Barcode macros all zero');

            return {
                success: true,
                name: product.product_name || `Product ${barcode}`,
                calories: cal, protein: p, carbs: c, fat: f,
                serving: servingLabel,
                source: 'Open Food Facts (Barcode)',
            };
        } catch (error) {
            console.log('OFF barcode failed:', error.message);
            return { success: false };
        }
    };

    // ── 3. USDA — best for raw whole foods ────────────────────────────────
    const searchUSDA = async (query) => {
        try {
            const res = await fetch(
                `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=10`
            );
            if (!res.ok) {
                const errBody = await res.text();
                throw new Error(`USDA responded with ${res.status}: ${errBody}`);
            }
            const data = await res.json();

            if (!data.foods?.length) throw new Error('No USDA results');

            // Prioritize raw/whole food datasets
            const priority = { 'Foundation': 0, 'SR Legacy': 1, 'Survey (FNDDS)': 2 };
            const food = [...data.foods].sort((a, b) =>
                (priority[a.dataType] ?? 99) - (priority[b.dataType] ?? 99)
            )[0];

            const nutrients = food.foodNutrients || [];
            const getById = (id) => Math.round(nutrients.find(x => x.nutrientId === id)?.value || 0);

            const p = getById(1003); // Protein
            const c = getById(1005); // Carbohydrate, by difference
            const f = getById(1004); // Total lipid (fat)
            const cal = getById(1008); // Energy kcal

            if (!isValidResult(p, c, f)) throw new Error('USDA macros all zero');

            return {
                success: true,
                name: food.description || query,
                calories: cal || Math.round(p * 4 + c * 4 + f * 9),
                protein: p, carbs: c, fat: f,
                serving: '100g',
                source: 'USDA FoodData Central',
            };
        } catch (error) {
            console.log('USDA search failed:', error.message);
            return { success: false };
        }
    };

    // ── Text search: USDA first → OFF fallback ────────────────────────────
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            // Try USDA first (better for raw whole foods)
            let result = await searchUSDA(searchQuery);

            // Fall back to Open Food Facts (better for packaged/branded foods)
            if (!result.success) result = await searchOpenFoodFacts(searchQuery);

            if (result.success) {
                fillForm(result);
                setActiveTab('manual');
                setSearchQuery('');
                Alert.alert(
                    '✅ Found!',
                    `${result.name}\nServing: ${result.serving}\nSource: ${result.source}\n\nAdjust values if needed.`
                );
            } else {
                Alert.alert(
                    'Not Found',
                    'Could not find this food. Try:\n\n• Simpler names (e.g. "chicken breast")\n• Brand name for packaged foods\n• Scan the barcode instead\n• Enter values manually'
                );
            }
        } finally {
            setSearching(false);
        }
    };

    // ── Barcode scanned ───────────────────────────────────────────────────
    const handleBarcodeScan = async (barcode) => {
        setShowScanner(false);
        setSearching(true);
        try {
            const result = await lookupBarcode(barcode);
            if (result.success) {
                fillForm(result);
                setActiveTab('manual');
                Alert.alert(
                    '✅ Barcode Scanned!',
                    `${result.name}\nServing: ${result.serving}\nSource: ${result.source}\n\nAdjust values if needed.`
                );
            } else {
                Alert.alert('Not Found', `Barcode ${barcode} was not found in Open Food Facts.\n\nTry searching by name instead.`);
            }
        } finally {
            setSearching(false);
        }
    };

    const fillForm = (r) => {
        setMealName(r.name);
        setCalories(String(r.calories));
        setProtein(String(r.protein));
        setCarbs(String(r.carbs));
        setFat(String(r.fat));
        setSearchSource(r.source);
    };

    const handleAddMeal = async () => {
        if (!canSubmit) return;
        addMeal(finalCals, protein, carbs, fat);
        await logMeal();
        setMealName(''); setCalories(''); setProtein(''); setCarbs(''); setFat(''); setSearchSource('');
        Alert.alert(
            '✅ Meal Added!',
            `${mealName || 'Meal'} logged successfully.\n\nNew total: ${Math.round(newTotal)} / ${calorieGoal} kcal`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
    };

    const s = createStyles(theme);

    // ── Barcode scanner fullscreen ────────────────────────────────────────
    if (showScanner) {
        return (
            <BarcodeScanner
                theme={theme}
                onScan={handleBarcodeScan}
                onClose={() => setShowScanner(false)}
            />
        );
    }

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
                <Animated.ScrollView
                    style={{ flex: 1, opacity: fadeIn }}
                    contentContainerStyle={s.scroll}
                    showsVerticalScrollIndicator={false}
                >

                    {/* ── Header ─────────────────────────────────────── */}
                    <Animated.View style={[s.header, { transform: [{ translateY: slideUp }] }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                            <Ionicons name="chevron-back" size={22} color={theme.text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={s.headerTitle}>Add Meal</Text>
                            <Text style={s.headerSub}>Track your nutrition accurately</Text>
                        </View>
                        <View style={[s.liveDot, { backgroundColor: theme.success, shadowColor: theme.success }]} />
                    </Animated.View>

                    {/* ── Today snapshot strip ─────────────────────── */}
                    <View style={s.snapshotStrip}>
                        {[
                            { label: 'Calories', val: Math.round(todayCalories), unit: 'kcal', color: theme.primary },
                            { label: 'Protein', val: Math.round(todayProtein), unit: 'g', color: theme.info },
                            { label: 'Carbs', val: Math.round(todayCarbs), unit: 'g', color: theme.warning },
                            { label: 'Fat', val: Math.round(todayFat), unit: 'g', color: theme.error },
                        ].map((item, i) => (
                            <View key={i} style={s.snapshotItem}>
                                <Text style={[s.snapshotVal, { color: item.color }]}>{item.val}</Text>
                                <Text style={s.snapshotUnit}>{item.unit}</Text>
                                <Text style={s.snapshotLabel}>{item.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* ── Tab switcher ─────────────────────────────── */}
                    <View style={s.tabBar}>
                        {[
                            { key: 'search', icon: 'search-outline', label: 'Food Search' },
                            { key: 'manual', icon: 'create-outline', label: 'Manual Entry' },
                        ].map(({ key, icon, label }) => (
                            <TouchableOpacity
                                key={key}
                                style={[s.tab, activeTab === key && s.tabActive]}
                                onPress={() => { setActiveTab(key); Haptics.selectionAsync(); }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name={icon} size={16} color={activeTab === key ? theme.primary : theme.textTertiary} />
                                <Text style={[s.tabText, activeTab === key && { color: theme.primary }]}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ════════════ SEARCH PANEL ════════════════════ */}
                    {activeTab === 'search' && (
                        <View style={s.panel}>
                            <View style={[s.panelTopGlow, { backgroundColor: theme.primaryLight }]} />

                            <View style={s.panelHeader}>
                                <View style={[s.iconBox, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                                    <Ionicons name="nutrition" size={22} color={theme.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.panelTitle}>Food Lookup</Text>
                                    <Text style={[s.panelSub, { color: theme.primary }]}>Open Food Facts · USDA FoodData Central</Text>
                                </View>
                            </View>

                            {/* Search input */}
                            <View style={[s.searchRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                <Ionicons name="search" size={18} color={theme.primary} style={{ marginRight: 10 }} />
                                <TextInput
                                    placeholder="e.g. chicken breast, Nutella, oats"
                                    placeholderTextColor={theme.textTertiary}
                                    style={[s.searchInput, { color: theme.text }]}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    editable={!searching}
                                    onSubmitEditing={handleSearch}
                                    returnKeyType="search"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Search + Barcode row */}
                            <View style={s.actionRow}>
                                <TouchableOpacity
                                    onPress={handleSearch}
                                    disabled={searching || !searchQuery.trim()}
                                    activeOpacity={0.85}
                                    style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}
                                >
                                    <LinearGradient
                                        colors={searching || !searchQuery.trim()
                                            ? [theme.border, theme.border]
                                            : [theme.primary, theme.primaryDark ?? theme.primary]}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={s.searchBtn}
                                    >
                                        {searching ? (
                                            <>
                                                <ActivityIndicator color="#fff" size="small" />
                                                <Text style={s.searchBtnText}>Searching…</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Ionicons name="search" size={15} color="#fff" />
                                                <Text style={s.searchBtnText}>Search Food</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Barcode scan button */}
                                <TouchableOpacity
                                    onPress={() => setShowScanner(true)}
                                    disabled={searching}
                                    style={[s.barcodeBtn, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="barcode-outline" size={22} color={theme.primary} />
                                </TouchableOpacity>
                            </View>

                            {/* Example chips */}
                            <View style={s.examplesRow}>
                                <Text style={[s.examplesLabel, { color: theme.textSecondary }]}>Try:</Text>
                                {['chicken breast', 'white rice', 'whole egg', 'banana', 'oats'].map((e, i) => (
                                    <ExampleChip key={i} label={e} disabled={searching} onPress={() => setSearchQuery(e)} theme={theme} />
                                ))}
                            </View>


                            {/* Info note */}
                            <View style={[s.infoNote, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                                <Ionicons name="information-circle-outline" size={15} color={theme.primary} />
                                <Text style={[s.infoNoteText, { color: theme.primaryDark }]}>
                                    Results are per 100g. Adjust values after searching to match your actual portion size.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* ════════════ MANUAL PANEL ════════════════════ */}
                    {activeTab === 'manual' && (
                        <View style={s.panel}>
                            {/* Source tag if filled from search */}
                            {searchSource ? (
                                <View style={[s.sourceTag, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                                    <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
                                    <Text style={[s.sourceTagText, { color: theme.primaryDark }]}>Filled from {searchSource}</Text>
                                </View>
                            ) : null}

                            {/* Meal name */}
                            <View style={s.fieldGroup}>
                                <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>
                                    Meal Name <Text style={{ color: theme.textTertiary, fontWeight: '500' }}>(optional)</Text>
                                </Text>
                                <View style={[s.fieldRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                    <Ionicons name="restaurant-outline" size={18} color={theme.textTertiary} style={{ marginRight: 10 }} />
                                    <TextInput
                                        placeholder="e.g. Chicken Bowl"
                                        placeholderTextColor={theme.textTertiary}
                                        style={[s.fieldInput, { color: theme.text }]}
                                        value={mealName} onChangeText={setMealName}
                                    />
                                </View>
                            </View>

                            {/* Calories */}
                            <View style={s.fieldGroup}>
                                <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>
                                    Calories <Text style={{ color: theme.textTertiary, fontWeight: '500' }}>(optional — auto-calculated)</Text>
                                </Text>
                                <View style={[s.fieldRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                    <Ionicons name="flame-outline" size={18} color={theme.warning} style={{ marginRight: 10 }} />
                                    <TextInput
                                        placeholder="Leave empty for auto-calc"
                                        placeholderTextColor={theme.textTertiary}
                                        style={[s.fieldInput, { color: theme.text }]}
                                        keyboardType="numeric" value={calories} onChangeText={setCalories}
                                    />
                                    <Text style={[s.fieldUnit, { color: theme.textTertiary }]}>kcal</Text>
                                </View>
                                {!calories && calcCals > 0 && (
                                    <View style={[s.autoHint, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                                        <Ionicons name="information-circle-outline" size={13} color={theme.primary} />
                                        <Text style={[s.autoHintText, { color: theme.primaryDark }]}>Auto: {Math.round(calcCals)} kcal from macros</Text>
                                    </View>
                                )}
                            </View>

                            {/* Macros */}
                            <Text style={[s.fieldLabel, { color: theme.textSecondary, marginBottom: 10 }]}>Macronutrients</Text>
                            <View style={s.macrosRow}>
                                <MacroCard icon="fitness" label="Protein" color={theme.info} softBg={theme.primaryLight} value={protein} onChange={setProtein} goal={proteinGoal} theme={theme} />
                                <MacroCard icon="nutrition" label="Carbs" color={theme.warning} softBg={theme.warningLight} value={carbs} onChange={setCarbs} goal={carbsGoal} theme={theme} />
                                <MacroCard icon="water" label="Fat" color={theme.error} softBg={theme.warningLight} value={fat} onChange={setFat} goal={fatGoal} theme={theme} />
                            </View>

                            {/* Calorie badge */}
                            <View style={[s.calcBadge, { backgroundColor: theme.warningLight, borderColor: theme.warning }]}>
                                <Ionicons name="calculator-outline" size={15} color={calories ? theme.info : theme.warning} />
                                <Text style={[s.calcBadgeText, { color: theme.text }]}>
                                    {calories
                                        ? <>Using manual: <Text style={{ fontWeight: '800', color: theme.info }}>{Math.round(parseFloat(calories))} kcal</Text></>
                                        : <>Auto-calculated: <Text style={{ fontWeight: '800', color: theme.warning }}>{Math.round(calcCals)} kcal</Text></>
                                    }
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* ════════════ PREVIEW CARD ════════════════════ */}
                    {canSubmit && (
                        <View style={s.previewCard}>
                            <View style={s.previewHeader}>
                                <Ionicons name="eye-outline" size={18} color={theme.textSecondary} />
                                <Text style={[s.previewTitle, { color: theme.text }]}>After Adding This Meal</Text>
                            </View>

                            <View style={s.previewCalRow}>
                                <View>
                                    <Text style={[s.previewBig, { color: theme.text }]}>
                                        {Math.round(newTotal)}
                                        <Text style={[s.previewBigSub, { color: theme.textTertiary }]}> / {calorieGoal} kcal</Text>
                                    </Text>
                                    <Text style={[s.previewRemaining, { color: remaining > 0 ? theme.success : theme.error }]}>
                                        {remaining > 0
                                            ? `${Math.round(remaining)} kcal remaining`
                                            : `${Math.round(newTotal - parseFloat(calorieGoal))} kcal over goal`}
                                    </Text>
                                </View>
                                <View style={[s.addedBadge, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                                    <Text style={[s.addedBadgeVal, { color: theme.primary }]}>+{Math.round(finalCals)}</Text>
                                    <Text style={[s.addedBadgeSub, { color: theme.primary }]}>kcal added</Text>
                                </View>
                            </View>

                            <View style={[s.bigBar, { backgroundColor: theme.divider }]}>
                                <View style={[s.bigBarExisting, {
                                    width: `${Math.min((todayCalories / parseFloat(calorieGoal)) * 100, 100)}%`,
                                    backgroundColor: theme.textTertiary,
                                }]} />
                                <View style={[s.bigBarNew, {
                                    width: `${Math.min((finalCals / parseFloat(calorieGoal)) * 100, 100)}%`,
                                    backgroundColor: newTotal > parseFloat(calorieGoal) ? theme.error : theme.primary,
                                }]} />
                            </View>
                            <View style={s.barLegend}>
                                <View style={s.legendItem}>
                                    <View style={[s.legendDot, { backgroundColor: theme.textTertiary }]} />
                                    <Text style={[s.legendText, { color: theme.textTertiary }]}>Today so far</Text>
                                </View>
                                <View style={s.legendItem}>
                                    <View style={[s.legendDot, { backgroundColor: theme.primary }]} />
                                    <Text style={[s.legendText, { color: theme.textTertiary }]}>This meal</Text>
                                </View>
                            </View>

                            <View style={s.macroPills}>
                                {[
                                    { letter: 'P', val: Math.round(newProteinTotal), goal: proteinGoal, color: theme.info },
                                    { letter: 'C', val: Math.round(newCarbsTotal), goal: carbsGoal, color: theme.warning },
                                    { letter: 'F', val: Math.round(newFatTotal), goal: fatGoal, color: theme.error },
                                ].map((m, i) => (
                                    <View key={i} style={[s.macroPill, { backgroundColor: theme.background, borderColor: theme.divider }]}>
                                        <Text style={[s.macroPillLetter, { color: m.color }]}>{m.letter}</Text>
                                        <Text style={[s.macroPillVal, { color: m.val > parseFloat(m.goal) ? theme.error : theme.text }]}>
                                            {m.val}<Text style={[s.macroPillGoal, { color: theme.textTertiary }]}>/{m.goal}g</Text>
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={{ height: 120 }} />
                </Animated.ScrollView>
            </KeyboardAvoidingView>

            {/* ── Footer CTA ───────────────────────────────────────── */}
            <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.divider }]}>
                <TouchableOpacity
                    onPress={handleAddMeal} disabled={!canSubmit}
                    activeOpacity={0.88} style={{ borderRadius: 20, overflow: 'hidden' }}
                >
                    <LinearGradient
                        colors={canSubmit ? [theme.success, theme.success] : [theme.border, theme.border]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={s.footerBtn}
                    >
                        <View style={[s.footerBtnIcon, { backgroundColor: 'rgba(0,0,0,0.18)' }]}>
                            <Ionicons name="checkmark" size={16} color={canSubmit ? '#fff' : theme.textTertiary} />
                        </View>
                        <Text style={[s.footerBtnText, !canSubmit && { color: theme.textTertiary }]}>
                            {canSubmit ? `Log ${Math.round(finalCals)} kcal` : 'Fill in macros to continue'}
                        </Text>
                        {canSubmit && <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" style={{ right: 15 }} />}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const createStyles = (theme) => StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    scroll: { paddingTop: 60, paddingBottom: 40 },

    header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, marginBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 28, fontWeight: '800', color: theme.text, letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: theme.textTertiary, marginTop: 2 },
    liveDot: { width: 10, height: 10, borderRadius: 5, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },

    snapshotStrip: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: theme.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.border, paddingVertical: 14, paddingHorizontal: 8, marginBottom: 16 },
    snapshotItem: { flex: 1, alignItems: 'center' },
    snapshotVal: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    snapshotUnit: { fontSize: 9, color: theme.textTertiary, fontWeight: '700', letterSpacing: 0.5, marginTop: 1 },
    snapshotLabel: { fontSize: 10, color: theme.textSecondary, marginTop: 3, fontWeight: '600' },

    tabBar: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 4, marginBottom: 14 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 13 },
    tabActive: { backgroundColor: theme.surfaceAlt ?? theme.background, borderWidth: 1, borderColor: theme.border },
    tabText: { fontSize: 13, fontWeight: '700', color: theme.textTertiary },

    panel: { marginHorizontal: 20, backgroundColor: theme.surface, borderRadius: 24, borderWidth: 1.5, borderColor: theme.border, padding: 20, marginBottom: 14, overflow: 'hidden', shadowColor: theme.primary, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    panelTopGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 80, opacity: 0.4 },
    panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
    iconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    panelTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
    panelSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },

    searchRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },

    actionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
    searchBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
    barcodeBtn: { width: 52, height: 52, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

    examplesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 14 },
    examplesLabel: { fontSize: 11, fontWeight: '700' },

    sourceBadges: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    sourceBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1 },
    sourceBadgeText: { fontSize: 10, fontWeight: '700', flex: 1 },
    sourceBadgeTag: { fontSize: 9, fontWeight: '800', opacity: 0.8 },

    infoNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
    infoNoteText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },

    sourceTag: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, marginBottom: 16 },
    sourceTagText: { fontSize: 12, fontWeight: '700' },

    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.2 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 14 },
    fieldInput: { flex: 1, paddingVertical: 14, fontSize: 15, fontWeight: '500' },
    fieldUnit: { fontSize: 13, fontWeight: '700' },
    autoHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
    autoHintText: { fontSize: 12, fontWeight: '700' },

    macrosRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    calcBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
    calcBadgeText: { fontSize: 13, fontWeight: '500' },

    previewCard: { marginHorizontal: 20, backgroundColor: theme.surface, borderRadius: 24, borderWidth: 1, borderColor: theme.border, padding: 20, marginBottom: 14, shadowColor: theme.shadowColor, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
    previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    previewTitle: { fontSize: 15, fontWeight: '700' },
    previewCalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    previewBig: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    previewBigSub: { fontSize: 14, fontWeight: '500' },
    previewRemaining: { fontSize: 13, fontWeight: '700', marginTop: 4 },
    addedBadge: { alignItems: 'center', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1.5 },
    addedBadgeVal: { fontSize: 22, fontWeight: '800' },
    addedBadgeSub: { fontSize: 10, fontWeight: '700', opacity: 0.75 },

    bigBar: { height: 8, borderRadius: 8, overflow: 'hidden', flexDirection: 'row', marginBottom: 8 },
    bigBarExisting: { height: '100%' },
    bigBarNew: { height: '100%' },
    barLegend: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, fontWeight: '600' },

    macroPills: { flexDirection: 'row', gap: 10 },
    macroPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 10, borderWidth: 1.5 },
    macroPillLetter: { fontSize: 13, fontWeight: '900' },
    macroPillVal: { fontSize: 13, fontWeight: '800' },
    macroPillGoal: { fontSize: 10, fontWeight: '500' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 32 : 20, paddingTop: 12, borderTopWidth: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, elevation: 10 },
    footerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: 20 },
    footerBtnIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', left: 15 },
    footerBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center', letterSpacing: 0.2 },
});