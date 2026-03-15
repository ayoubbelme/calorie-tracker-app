import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { useSound } from './SoundContext';

const AchievementsContext = createContext();

// Expanded achievements with tiers and XP
const ACHIEVEMENTS = [
    // Meal Logging Achievements
    {
        id: 'first_meal',
        title: 'First Bite',
        description: 'Log your first meal',
        icon: '🍽️',
        tier: 'bronze',
        xp: 50,
        progress: 0,
        target: 1,
        category: 'meals',
    },
    {
        id: 'ten_meals',
        title: 'Getting Started',
        description: 'Log 10 meals',
        icon: '📝',
        tier: 'bronze',
        xp: 100,
        progress: 0,
        target: 10,
        category: 'meals',
    },
    {
        id: 'fifty_meals',
        title: 'Meal Master',
        description: 'Log 50 meals',
        icon: '🌟',
        tier: 'silver',
        xp: 250,
        progress: 0,
        target: 50,
        category: 'meals',
    },
    {
        id: 'hundred_meals',
        title: 'Century Club',
        description: 'Log 100 meals',
        icon: '💯',
        tier: 'gold',
        xp: 500,
        progress: 0,
        target: 100,
        category: 'meals',
    },
    {
        id: 'five_hundred_meals',
        title: 'Nutrition Expert',
        description: 'Log 500 meals',
        icon: '👨‍🍳',
        tier: 'platinum',
        xp: 1000,
        progress: 0,
        target: 500,
        category: 'meals',
    },

    // Streak Achievements
    {
        id: 'three_day_streak',
        title: 'On Fire',
        description: 'Log meals for 3 days straight',
        icon: '🔥',
        tier: 'bronze',
        xp: 75,
        progress: 0,
        target: 3,
        category: 'streaks',
    },
    {
        id: 'week_streak',
        title: 'Week Warrior',
        description: 'Log meals for 7 days straight',
        icon: '🗓️',
        tier: 'silver',
        xp: 200,
        progress: 0,
        target: 7,
        category: 'streaks',
    },
    {
        id: 'month_streak',
        title: 'Monthly Master',
        description: 'Log meals for 30 days straight',
        icon: '⭐',
        tier: 'gold',
        xp: 750,
        progress: 0,
        target: 30,
        category: 'streaks',
    },
    {
        id: 'hundred_day_streak',
        title: 'Unstoppable',
        description: 'Log meals for 100 days straight',
        icon: '🏆',
        tier: 'platinum',
        xp: 2000,
        progress: 0,
        target: 100,
        category: 'streaks',
    },

    // Goal Achievements
    {
        id: 'first_goal',
        title: 'Bullseye',
        description: 'Hit your calorie goal',
        icon: '🎯',
        tier: 'bronze',
        xp: 100,
        progress: 0,
        target: 1,
        category: 'goals',
    },
    {
        id: 'ten_goals',
        title: 'Consistent',
        description: 'Hit calorie goal 10 times',
        icon: '✨',
        tier: 'silver',
        xp: 300,
        progress: 0,
        target: 10,
        category: 'goals',
    },
    {
        id: 'perfect_week',
        title: 'Perfect Week',
        description: 'Hit goals 7 days in a row',
        icon: '💎',
        tier: 'gold',
        xp: 500,
        progress: 0,
        target: 7,
        category: 'goals',
    },

    // Photo Achievements
    {
        id: 'first_photo',
        title: 'Snapshot',
        description: 'Add your first progress photo',
        icon: '📸',
        tier: 'bronze',
        xp: 100,
        progress: 0,
        target: 1,
        category: 'photos',
    },
    {
        id: 'ten_photos',
        title: 'Documented',
        description: 'Add 10 progress photos',
        icon: '📷',
        tier: 'silver',
        xp: 250,
        progress: 0,
        target: 10,
        category: 'photos',
    },
    {
        id: 'transformation',
        title: 'Transformation',
        description: 'Add 30 progress photos',
        icon: '🎬',
        tier: 'gold',
        xp: 600,
        progress: 0,
        target: 30,
        category: 'photos',
    },

    // Weight Tracking
    {
        id: 'weight_logger',
        title: 'Scale Master',
        description: 'Log weight 10 times',
        icon: '⚖️',
        tier: 'silver',
        xp: 150,
        progress: 0,
        target: 10,
        category: 'weight',
    },
    {
        id: 'dedicated_weigher',
        title: 'Dedicated Weigher',
        description: 'Log weight 50 times',
        icon: '📊',
        tier: 'gold',
        xp: 400,
        progress: 0,
        target: 50,
        category: 'weight',
    },

    // Water Tracking
    {
        id: 'water_warrior',
        title: 'Hydration Hero',
        description: 'Hit water goal 5 times',
        icon: '💧',
        tier: 'silver',
        xp: 150,
        progress: 0,
        target: 5,
        category: 'water',
    },
    {
        id: 'aqua_master',
        title: 'Aqua Master',
        description: 'Hit water goal 30 times',
        icon: '🌊',
        tier: 'gold',
        xp: 500,
        progress: 0,
        target: 30,
        category: 'water',
    },

    // Special/Hidden Achievements
    {
        id: 'early_bird',
        title: 'Early Bird',
        description: 'Log breakfast before 8 AM',
        icon: '🌅',
        tier: 'bronze',
        xp: 75,
        progress: 0,
        target: 1,
        category: 'special',
    },
    {
        id: 'night_owl',
        title: 'Night Owl',
        description: 'Log a meal after 10 PM',
        icon: '🦉',
        tier: 'bronze',
        xp: 50,
        progress: 0,
        target: 1,
        category: 'special',
    },
    {
        id: 'macro_perfect',
        title: 'Macro Perfect',
        description: 'Hit all macros within 5g',
        icon: '🎨',
        tier: 'platinum',
        xp: 1000,
        progress: 0,
        target: 1,
        category: 'special',
    },
];

