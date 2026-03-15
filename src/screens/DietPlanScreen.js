// import React, { useState, useEffect } from 'react';
// import {
//     View, Text, StyleSheet, ScrollView, TouchableOpacity,
//     ActivityIndicator, Alert, Modal, Dimensions
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useProfile } from '../components/ProfileContext';
// import { useCalories } from '../components/CaloriesContext';
// import { useTheme } from '../components/ThemeContext';

// const screenWidth = Dimensions.get('window').width;

// const MEAL_TIMES = [
//     { id: 'breakfast', label: 'Breakfast', icon: 'sunny', color: '#F59E0B', time: '7:00 AM' },
//     { id: 'lunch', label: 'Lunch', icon: 'restaurant', color: '#22C55E', time: '12:00 PM' },
//     { id: 'dinner', label: 'Dinner', icon: 'moon', color: '#8B5CF6', time: '6:00 PM' },
//     { id: 'snacks', label: 'Snacks', icon: 'ice-cream', color: '#EF4444', time: 'Anytime' },
// ];

// const DIET_TEMPLATES = [
//     { id: 'balanced', name: 'Balanced', desc: 'Well-rounded meals', icon: 'scale', color: '#3B82F6' },
//     { id: 'highprotein', name: 'High Protein', desc: 'Muscle building focus', icon: 'fitness', color: '#8B5CF6' },
//     { id: 'lowcarb', name: 'Low Carb', desc: 'Keto-friendly', icon: 'nutrition', color: '#22C55E' },
//     { id: 'vegetarian', name: 'Vegetarian', desc: 'Plant-based meals', icon: 'leaf', color: '#10B981' },
// ];

// const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// // ─── Direct Anthropic API call ───────────────────────────────────────────────
// // 🔑 Replace with your ngrok URL each time you restart ngrok
// // Example: 'https://abc123.ngrok-free.app/ai'
// const PROXY_URL = 'https://192.168.100.4.ngrok-free.app/ai';

// const callClaude = async (prompt) => {
//     const response = await fetch(PROXY_URL, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ prompt }),
//     });
//     if (!response.ok) throw new Error(`API error: ${response.status}`);
//     const data = await response.json();
//     const text = data.content?.filter(i => i.type === 'text').map(i => i.text).join('') || '';
//     const clean = text.replace(/```json|```/g, '').trim();
//     return JSON.parse(clean);
// };

// // ─── Generate meals for a single meal-time slot ───────────────────────────────
// const generateMealsForSlot = async ({ mealTime, calorieGoal, proteinGoal, carbsGoal, fatGoal, goal }) => {
//     const fraction = mealTime === 'snacks' ? 0.125 : 0.3;
//     const tCal = Math.round(parseFloat(calorieGoal) * fraction);
//     const tProt = Math.round(parseFloat(proteinGoal) * fraction);
//     const tCarb = Math.round(parseFloat(carbsGoal) * fraction);
//     const tFat = Math.round(parseFloat(fatGoal) * fraction);

//     const prompt = `You are a nutrition expert. Create 3 healthy ${mealTime} meal options for someone with these goals:
// - Fitness Goal: ${goal}
// - Target Calories: ${tCal} kcal
// - Target Protein: ${tProt}g, Carbs: ${tCarb}g, Fat: ${tFat}g

// Respond ONLY with valid JSON, no markdown:
// {
//   "meals": [
//     {
//       "name": "meal name",
//       "ingredients": ["item 1", "item 2"],
//       "portions": "serving size",
//       "protein": 0,
//       "carbs": 0,
//       "fat": 0,
//       "calories": 0,
//       "prep": "brief instructions"
//     }
//   ]
// }`;

//     const result = await callClaude(prompt);
//     return result.meals || [];
// };

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// export default function DietPlanScreen() {
//     const { theme } = useTheme();
//     const styles = createStyles(theme);
//     const { calorieGoal, proteinGoal, carbsGoal, fatGoal, goal } = useProfile();
//     const { addMeal } = useCalories();

