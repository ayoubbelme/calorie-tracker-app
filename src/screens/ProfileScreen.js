import React, { useState } from 'react';
import { Image } from 'react-native';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCalories } from '../components/CaloriesContext';
import { useProfile } from '../components/ProfileContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../components/ThemeContext';

const GOALS = ['Weight Loss', 'Extreme Weight Loss', 'Maintain Weight', 'Muscle Gain'];
const ACTIVITY = ['sedentary', 'light', 'moderate', 'active', 'veryActive'];
const ACTIVITY_LABELS = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  veryActive: 'Very Active'
};
const GENDERS = ['male', 'female'];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { history } = useCalories();
  const {
    name,
    age,
    weight,
    height,
    goal,
    activity,
    gender,
    calorieGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
    bmr,
    tdee,
    updateProfile
  } = useProfile();

  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempAge, setTempAge] = useState(age);
  const [tempWeight, setTempWeight] = useState(weight);
  const [tempHeight, setTempHeight] = useState(height);
  const [tempGoal, setTempGoal] = useState(goal);
  const [tempActivity, setTempActivity] = useState(activity);
  const [tempGender, setTempGender] = useState(gender);

  // Stats from history
  const historyKeys = Object.keys(history);
  const totalDays = historyKeys.length;
  const allCalories = historyKeys.map(k => history[k].calories || 0);
  const avgCalories = totalDays
    ? Math.round(allCalories.reduce((a, b) => a + b, 0) / totalDays)
    : 0;

  // BMI
  const currentBmi = weight && height
    ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)
    : '--';
  const bmiCategory =
    currentBmi < 18.5 ? 'Underweight' :
      currentBmi < 25 ? 'Normal' :
        currentBmi < 30 ? 'Overweight' : 'Obese';
  const bmiColor =
    currentBmi < 18.5 ? theme.info :
      currentBmi < 25 ? theme.success :
        currentBmi < 30 ? theme.warning : theme.error;

  const handleEdit = () => {
    setTempName(name);
    setTempAge(age);
    setTempWeight(weight);
    setTempHeight(height);
    setTempGoal(goal);
    setTempActivity(activity);
    setTempGender(gender);
    setEditing(true);
  };

  const handleSave = () => {
    if (!tempName || !tempAge || !tempWeight || !tempHeight) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    // Check what changed
    const hasRelevantChanges =
      tempWeight !== weight ||
      tempHeight !== height ||
      tempAge !== age ||
      tempGender !== gender ||
      tempActivity !== activity ||
      tempGoal !== goal;

    updateProfile({
      name: tempName,
      age: tempAge,
      weight: tempWeight,
      height: tempHeight,
      goal: tempGoal,
      activity: tempActivity,
      gender: tempGender,
    });

    setEditing(false);

    if (hasRelevantChanges) {
      Alert.alert(
        '✅ Profile Updated',
        'Your profile has been updated!\n\n✨ Your calorie goal and macros have been automatically recalculated based on your new information.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('✅ Saved', 'Your profile has been updated.');
    }
  };

  const StatBox = ({ icon, label, value, color }) => (
    <View style={styles.statBox}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* ── Hero Card ── */}
      <View style={styles.heroCard}>
        <View style={styles.heroBg} />
        <View style={styles.heroContent}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Image
                source={require('../../assets/logo1.png')}
                style={styles.avatarLogo}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.heroName}>{name || 'User'}</Text>
          <View style={styles.heroBadge}>
            <Ionicons name="fitness-outline" size={12} color={theme.success} />
            <Text style={styles.heroBadgeText}>{goal || 'Maintain Weight'}</Text>
          </View>

          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>{weight || '--'}<Text style={styles.heroMetricUnit}>kg</Text></Text>
              <Text style={styles.heroMetricLabel}>Weight</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>{height || '--'}<Text style={styles.heroMetricUnit}>cm</Text></Text>
              <Text style={styles.heroMetricLabel}>Height</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetric}>
              <Text style={[styles.heroMetricValue, { color: bmiColor }]}>{currentBmi}</Text>
              <Text style={styles.heroMetricLabel}>BMI</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => editing ? handleSave() : handleEdit()}
        >
          <Ionicons name={editing ? 'checkmark' : 'pencil'} size={16} color="#fff" />
          <Text style={styles.editBtnText}>{editing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Current Goals Card (Always Visible) ── */}
      <View style={styles.goalsCard}>
        <View style={styles.goalsHeader}>
          <Text style={styles.goalsTitle}>Current Daily Goals</Text>
          {editing && (
            <View style={styles.autoCalcChip}>
              <Ionicons name="sparkles" size={12} color={theme.primary} />
              <Text style={styles.autoCalcChipText}>Auto</Text>
            </View>
          )}
        </View>

        <View style={styles.goalsGrid}>
          <View style={styles.goalItem}>
            <Ionicons name="flame" size={20} color={theme.calories} />
            <Text style={styles.goalValue}>{calorieGoal || '2000'}</Text>
            <Text style={styles.goalLabel}>Calories</Text>
          </View>
          <View style={styles.goalItem}>
            <Ionicons name="fitness" size={20} color={theme.protein} />
            <Text style={styles.goalValue}>{proteinGoal || '150'}g</Text>
            <Text style={styles.goalLabel}>Protein</Text>
          </View>
          <View style={styles.goalItem}>
            <Ionicons name="nutrition" size={20} color={theme.carbs} />
            <Text style={styles.goalValue}>{carbsGoal || '200'}g</Text>
            <Text style={styles.goalLabel}>Carbs</Text>
          </View>
          <View style={styles.goalItem}>
            <Ionicons name="water" size={20} color={theme.fat} />
            <Text style={styles.goalValue}>{fatGoal || '67'}g</Text>
            <Text style={styles.goalLabel}>Fat</Text>
          </View>
        </View>

        {bmr && tdee && bmr !== '0' && tdee !== '0' && (
          <View style={styles.metabolismBox}>
            <View style={styles.metabolismRow}>
              <Text style={styles.metabolismLabel}>BMR (Basal):</Text>
              <Text style={styles.metabolismValue}>{bmr} kcal/day</Text>
            </View>
            <View style={styles.metabolismRow}>
              <Text style={styles.metabolismLabel}>TDEE (Active):</Text>
              <Text style={styles.metabolismValue}>{tdee} kcal/day</Text>
            </View>
          </View>
        )}

        {editing && (
          <View style={styles.editWarning}>
            <Ionicons name="information-circle" size={16} color={theme.primary} />
            <Text style={styles.editWarningText}>
              Goals will be recalculated when you save
            </Text>
          </View>
        )}
      </View>

      {/* ── BMI Card ── */}
      <View style={styles.bmiCard}>
        <View style={styles.bmiLeft}>
          <Text style={styles.bmiTitle}>BMI Score</Text>
          <Text style={[styles.bmiValue, { color: bmiColor }]}>{currentBmi}</Text>
          <View style={[styles.bmiChip, { backgroundColor: bmiColor + '20' }]}>
            <Text style={[styles.bmiChipText, { color: bmiColor }]}>{bmiCategory}</Text>
          </View>
        </View>
        <View style={styles.bmiRight}>
          {[
            { label: 'Underweight', range: '< 18.5', color: theme.info },
            { label: 'Normal', range: '18.5–24.9', color: theme.success },
            { label: 'Overweight', range: '25–29.9', color: theme.warning },
            { label: 'Obese', range: '≥ 30', color: theme.error },
          ].map((row, i) => (
            <View key={i} style={styles.bmiRow}>
              <View style={[styles.bmiDot, { backgroundColor: row.color }]} />
              <Text style={styles.bmiRangeLabel}>{row.label}</Text>
              <Text style={styles.bmiRange}>{row.range}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Edit Form ── */}
      {editing && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✏️ Edit Profile</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={tempName}
            onChangeText={setTempName}
            placeholder="Your name"
            placeholderTextColor={theme.textTertiary}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={tempAge}
                onChangeText={setTempAge}
                keyboardType="numeric"
                placeholder="Age"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {GENDERS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, tempGender === g && styles.genderBtnActive]}
                    onPress={() => setTempGender(g)}
                  >
                    <Ionicons
                      name={g === 'male' ? 'male' : 'female'}
                      size={16}
                      color={tempGender === g ? '#fff' : theme.textSecondary}
                    />
                    <Text style={[styles.genderText, tempGender === g && styles.genderTextActive]}>
                      {g === 'male' ? 'Male' : 'Female'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={tempWeight}
                onChangeText={setTempWeight}
                keyboardType="numeric"
                placeholder="Weight"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={tempHeight}
                onChangeText={setTempHeight}
                keyboardType="numeric"
                placeholder="Height"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
          </View>

          <Text style={styles.label}>Fitness Goal</Text>
          <Text style={styles.sublabel}>Affects your daily calorie target</Text>
          <View style={styles.chipRow}>
            {GOALS.map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, tempGoal === g && styles.chipActive]}
                onPress={() => setTempGoal(g)}
              >
                <Text style={[styles.chipText, tempGoal === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Activity Level</Text>
          <Text style={styles.sublabel}>How active are you?</Text>
          <View style={styles.chipRow}>
            {ACTIVITY.map(a => (
              <TouchableOpacity
                key={a}
                style={[styles.chip, tempActivity === a && styles.chipActive]}
                onPress={() => setTempActivity(a)}
              >
                <Text style={[styles.chipText, tempActivity === a && styles.chipTextActive]}>
                  {ACTIVITY_LABELS[a]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.recalcBanner}>
            <Ionicons name="calculator" size={18} color={theme.primary} />
            <Text style={styles.recalcBannerText}>
              Calorie goal and macros will be automatically recalculated when you save
            </Text>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Info Card (non-editing) ── */}
      {!editing && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Profile Details</Text>
          {[
            { icon: 'person-outline', label: 'Gender', value: gender === 'male' ? 'Male' : 'Female' },
            { icon: 'calendar-outline', label: 'Age', value: `${age} years` },
            { icon: 'walk-outline', label: 'Activity Level', value: ACTIVITY_LABELS[activity] || activity },
            { icon: 'trophy-outline', label: 'Fitness Goal', value: goal },
          ].map((row, i) => (
            <View key={i} style={[styles.detailRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.divider }]}>
              <View style={styles.detailIconBox}>
                <Ionicons name={row.icon} size={18} color={theme.primary} />
              </View>
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={styles.detailValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      )}

    </ScrollView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  avatarLogo: { width: 160, height: 160 },
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { paddingBottom: 60 },

  // Hero Card
  heroCard: {
    margin: 20,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: theme.primary,
    shadowColor: theme.shadowColor,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: theme.primaryDark,
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: theme.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.success + '30',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.success,
  },
  heroMetrics: {
    flexDirection: 'row',
    backgroundColor: theme.primaryDark,
    borderRadius: 18,
    padding: 16,
    width: '100%',
    justifyContent: 'space-around'
  },
  heroMetric: { alignItems: 'center' },
  heroMetricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  heroMetricUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  heroMetricLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  heroMetricDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  editBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.success,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // Goals Card
  goalsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: theme.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  autoCalcChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.primary + '40',
  },
  autoCalcChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.primary,
  },
  goalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalItem: { alignItems: 'center', flex: 1 },
  goalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginTop: 6,
  },
  goalLabel: {
    fontSize: 11,
    color: theme.textTertiary,
    fontWeight: '600',
    marginTop: 2,
  },

  metabolismBox: {
    backgroundColor: theme.successLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.success + '40',
  },
  metabolismRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metabolismLabel: {
    fontSize: 12,
    color: theme.success,
    fontWeight: '600',
  },
  metabolismValue: {
    fontSize: 12,
    color: theme.success,
    fontWeight: '800',
  },

  editWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.primaryLight,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.primary + '40',
  },
  editWarningText: {
    flex: 1,
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
  },

  // BMI Card
  bmiCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    shadowColor: theme.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  bmiLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  bmiTitle: {
    fontSize: 11,
    color: theme.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bmiValue: {
    fontSize: 42,
    fontWeight: '900',
    marginVertical: 4,
  },
  bmiChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bmiChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bmiRight: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  bmiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bmiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bmiRangeLabel: {
    flex: 1,
    fontSize: 12,
    color: theme.text,
    fontWeight: '600',
  },
  bmiRange: {
    fontSize: 11,
    color: theme.textTertiary,
  },

  // Card
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: theme.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },

  // Form
  row: { flexDirection: 'row' },
  label: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  sublabel: {
    fontSize: 11,
    color: theme.textTertiary,
    marginBottom: 8,
    marginTop: -4,
  },
  input: {
    backgroundColor: theme.background,
    borderRadius: 14,
    padding: 13,
    fontSize: 15,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },

  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: theme.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.border,
    paddingVertical: 10,
  },
  genderBtnActive: {
    backgroundColor: theme.info,
    borderColor: theme.info,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  genderTextActive: {
    color: '#fff',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  chipActive: {
    backgroundColor: theme.successLight,
    borderColor: theme.success,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  chipTextActive: {
    color: theme.success,
  },

  recalcBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.primaryLight,
    padding: 14,
    borderRadius: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.primary + '40',
  },
  recalcBannerText: {
    flex: 1,
    fontSize: 13,
    color: theme.primary,
    fontWeight: '600',
    lineHeight: 18,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.success,
    padding: 16,
    borderRadius: 16,
    marginTop: 20
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 16,
    shadowColor: theme.shadowColor,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  settingSubtext: {
    fontSize: 12,
    color: theme.textTertiary,
    marginTop: 2,
  },
});