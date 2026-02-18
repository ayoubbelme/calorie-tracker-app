import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useCalories } from '../components/CaloriesContext';

const screenWidth = Dimensions.get('window').width - 40;

const TABS = ['Weekly', 'Monthly'];

const MACROS = [
    { key: 'calories', label: 'Calories', unit: 'kcal', color: '#22C55E', bg: '#F0FDF4' },
    { key: 'protein',  label: 'Protein',  unit: 'g',    color: '#3B82F6', bg: '#EFF6FF' },
    { key: 'carbs',    label: 'Carbs',    unit: 'g',    color: '#F59E0B', bg: '#FFFBEB' },
    { key: 'fat',      label: 'Fat',      unit: 'g',    color: '#EF4444', bg: '#FFF1F2' },
];

const ICONS = { calories: '🔥', protein: '🥩', carbs: '🍞', fat: '🥑' };

export default function StatsScreen() {
    const { history } = useCalories();
    const [activeTab, setActiveTab] = useState('Weekly');
    const [activeMacro, setActiveMacro] = useState('calories');

    const getDays = (count) => {
        const days = [];
        for (let i = count - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    const days = activeTab === 'Weekly' ? getDays(7) : getDays(30);

    const weeklyLabels = days.map(d => {
        const date = new Date(d + 'T12:00:00');
        return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][date.getDay()];
    });

    const chunkWeeks = (arr) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += 7) chunks.push(arr.slice(i, i + 7));
        return chunks;
    };

    const monthlyWeeks = chunkWeeks(days);

    const weeklyAvg = (key) =>
        monthlyWeeks.map(week => {
            const vals = week.map(d => history[d]?.[key] || 0);
            const nonZero = vals.filter(v => v > 0);
            return nonZero.length ? Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length) : 0;
        });

    const shortWeekLabels = monthlyWeeks.map((_, i) => `Wk ${i + 1}`);

    const getValues   = (key) => days.map(d => history[d]?.[key] || 0);
    const avg         = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const trackedDays = days.filter(d => history[d]).length;

    const selected     = MACROS.find(m => m.key === activeMacro);
    const selectedData = getValues(activeMacro);
    const weeklyData   = weeklyAvg(activeMacro);

    // Best / worst day in monthly
    const monthlyEntries = days
        .filter(d => history[d])
        .map(d => ({ date: d, value: history[d][activeMacro] || 0 }))
        .sort((a, b) => b.value - a.value);
    const bestDay  = monthlyEntries[0];
    const worstDay = monthlyEntries[monthlyEntries.length - 1];

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Today macro split
    const todayKey  = new Date().toISOString().split('T')[0];
    const todayData = history[todayKey] || {};
    const pTotal    = (todayData.protein || 0) * 4 + (todayData.carbs || 0) * 4 + (todayData.fat || 0) * 9 || 1;
    const macroSplit = [
        { label: 'Protein', color: '#3B82F6', pct: (todayData.protein || 0) * 4 / pTotal },
        { label: 'Carbs',   color: '#F59E0B', pct: (todayData.carbs || 0) * 4 / pTotal },
        { label: 'Fat',     color: '#EF4444', pct: (todayData.fat || 0) * 9 / pTotal },
    ];

    const chartConfig = {
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        decimalPlaces: 0,
        color: () => selected.color,
        labelColor: () => '#9CA3AF',
        propsForDots: { r: '5', strokeWidth: '2', stroke: selected.color, fill: '#fff' },
        propsForBackgroundLines: { stroke: '#F3F4F6', strokeDasharray: '' },
        fillShadowGradientOpacity: 0.12,
        fillShadowGradient: selected.color,
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Stats 📊</Text>
            <Text style={styles.subtitle}>Your nutrition overview</Text>

            {/* Tabs */}
            <View style={styles.tabs}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {trackedDays === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📉</Text>
                    <Text style={styles.emptyTitle}>No data yet</Text>
                    <Text style={styles.emptyText}>Start adding meals to see your trends here</Text>
                </View>
            ) : (
                <>
                    {/* Today's Macro Split */}
                    <View style={styles.splitCard}>
                        <Text style={styles.splitTitle}>Today's Macro Split</Text>
                        <View style={styles.splitBarContainer}>
                            {macroSplit.map((m, i) => (
                                <View key={i} style={[styles.splitBarSegment, {
                                    flex: Math.max(m.pct, 0.01),
                                    backgroundColor: m.color,
                                    borderTopLeftRadius:    i === 0 ? 8 : 0,
                                    borderBottomLeftRadius: i === 0 ? 8 : 0,
                                    borderTopRightRadius:    i === macroSplit.length - 1 ? 8 : 0,
                                    borderBottomRightRadius: i === macroSplit.length - 1 ? 8 : 0,
                                }]} />
                            ))}
                        </View>
                        <View style={styles.splitLegend}>
                            {macroSplit.map((m, i) => (
                                <View key={i} style={styles.splitLegendItem}>
                                    <View style={[styles.splitDot, { backgroundColor: m.color }]} />
                                    <Text style={styles.splitLegendLabel}>{m.label}</Text>
                                    <Text style={[styles.splitLegendPct, { color: m.color }]}>{Math.round(m.pct * 100)}%</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── WEEKLY VIEW ── */}
                    {activeTab === 'Weekly' && (
                        <View style={styles.chartCard}>
                            <View style={styles.chartHeaderRow}>
                                <View>
                                    <Text style={styles.chartTitle}>{selected.label} — This Week</Text>
                                    <Text style={styles.chartMeta}>{trackedDays} days tracked</Text>
                                </View>
                                <View style={[styles.chartBadge, { backgroundColor: selected.bg }]}>
                                    <Text style={[styles.chartBadgeText, { color: selected.color }]}>
                                        avg {avg(selectedData)} {selected.unit}
                                    </Text>
                                </View>
                            </View>
                            <LineChart
                                data={{
                                    labels: weeklyLabels,
                                    datasets: [{ data: selectedData.map(v => v || 0), color: () => selected.color, strokeWidth: 3 }],
                                }}
                                width={screenWidth - 24}
                                height={200}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                                withInnerLines={true}
                                withOuterLines={false}
                                withShadow={true}
                                fromZero={true}
                            />
                        </View>
                    )}

                    {/* ── MONTHLY VIEW ── */}
                    {activeTab === 'Monthly' && (
                        <>
                         {/* Best / Worst day */}
                         <View style={styles.extremesRow}>
                                <View style={[styles.extremeCard, { borderLeftColor: selected.color }]}>
                                    <Text style={styles.extremeEmoji}>🏆</Text>
                                    <Text style={styles.extremeLabel}>Best Day</Text>
                                    <Text style={[styles.extremeValue, { color: selected.color }]}>
                                        {bestDay ? bestDay.value : '—'} {selected.unit}
                                    </Text>
                                    <Text style={styles.extremeDate}>{bestDay ? formatDate(bestDay.date) : '—'}</Text>
                                </View>
                                <View style={[styles.extremeCard, { borderLeftColor: '#9CA3AF' }]}>
                                    <Text style={styles.extremeEmoji}>📉</Text>
                                    <Text style={styles.extremeLabel}>Lowest Day</Text>
                                    <Text style={[styles.extremeValue, { color: '#6B7280' }]}>
                                        {worstDay ? worstDay.value : '—'} {selected.unit}
                                    </Text>
                                    <Text style={styles.extremeDate}>{worstDay ? formatDate(worstDay.date) : '—'}</Text>
                                </View>
                            </View>
                            <View style={styles.chartCard}>
                                <View style={styles.chartHeaderRow}>
                                    <View>
                                        <Text style={styles.chartTitle}>{selected.label} — Weekly Avg</Text>
                                        <Text style={styles.chartMeta}>Past 30 days · by week</Text>
                                    </View>
                                    <View style={[styles.chartBadge, { backgroundColor: selected.bg }]}>
                                        <Text style={[styles.chartBadgeText, { color: selected.color }]}>
                                            avg {avg(selectedData)} {selected.unit}
                                        </Text>
                                    </View>
                                </View>
                                
                                <LineChart
                                    data={{
                                        labels: shortWeekLabels,
                                        datasets: [{ data: weeklyData.map(v => v || 0), color: () => selected.color, strokeWidth: 3 }],
                                    }}
                                    width={screenWidth - 24}
                                    height={200}
                                    chartConfig={chartConfig}
                                    bezier
                                    style={styles.chart}
                                    withInnerLines={true}
                                    withOuterLines={false}
                                    withShadow={true}
                                    fromZero={true}
                                />
                            </View>

                           
                        </>
                    )}

                    {/* Macro Selector Grid */}
                    <Text style={styles.sectionLabel}>All Macros</Text>
                    <View style={styles.macroGrid}>
                        {MACROS.map(m => {
                            const data   = getValues(m.key);
                            const avgVal = avg(data);
                            const isActive = activeMacro === m.key;
                            const first  = avg(data.slice(0, Math.floor(data.length / 2)));
                            const last   = avg(data.slice(Math.floor(data.length / 2)));
                            const trend  = last > first ? '↑' : last < first ? '↓' : '→';
                            const trendColor = last > first ? '#22C55E' : last < first ? '#EF4444' : '#9CA3AF';

                            return (
                                <TouchableOpacity
                                    key={m.key}
                                    style={[styles.macroCard,
                                        isActive ? { borderColor: m.color, borderWidth: 2 } : { borderColor: '#F3F4F6', borderWidth: 2 }
                                    ]}
                                    onPress={() => setActiveMacro(m.key)}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.macroCardTopRow}>
                                        <View style={[styles.macroIconBox, { backgroundColor: m.bg }]}>
                                            <Text style={styles.macroIcon}>{ICONS[m.key]}</Text>
                                        </View>
                                        <View style={[styles.trendBadge, { backgroundColor: isActive ? m.bg : '#F9FAFB' }]}>
                                            <Text style={[styles.trendText, { color: isActive ? trendColor : '#9CA3AF' }]}>{trend}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.macroCardValue, { color: isActive ? m.color : '#111827' }]}>
                                        {avgVal}<Text style={styles.macroCardUnit}> {m.unit}</Text>
                                    </Text>
                                    <Text style={styles.macroCardLabel}>{m.label}</Text>
                                    <View style={styles.macroProgressBg}>
                                        <View style={[styles.macroProgressFill, {
                                            width: isActive ? '100%' : '40%',
                                            backgroundColor: isActive ? m.color : '#E5E7EB',
                                        }]} />
                                    </View>
                                    {isActive && <View style={[styles.activeIndicator, { backgroundColor: m.color }]} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scroll: { padding: 20, paddingBottom: 60 },
    title: { fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 20 },
    subtitle: { fontSize: 15, color: '#9CA3AF', marginBottom: 20 },

    tabs: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 14, padding: 4, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    tabActive: { backgroundColor: '#111827', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
    tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
    tabTextActive: { color: '#fff' },

    splitCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 5 },
    splitTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 14 },
    splitBarContainer: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', marginBottom: 14 },
    splitBarSegment: { height: '100%' },
    splitLegend: { flexDirection: 'row', justifyContent: 'space-around' },
    splitLegendItem: { alignItems: 'center', gap: 4 },
    splitDot: { width: 8, height: 8, borderRadius: 4 },
    splitLegendLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
    splitLegendPct: { fontSize: 14, fontWeight: '800' },

    chartCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 5 },
    chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    chartTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
    chartMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
    chartBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    chartBadgeText: { fontSize: 13, fontWeight: '700' },
    chart: { borderRadius: 16, marginLeft: -10 },

    extremesRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    extremeCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    extremeEmoji: { fontSize: 22, marginBottom: 8 },
    extremeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    extremeValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
    extremeDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

    sectionLabel: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
    macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    macroCard: { width: (screenWidth / 2) - 6, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4, position: 'relative', overflow: 'hidden' },
    macroCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    macroIconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    macroIcon: { fontSize: 20 },
    trendBadge: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    trendText: { fontSize: 16, fontWeight: '700' },
    macroCardValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
    macroCardUnit: { fontSize: 13, fontWeight: '500', color: '#9CA3AF' },
    macroCardLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
    macroProgressBg: { height: 4, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
    macroProgressFill: { height: '100%', borderRadius: 4 },
    activeIndicator: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, margin: 10 },

    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyIcon: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
    emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
});