//     const [selectedDay, setSelectedDay] = useState(0);
//     const [mealPlan, setMealPlan] = useState({});
//     const [aiModalVisible, setAiModalVisible] = useState(false);
//     const [selectedMealTime, setSelectedMealTime] = useState(null);
//     const [templateModalVisible, setTemplateModalVisible] = useState(false);
//     const [weekGenerating, setWeekGenerating] = useState(false);

//     useEffect(() => { loadMealPlan(); }, []);

//     const loadMealPlan = async () => {
//         try {
//             const stored = await AsyncStorage.getItem('diet_plan');
//             if (stored) setMealPlan(JSON.parse(stored));
//         } catch (e) { console.error(e); }
//     };

//     const saveMealPlan = async (plan) => {
//         try {
//             await AsyncStorage.setItem('diet_plan', JSON.stringify(plan));
//             setMealPlan(plan);
//         } catch (e) { console.error(e); }
//     };

//     const addMealToPlan = (day, mealTime, meal) => {
//         const dayKey = DAYS[day];
//         const newPlan = { ...mealPlan, [dayKey]: { ...(mealPlan[dayKey] || {}), [mealTime]: meal } };
//         saveMealPlan(newPlan);
//         Alert.alert('✅ Meal Added', `${meal.name} added to ${DAYS[day]} ${mealTime}`);
//     };

//     const removeMealFromPlan = (day, mealTime) => {
//         const dayKey = DAYS[day];
//         const newPlan = { ...mealPlan };
//         if (newPlan[dayKey]?.[mealTime]) {
//             delete newPlan[dayKey][mealTime];
//             saveMealPlan(newPlan);
//         }
//     };

//     const logMealToToday = (meal) => {
//         addMeal(meal.calories, meal.protein, meal.carbs, meal.fat);
//         Alert.alert('✅ Logged!', `${meal.name} added to today's meals.\n\n${meal.calories} kcal`);
//     };

//     const handleOpenAIModal = (mealTimeId) => {
//         setSelectedMealTime(mealTimeId);
//         setAiModalVisible(true);
//     };

//     const generateWeekPlan = () => {
//         Alert.alert(
//             '🤖 AI Weekly Plan',
//             'Generate a full weekly meal plan based on your goals?',
//             [
//                 { text: 'Cancel', style: 'cancel' },
//                 {
//                     text: 'Generate',
//                     onPress: async () => {
//                         setWeekGenerating(true);
//                         try {
//                             const newPlan = {};
//                             for (let d = 0; d < 7; d++) {
//                                 const dayKey = DAYS[d];
//                                 newPlan[dayKey] = {};
//                                 for (const mt of ['breakfast', 'lunch', 'dinner']) {
//                                     const meals = await generateMealsForSlot({ mealTime: mt, calorieGoal, proteinGoal, carbsGoal, fatGoal, goal });
//                                     if (meals.length > 0) newPlan[dayKey][mt] = meals[0];
//                                 }
//                             }
//                             saveMealPlan(newPlan);
//                             Alert.alert('✅ Done!', 'Your weekly meal plan is ready!');
//                         } catch (e) {
//                             console.error(e);
//                             Alert.alert('Error', 'Failed to generate plan. Please try again.');
//                         } finally {
//                             setWeekGenerating(false);
//                         }
//                     }
//                 }
//             ]
//         );
//     };

//     const currentDayPlan = mealPlan[DAYS[selectedDay]] || {};

//     return (
//         <View style={styles.container}>
//             <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