// Level thresholds
const LEVELS = [
    { level: 1, xpRequired: 0, title: 'Beginner', color: '#9CA3AF' },
    { level: 2, xpRequired: 500, title: 'Novice', color: '#8B5CF6' },
    { level: 3, xpRequired: 1200, title: 'Apprentice', color: '#3B82F6' },
    { level: 4, xpRequired: 2000, title: 'Dedicated', color: '#10B981' },
    { level: 5, xpRequired: 3500, title: 'Committed', color: '#F59E0B' },
    { level: 6, xpRequired: 5500, title: 'Expert', color: '#EF4444' },
    { level: 7, xpRequired: 8000, title: 'Master', color: '#EC4899' },
    { level: 8, xpRequired: 12000, title: 'Champion', color: '#8B5CF6' },
    { level: 9, xpRequired: 17000, title: 'Legend', color: '#F59E0B' },
    { level: 10, xpRequired: 25000, title: 'Mythic', color: '#FFD700' },
];

export const AchievementsProvider = ({ children }) => {
    const [achievements, setAchievements] = useState(ACHIEVEMENTS);
    const [streak, setStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [totalMeals, setTotalMeals] = useState(0);
    const [unlockedAchievements, setUnlockedAchievements] = useState([]);
    const [totalXP, setTotalXP] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(false);
    const [consecutiveGoals, setConsecutiveGoals] = useState(0);

    useEffect(() => {
        loadAchievements();
    }, []);

    useEffect(() => {
        // Calculate current level based on XP
        const level = LEVELS.slice().reverse().find(l => totalXP >= l.xpRequired) || LEVELS[0];
        setCurrentLevel(level.level);
    }, [totalXP]);

    const loadAchievements = async () => {
        try {
            const stored = await AsyncStorage.getItem('achievements_data');
            if (stored) {
                const data = JSON.parse(stored);
                setStreak(data.streak || 0);
                setLongestStreak(data.longestStreak || 0);
                setTotalMeals(data.totalMeals || 0);
                setUnlockedAchievements(data.unlocked || []);
                setTotalXP(data.totalXP || 0);
                setConsecutiveGoals(data.consecutiveGoals || 0);

                // IMPORTANT: Merge saved progress with current achievement definitions
                // This ensures all achievements have the category field
                if (data.achievements && Array.isArray(data.achievements)) {
                    const mergedAchievements = ACHIEVEMENTS.map(defaultAch => {
                        const savedAch = data.achievements.find(a => a.id === defaultAch.id);
                        if (savedAch) {
                            // Keep progress from saved data, but use current definition for everything else
                            return {
                                ...defaultAch,
                                progress: savedAch.progress || 0,
                            };
                        }
                        return defaultAch;
                    });
                    setAchievements(mergedAchievements);
                } else {
                    // No saved achievements, use defaults
                    setAchievements(ACHIEVEMENTS);
                }
            } else {
                // First time loading, use defaults
                setAchievements(ACHIEVEMENTS);
            }
        } catch (error) {
            console.error('Failed to load achievements:', error);
            setAchievements(ACHIEVEMENTS);
        }
    };

    const saveAchievements = async (data) => {
        try {
            await AsyncStorage.setItem('achievements_data', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save achievements:', error);
        }
    };

    const addXP = (amount) => {
        const newXP = totalXP + amount;
        setTotalXP(newXP);

        // Check for level up
        const newLevel = LEVELS.slice().reverse().find(l => newXP >= l.xpRequired);
        const oldLevel = LEVELS.slice().reverse().find(l => totalXP >= l.xpRequired);

        if (newLevel && oldLevel && newLevel.level > oldLevel.level) {

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                '🎊 LEVEL UP!',
                `Congratulations! You've reached Level ${newLevel.level}: ${newLevel.title}!\n\n+${amount} XP earned`,
                [{ text: 'Awesome!', style: 'default' }]
            );
        }
    };

    const checkAndUpdateStreak = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const lastLog = await AsyncStorage.getItem('last_log_date');

            if (lastLog !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                let newStreak = streak;
                if (lastLog === yesterdayStr) {
                    newStreak = streak + 1;
                } else if (lastLog !== null) {
                    newStreak = 1;
                    setConsecutiveGoals(0); // Reset consecutive goals on broken streak
                } else {
                    newStreak = 1;
                }

                const newLongestStreak = Math.max(longestStreak, newStreak);
                setStreak(newStreak);
                setLongestStreak(newLongestStreak);

                await AsyncStorage.setItem('last_log_date', today);

                // Check streak achievements
                checkAchievement('three_day_streak', newStreak);
                checkAchievement('week_streak', newStreak);
                checkAchievement('month_streak', newStreak);
                checkAchievement('hundred_day_streak', newStreak);

                return newStreak;
            }
            return streak;
        } catch (error) {
            console.error('Failed to update streak:', error);
            return streak;
        }
    };

    const checkAchievement = (achievementId, currentProgress) => {
        const achievement = achievements.find(a => a.id === achievementId);
        if (!achievement) return null;

        const isAlreadyUnlocked = unlockedAchievements.includes(achievementId);
        if (isAlreadyUnlocked) return null;

        const updatedAchievements = achievements.map(a => {
            if (a.id === achievementId) {
                return { ...a, progress: currentProgress };
            }
            return a;
        });
        setAchievements(updatedAchievements);

        if (currentProgress >= achievement.target) {
            return unlockAchievement(achievementId, achievement, updatedAchievements);
        }

        saveAchievements({
            streak,
            longestStreak,
            totalMeals,
            unlocked: unlockedAchievements,
            achievements: updatedAchievements,
            totalXP,
            consecutiveGoals,
        });

        return null;
    };

    const unlockAchievement = (achievementId, achievement, updatedAchievements) => {
        const newUnlocked = [...unlockedAchievements, achievementId];
        setUnlockedAchievements(newUnlocked);

        // Add XP
        addXP(achievement.xp);

        // Haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Show alert with tier-specific emoji
        const tierEmoji = {
            bronze: '🥉',
            silver: '🥈',
            gold: '🥇',
            platinum: '💎',
        }[achievement.tier] || '🏆';

        Alert.alert(
            `${tierEmoji} Achievement Unlocked!`,
            `${achievement.icon} ${achievement.title}\n${achievement.description}\n\n+${achievement.xp} XP`,
            [{ text: 'Awesome!', style: 'default' }]
        );

        // Save
        saveAchievements({
            streak,
            longestStreak,
            totalMeals,
            unlocked: newUnlocked,
            achievements: updatedAchievements,
            totalXP: totalXP + achievement.xp,
            consecutiveGoals,
        });

        return achievement;
    };

    const logMeal = async () => {
        const newTotalMeals = totalMeals + 1;
        setTotalMeals(newTotalMeals);

        // Update streak
        const newStreak = await checkAndUpdateStreak();

        // Check meal-based achievements
        checkAchievement('first_meal', newTotalMeals);
        checkAchievement('ten_meals', newTotalMeals);
        checkAchievement('fifty_meals', newTotalMeals);
        checkAchievement('hundred_meals', newTotalMeals);
        checkAchievement('five_hundred_meals', newTotalMeals);

        // Check time-based achievements
        const hour = new Date().getHours();
        if (hour < 8) {
            checkAchievement('early_bird', 1);
        } else if (hour >= 22) {
            checkAchievement('night_owl', 1);
        }

        // Award XP for logging meal
        addXP(10);

        saveAchievements({
            streak: newStreak,
            longestStreak,
            totalMeals: newTotalMeals,
            unlocked: unlockedAchievements,
            achievements,
            totalXP,
            consecutiveGoals,
        });
    };

    const logGoalHit = async () => {
        const newConsecutiveGoals = consecutiveGoals + 1;
        setConsecutiveGoals(newConsecutiveGoals);

        // Check goal achievements
        checkAchievement('first_goal', 1);

        // Increment progress for ten_goals
        const tenGoalsAchievement = achievements.find(a => a.id === 'ten_goals');
        if (tenGoalsAchievement) {
            const currentGoalsHit = tenGoalsAchievement.progress + 1;
            checkAchievement('ten_goals', currentGoalsHit);
        }

        checkAchievement('perfect_week', newConsecutiveGoals);

        // Award bonus XP
        addXP(25);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const logPhoto = () => {
        const firstPhotoAchievement = achievements.find(a => a.id === 'first_photo');
        const photoProgress = (firstPhotoAchievement?.progress || 0) + 1;

        checkAchievement('first_photo', photoProgress);
        checkAchievement('ten_photos', photoProgress);
        checkAchievement('transformation', photoProgress);

        addXP(15);
    };

    const logWeight = async () => {
        try {
            const weightLogs = await AsyncStorage.getItem('weight_log_count');
            const count = weightLogs ? parseInt(weightLogs) + 1 : 1;
            await AsyncStorage.setItem('weight_log_count', count.toString());

            checkAchievement('weight_logger', count);
            checkAchievement('dedicated_weigher', count);

            addXP(5);
        } catch (error) {
            console.error('Failed to log weight:', error);
        }
    };

    const logWaterGoal = async () => {
        try {
            const waterGoals = await AsyncStorage.getItem('water_goal_count');
            const count = waterGoals ? parseInt(waterGoals) + 1 : 1;
            await AsyncStorage.setItem('water_goal_count', count.toString());

            checkAchievement('water_warrior', count);
            checkAchievement('aqua_master', count);

            addXP(10);
        } catch (error) {
            console.error('Failed to log water:', error);
        }
    };

    const getCurrentLevelInfo = () => {
        const current = LEVELS.find(l => l.level === currentLevel) || LEVELS[0];
        const next = LEVELS.find(l => l.level === currentLevel + 1);

        const xpInCurrentLevel = totalXP - current.xpRequired;
        const xpNeededForNext = next ? next.xpRequired - current.xpRequired : 0;
        const progress = next ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100;

        return {
            current,
            next,
            xpInCurrentLevel,
            xpNeededForNext,
            progress: Math.min(progress, 100),
        };
    };

    return (
        <AchievementsContext.Provider
            value={{
                achievements,
                streak,
                longestStreak,
                totalMeals,
                unlockedAchievements,
                totalXP,
                currentLevel,
                consecutiveGoals,
                logMeal,
                logGoalHit,
                logPhoto,
                logWeight,
                logWaterGoal,
                getCurrentLevelInfo,
                LEVELS,
            }}
        >
            {children}
        </AchievementsContext.Provider>
    );
};

export const useAchievements = () => {
    const context = useContext(AchievementsContext);
    if (!context) {
        throw new Error('useAchievements must be used within AchievementsProvider');
    }
    return context;
};