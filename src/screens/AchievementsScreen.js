import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useAchievements } from '../components/AchievementsContext';
import { useTheme } from '../components/ThemeContext';
import * as Haptics from 'expo-haptics';

const screenWidth = Dimensions.get('window').width;

// Level Progress Ring
const LevelRing = ({ progress, size, strokeWidth, color, theme }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <Svg width={size} height={size}>
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={theme.border}
                strokeWidth={strokeWidth}
                fill="none"
            />
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${size / 2}, ${size / 2}`}
            />
        </Svg>
    );
};

export default function AchievementsScreen() {
    const { theme } = useTheme();
    const {
        achievements,
        streak,
        longestStreak,
        totalMeals,
        unlockedAchievements,
        totalXP,
        currentLevel,
        getCurrentLevelInfo,
        LEVELS,
    } = useAchievements();

    const [selectedCategory, setSelectedCategory] = useState('all');
    const levelInfo = getCurrentLevelInfo();

    const styles = createStyles(theme);

    const getTierColor = (tier) => {
        switch (tier) {
            case 'bronze': return '#CD7F32';
            case 'silver': return '#C0C0C0';
            case 'gold': return '#FFD700';
            case 'platinum': return '#E5E4E2';
            default: return theme.textTertiary;
        }
    };

    const categories = [
        { id: 'all', name: 'All', icon: 'grid-outline' },
        { id: 'meals', name: 'Meals', icon: 'restaurant-outline' },
        { id: 'streaks', name: 'Streaks', icon: 'flame-outline' },
        { id: 'goals', name: 'Goals', icon: 'trophy-outline' },
        { id: 'photos', name: 'Photos', icon: 'camera-outline' },
        { id: 'weight', name: 'Weight', icon: 'scale-outline' },
        { id: 'water', name: 'Water', icon: 'water-outline' },
        { id: 'special', name: 'Special', icon: 'star-outline' },
    ];

    // Filter achievements by category
    const filteredAchievements = selectedCategory === 'all'
        ? achievements
        : achievements.filter(a => a.category === selectedCategory);

    const completionPercent = Math.round((unlockedAchievements.length / achievements.length) * 100);

    // Count achievements per category
    const getCategoryCount = (categoryId) => {
        if (categoryId === 'all') return achievements.length;
        return achievements.filter(a => a.category === categoryId).length;
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Level Header Card */}
            <View style={styles.levelCard}>
                <View style={styles.levelCardTop}>
                    <View style={styles.levelRingContainer}>
                        <LevelRing
                            progress={levelInfo.progress}
                            size={120}
                            strokeWidth={10}
                            color={levelInfo.current.color}
                            theme={theme}
                        />
                        <View style={styles.levelCenter}>
                            <Text style={styles.levelNumber}>{currentLevel}</Text>
                            <Text style={styles.levelLabel}>LEVEL</Text>
                        </View>
                    </View>

                    <View style={styles.levelInfo}>
                        <Text style={[styles.levelTitle, { color: levelInfo.current.color }]}>
                            {levelInfo.current.title}
                        </Text>
                        <Text style={styles.xpText}>
                            {totalXP.toLocaleString()} XP
                        </Text>
                        
                        {levelInfo.next && (
                            <>
                                <View style={styles.xpBar}>
                                    <View 
                                        style={[
                                            styles.xpBarFill, 
                                            { 
                                                width: `${levelInfo.progress}%`,
                                                backgroundColor: levelInfo.current.color 
                                            }
                                        ]} 
                                    />
                                </View>
                                <Text style={styles.nextLevelText}>
                                    {levelInfo.xpInCurrentLevel}/{levelInfo.xpNeededForNext} XP to Level {currentLevel + 1}
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.miniStat}>
                        <Ionicons name="flame" size={20} color={theme.error} />
                        <Text style={styles.miniStatValue}>{streak}</Text>
                        <Text style={styles.miniStatLabel}>Streak</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <Ionicons name="trophy" size={20} color={theme.warning} />
                        <Text style={styles.miniStatValue}>{unlockedAchievements.length}</Text>
                        <Text style={styles.miniStatLabel}>Unlocked</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <Ionicons name="restaurant" size={20} color={theme.success} />
                        <Text style={styles.miniStatValue}>{totalMeals}</Text>
                        <Text style={styles.miniStatLabel}>Meals</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <Ionicons name="star" size={20} color={theme.primary} />
                        <Text style={styles.miniStatValue}>{completionPercent}%</Text>
                        <Text style={styles.miniStatLabel}>Complete</Text>
                    </View>
                </View>
            </View>

            {/* Category Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScroll}
            >
                {categories.map(cat => {
                    const count = getCategoryCount(cat.id);
                    
                    return (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat.id && styles.categoryChipActive
                            ]}
                            onPress={() => {
                                setSelectedCategory(cat.id);
                            }}
                        >
                            <Ionicons
                                name={cat.icon}
                                size={18}
                                color={selectedCategory === cat.id ? '#fff' : theme.primary}
                            />
                            <Text style={[
                                styles.categoryChipText,
                                selectedCategory === cat.id && styles.categoryChipTextActive
                            ]}>
                                {cat.name}
                            </Text>
                            <View style={[
                                styles.categoryCount,
                                selectedCategory === cat.id && styles.categoryCountActive
                            ]}>
                                <Text style={[
                                    styles.categoryCountText,
                                    selectedCategory === cat.id && styles.categoryCountTextActive
                                ]}>
                                    {count}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Achievements List */}
            <View style={styles.achievementsList}>
                <Text style={styles.sectionTitle}>
                    {selectedCategory === 'all' 
                        ? `All Achievements (${filteredAchievements.length})` 
                        : `${categories.find(c => c.id === selectedCategory)?.name} (${filteredAchievements.length})`
                    }
                </Text>

                {filteredAchievements.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="trophy-outline" size={64} color={theme.textTertiary} />
                        <Text style={styles.emptyTitle}>No Achievements</Text>
                        <Text style={styles.emptyText}>Keep tracking to unlock achievements!</Text>
                    </View>
                ) : (
                    filteredAchievements.map((achievement) => {
                        const isUnlocked = unlockedAchievements.includes(achievement.id);
                        const progress = isUnlocked ? achievement.target : achievement.progress;
                        const progressPercent = Math.min((progress / achievement.target) * 100, 100);

                        return (
                            <TouchableOpacity
                                key={achievement.id}
                                style={[
                                    styles.achievementCard,
                                    isUnlocked && { borderColor: getTierColor(achievement.tier) }
                                ]}
                                activeOpacity={0.8}
                            >
                                {/* Icon */}
                                <View style={[
                                    styles.achievementIconContainer,
                                    isUnlocked && { 
                                        backgroundColor: getTierColor(achievement.tier) + '20',
                                        borderColor: getTierColor(achievement.tier),
                                        borderWidth: 2,
                                    }
                                ]}>
                                    <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                                    {isUnlocked && (
                                        <View style={[styles.checkBadge, { backgroundColor: getTierColor(achievement.tier) }]}>
                                            <Ionicons name="checkmark" size={12} color="#fff" />
                                        </View>
                                    )}
                                </View>

                                {/* Info */}
                                <View style={styles.achievementInfo}>
                                    <View style={styles.achievementTitleRow}>
                                        <Text style={[
                                            styles.achievementTitle,
                                            !isUnlocked && { color: theme.textTertiary }
                                        ]}>
                                            {achievement.title}
                                        </Text>
                                        <View style={[styles.xpBadge, { backgroundColor: theme.primaryLight }]}>
                                            <Ionicons name="star" size={12} color={theme.primary} />
                                            <Text style={styles.xpBadgeText}>{achievement.xp}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.achievementDesc}>
                                        {achievement.description}
                                    </Text>

                                    {/* Progress Bar */}
                                    {!isUnlocked && (
                                        <View style={styles.progressContainer}>
                                            <View style={styles.progressBar}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        {
                                                            width: `${progressPercent}%`,
                                                            backgroundColor: getTierColor(achievement.tier)
                                                        }
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.progressText}>
                                                {progress}/{achievement.target}
                                            </Text>
                                        </View>
                                    )}

                                    {isUnlocked && (
                                        <View style={styles.unlockedRow}>
                                            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                                            <Text style={styles.unlockedText}>Unlocked!</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Tier Badge */}
                                <View style={[styles.tierBadge, { backgroundColor: getTierColor(achievement.tier) }]}>
                                    <Text style={styles.tierText}>{achievement.tier.toUpperCase()}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },

    // Level Card
    levelCard: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: theme.surface,
        borderRadius: 28,
        padding: 24,
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    levelCardTop: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 24,
    },
    levelRingContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelCenter: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelNumber: {
        fontSize: 36,
        fontWeight: '900',
        color: theme.text,
    },
    levelLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.textTertiary,
        letterSpacing: 1,
    },
    levelInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    levelTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 4,
    },
    xpText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.textSecondary,
        marginBottom: 12,
    },
    xpBar: {
        height: 10,
        backgroundColor: theme.divider,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 8,
    },
    xpBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    nextLevelText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.textTertiary,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: theme.divider,
    },
    miniStat: {
        alignItems: 'center',
        gap: 4,
    },
    miniStatValue: {
        fontSize: 18,
        fontWeight: '900',
        color: theme.text,
    },
    miniStatLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.textTertiary,
    },

    // Categories
    categoriesScroll: {
        paddingHorizontal: 20,
        gap: 8,
        marginBottom: 20,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: theme.border,
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    categoryChipActive: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
        shadowOpacity: 0.3,
        elevation: 6,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.text,
    },
    categoryChipTextActive: {
        color: '#fff',
    },
    categoryCount: {
        backgroundColor: theme.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 24,
        alignItems: 'center',
    },
    categoryCountActive: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    categoryCountText: {
        fontSize: 11,
        fontWeight: '900',
        color: theme.primary,
    },
    categoryCountTextActive: {
        color: '#fff',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: theme.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Achievements List
    achievementsList: {
        paddingHorizontal: 20,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 16,
    },

    achievementCard: {
        flexDirection: 'row',
        backgroundColor: theme.surface,
        borderRadius: 24,
        padding: 16,
        gap: 16,
        alignItems: 'center',
        shadowColor: theme.shadowColor,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        position: 'relative',
        borderWidth: 2,
        borderColor: theme.border,
        marginBottom: 12,
    },
    achievementIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 20,
        backgroundColor: theme.background,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    achievementEmoji: {
        fontSize: 36,
    },
    checkBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.surface,
    },
    achievementInfo: {
        flex: 1,
        gap: 6,
    },
    achievementTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    achievementTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: theme.text,
        flex: 1,
    },
    xpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    xpBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: theme.primary,
    },
    achievementDesc: {
        fontSize: 13,
        color: theme.textSecondary,
        lineHeight: 18,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: theme.background,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 11,
        fontWeight: '800',
        color: theme.textTertiary,
        minWidth: 50,
        textAlign: 'right',
    },
    unlockedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    unlockedText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.success,
    },
    tierBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    tierText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0.8,
    },
});