//                 {/* Daily Targets */}
//                 <View style={styles.targetsCard}>
//                     <Text style={styles.targetsTitle}>Daily Targets</Text>
//                     <View style={styles.targetsRow}>
//                         <View style={styles.targetItem}>
//                             <Ionicons name="flame" size={18} color={theme.calories} />
//                             <Text style={styles.targetValue}>{calorieGoal}</Text>
//                             <Text style={styles.targetLabel}>kcal</Text>
//                         </View>
//                         <View style={styles.targetItem}>
//                             <Ionicons name="fitness" size={18} color={theme.protein} />
//                             <Text style={styles.targetValue}>{proteinGoal}g</Text>
//                             <Text style={styles.targetLabel}>Protein</Text>
//                         </View>
//                         <View style={styles.targetItem}>
//                             <Ionicons name="nutrition" size={18} color={theme.carbs} />
//                             <Text style={styles.targetValue}>{carbsGoal}g</Text>
//                             <Text style={styles.targetLabel}>Carbs</Text>
//                         </View>
//                         <View style={styles.targetItem}>
//                             <Ionicons name="water" size={18} color={theme.fat} />
//                             <Text style={styles.targetValue}>{fatGoal}g</Text>
//                             <Text style={styles.targetLabel}>Fat</Text>
//                         </View>
//                     </View>
//                 </View>

//                 {/* Day Selector */}
//                 <View style={styles.daySelector}>
//                     <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScrollContent}>
//                         {DAYS.map((day, index) => (
//                             <TouchableOpacity
//                                 key={day}
//                                 style={[styles.dayBtn, selectedDay === index && styles.dayBtnActive]}
//                                 onPress={() => setSelectedDay(index)}
//                             >
//                                 <Text style={[styles.dayText, selectedDay === index && styles.dayTextActive]}>{day}</Text>
//                                 {Object.keys(mealPlan[day] || {}).length > 0 && <View style={styles.dayDot} />}
//                             </TouchableOpacity>
//                         ))}
//                     </ScrollView>
//                 </View>

//                 {/* Quick Actions */}
//                 <View style={styles.quickActions}>
//                     <TouchableOpacity style={styles.quickActionBtn} onPress={() => setTemplateModalVisible(true)}>
//                         <View style={[styles.quickActionIcon, { backgroundColor: theme.infoLight }]}>
//                             <Ionicons name="documents" size={20} color={theme.info} />
//                         </View>
//                         <Text style={styles.quickActionText}>Templates</Text>
//                     </TouchableOpacity>

//                     <TouchableOpacity style={styles.quickActionBtn} onPress={generateWeekPlan} disabled={weekGenerating}>
//                         <View style={[styles.quickActionIcon, { backgroundColor: theme.primaryLight }]}>
//                             {weekGenerating
//                                 ? <ActivityIndicator size="small" color={theme.primary} />
//                                 : <Ionicons name="sparkles" size={20} color={theme.primary} />
//                             }
//                         </View>
//                         <Text style={styles.quickActionText}>{weekGenerating ? 'Generating…' : 'AI Week Plan'}</Text>
//                     </TouchableOpacity>

//                     <TouchableOpacity style={styles.quickActionBtn} onPress={() => Alert.alert('Coming Soon', 'Shopping list coming soon!')}>
//                         <View style={[styles.quickActionIcon, { backgroundColor: theme.successLight }]}>
//                             <Ionicons name="cart" size={20} color={theme.success} />
//                         </View>
//                         <Text style={styles.quickActionText}>Shopping List</Text>
//                     </TouchableOpacity>
//                 </View>

//                 {/* Meal Cards */}
//                 {MEAL_TIMES.map((mealTime) => {
//                     const meal = currentDayPlan[mealTime.id];
//                     return (
//                         <View key={mealTime.id} style={styles.mealCard}>
//                             <View style={styles.mealHeader}>
//                                 <View style={styles.mealHeaderLeft}>
//                                     <View style={[styles.mealIcon, { backgroundColor: mealTime.color + '20' }]}>
//                                         <Ionicons name={mealTime.icon} size={22} color={mealTime.color} />
//                                     </View>
//                                     <View>
//                                         <Text style={styles.mealTitle}>{mealTime.label}</Text>
//                                         <Text style={styles.mealTime}>{mealTime.time}</Text>
//                                     </View>
//                                 </View>
//                                 {!meal ? (
//                                     <TouchableOpacity style={styles.addMealBtn} onPress={() => handleOpenAIModal(mealTime.id)}>
//                                         <Ionicons name="add" size={20} color={theme.primary} />
//                                     </TouchableOpacity>
//                                 ) : (
//                                     <TouchableOpacity style={styles.removeMealBtn} onPress={() => removeMealFromPlan(selectedDay, mealTime.id)}>
//                                         <Ionicons name="close" size={18} color={theme.error} />
//                                     </TouchableOpacity>
//                                 )}
//                             </View>

