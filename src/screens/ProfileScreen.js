import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCalories } from '../components/CaloriesContext';
import { useProfile } from '../components/ProfileContext';

const GOALS = ['Lose Weight', 'Maintain', 'Gain Muscle'];
const ACTIVITY = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'];
const GENDERS = ['Male', 'Female'];

export default function ProfileScreen() {
  const { history } = useCalories();
  const { name, age, weight, height, goal, activity, gender, calorieGoal, updateProfile } = useProfile();

  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempAge, setTempAge] = useState(age);
  const [tempWeight, setTempWeight] = useState(weight);
  const [tempHeight, setTempHeight] = useState(height);
  const [tempGoal, setTempGoal] = useState(goal);
  const [tempActivity, setTempActivity] = useState(activity);
  const [tempGender, setTempGender] = useState(gender);
  const [tempCalorieGoal, setTempCalorieGoal] = useState(calorieGoal);

  // Stats from history
  const historyKeys = Object.keys(history);
  const totalDays = historyKeys.length;
  const allCalories = historyKeys.map(k => history[k].calories || 0);
  const avgCalories = totalDays
    ? Math.round(allCalories.reduce((a, b) => a + b, 0) / totalDays)
    : 0;
  const totalProtein = historyKeys.reduce((sum, k) => sum + (history[k].protein || 0), 0);

  // BMI
  const bmi = weight && height
    ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)
    : '--';
  const bmiCategory =
    bmi < 18.5 ? 'Underweight' :
      bmi < 25 ? 'Normal' :
        bmi < 30 ? 'Overweight' : 'Obese';
  const bmiColor =
    bmi < 18.5 ? '#3B82F6' :
      bmi < 25 ? '#22C55E' :
        bmi < 30 ? '#F59E0B' : '#EF4444';

  const handleEdit = () => {
    setTempName(name);
    setTempAge(age);
    setTempWeight(weight);
    setTempHeight(height);
    setTempGoal(goal);
    setTempActivity(activity);
    setTempGender(gender);
    setTempCalorieGoal(calorieGoal);
    setEditing(true);
  };

  const handleSave = () => {
    updateProfile({
      name: tempName,
      age: tempAge,
      weight: tempWeight,
      height: tempHeight,
      goal: tempGoal,
      activity: tempActivity,
      gender: tempGender,
      calorieGoal: tempCalorieGoal,
    });
    setEditing(false);
    Alert.alert('✅ Saved', 'Your profile has been updated.');
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* ── Hero Card ── */}
      <View style={styles.heroCard}>
        <View style={styles.heroBg} />
        <View style={styles.heroContent}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>💪</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{name}</Text>
          <View style={styles.heroBadge}>
            <Ionicons name="fitness-outline" size={12} color="#22C55E" />
            <Text style={styles.heroBadgeText}>{goal}</Text>
          </View>

          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>{weight}<Text style={styles.heroMetricUnit}>kg</Text></Text>
              <Text style={styles.heroMetricLabel}>Weight</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>{height}<Text style={styles.heroMetricUnit}>cm</Text></Text>
              <Text style={styles.heroMetricLabel}>Height</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetric}>
              <Text style={[styles.heroMetricValue, { color: bmiColor }]}>{bmi}</Text>
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

     

      {/* ── BMI Card ── */}
      <View style={styles.bmiCard}>
        <View style={styles.bmiLeft}>
          <Text style={styles.bmiTitle}>BMI Score</Text>
          <Text style={[styles.bmiValue, { color: bmiColor }]}>{bmi}</Text>
          <View style={[styles.bmiChip, { backgroundColor: bmiColor + '20' }]}>
            <Text style={[styles.bmiChipText, { color: bmiColor }]}>{bmiCategory}</Text>
          </View>
        </View>
        <View style={styles.bmiRight}>
          {[
            { label: 'Underweight', range: '< 18.5', color: '#3B82F6' },
            { label: 'Normal', range: '18.5–24.9', color: '#22C55E' },
            { label: 'Overweight', range: '25–29.9', color: '#F59E0B' },
            { label: 'Obese', range: '≥ 30', color: '#EF4444' },
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
          <TextInput style={styles.input} value={tempName} onChangeText={setTempName} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Age</Text>
              <TextInput style={styles.input} value={tempAge} onChangeText={setTempAge} keyboardType="numeric" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Calorie Goal</Text>
              <TextInput style={styles.input} value={tempCalorieGoal} onChangeText={setTempCalorieGoal} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput style={styles.input} value={tempWeight} onChangeText={setTempWeight} keyboardType="numeric" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput style={styles.input} value={tempHeight} onChangeText={setTempHeight} keyboardType="numeric" />
            </View>
          </View>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipRow}>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, tempGender === g && styles.chipActive]}
                onPress={() => setTempGender(g)}
              >
                <Text style={[styles.chipText, tempGender === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Goal</Text>
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
          <View style={styles.chipRow}>
            {ACTIVITY.map(a => (
              <TouchableOpacity
                key={a}
                style={[styles.chip, tempActivity === a && styles.chipActive]}
                onPress={() => setTempActivity(a)}
              >
                <Text style={[styles.chipText, tempActivity === a && styles.chipTextActive]}>{a}</Text>
              </TouchableOpacity>
            ))}
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
          <Text style={styles.cardTitle}>📋 Details</Text>
          {[
            { icon: 'person-outline', label: 'Gender', value: gender },
            { icon: 'calendar-outline', label: 'Age', value: `${age} years` },
            { icon: 'flame-outline', label: 'Calorie Goal', value: `${calorieGoal} kcal` },
            { icon: 'walk-outline', label: 'Activity Level', value: activity },
            { icon: 'trophy-outline', label: 'Goal', value: goal },
          ].map((row, i) => (
            <View key={i} style={[styles.detailRow, i > 0 && { borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}>
              <View style={styles.detailIconBox}>
                <Ionicons name={row.icon} size={18} color="#22C55E" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { paddingBottom: 60 },
  heroCard: { margin: 20, borderRadius: 28, overflow: 'hidden', backgroundColor: '#111827', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, backgroundColor: '#1F2937' },
  heroContent: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20 },
  avatarRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 36 },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#22C55E20', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 20 },
  heroBadgeText: { fontSize: 12, fontWeight: '600', color: '#22C55E' },
  heroMetrics: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 18, padding: 16, width: '100%', justifyContent: 'space-around' },
  heroMetric: { alignItems: 'center' },
  heroMetricValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroMetricUnit: { fontSize: 12, fontWeight: '400', color: '#9CA3AF' },
  heroMetricLabel: { fontSize: 11, color: '#6B7280', marginTop: 3 },
  heroMetricDivider: { width: 1, backgroundColor: '#374151' },
  editBtn: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#22C55E', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginHorizontal: 20, marginBottom: 12 },
  bmiCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#fff', borderRadius: 24, padding: 20, flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  bmiLeft: { alignItems: 'center', justifyContent: 'center', marginRight: 20 },
  bmiTitle: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  bmiValue: { fontSize: 42, fontWeight: '900', marginVertical: 4 },
  bmiChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  bmiChipText: { fontSize: 12, fontWeight: '700' },
  bmiRight: { flex: 1, justifyContent: 'center', gap: 8 },
  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bmiDot: { width: 8, height: 8, borderRadius: 4 },
  bmiRangeLabel: { flex: 1, fontSize: 12, color: '#374151', fontWeight: '600' },
  bmiRange: { fontSize: 11, color: '#9CA3AF' },
  card: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  detailIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { flex: 1, fontSize: 14, color: '#6B7280', fontWeight: '500' },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  row: { flexDirection: 'row' },
  label: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 13, fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#F3F4F6' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: 'transparent' },
  chipActive: { backgroundColor: '#F0FDF4', borderColor: '#22C55E' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#22C55E' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#22C55E', padding: 16, borderRadius: 16, marginTop: 20 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});