import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Dimensions, Modal, Alert
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useCalories } from '../components/CaloriesContext';
import { useProfile } from '../components/ProfileContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../components/ThemeContext';
import { exportCSV, exportPDF } from '../utils/exportData';
import { ActivityIndicator } from 'react-native';

const screenWidth = Dimensions.get('window').width - 40;
const TABS = ['Weekly', 'Monthly', '3 Months'];

export default function StatsScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { history } = useCalories();
    const { name, weight, height, goal, calorieGoal, proteinGoal, carbsGoal, fatGoal, bmr, tdee } = useProfile();
    const [isExporting, setIsExporting] = useState(false);

    const MACROS = [
        { key: 'calories', label: 'Calories', unit: 'kcal', color: theme.calories, bg: theme.successLight, icon: 'flame' },
        { key: 'protein', label: 'Protein', unit: 'g', color: theme.protein, bg: theme.infoLight, icon: 'fitness' },
        { key: 'carbs', label: 'Carbs', unit: 'g', color: theme.carbs, bg: theme.warningLight, icon: 'nutrition' },
        { key: 'fat', label: 'Fat', unit: 'g', color: theme.fat, bg: theme.errorLight, icon: 'water' },
    ];

    const [activeTab, setActiveTab] = useState('Weekly');
    const [activeMacro, setActiveMacro] = useState('calories');
    const [chartType, setChartType] = useState('line');
    const [showGoalLine, setShowGoalLine] = useState(true);
    const [showDayDetail, setShowDayDetail] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [compareMode, setCompareMode] = useState(false);

    // ── Date helpers ─────────────────────────────────────────────────────────
    const getDays = (count) => {
        const days = [];
        for (let i = count - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    const daysCount = activeTab === 'Weekly' ? 7 : activeTab === 'Monthly' ? 30 : 90;
    const days = getDays(daysCount);

    // ── Weight stats (computed from ALL history, not just current period) ────
    const allHistoryDates = Object.keys(history).sort();

    const allWeightEntries = allHistoryDates
        .filter(d => history[d]?.weight != null && history[d].weight !== '')
        .map(d => ({ date: d, value: parseFloat(history[d].weight) }))
        .filter(e => !isNaN(e.value));

    // Starting = earliest ever logged weight; Current = most recently logged weight
    const startingWeight = allWeightEntries.length > 0
        ? allWeightEntries[0].value
        : parseFloat(weight) || 0;

    const currentWeight = allWeightEntries.length > 0
        ? allWeightEntries[allWeightEntries.length - 1].value
        : parseFloat(weight) || 0;

    const weightChange = currentWeight - startingWeight;
    const weightChangePercent = startingWeight !== 0
        ? ((weightChange / startingWeight) * 100).toFixed(1)
        : '0.0';

    const trackedDays = days.filter(d => history[d]).length;
    const avgWeeklyChange = trackedDays > 0
        ? (weightChange / Math.max(trackedDays / 7, 1)).toFixed(2)
        : '0.00';

    // ── Weight chart: only real logged entries within current period ─────────
    const getWeightChartData = () => {
        const entriesInPeriod = days
            .filter(d => history[d]?.weight != null && history[d].weight !== '')
            .map(d => ({ date: d, value: parseFloat(history[d].weight) }))
            .filter(e => !isNaN(e.value));

        if (entriesInPeriod.length < 2) return null;

        const maxPoints = 10;
        const step = Math.max(1, Math.floor(entriesInPeriod.length / maxPoints));
        const sampled = entriesInPeriod.filter((_, i) => i % step === 0);

        return {
            labels: sampled.map(e =>
                new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'numeric', day: 'numeric'
                })
            ),
            datasets: [{
                data: sampled.map(e => e.value),
                color: () => theme.primary,
                strokeWidth: 3,
            }],
        };
    };

    // ── Macro chart helpers ──────────────────────────────────────────────────
    const getLabels = () => {
        if (activeTab === 'Weekly') {
            return days.map(d => {
                const date = new Date(d + 'T12:00:00');
                return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][date.getDay()];
            });
        } else if (activeTab === 'Monthly') {
            return days.filter((_, i) => i % 5 === 0).map(d => {
                const date = new Date(d + 'T12:00:00');
                return `${date.getDate()}`;
            });
        } else {
            return days.filter((_, i) => i % 15 === 0).map(d => {
                const date = new Date(d + 'T12:00:00');
                return `${date.getMonth() + 1}/${date.getDate()}`;
            });
        }
    };

    const getValues = (key) => {
        const values = days.map(d => history[d]?.[key] || 0);
        if (activeTab === 'Monthly') return values.filter((_, i) => i % 5 === 0);
        if (activeTab === '3 Months') return values.filter((_, i) => i % 15 === 0);
        return values;
    };

    const avg = (arr) => {
        const nonZero = arr.filter(v => v > 0);
        return nonZero.length ? Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length) : 0;
    };
    const max = (arr) => Math.max(...arr.filter(v => v > 0), 0);
    const min = (arr) => {
        const nonZero = arr.filter(v => v > 0);
        return nonZero.length ? Math.min(...nonZero) : 0;
    };

    const selected = MACROS.find(m => m.key === activeMacro);
    const selectedData = getValues(activeMacro);
    const labels = getLabels();

    const goals = {
        calories: parseFloat(calorieGoal),
        protein: parseFloat(proteinGoal),
        carbs: parseFloat(carbsGoal),
        fat: parseFloat(fatGoal),
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const handleDataPointClick = (data) => {
        const stepSize = activeTab === 'Weekly' ? 1 : activeTab === 'Monthly' ? 5 : 15;
        const index = data.index * stepSize;
        const dayKey = days[index];
        const dayData = history[dayKey];
        if (dayData) {
            setSelectedDay({ date: dayKey, ...dayData });
            setShowDayDetail(true);
        }
    };

    // ── Export ───────────────────────────────────────────────────────────────
    const exportData = () => {
        const exportStats = {
            avgCalories: avg(getValues('calories')),
            trackedDays,
            weightChange,
            startingWeight,
        };

        Alert.alert('📥 Export Data', 'Choose export format', [
           
            {
                text: 'PDF Report',
                onPress: async () => {
                    setIsExporting(true);
                    try {
                        const result = await exportPDF(history, {
                            name, weight, height, goal,
                            calorieGoal, proteinGoal, carbsGoal, fatGoal, bmr, tdee,
                        }, exportStats);
                        if (result.success) Alert.alert('✅ Success', 'Report exported!');
                    } catch (e) {
                        Alert.alert('Error', 'Failed to export report');
                    } finally {
                        setIsExporting(false);
                    }
                }
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    // ── Chart configs ────────────────────────────────────────────────────────
    const chartConfig = {
        backgroundGradientFrom: theme.surface,
        backgroundGradientTo: theme.surface,
        decimalPlaces: 0,
        color: () => selected.color,
        labelColor: () => theme.textTertiary,
        propsForDots: { r: '6', strokeWidth: '2', stroke: selected.color, fill: theme.surface },
        propsForBackgroundLines: { stroke: theme.divider, strokeDasharray: '' },
        fillShadowGradientOpacity: 0.2,
        fillShadowGradient: selected.color,
    };

    const weightChartConfig = {
        backgroundGradientFrom: theme.surface,
        backgroundGradientTo: theme.surface,
        decimalPlaces: 1,
        color: () => theme.primary,
        labelColor: () => theme.textTertiary,
        propsForDots: { r: '6', strokeWidth: '3', stroke: theme.primary, fill: theme.surface },
        propsForBackgroundLines: { stroke: theme.divider, strokeDasharray: '' },
        fillShadowGradientOpacity: 0.2,
        fillShadowGradient: theme.primary,
    };

    const weightChartData = getWeightChartData();

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Analytics 📊</Text>
                        <Text style={styles.subtitle}>Interactive nutrition insights</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={exportData}
                            disabled={isExporting}
                        >
                            {isExporting
                                ? <ActivityIndicator size="small" color={theme.primary} />
                                : <Ionicons name="download-outline" size={20} color={theme.primary} />
                            }
                        </TouchableOpacity>

                    </View>
                </View>

                {/* Time Period Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
                    <View style={styles.tabs}>
                        {TABS.map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.tabActive]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {trackedDays === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📉</Text>
                        <Text style={styles.emptyTitle}>No data yet</Text>
                        <Text style={styles.emptyText}>Start tracking to unlock interactive analytics</Text>
                    </View>
                ) : (
                    <>
                        {/* Weight Card */}
                        <View style={styles.weightCard}>
                            <View style={styles.weightCardHeader}>
                                <View>
                                    <Text style={styles.weightCardTitle}>Weight Progress</Text>
                                    <Text style={styles.weightCardSubtitle}>All-time journey</Text>
                                </View>
                                <View style={styles.weightGoalBadge}>
                                    <Ionicons name="trophy" size={16} color={theme.primary} />
                                    <Text style={styles.weightGoalText}>{goal}</Text>
                                </View>
                            </View>

                            {/* Starting / Current / Change */}
                            <View style={styles.weightStatsRow}>
                                <View style={styles.weightStatBox}>
                                    <Text style={styles.weightStatLabel}>Starting</Text>
                                    <Text style={styles.weightStatValue}>
                                        {startingWeight.toFixed(1)}
                                        <Text style={styles.weightStatUnit}> kg</Text>
                                    </Text>
                                </View>
                                <View style={styles.weightStatDivider} />
                                <View style={styles.weightStatBox}>
                                    <Text style={styles.weightStatLabel}>Current</Text>
                                    <Text style={[styles.weightStatValue, { color: theme.primary }]}>
                                        {currentWeight.toFixed(1)}
                                        <Text style={styles.weightStatUnit}> kg</Text>
                                    </Text>
                                </View>
                                <View style={styles.weightStatDivider} />
                                <View style={styles.weightStatBox}>
                                    <Text style={styles.weightStatLabel}>Change</Text>
                                    <Text style={[
                                        styles.weightStatValue,
                                        { color: weightChange < 0 ? theme.success : weightChange > 0 ? theme.error : theme.textTertiary }
                                    ]}>
                                        {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                                        <Text style={styles.weightStatUnit}> kg</Text>
                                    </Text>
                                </View>
                            </View>

                            {/* Progress bar */}
                            <View style={styles.weightProgressContainer}>
                                <View style={styles.weightProgressBar}>
                                    <View style={[styles.weightProgressFill, {
                                        width: `${Math.min(Math.abs(weightChange) * 20, 100)}%`,
                                        backgroundColor: weightChange < 0 ? theme.success : weightChange > 0 ? theme.error : theme.textTertiary,
                                    }]} />
                                </View>
                                <View style={styles.weightProgressTextRow}>
                                    <Text style={styles.weightProgressText}>
                                        {Math.abs(weightChange).toFixed(1)}kg {weightChange < 0 ? 'lost' : weightChange > 0 ? 'gained' : 'no change'}
                                    </Text>
                                    <View style={styles.weightChangeChip}>
                                        <Ionicons
                                            name={weightChange < 0 ? 'trending-down' : weightChange > 0 ? 'trending-up' : 'remove'}
                                            size={12}
                                            color={weightChange < 0 ? theme.success : weightChange > 0 ? theme.error : theme.textTertiary}
                                        />
                                        <Text style={[styles.weightChangeText, {
                                            color: weightChange < 0 ? theme.success : weightChange > 0 ? theme.error : theme.textTertiary
                                        }]}>
                                            {weightChangePercent}%
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Weight Chart */}
                            <View style={styles.weightChartContainer}>
                                <Text style={styles.weightChartTitle}>Weight Trend</Text>
                                {weightChartData ? (
                                    <LineChart
                                        data={weightChartData}
                                        width={screenWidth}
                                        height={200}
                                        chartConfig={weightChartConfig}
                                        bezier
                                        style={styles.chart}
                                        withInnerLines={true}
                                        withOuterLines={false}
                                        withShadow={true}
                                        onDataPointClick={handleDataPointClick}
                                    />
                                ) : (
                                    <View style={styles.chartEmpty}>
                                        <Ionicons name="scale-outline" size={32} color={theme.textTertiary} />
                                        <Text style={styles.chartEmptyText}>
                                            Log weight on at least 2 days to see the trend
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Insights row */}
                            <View style={styles.weightInsights}>
                                <View style={styles.weightInsightItem}>
                                    <Ionicons name="calendar-outline" size={16} color={theme.textTertiary} />
                                    <Text style={styles.weightInsightText}>{trackedDays} days tracked</Text>
                                </View>
                                <View style={styles.weightInsightItem}>
                                    <Ionicons name="trending-up-outline" size={16} color={theme.textTertiary} />
                                    <Text style={styles.weightInsightText}>{avgWeeklyChange} kg/week avg</Text>
                                </View>
                            </View>
                        </View>

                        {/* Quick Stats */}
                        <View style={styles.quickStatsCard}>
                            <View style={styles.quickStatItem}>
                                <Text style={styles.quickStatLabel}>Average</Text>
                                <Text style={[styles.quickStatValue, { color: selected.color }]}>
                                    {avg(selectedData)} {selected.unit}
                                </Text>
                            </View>
                            <View style={styles.quickStatDivider} />
                            <View style={styles.quickStatItem}>
                                <Text style={styles.quickStatLabel}>Highest</Text>
                                <Text style={styles.quickStatValue}>{max(selectedData)} {selected.unit}</Text>
                            </View>
                            <View style={styles.quickStatDivider} />
                            <View style={styles.quickStatItem}>
                                <Text style={styles.quickStatLabel}>Lowest</Text>
                                <Text style={styles.quickStatValue}>{min(selectedData)} {selected.unit}</Text>
                            </View>
                        </View>

                        {/* Chart Controls */}
                        <View style={styles.chartControls}>
                            <View style={styles.chartTypeToggle}>
                                <TouchableOpacity
                                    style={[styles.chartTypeBtn, chartType === 'line' && styles.chartTypeBtnActive]}
                                    onPress={() => setChartType('line')}
                                >
                                    <Ionicons name="analytics" size={18} color={chartType === 'line' ? '#fff' : theme.textTertiary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.chartTypeBtn, chartType === 'bar' && styles.chartTypeBtnActive]}
                                    onPress={() => setChartType('bar')}
                                >
                                    <Ionicons name="bar-chart" size={18} color={chartType === 'bar' ? '#fff' : theme.textTertiary} />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={styles.goalToggle}
                                onPress={() => setShowGoalLine(!showGoalLine)}
                            >
                                <Ionicons
                                    name={showGoalLine ? 'eye' : 'eye-off'}
                                    size={18}
                                    color={showGoalLine ? theme.primary : theme.textTertiary}
                                />
                                <Text style={[styles.goalToggleText, showGoalLine && styles.goalToggleTextActive]}>
                                    Goal Line
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Macro Chart */}
                        <View style={styles.chartCard}>
                            <View style={styles.chartHeader}>
                                <View>
                                    <Text style={styles.chartTitle}>{selected.label}</Text>
                                    <Text style={styles.chartSubtitle}>Tap any point for details</Text>
                                </View>
                                <View style={[styles.chartBadge, { backgroundColor: selected.bg }]}>
                                    <Text style={[styles.chartBadgeText, { color: selected.color }]}>
                                        {trackedDays}/{daysCount} days
                                    </Text>
                                </View>
                            </View>

                            {chartType === 'line' ? (
                                <LineChart
                                    data={{
                                        labels,
                                        datasets: [
                                            {
                                                data: selectedData.map(v => v || 0),
                                                color: () => selected.color,
                                                strokeWidth: 3,
                                            },
                                            ...(showGoalLine && goals[activeMacro] ? [{
                                                data: selectedData.map(() => goals[activeMacro]),
                                                color: () => theme.textTertiary,
                                                strokeWidth: 2,
                                                withDots: false,
                                                strokeDashArray: [5, 5],
                                            }] : []),
                                        ],
                                    }}
                                    width={screenWidth}
                                    height={240}
                                    chartConfig={chartConfig}
                                    bezier
                                    style={styles.chart}
                                    withInnerLines={true}
                                    withOuterLines={false}
                                    withShadow={true}
                                    fromZero={true}
                                    onDataPointClick={handleDataPointClick}
                                />
                            ) : (
                                <BarChart
                                    data={{
                                        labels,
                                        datasets: [{ data: selectedData.map(v => v || 0) }],
                                    }}
                                    width={screenWidth}
                                    height={240}
                                    chartConfig={{ ...chartConfig, barPercentage: 0.7 }}
                                    style={styles.chart}
                                    fromZero={true}
                                    showBarTops={false}
                                    onDataPointClick={handleDataPointClick}
                                />
                            )}

                            <View style={styles.chartHint}>
                                <Ionicons name="hand-left" size={14} color={theme.textTertiary} />
                                <Text style={styles.chartHintText}>
                                    Tap chart points • {showGoalLine ? 'Dashed line shows your goal' : 'Toggle goal line'}
                                </Text>
                            </View>
                        </View>



                        {/* Macro Selector */}
                        <Text style={styles.sectionLabel}>Select Macro to Analyze</Text>
                        <View style={styles.macroGrid}>
                            {MACROS.map(m => {
                                const data = getValues(m.key);
                                const avgVal = avg(data);
                                const maxVal = max(data);
                                const isActive = activeMacro === m.key;
                                return (
                                    <TouchableOpacity
                                        key={m.key}
                                        style={[styles.macroCard, isActive && styles.macroCardActive]}
                                        onPress={() => setActiveMacro(m.key)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.macroCardHeader}>
                                            <View style={[styles.macroIconBox, { backgroundColor: m.bg }]}>
                                                <Ionicons name={m.icon} size={20} color={m.color} />
                                            </View>
                                            {isActive && (
                                                <View style={[styles.activeCheckmark, { backgroundColor: m.color }]}>
                                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.macroLabel}>{m.label}</Text>
                                        <Text style={[styles.macroValue, { color: isActive ? m.color : theme.text }]}>
                                            {avgVal}<Text style={styles.macroUnit}> {m.unit}</Text>
                                        </Text>
                                        <View style={styles.macroProgress}>
                                            <View style={[styles.macroProgressFill, {
                                                width: `${maxVal ? (avgVal / maxVal) * 100 : 0}%`,
                                                backgroundColor: isActive ? m.color : theme.border,
                                            }]} />
                                        </View>
                                        <Text style={styles.macroSubtext}>avg • max {maxVal}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Insights */}
                        <View style={styles.insightsCard}>
                            <View style={styles.insightsHeader}>
                                <Ionicons name="bulb" size={22} color={theme.warning} />
                                <Text style={styles.insightsTitle}>Smart Insights</Text>
                            </View>

                            {avg(selectedData) < goals[activeMacro] * 0.8 && (
                                <View style={styles.insightItem}>
                                    <Ionicons name="arrow-up-circle" size={20} color={theme.info} />
                                    <Text style={styles.insightText}>
                                        Your average {selected.label.toLowerCase()} is below your goal. Try increasing by{' '}
                                        {Math.round((goals[activeMacro] - avg(selectedData)) / Math.max(trackedDays, 1))} {selected.unit}/day.
                                    </Text>
                                </View>
                            )}

                            {avg(selectedData) > goals[activeMacro] * 1.2 && (
                                <View style={styles.insightItem}>
                                    <Ionicons name="warning" size={20} color={theme.warning} />
                                    <Text style={styles.insightText}>
                                        You're exceeding your {selected.label.toLowerCase()} goal by{' '}
                                        {Math.round(avg(selectedData) - goals[activeMacro])} {selected.unit} on average.
                                    </Text>
                                </View>
                            )}

                            {Math.abs(avg(selectedData) - goals[activeMacro]) <= goals[activeMacro] * 0.1 && (
                                <View style={styles.insightItem}>
                                    <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                                    <Text style={styles.insightText}>
                                        Excellent! You're hitting your {selected.label.toLowerCase()} goal consistently.
                                    </Text>
                                </View>
                            )}


                        </View>
                    </>
                )}
            </ScrollView>

            {/* Day Detail Modal */}
            <Modal
                visible={showDayDetail}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDayDetail(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedDay && formatDate(selectedDay.date)}
                            </Text>
                            <TouchableOpacity onPress={() => setShowDayDetail(false)}>
                                <Ionicons name="close-circle" size={28} color={theme.textTertiary} />
                            </TouchableOpacity>
                        </View>

                        {selectedDay && (
                            <>
                                <View style={styles.dayDetailGrid}>
                                    {[
                                        { key: 'calories', label: 'Calories', icon: 'flame', color: theme.calories, goal: calorieGoal, unit: '' },
                                        { key: 'protein', label: 'Protein', icon: 'fitness', color: theme.protein, goal: proteinGoal, unit: 'g' },
                                        { key: 'carbs', label: 'Carbs', icon: 'nutrition', color: theme.carbs, goal: carbsGoal, unit: 'g' },
                                        { key: 'fat', label: 'Fat', icon: 'water', color: theme.fat, goal: fatGoal, unit: 'g' },
                                    ].map(item => (
                                        <View key={item.key} style={styles.dayDetailItem}>
                                            <Ionicons name={item.icon} size={24} color={item.color} />
                                            <Text style={styles.dayDetailLabel}>{item.label}</Text>
                                            <Text style={styles.dayDetailValue}>
                                                {selectedDay[item.key] || 0}{item.unit}
                                            </Text>
                                            <Text style={styles.dayDetailGoal}>Goal: {item.goal}{item.unit}</Text>
                                        </View>
                                    ))}
                                </View>

                                {selectedDay.weight && (
                                    <View style={styles.dayDetailWeight}>
                                        <Ionicons name="scale" size={20} color={theme.primary} />
                                        <Text style={styles.dayDetailWeightText}>
                                            Weight:{' '}
                                            <Text style={styles.dayDetailWeightValue}>{selectedDay.weight} kg</Text>
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.modalCloseBtn}
                                    onPress={() => setShowDayDetail(false)}
                                >
                                    <Text style={styles.modalCloseBtnText}>Close</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { padding: 20, paddingBottom: 60 },

    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginTop: 20, marginBottom: 20,
    },
    title: { fontSize: 28, fontWeight: '800', color: theme.text },
    subtitle: { fontSize: 14, color: theme.textTertiary, marginTop: 4 },
    headerActions: { flexDirection: 'row', gap: 8 },
    iconButton: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: theme.primaryLight,
        alignItems: 'center', justifyContent: 'center',
    },
    iconButtonActive: { backgroundColor: theme.primary },

    tabsScroll: { marginBottom: 20 },
    tabs: { flexDirection: 'row', gap: 10 },
    tab: {
        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
        backgroundColor: theme.surface, borderWidth: 2, borderColor: 'transparent',
        shadowColor: theme.shadowColor, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    tabActive: { borderColor: theme.primary, backgroundColor: theme.primaryLight },
    tabText: { fontSize: 14, fontWeight: '700', color: theme.textTertiary },
    tabTextActive: { color: theme.primary },

    weightCard: {
        backgroundColor: theme.surface, borderRadius: 24, padding: 20, marginBottom: 20,
        shadowColor: theme.primary, shadowOpacity: 0.1, shadowRadius: 20, elevation: 6,
        borderWidth: 2, borderColor: theme.primaryLight,
    },
    weightCardHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 20,
    },
    weightCardTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    weightCardSubtitle: { fontSize: 13, color: theme.textTertiary, marginTop: 2 },
    weightGoalBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: theme.primaryLight, paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, borderColor: theme.primary + '40',
    },
    weightGoalText: { fontSize: 11, fontWeight: '700', color: theme.primary },
    weightStatsRow: {
        flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20,
        backgroundColor: theme.background, borderRadius: 16, padding: 16,
    },
    weightStatBox: { alignItems: 'center' },
    weightStatLabel: {
        fontSize: 11, color: theme.textTertiary, fontWeight: '600',
        marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    weightStatValue: { fontSize: 22, fontWeight: '900', color: theme.text },
    weightStatUnit: { fontSize: 13, fontWeight: '500', color: theme.textTertiary },
    weightStatDivider: { width: 1, backgroundColor: theme.border },
    weightProgressContainer: { marginBottom: 20 },
    weightProgressBar: {
        height: 8, backgroundColor: theme.divider,
        borderRadius: 8, overflow: 'hidden', marginBottom: 8,
    },
    weightProgressFill: { height: '100%', borderRadius: 8 },
    weightProgressTextRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    weightProgressText: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
    weightChangeChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: theme.background, paddingHorizontal: 8,
        paddingVertical: 4, borderRadius: 8,
    },
    weightChangeText: { fontSize: 11, fontWeight: '800' },
    weightChartContainer: { marginBottom: 16 },
    weightChartTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 12 },
    chartEmpty: {
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 36, gap: 10,
    },
    chartEmptyText: {
        fontSize: 13, color: theme.textTertiary,
        textAlign: 'center', fontWeight: '500',
    },
    weightInsights: {
        flexDirection: 'row', justifyContent: 'space-around',
        paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.divider,
    },
    weightInsightItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    weightInsightText: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },

    quickStatsCard: {
        flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 20,
        padding: 16, marginBottom: 16,
        shadowColor: theme.shadowColor, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
    },
    quickStatItem: { flex: 1, alignItems: 'center' },
    quickStatLabel: {
        fontSize: 11, color: theme.textTertiary, fontWeight: '600',
        marginBottom: 6, textTransform: 'uppercase',
    },
    quickStatValue: { fontSize: 20, fontWeight: '900', color: theme.text },
    quickStatDivider: { width: 1, backgroundColor: theme.border },

    chartControls: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16,
    },
    chartTypeToggle: {
        flexDirection: 'row', backgroundColor: theme.surface,
        borderRadius: 12, padding: 4, gap: 4,
        shadowColor: theme.shadowColor, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    chartTypeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    chartTypeBtnActive: { backgroundColor: theme.primary },
    goalToggle: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.surface, paddingHorizontal: 12,
        paddingVertical: 8, borderRadius: 12,
        shadowColor: theme.shadowColor, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    goalToggleText: { fontSize: 13, fontWeight: '600', color: theme.textTertiary },
    goalToggleTextActive: { color: theme.primary },

    chartCard: {
        backgroundColor: theme.surface, borderRadius: 24, padding: 20, marginBottom: 16,
        shadowColor: theme.shadowColor, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6,
    },
    chartHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 16,
    },
    chartTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    chartSubtitle: { fontSize: 12, color: theme.textTertiary, marginTop: 2 },
    chartBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    chartBadgeText: { fontSize: 12, fontWeight: '700' },
    chart: { borderRadius: 16, marginLeft: -10, marginVertical: 8 },
    chartHint: {
        flexDirection: 'row', alignItems: 'center',
        gap: 6, justifyContent: 'center', marginTop: 8,
    },
    chartHintText: { fontSize: 11, color: theme.textTertiary, fontWeight: '600' },

    compareCard: {
        backgroundColor: theme.surface, borderRadius: 24, padding: 20, marginBottom: 16,
        shadowColor: theme.shadowColor, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
    },
    compareTitle: { fontSize: 16, fontWeight: '800', color: theme.text, marginBottom: 16 },
    compareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    compareItem: {
        width: (screenWidth - 64) / 2, backgroundColor: theme.background,
        borderRadius: 16, padding: 16,
    },
    compareHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    compareLabel: { fontSize: 13, fontWeight: '700', color: theme.text },
    compareValue: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
    compareBar: {
        height: 6, backgroundColor: theme.border,
        borderRadius: 3, overflow: 'hidden', marginBottom: 6,
    },
    compareBarFill: { height: '100%', borderRadius: 3 },
    compareProgress: { fontSize: 11, color: theme.textTertiary, fontWeight: '600' },

    sectionLabel: { fontSize: 16, fontWeight: '800', color: theme.text, marginBottom: 12 },
    macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    macroCard: {
        width: (screenWidth - 12) / 2, backgroundColor: theme.surface,
        borderRadius: 20, padding: 16,
        shadowColor: theme.shadowColor, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
        borderWidth: 2, borderColor: 'transparent',
    },
    macroCardActive: {
        borderColor: theme.primary, backgroundColor: theme.surfaceAlt, shadowOpacity: 0.12,
    },
    macroCardHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12,
    },
    macroIconBox: {
        width: 44, height: 44, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    activeCheckmark: {
        width: 24, height: 24, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    macroLabel: { fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginBottom: 4 },
    macroValue: { fontSize: 26, fontWeight: '900' },
    macroUnit: { fontSize: 13, fontWeight: '500', color: theme.textTertiary },
    macroProgress: {
        height: 6, backgroundColor: theme.divider,
        borderRadius: 3, overflow: 'hidden', marginVertical: 10,
    },
    macroProgressFill: { height: '100%', borderRadius: 3 },
    macroSubtext: { fontSize: 11, color: theme.textTertiary, fontWeight: '600' },

    insightsCard: {
        backgroundColor: theme.warningLight, borderRadius: 20, padding: 20, marginBottom: 20,
        borderWidth: 2, borderColor: theme.warning + '40',
    },
    insightsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    insightsTitle: { fontSize: 16, fontWeight: '800', color: theme.warning },
    insightItem: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
    insightText: { flex: 1, fontSize: 14, color: theme.text, lineHeight: 20 },
    moreInsightsBtn: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 6, marginTop: 8,
    },
    moreInsightsText: { fontSize: 14, fontWeight: '700', color: theme.primary },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: theme.surface, borderTopLeftRadius: 32,
        borderTopRightRadius: 32, padding: 24, maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 24,
    },
    modalTitle: { fontSize: 22, fontWeight: '900', color: theme.text },
    dayDetailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    dayDetailItem: {
        width: (screenWidth - 80) / 2, backgroundColor: theme.background,
        borderRadius: 16, padding: 16, alignItems: 'center',
    },
    dayDetailLabel: {
        fontSize: 12, color: theme.textTertiary,
        fontWeight: '600', marginTop: 8, marginBottom: 4,
    },
    dayDetailValue: { fontSize: 24, fontWeight: '900', color: theme.text, marginBottom: 4 },
    dayDetailGoal: { fontSize: 11, color: theme.textTertiary },
    dayDetailWeight: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: theme.primaryLight, padding: 16,
        borderRadius: 16, marginBottom: 20,
    },
    dayDetailWeightText: { fontSize: 14, color: theme.textSecondary, fontWeight: '600' },
    dayDetailWeightValue: { fontWeight: '900', color: theme.primary },
    modalCloseBtn: {
        backgroundColor: theme.primary, paddingVertical: 16,
        borderRadius: 16, alignItems: 'center',
    },
    modalCloseBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyIcon: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 8 },
    emptyText: { fontSize: 14, color: theme.textTertiary, textAlign: 'center', lineHeight: 22 },
});