//                             {meal ? (
//                                 <View>
//                                     <Text style={styles.mealName}>{meal.name}</Text>
//                                     {meal.ingredients?.length > 0 && (
//                                         <View style={styles.ingredientsBox}>
//                                             <Ionicons name="list" size={14} color={theme.textTertiary} />
//                                             <Text style={styles.ingredientsText} numberOfLines={2}>
//                                                 {meal.ingredients.join(', ')}
//                                             </Text>
//                                         </View>
//                                     )}
//                                     <View style={styles.macrosRow}>
//                                         <View style={[styles.macroChip, { backgroundColor: theme.infoLight }]}>
//                                             <Text style={[styles.macroChipLabel, { color: theme.info }]}>P</Text>
//                                             <Text style={[styles.macroChipValue, { color: theme.info }]}>{meal.protein}g</Text>
//                                         </View>
//                                         <View style={[styles.macroChip, { backgroundColor: theme.warningLight }]}>
//                                             <Text style={[styles.macroChipLabel, { color: theme.warning }]}>C</Text>
//                                             <Text style={[styles.macroChipValue, { color: theme.warning }]}>{meal.carbs}g</Text>
//                                         </View>
//                                         <View style={[styles.macroChip, { backgroundColor: theme.errorLight }]}>
//                                             <Text style={[styles.macroChipLabel, { color: theme.error }]}>F</Text>
//                                             <Text style={[styles.macroChipValue, { color: theme.error }]}>{meal.fat}g</Text>
//                                         </View>
//                                         <View style={[styles.macroChip, { backgroundColor: theme.successLight }]}>
//                                             <Ionicons name="flame" size={12} color={theme.success} />
//                                             <Text style={[styles.macroChipValue, { color: theme.success }]}>{meal.calories}</Text>
//                                         </View>
//                                     </View>
//                                     {/* Log to Today button — modern style */}
//                                     <TouchableOpacity style={styles.logBtn} activeOpacity={0.82} onPress={() => logMealToToday(meal)}>
//                                         <View style={styles.logBtnInner}>
//                                             <View style={styles.logBtnIconWrap}>
//                                                 <Ionicons name="add" size={14} color="#FFFFFF" />
//                                             </View>
//                                             <Text style={styles.logBtnText}>Log to Today</Text>
//                                             <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.9)" />
//                                         </View>
//                                     </TouchableOpacity>
//                                 </View>
//                             ) : (
//                                 <View style={styles.emptyMeal}>
//                                     <Ionicons name="restaurant-outline" size={32} color={theme.border} />
//                                     <Text style={styles.emptyText}>No meal planned</Text>
//                                     <TouchableOpacity style={styles.aiSuggestBtn} onPress={() => handleOpenAIModal(mealTime.id)}>
//                                         <Ionicons name="sparkles" size={16} color={theme.primary} />
//                                         <Text style={styles.aiSuggestText}>Get AI Suggestions</Text>
//                                     </TouchableOpacity>
//                                 </View>
//                             )}
//                         </View>
//                     );
//                 })}

//                 <View style={{ height: 40 }} />
//             </ScrollView>

//             {/* AI Suggestions Modal */}
//             <AISuggestionsModal
//                 visible={aiModalVisible}
//                 onClose={() => setAiModalVisible(false)}
//                 mealTime={selectedMealTime}
//                 theme={theme}
//                 calorieGoal={calorieGoal}
//                 proteinGoal={proteinGoal}
//                 carbsGoal={carbsGoal}
//                 fatGoal={fatGoal}
//                 goal={goal}
//                 onSelectMeal={(meal) => {
//                     addMealToPlan(selectedDay, selectedMealTime, meal);
//                     setAiModalVisible(false);
//                 }}
//             />

