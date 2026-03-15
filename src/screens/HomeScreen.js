import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert, TextInput, Modal, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCalories } from '../components/CaloriesContext';
import { useProfile } from '../components/ProfileContext';
import { useTheme } from '../components/ThemeContext';
import * as Haptics from 'expo-haptics';
import { useAchievements } from '../components/AchievementsContext';
import CelebrationModal from '../components/CelebrationModal';
import { useSound } from '../components/SoundContext';
import { getDailyInsights } from '../components/Insights';


const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const screenWidth = Dimensions.get('window').width;

const PHOTO_LABELS = ['Front', 'Back', 'Side', 'Flex', 'Other'];

// Generate unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// ─── INSIGHTS DATA is in ../data/insights.js ─────────────────────────────────

// ─── INSIGHT SLIDESHOW COMPONENT ─────────────────────────────────────────────
const InsightSlideshow = ({ styles, theme }) => {
    const insights = getDailyInsights();
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef(null);
    const autoPlayRef = useRef(null);
    const cardWidth = screenWidth - 40; // full width minus margins

    const goToSlide = (index) => {
        const clamped = Math.max(0, Math.min(index, insights.length - 1));
        scrollRef.current?.scrollTo({ x: clamped * cardWidth, animated: true });
        setActiveIndex(clamped);
    };

    // Auto-advance every 6 seconds
    useEffect(() => {
        autoPlayRef.current = setInterval(() => {
            setActiveIndex(prev => {
                const next = (prev + 1) % insights.length;
                scrollRef.current?.scrollTo({ x: next * cardWidth, animated: true });
                return next;
            });
        }, 6000);
        return () => clearInterval(autoPlayRef.current);
    }, []);

    const handleScrollEnd = (e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
        setActiveIndex(index);
        // Reset auto-play timer on manual swipe
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = setInterval(() => {
            setActiveIndex(prev => {
                const next = (prev + 1) % insights.length;
                scrollRef.current?.scrollTo({ x: next * cardWidth, animated: true });
                return next;
            });
        }, 6000);
    };

    const current = insights[activeIndex];

    return (
        <View style={styles.slideshowWrapper}>
            {/* Header */}
            <View style={styles.slideshowHeader}>
                <View style={styles.slideshowTitleRow}>
                    <Ionicons name="bulb" size={16} color={theme.warning} />
                    <Text style={styles.slideshowTitle}>Daily Insights</Text>
                </View>
                <Text style={styles.slideshowMeta}>
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
            </View>

            {/* Scrollable Cards */}
            <Animated.ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScrollEnd}
                decelerationRate="fast"
                snapToInterval={cardWidth}
                snapToAlignment="start"
                style={{ width: cardWidth }}
            >
                {insights.map((insight, i) => (
                    <View
                        key={i}
                        style={[styles.insightCard, { width: cardWidth, borderLeftColor: insight.color }]}
                    >
                        <View style={styles.insightTop}>
                            <View style={[styles.insightIconCircle, { backgroundColor: insight.color + '20' }]}>
                                <Text style={styles.insightEmoji}>{insight.icon}</Text>
                            </View>
                            <View style={[styles.insightCategoryBadge, { backgroundColor: insight.color + '20' }]}>
                                <Text style={[styles.insightCategory, { color: insight.color }]}>{insight.category}</Text>
                            </View>
                        </View>
                        <Text style={styles.insightTitle}>{insight.title}</Text>
                        <Text style={styles.insightBody}>{insight.body}</Text>
                    </View>
                ))}
            </Animated.ScrollView>

            {/* Dot Indicators */}
            <View style={styles.dotsRow}>
                {insights.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => goToSlide(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <View
                            style={[
                                styles.dot,
                                i === activeIndex
                                    ? [styles.dotActive, { backgroundColor: current.color }]
                                    : styles.dotInactive,
                            ]}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

// Large calorie ring component
const CalorieRing = ({ current, goal, styles, theme }) => {
    const size = 200;
    const radius = 85;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(current / goal, 1);
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <View style={styles.ringContainer}>
            <Svg width={size} height={size}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={theme.divider}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={theme.calories}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>
            <View style={styles.ringCenter}>
                <Text style={styles.ringCalories}>{Math.round(current)}</Text>
                <Text style={styles.ringLabel}>kcal</Text>
                <View style={styles.ringDivider} />
                <Text style={styles.ringGoal}>{goal} goal</Text>
            </View>
        </View>
    );
};

// Compact macro bar
const MacroBar = ({ label, value, goal, color, icon, styles, theme }) => {
    const progress = Math.min((value / goal) * 100, 100);
    return (
        <View style={styles.macroBar}>
            <View style={styles.macroBarHeader}>
                <View style={styles.macroBarLeft}>
                    <View style={[styles.macroIcon, { backgroundColor: color + '20' }]}>
                        <Ionicons name={icon} size={16} color={color} />
                    </View>
                    <Text style={styles.macroBarLabel}>{label}</Text>
                </View>
                <Text style={styles.macroBarValue}>
                    <Text style={{ color, fontWeight: '800' }}>{Math.round(value)}</Text>
                    <Text style={{ color: theme.textTertiary }}> / {goal}g</Text>
                </Text>
            </View>
            <View style={styles.macroBarBg}>
                <View style={[styles.macroBarFill, { width: `${progress}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
};

// Quick stat card with haptic feedback
const StatCard = ({ icon, label, value, color, styles, onPress }) => (
    <TouchableOpacity
        style={styles.statCard}
        onPress={() => {
            onPress && onPress();
        }}
        activeOpacity={0.7}
    >
        <View style={[styles.statIconBox, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
    const { playSound } = useSound();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { todayCalories, todayProtein, todayCarbs, todayFat, history, updateWeight } = useCalories();
    const {
        name,
        calorieGoal,
        proteinGoal,
        carbsGoal,
        fatGoal,
        weight,
        height,
        goal,
        bmr,
        tdee,
        isLoaded,
        updateProfile
    } = useProfile();

    const {
        logMeal,
        logGoalHit,
        logPhoto,
        logWeight,
        logWaterGoal,
        streak,
        longestStreak,
        totalMeals,
        unlockedAchievements,
    } = useAchievements();

    // Modal states
    const [weightModalVisible, setWeightModalVisible] = useState(false);
    const [newWeight, setNewWeight] = useState(weight);
    const [waterIntake, setWaterIntake] = useState(0);
    const [todayPhotoCount, setTodayPhotoCount] = useState(0);
    const [celebrationVisible, setCelebrationVisible] = useState(false);
    const [unlockedAchievement, setUnlockedAchievement] = useState(null);

    // Animation values
    const ringPulse = React.useRef(new Animated.Value(1)).current;

    // Track whether we already fired the goal alert today so it never re-fires
    // when the user navigates back to this screen.
    const goalAlertedDateRef = React.useRef(null);
    // Track the last calories value that triggered the check so we only re-check
    // when calories actually change, not just on every focus.
    const lastCheckedCaloriesRef = React.useRef(null);

    // Load data on focus
    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    // Load photo count
                    const pStored = await AsyncStorage.getItem('progress_photos');
                    if (pStored) {
                        const photos = JSON.parse(pStored);
                        const todayKey = getLocalDateString();
                        setTodayPhotoCount(photos[todayKey]?.length || 0);
                    }

                    // Load water intake for today
                    const waterData = await AsyncStorage.getItem('water_intake');
                    if (waterData) {
                        const water = JSON.parse(waterData);
                        const todayKey = getLocalDateString();
                        setWaterIntake(water[todayKey] || 0);
                    }

                    // Check goal only if calories actually changed since last check
                    checkGoalAchievement();
                } catch (e) {
                    console.error('Failed to load data', e);
                }
            };
            loadData();
        }, [todayCalories, calorieGoal])
    );

    // Check if calorie goal was hit — fires at most ONCE per day
    const checkGoalAchievement = () => {
        const todayKey = getLocalDateString();

        // Already alerted today -> do nothing
        if (goalAlertedDateRef.current === todayKey) return;

        // Calories haven't changed since last check -> do nothing
        if (lastCheckedCaloriesRef.current === todayCalories) return;
        lastCheckedCaloriesRef.current = todayCalories;

        const calorieGoalNum = parseFloat(calorieGoal || '2000');
        const tolerance = calorieGoalNum * 0.05;

        if (
            todayCalories >= (calorieGoalNum - tolerance) &&
            todayCalories <= (calorieGoalNum + tolerance)
        ) {
            // Mark as alerted for today so re-focusing never re-fires it
            goalAlertedDateRef.current = todayKey;

            logGoalHit();

            Animated.sequence([
                Animated.timing(ringPulse, {
                    toValue: 1.05,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(ringPulse, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    };

    if (!isLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.calories} />
            </View>
        );
    }

    const proteinGoalNum = parseFloat(proteinGoal || '150');
    const carbsGoalNum = parseFloat(carbsGoal || '200');
    const fatGoalNum = parseFloat(fatGoal || '67');
    const calorieGoalNum = parseFloat(calorieGoal || '2000');

    const historyKeys = Object.keys(history);
    const totalDays = historyKeys.length;

    const allCalories = historyKeys.map(k => history[k].calories || 0);
    const avgCalories = totalDays ? Math.round(allCalories.reduce((a, b) => a + b, 0) / totalDays) : 0;

    const remaining = Math.max(0, calorieGoalNum - todayCalories);

    const bmi = weight && height
        ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)
        : '--';

    const firstName = (name || 'User').split(' ')[0];

    const handleWeightUpdate = async () => {
        if (!newWeight || isNaN(newWeight)) {
            Alert.alert('Invalid Weight', 'Please enter a valid number');
            return;
        }
        updateProfile({ weight: newWeight });
        updateWeight(newWeight);
        await logWeight();
        setWeightModalVisible(false);
        Alert.alert(
            '✅ Weight Updated',
            `Your weight has been updated to ${newWeight}kg\n\nYour calorie and macro goals have been automatically recalculated!`
        );
    };

    const saveProgressPhoto = async (photoUri, label) => {
        try {
            const todayKey = getLocalDateString();
            const newPhoto = {
                id: generateId(),
                uri: photoUri,
                label: label,
                timestamp: Date.now()
            };
            const pStored = await AsyncStorage.getItem('progress_photos');
            const progressPhotos = pStored ? JSON.parse(pStored) : {};
            if (!progressPhotos[todayKey]) {
                progressPhotos[todayKey] = [];
            }
            progressPhotos[todayKey].push(newPhoto);
            await AsyncStorage.setItem('progress_photos', JSON.stringify(progressPhotos));
            setTodayPhotoCount(progressPhotos[todayKey].length);
            await logPhoto();
            return true;
        } catch (e) {
            console.error('Failed to save photo', e);
            return false;
        }
    };

    const handleProgressPhoto = async () => {
        Alert.alert(
            '📸 Progress Photo',
            'What type of photo?',
            [
                ...PHOTO_LABELS.map(label => ({
                    text: label,
                    onPress: () => selectPhotoSource(label)
                })),
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const selectPhotoSource = (label) => {
        Alert.alert(
            `${label} Photo`,
            'Choose photo source',
            [
                {
                    text: 'Take Photo',
                    onPress: async () => {
                        const permission = await ImagePicker.requestCameraPermissionsAsync();
                        if (!permission.granted) {
                            Alert.alert('Permission Required', 'Camera access is needed');
                            return;
                        }
                        const result = await ImagePicker.launchCameraAsync({
                            quality: 0.7,
                            allowsEditing: true,
                            aspect: [3, 4],
                        });
                        if (!result.canceled) {
                            const saved = await saveProgressPhoto(result.assets[0].uri, label);
                            if (saved) {
                                Alert.alert(
                                    '✅ Photo Saved',
                                    `${label} photo added successfully!\n\nView it in the Calendar tab.`,
                                    [
                                        { text: 'OK' },
                                        { text: 'View Calendar', onPress: () => navigation.navigate('Calendar') }
                                    ]
                                );
                            }
                        }
                    }
                },
                {
                    text: 'Choose from Gallery',
                    onPress: async () => {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: 0.7,
                            allowsEditing: true,
                            aspect: [3, 4],
                        });
                        if (!result.canceled) {
                            const saved = await saveProgressPhoto(result.assets[0].uri, label);
                            if (saved) {
                                Alert.alert(
                                    '✅ Photo Saved',
                                    `${label} photo added successfully!\n\nView it in the Calendar tab.`,
                                    [
                                        { text: 'OK' },
                                        { text: 'View Calendar', onPress: () => navigation.navigate('Calendar') }
                                    ]
                                );
                            }
                        }
                    }
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const addWaterGlass = async () => {
        const newWaterIntake = waterIntake + 1;
        setWaterIntake(newWaterIntake);
        try {
            const waterData = await AsyncStorage.getItem('water_intake');
            const water = waterData ? JSON.parse(waterData) : {};
            const todayKey = getLocalDateString();
            water[todayKey] = newWaterIntake;
            await AsyncStorage.setItem('water_intake', JSON.stringify(water));
            if (newWaterIntake >= 8) {
                playSound('water');
                await logWaterGoal();
                Alert.alert('🎉 Great Job!', 'You\'ve reached your daily water goal!');
            }
        } catch (e) {
            console.error('Failed to save water intake', e);
        }
    };

    return (
        <>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Greeting */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello, {firstName} </Text>
                        <Text style={styles.date}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.achievementsBadge}
                        onPress={() => navigation.navigate('Achievements')}
                    >
                        <Ionicons name="trophy" size={24} color={theme.warning} />
                        {unlockedAchievements.length > 0 && (
                            <View style={styles.achievementsCount}>
                                <Text style={styles.achievementsCountText}>{unlockedAchievements.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Hero Card - Main Calorie Ring */}
                <Animated.View style={[styles.heroCard, { transform: [{ scale: ringPulse }] }]}>
                    <CalorieRing current={todayCalories} goal={calorieGoalNum} styles={styles} theme={theme} />
                    <View style={styles.heroFooter}>
                        <View style={styles.heroStat}>
                            <Ionicons name="flame" size={18} color={theme.calories} />
                            <Text style={styles.heroStatValue}>{Math.round(remaining)}</Text>
                            <Text style={styles.heroStatLabel}>remaining</Text>
                        </View>
                        <View style={styles.heroStatDivider} />
                        <View style={styles.heroStat}>
                            <Ionicons name="trending-up" size={18} color={theme.error} />
                            <Text style={styles.heroStatValue}>{streak}</Text>
                            <Text style={styles.heroStatLabel}>day streak</Text>
                        </View>
                        <View style={styles.heroStatDivider} />
                        <View style={styles.heroStat}>
                            <Ionicons name="analytics" size={18} color={theme.carbs} />
                            <Text style={styles.heroStatValue}>{avgCalories}</Text>
                            <Text style={styles.heroStatLabel}>avg/day</Text>
                        </View>
                    </View>
                    <View style={styles.goalBadge}>
                        <Ionicons name="trophy" size={14} color={theme.warning} />
                        <Text style={styles.goalBadgeText}>{goal || 'Maintain Weight'}</Text>
                    </View>
                    {streak >= 3 && (
                        <View style={styles.streakBadge}>
                            <Text style={styles.streakFire}>🔥</Text>
                            <Text style={styles.streakText}>{streak} Day Streak!</Text>
                        </View>
                    )}
                </Animated.View>

                {/* ── DAILY INSIGHTS SLIDESHOW ── */}
                <InsightSlideshow styles={styles} theme={theme} />

                {/* Quick Stats Row */}
                <View style={styles.statsRow}>
                    <StatCard
                        icon="calendar"
                        label="Days"
                        value={totalDays}
                        color={theme.primary}
                        styles={styles}
                        onPress={() => navigation.navigate('Calendar')}
                    />
                    <StatCard
                        icon="scale"
                        label="Weight"
                        value={`${weight || '--'}kg`}
                        color={theme.protein}
                        styles={styles}
                        onPress={() => {
                            setNewWeight(weight);
                            setWeightModalVisible(true);
                        }}
                    />
                    <StatCard
                        icon="body"
                        label="BMI"
                        value={bmi}
                        color={theme.carbs}
                        styles={styles}
                        onPress={() => navigation.navigate('Profile')}
                    />
                </View>

                {/* Macros Card */}
                <View style={styles.macrosCard}>
                    <View style={styles.macrosHeader}>
                        <Text style={styles.macrosTitle}>Today's Macros</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Plots')}>
                            <Text style={styles.macrosLink}>View Stats →</Text>
                        </TouchableOpacity>
                    </View>
                    <MacroBar label="Protein" value={todayProtein} goal={proteinGoalNum} color={theme.protein} icon="fitness" styles={styles} theme={theme} />
                    <MacroBar label="Carbs" value={todayCarbs} goal={carbsGoalNum} color={theme.carbs} icon="nutrition" styles={styles} theme={theme} />
                    <MacroBar label="Fat" value={todayFat} goal={fatGoalNum} color={theme.fat} icon="water" styles={styles} theme={theme} />
                    {(bmr && tdee && bmr !== '0' && tdee !== '0') && (
                        <View style={styles.macroInfoBox}>
                            <View style={styles.macroInfoRow}>
                                <Text style={styles.macroInfoLabel}>BMR (Base):</Text>
                                <Text style={styles.macroInfoValue}>{bmr} kcal/day</Text>
                            </View>
                            <View style={styles.macroInfoRow}>
                                <Text style={styles.macroInfoLabel}>TDEE (Active):</Text>
                                <Text style={styles.macroInfoValue}>{tdee} kcal/day</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Daily Tracking Card */}
                <View style={styles.trackingCard}>
                    <Text style={styles.trackingTitle}>Daily Tracking</Text>
                    <TouchableOpacity
                        style={styles.trackingItem}
                        onPress={() => { setNewWeight(weight); setWeightModalVisible(true); }}
                    >
                        <View style={styles.trackingLeft}>
                            <View style={[styles.trackingIcon, { backgroundColor: theme.infoLight }]}>
                                <Ionicons name="scale" size={24} color={theme.info} />
                            </View>
                            <View>
                                <Text style={styles.trackingLabel}>Update Weight</Text>
                                <Text style={styles.trackingSubtitle}>Current: {weight || '--'}kg</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.border} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.trackingItem} onPress={handleProgressPhoto}>
                        <View style={styles.trackingLeft}>
                            <View style={[styles.trackingIcon, { backgroundColor: theme.primaryLight }]}>
                                <Ionicons name="camera" size={24} color={theme.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.trackingLabel}>Progress Photo</Text>
                                <Text style={styles.trackingSubtitle}>
                                    {todayPhotoCount > 0 ? `${todayPhotoCount} photo${todayPhotoCount > 1 ? 's' : ''} today` : 'Track your transformation'}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {todayPhotoCount > 0 && (
                                <View style={styles.photoBadge}>
                                    <Text style={styles.photoBadgeText}>{todayPhotoCount}</Text>
                                </View>
                            )}
                            <Ionicons name="chevron-forward" size={20} color={theme.border} />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.trackingItem}>
                        <View style={styles.trackingLeft}>
                            <View style={[styles.trackingIcon, { backgroundColor: theme.infoLight }]}>
                                <Ionicons name="water" size={24} color={theme.info} />
                            </View>
                            <View>
                                <Text style={styles.trackingLabel}>Water Intake</Text>
                                <Text style={styles.trackingSubtitle}>{waterIntake} / 8 glasses</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.addWaterBtn} onPress={addWaterGlass}>
                            <Ionicons name="add" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.waterProgress}>
                        <View style={styles.waterProgressBg}>
                            <View style={[styles.waterProgressFill, { width: `${Math.min((waterIntake / 8) * 100, 100)}%` }]} />
                        </View>
                        <Text style={styles.waterProgressText}>{Math.round((waterIntake / 8) * 100)}%</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsCard}>
                    <Text style={styles.actionsTitle}>Quick Actions</Text>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Add')}>
                            <View style={[styles.actionIcon, { backgroundColor: theme.successLight }]}>
                                <Ionicons name="add-circle" size={24} color={theme.success} />
                            </View>
                            <Text style={styles.actionLabel}>Add Meal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Plots')}>
                            <View style={[styles.actionIcon, { backgroundColor: theme.infoLight }]}>
                                <Ionicons name="bar-chart" size={24} color={theme.info} />
                            </View>
                            <Text style={styles.actionLabel}>View Stats</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Workout')}>
                            <View style={[styles.actionIcon, { backgroundColor: theme.errorLight }]}>
                                <Ionicons name="barbell" size={24} color={theme.error} />
                            </View>
                            <Text style={styles.actionLabel}>Workout</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Weight Update Modal */}
            <Modal
                visible={weightModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setWeightModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Weight</Text>
                        <Text style={styles.modalSubtitle}>Current: {weight || '--'}kg</Text>
                        <View style={styles.modalInputWrapper}>
                            <Ionicons name="scale" size={20} color={theme.info} />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter new weight"
                                placeholderTextColor={theme.textTertiary}
                                value={newWeight}
                                onChangeText={setNewWeight}
                                keyboardType="numeric"
                            />
                            <Text style={styles.modalUnit}>kg</Text>
                        </View>
                        <View style={styles.modalInfo}>
                            <Ionicons name="information-circle" size={16} color={theme.info} />
                            <Text style={styles.modalInfoText}>
                                Your macro goals will be recalculated automatically
                            </Text>
                        </View>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setWeightModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleWeightUpdate}>
                                <Text style={styles.modalSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Celebration Modal */}
            <CelebrationModal
                visible={celebrationVisible}
                achievement={unlockedAchievement}
                onClose={() => {
                    setCelebrationVisible(false);
                    setUnlockedAchievement(null);
                }}
            />
        </>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { paddingBottom: 40 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: { fontSize: 28, fontWeight: '800', color: theme.text },
    date: { fontSize: 14, color: theme.textTertiary, marginTop: 4 },

    // Achievements Badge
    achievementsBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.warningLight,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderWidth: 2,
        borderColor: theme.warning + '40',
    },
    achievementsCount: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: theme.error,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.background,
    },
    achievementsCountText: { fontSize: 10, fontWeight: '900', color: '#fff' },

    // Hero Card
    heroCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: theme.surface,
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6,
        position: 'relative',
    },
    ringContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
    ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    ringCalories: { fontSize: 44, fontWeight: '900', color: theme.text, letterSpacing: -1 },
    ringLabel: { fontSize: 14, color: theme.textTertiary, fontWeight: '600', marginTop: -4 },
    ringDivider: { width: 40, height: 1, backgroundColor: theme.border, marginVertical: 8 },
    ringGoal: { fontSize: 13, color: theme.textSecondary, fontWeight: '600' },

    heroFooter: {
        flexDirection: 'row',
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: theme.divider,
        width: '100%',
        justifyContent: 'space-around',
    },
    heroStat: { alignItems: 'center', gap: 4 },
    heroStatValue: { fontSize: 18, fontWeight: '800', color: theme.text, marginTop: 4 },
    heroStatLabel: { fontSize: 11, color: theme.textTertiary, fontWeight: '600' },
    heroStatDivider: { width: 1, backgroundColor: theme.divider },

    goalBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: theme.warningLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.warning + '40',
    },
    goalBadgeText: { fontSize: 11, fontWeight: '700', color: theme.warning },

    streakBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.errorLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.error + '40',
    },
    streakFire: { fontSize: 16 },
    streakText: { fontSize: 11, fontWeight: '800', color: theme.error },

    // ── Insight Slideshow ──────────────────────────────────────────────────────
    slideshowWrapper: {
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: theme.surface,
        borderRadius: 24,
        paddingTop: 16,
        paddingBottom: 14,
        paddingHorizontal: 0,
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        overflow: 'hidden',
    },
    slideshowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    slideshowTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    slideshowTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
    },
    slideshowMeta: {
        fontSize: 12,
        color: theme.textTertiary,
        fontWeight: '600',
    },
    insightCard: {
        paddingHorizontal: 20,
        paddingVertical: 4,
        borderLeftWidth: 4,
        marginLeft: 0,
    },
    insightTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    insightIconCircle: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    insightEmoji: { fontSize: 22 },
    insightCategoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    insightCategory: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    insightTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 6,
    },
    insightBody: {
        fontSize: 13,
        color: theme.textSecondary,
        lineHeight: 20,
        fontWeight: '500',
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 14,
    },
    dot: {
        height: 7,
        borderRadius: 4,
    },
    dotActive: {
        width: 20,
    },
    dotInactive: {
        width: 7,
        backgroundColor: theme.divider,
    },
    // ──────────────────────────────────────────────────────────────────────────

    // Quick Stats Row
    statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 16 },
    statCard: {
        flex: 1,
        backgroundColor: theme.surface,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2
    },
    statIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statValue: { fontSize: 18, fontWeight: '800', color: theme.text },
    statLabel: { fontSize: 11, color: theme.textTertiary, fontWeight: '600', marginTop: 2 },

    // Macros Card
    macrosCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: theme.surface,
        borderRadius: 24,
        padding: 20,
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2
    },
    macrosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    macrosTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
    macrosLink: { fontSize: 13, fontWeight: '600', color: theme.calories },

    macroBar: { marginBottom: 16 },
    macroBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    macroBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    macroIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    macroBarLabel: { fontSize: 14, fontWeight: '600', color: theme.text },
    macroBarValue: { fontSize: 14 },
    macroBarBg: { height: 8, backgroundColor: theme.divider, borderRadius: 8, overflow: 'hidden' },
    macroBarFill: { height: '100%', borderRadius: 8 },

    macroInfoBox: {
        backgroundColor: theme.successLight,
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: theme.success + '40',
    },
    macroInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    macroInfoLabel: { fontSize: 12, color: theme.success, fontWeight: '600' },
    macroInfoValue: { fontSize: 12, color: theme.success, fontWeight: '800' },

    // Daily Tracking Card
    trackingCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: theme.surface,
        borderRadius: 24,
        padding: 20,
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    trackingTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 16 },
    trackingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.divider,
    },
    trackingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    trackingIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    trackingLabel: { fontSize: 15, fontWeight: '700', color: theme.text },
    trackingSubtitle: { fontSize: 12, color: theme.textTertiary, marginTop: 2 },
    photoBadge: {
        backgroundColor: theme.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.primary + '40',
    },
    photoBadgeText: { fontSize: 11, fontWeight: '800', color: theme.primary },
    addWaterBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: theme.info,
        alignItems: 'center',
        justifyContent: 'center',
    },
    waterProgress: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    waterProgressBg: { flex: 1, height: 8, backgroundColor: theme.divider, borderRadius: 8, overflow: 'hidden' },
    waterProgressFill: { height: '100%', backgroundColor: theme.protein, borderRadius: 8 },
    waterProgressText: { fontSize: 12, fontWeight: '700', color: theme.protein },

    // Actions
    actionsCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: theme.surface,
        borderRadius: 24,
        padding: 20,
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2
    },
    actionsTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 16 },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    actionBtn: { alignItems: 'center', gap: 8 },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2
    },
    actionLabel: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: theme.surface,
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 4 },
    modalSubtitle: { fontSize: 14, color: theme.textTertiary, marginBottom: 20 },
    modalInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: theme.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        marginBottom: 12,
    },
    modalInput: { flex: 1, fontSize: 16, color: theme.text, fontWeight: '600' },
    modalUnit: { fontSize: 14, color: theme.textTertiary, fontWeight: '600' },
    modalInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.infoLight,
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    modalInfoText: { flex: 1, fontSize: 12, color: theme.info, fontWeight: '600' },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: theme.divider,
        alignItems: 'center',
    },
    modalCancelText: { fontSize: 15, fontWeight: '700', color: theme.textSecondary },
    modalSaveBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: theme.info,
        alignItems: 'center',
    },
    modalSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});