//             {/* Templates Modal */}
//             <TemplatesModal
//                 visible={templateModalVisible}
//                 onClose={() => setTemplateModalVisible(false)}
//                 theme={theme}
//                 onSelectTemplate={(template) => {
//                     Alert.alert('Coming Soon', `${template.name} template coming soon!`);
//                     setTemplateModalVisible(false);
//                 }}
//             />
//         </View>
//     );
// }

// // ─── AI Suggestions Modal ─────────────────────────────────────────────────────
// function AISuggestionsModal({ visible, onClose, mealTime, theme, calorieGoal, proteinGoal, carbsGoal, fatGoal, goal, onSelectMeal }) {
//     const styles = createStyles(theme);
//     const [suggestions, setSuggestions] = useState([]);
//     const [loading, setLoading] = useState(false);

//     useEffect(() => {
//         if (visible && mealTime) fetchSuggestions();
//     }, [visible, mealTime]);

//     const fetchSuggestions = async () => {
//         setLoading(true);
//         setSuggestions([]);
//         try {
//             const meals = await generateMealsForSlot({ mealTime, calorieGoal, proteinGoal, carbsGoal, fatGoal, goal });
//             setSuggestions(meals);
//         } catch (e) {
//             console.error(e);
//             Alert.alert('Error', 'Failed to get suggestions. Please try again.');
//             onClose();
//         } finally {
//             setLoading(false);
//         }
//     };

//     const mealTimeMeta = MEAL_TIMES.find(m => m.id === mealTime);

//     return (
//         <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
//             <View style={styles.modalOverlay}>
//                 <View style={styles.modalContent}>
//                     {/* Modal Header */}
//                     <View style={styles.modalHeader}>
//                         <View style={styles.modalHeaderLeft}>
//                             {mealTimeMeta && (
//                                 <View style={[styles.modalMealIcon, { backgroundColor: mealTimeMeta.color + '20' }]}>
//                                     <Ionicons name={mealTimeMeta.icon} size={20} color={mealTimeMeta.color} />
//                                 </View>
//                             )}
//                             <View>
//                                 <Text style={styles.modalTitle}>AI Suggestions</Text>
//                                 <Text style={styles.modalSubtitle}>{mealTimeMeta?.label} · Tap to add to plan</Text>
//                             </View>
//                         </View>
//                         <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
//                             <Ionicons name="close" size={20} color={theme.textSecondary} />
//                         </TouchableOpacity>
//                     </View>

//                     <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
//                         {loading ? (
//                             <View style={styles.loadingContainer}>
//                                 <ActivityIndicator size="large" color={theme.primary} />
//                                 <Text style={styles.loadingText}>Generating personalized meals…</Text>
//                                 <Text style={styles.loadingSubText}>Powered by Claude AI</Text>
//                             </View>
//                         ) : (
//                             suggestions.map((meal, i) => (
//                                 <View key={i} style={styles.suggestionCard}>
//                                     {/* Suggestion header */}
//                                     <View style={styles.suggestionHeader}>
//                                         <Text style={styles.suggestionName}>{meal.name}</Text>
//                                         <View style={[styles.calorieBadge, { backgroundColor: theme.successLight }]}>
//                                             <Ionicons name="flame" size={12} color={theme.success} />
//                                             <Text style={[styles.calorieBadgeText, { color: theme.success }]}>{meal.calories} kcal</Text>
//                                         </View>
//                                     </View>

//                                     {/* Macros */}
//                                     <View style={styles.suggestionMacros}>
//                                         <View style={[styles.suggestionMacroItem, { backgroundColor: theme.infoLight }]}>
//                                             <Text style={[styles.suggestionMacroVal, { color: theme.info }]}>{meal.protein}g</Text>
//                                             <Text style={[styles.suggestionMacroLbl, { color: theme.info }]}>Protein</Text>
//                                         </View>
//                                         <View style={[styles.suggestionMacroItem, { backgroundColor: theme.warningLight }]}>
//                                             <Text style={[styles.suggestionMacroVal, { color: theme.warning }]}>{meal.carbs}g</Text>
//                                             <Text style={[styles.suggestionMacroLbl, { color: theme.warning }]}>Carbs</Text>
//                                         </View>
//                                         <View style={[styles.suggestionMacroItem, { backgroundColor: theme.errorLight }]}>
//                                             <Text style={[styles.suggestionMacroVal, { color: theme.error }]}>{meal.fat}g</Text>
//                                             <Text style={[styles.suggestionMacroLbl, { color: theme.error }]}>Fat</Text>
//                                         </View>
//                                     </View>

//                                     {/* Ingredients */}
//                                     {meal.ingredients?.length > 0 && (
//                                         <View style={styles.suggestionIngredients}>
//                                             <Ionicons name="list-outline" size={14} color={theme.textTertiary} />
//                                             <Text style={styles.suggestionIngredientsText} numberOfLines={2}>
//                                                 {meal.ingredients.join(', ')}
//                                             </Text>
//                                         </View>
//                                     )}

//                                     {/* Prep note */}
//                                     {meal.prep && (
//                                         <View style={styles.prepBox}>
//                                             <Ionicons name="time-outline" size={14} color={theme.info} />
//                                             <Text style={styles.prepText} numberOfLines={2}>{meal.prep}</Text>
//                                         </View>
//                                     )}

//                                     {/* Add to Plan button — modern style */}
//                                     <TouchableOpacity style={styles.selectBtn} activeOpacity={0.82} onPress={() => onSelectMeal(meal)}>
//                                         <View style={styles.selectBtnInner}>
//                                             <View style={styles.selectBtnIconWrap}>
//                                                 <Ionicons name="add" size={14} color="#FFFFFF" />
//                                             </View>
//                                             <Text style={styles.selectBtnText}>Add to Plan</Text>
//                                             <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.9)" />
//                                         </View>
//                                     </TouchableOpacity>
//                                 </View>
//                             ))
//                         )}
//                         <View style={{ height: 30 }} />
//                     </ScrollView>

//                     {/* Regenerate button */}
//                     {!loading && suggestions.length > 0 && (
//                         <View style={styles.modalFooter}>
//                             <TouchableOpacity style={styles.regenBtn} activeOpacity={0.82} onPress={fetchSuggestions}>
//                                 <View style={styles.regenBtnInner}>
//                                     <View style={styles.regenBtnIconWrap}>
//                                         <Ionicons name="refresh" size={14} color="#FFFFFF" />
//                                     </View>
//                                     <Text style={styles.regenBtnText}>Regenerate Suggestions</Text>
//                                 </View>
//                             </TouchableOpacity>
//                         </View>
//                     )}
//                 </View>
//             </View>
//         </Modal>
//     );
// }

// // ─── Templates Modal ──────────────────────────────────────────────────────────
// function TemplatesModal({ visible, onClose, theme, onSelectTemplate }) {
//     const styles = createStyles(theme);
//     return (
//         <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
//             <View style={styles.modalOverlay}>
//                 <View style={styles.modalContent}>
//                     <View style={styles.modalHeader}>
//                         <View style={styles.modalHeaderLeft}>
//                             <Text style={styles.modalTitle}>Meal Plan Templates</Text>
//                         </View>
//                         <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
//                             <Ionicons name="close" size={20} color={theme.textSecondary} />
//                         </TouchableOpacity>
//                     </View>
//                     <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
//                         {DIET_TEMPLATES.map((template) => (
//                             <TouchableOpacity key={template.id} style={styles.templateCard} activeOpacity={0.8} onPress={() => onSelectTemplate(template)}>
//                                 <View style={[styles.templateIcon, { backgroundColor: template.color + '20' }]}>
//                                     <Ionicons name={template.icon} size={24} color={template.color} />
//                                 </View>
//                                 <View style={styles.templateInfo}>
//                                     <Text style={styles.templateName}>{template.name}</Text>
//                                     <Text style={styles.templateDesc}>{template.desc}</Text>
//                                 </View>
//                                 <Ionicons name="chevron-forward" size={20} color={theme.border} />
//                             </TouchableOpacity>
//                         ))}
//                         <View style={{ height: 30 }} />
//                     </ScrollView>
//                 </View>
//             </View>
//         </Modal>
//     );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const createStyles = (theme) => StyleSheet.create({
//     container: { flex: 1, backgroundColor: theme.background },
//     scroll: { flex: 1 },

//     targetsCard: {
//         marginHorizontal: 20, marginTop: 20, backgroundColor: theme.surface,
//         borderRadius: 20, padding: 20,
//         shadowColor: theme.shadowColor, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
//     },
//     targetsTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 16 },
//     targetsRow: { flexDirection: 'row', justifyContent: 'space-between' },
//     targetItem: { alignItems: 'center', flex: 1 },
//     targetValue: { fontSize: 16, fontWeight: '800', color: theme.text, marginTop: 6 },
//     targetLabel: { fontSize: 11, color: theme.textTertiary, fontWeight: '600', marginTop: 2 },

//     daySelector: { marginTop: 20, marginBottom: 16 },
//     dayScrollContent: { paddingHorizontal: 20, gap: 10 },
//     dayBtn: {
//         paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16,
//         backgroundColor: theme.surface, borderWidth: 2, borderColor: 'transparent',
//         minWidth: 70, alignItems: 'center',
//     },
//     dayBtnActive: { backgroundColor: theme.primaryLight, borderColor: theme.primary },
//     dayText: { fontSize: 14, fontWeight: '700', color: theme.textSecondary },
//     dayTextActive: { color: theme.primary },
//     dayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.success, marginTop: 4 },

//     quickActions: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 12 },
//     quickActionBtn: {
//         flex: 1, backgroundColor: theme.surface, borderRadius: 16, padding: 14, alignItems: 'center',
//         shadowColor: theme.shadowColor, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
//     },
//     quickActionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
//     quickActionText: { fontSize: 12, fontWeight: '700', color: theme.text },

//     mealCard: {
//         marginHorizontal: 20, marginBottom: 16, backgroundColor: theme.surface,
//         borderRadius: 20, padding: 20,
//         shadowColor: theme.shadowColor, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
//     },
//     mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
//     mealHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
//     mealIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
//     mealTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
//     mealTime: { fontSize: 12, color: theme.textTertiary, marginTop: 2 },
//     addMealBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
//     removeMealBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: theme.errorLight, alignItems: 'center', justifyContent: 'center' },

//     mealName: { fontSize: 17, fontWeight: '800', color: theme.text, marginBottom: 12 },
//     ingredientsBox: {
//         flexDirection: 'row', alignItems: 'center', gap: 8,
//         backgroundColor: theme.background, padding: 10, borderRadius: 10, marginBottom: 12,
//     },
//     ingredientsText: { flex: 1, fontSize: 12, color: theme.textSecondary, lineHeight: 16 },

//     macrosRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
//     macroChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
//     macroChipLabel: { fontSize: 11, fontWeight: '800' },
//     macroChipValue: { fontSize: 12, fontWeight: '800' },

//     logBtn: {
//         borderRadius: 14, overflow: 'hidden', backgroundColor: theme.success,
//         shadowColor: theme.success, shadowOpacity: 0.4, shadowRadius: 12,
//         shadowOffset: { width: 0, height: 5 }, elevation: 5,
//     },
//     logBtnInner: {
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
//         gap: 8, paddingVertical: 13, paddingHorizontal: 20,
//         backgroundColor: 'rgba(0,0,0,0.15)',
//     },
//     logBtnIconWrap: { width: 22, height: 22, borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
//     logBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', flex: 1, textAlign: 'center' },

//     emptyMeal: { alignItems: 'center', paddingVertical: 20 },
//     emptyText: { fontSize: 14, color: theme.textTertiary, marginTop: 8, marginBottom: 12 },
//     aiSuggestBtn: {
//         flexDirection: 'row', alignItems: 'center', gap: 6,
//         backgroundColor: theme.primaryLight, paddingHorizontal: 16, paddingVertical: 10,
//         borderRadius: 12, borderWidth: 1.5, borderColor: theme.border,
//     },
//     aiSuggestText: { fontSize: 13, fontWeight: '700', color: theme.primary },

//     // ── Modal ──
//     modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
//     modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', paddingTop: 8 },
//     modalHeader: {
//         flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//         paddingHorizontal: 24, paddingVertical: 18,
//         borderBottomWidth: 1, borderBottomColor: theme.divider,
//     },
//     modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
//     modalMealIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
//     modalTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
//     modalSubtitle: { fontSize: 12, color: theme.textTertiary, marginTop: 2 },
//     modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
//     modalScroll: { paddingHorizontal: 20, paddingTop: 16 },

//     loadingContainer: { alignItems: 'center', paddingVertical: 60 },
//     loadingText: { fontSize: 15, color: theme.primary, fontWeight: '700', marginTop: 16 },
//     loadingSubText: { fontSize: 12, color: theme.textTertiary, marginTop: 4 },

//     suggestionCard: {
//         backgroundColor: theme.background, borderRadius: 18, padding: 16,
//         marginBottom: 16, borderWidth: 1.5, borderColor: theme.border,
//     },
//     suggestionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
//     suggestionName: { fontSize: 16, fontWeight: '800', color: theme.text, flex: 1, marginRight: 8 },
//     calorieBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
//     calorieBadgeText: { fontSize: 12, fontWeight: '700' },

//     suggestionMacros: { flexDirection: 'row', gap: 8, marginBottom: 12 },
//     suggestionMacroItem: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
//     suggestionMacroVal: { fontSize: 15, fontWeight: '800' },
//     suggestionMacroLbl: { fontSize: 10, fontWeight: '600', marginTop: 2 },

//     suggestionIngredients: {
//         flexDirection: 'row', alignItems: 'center', gap: 6,
//         backgroundColor: theme.surface, padding: 10, borderRadius: 10, marginBottom: 10,
//     },
//     suggestionIngredientsText: { flex: 1, fontSize: 12, color: theme.textSecondary, lineHeight: 16 },

//     prepBox: {
//         flexDirection: 'row', alignItems: 'flex-start', gap: 6,
//         backgroundColor: theme.infoLight, padding: 10, borderRadius: 10, marginBottom: 12,
//     },
//     prepText: { flex: 1, fontSize: 11, color: theme.info, lineHeight: 16 },

//     selectBtn: {
//         borderRadius: 14, overflow: 'hidden', backgroundColor: theme.primary,
//         shadowColor: theme.primary, shadowOpacity: 0.4, shadowRadius: 12,
//         shadowOffset: { width: 0, height: 5 }, elevation: 5,
//     },
//     selectBtnInner: {
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
//         gap: 8, paddingVertical: 13, paddingHorizontal: 20,
//         backgroundColor: 'rgba(0,0,0,0.15)',
//     },
//     selectBtnIconWrap: { width: 22, height: 22, borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
//     selectBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', flex: 1, textAlign: 'center' },

//     modalFooter: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: theme.divider },
//     regenBtn: {
//         borderRadius: 14, overflow: 'hidden', backgroundColor: theme.surfaceAlt,
//         borderWidth: 1.5, borderColor: theme.border,
//     },
//     regenBtnInner: {
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
//         gap: 8, paddingVertical: 13, paddingHorizontal: 20,
//     },
//     regenBtnIconWrap: { width: 22, height: 22, borderRadius: 7, backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' },
//     regenBtnText: { fontSize: 14, fontWeight: '700', color: theme.textSecondary },

//     templateCard: {
//         flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background,
//         borderRadius: 16, padding: 16, marginBottom: 12,
//         borderWidth: 1, borderColor: theme.border,
//     },
//     templateIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
//     templateInfo: { flex: 1 },
//     templateName: { fontSize: 16, fontWeight: '800', color: theme.text, marginBottom: 4 },
//     templateDesc: { fontSize: 13, color: theme.textSecondary },
// });