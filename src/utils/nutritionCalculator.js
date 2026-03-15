// Precise nutrition calculations based on user data

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
export const calculateBMR = (weight, height, age, gender) => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);

    if (gender === 'male') {
        return (10 * w) + (6.25 * h) - (5 * a) + 5;
    } else {
        return (10 * w) + (6.25 * h) - (5 * a) - 161;
    }
};

// Activity multipliers
export const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,        // Little or no exercise
    light: 1.375,          // Exercise 1-3 days/week
    moderate: 1.55,        // Exercise 3-5 days/week
    active: 1.725,         // Exercise 6-7 days/week
    veryActive: 1.9        // Very intense exercise daily
};

// Calculate TDEE (Total Daily Energy Expenditure)
export const calculateTDEE = (bmr, activityLevel) => {
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
    return bmr * multiplier;
};

// Calculate calorie goal based on fitness goal
export const calculateCalorieGoal = (tdee, goal) => {
    switch (goal) {
        case 'Weight Loss':
            return Math.round(tdee - 500); // 500 cal deficit = ~0.5kg/week loss
        case 'Extreme Weight Loss':
            return Math.round(tdee - 750); // 750 cal deficit = ~0.75kg/week loss
        case 'Muscle Gain':
            return Math.round(tdee + 300); // 300 cal surplus for lean gains
        case 'Maintain Weight':
        default:
            return Math.round(tdee);
    }
};

// Calculate optimal macros based on goal and body weight
export const calculateMacros = (calorieGoal, weight, goal) => {
    const w = parseFloat(weight);
    let proteinGrams, fatGrams, carbGrams;

    switch (goal) {
        case 'Weight Loss':
        case 'Extreme Weight Loss':
            // High protein to preserve muscle, moderate fat, lower carbs
            proteinGrams = Math.round(w * 2.2);  // 2.2g per kg (aggressive)
            fatGrams = Math.round((calorieGoal * 0.25) / 9); // 25% of calories
            const remainingCalories = calorieGoal - (proteinGrams * 4) - (fatGrams * 9);
            carbGrams = Math.round(remainingCalories / 4);
            break;

        case 'Muscle Gain':
            // High protein for muscle building, high carbs for energy, moderate fat
            proteinGrams = Math.round(w * 2.0);  // 2g per kg
            fatGrams = Math.round((calorieGoal * 0.25) / 9); // 25% of calories
            const remainingCalsGain = calorieGoal - (proteinGrams * 4) - (fatGrams * 9);
            carbGrams = Math.round(remainingCalsGain / 4);
            break;

        case 'Maintain Weight':
        default:
            // Balanced macros
            proteinGrams = Math.round(w * 1.8);  // 1.8g per kg
            fatGrams = Math.round((calorieGoal * 0.28) / 9); // 28% of calories
            const remainingCalsMaint = calorieGoal - (proteinGrams * 4) - (fatGrams * 9);
            carbGrams = Math.round(remainingCalsMaint / 4);
            break;
    }

    // Ensure values are positive
    proteinGrams = Math.max(proteinGrams, 50);
    fatGrams = Math.max(fatGrams, 30);
    carbGrams = Math.max(carbGrams, 50);

    return {
        protein: proteinGrams,
        carbs: carbGrams,
        fat: fatGrams,
        // Calculate percentages for display
        proteinPercent: Math.round((proteinGrams * 4 / calorieGoal) * 100),
        carbsPercent: Math.round((carbGrams * 4 / calorieGoal) * 100),
        fatPercent: Math.round((fatGrams * 9 / calorieGoal) * 100)
    };
};

// Get macro recommendations with explanations
export const getMacroRecommendations = (goal) => {
    const recommendations = {
        'Weight Loss': {
            focus: 'High Protein, Lower Carbs',
            proteinRange: '2.0-2.5g per kg',
            reason: 'Preserves muscle mass during calorie deficit',
            tips: [
                'Prioritize lean proteins',
                'Time carbs around workouts',
                'Include healthy fats for satiety'
            ]
        },
        'Extreme Weight Loss': {
            focus: 'Very High Protein, Controlled Carbs',
            proteinRange: '2.2-2.7g per kg',
            reason: 'Maximum muscle preservation in aggressive deficit',
            tips: [
                'Eat protein at every meal',
                'Focus on fibrous vegetables',
                'Keep fats moderate for hormone health'
            ]
        },
        'Muscle Gain': {
            focus: 'High Protein, High Carbs',
            proteinRange: '1.8-2.2g per kg',
            reason: 'Supports muscle growth and recovery',
            tips: [
                'Eat in slight calorie surplus',
                'Consume carbs pre and post workout',
                'Don\'t fear healthy fats'
            ]
        },
        'Maintain Weight': {
            focus: 'Balanced Macros',
            proteinRange: '1.6-2.0g per kg',
            reason: 'Maintains muscle and energy balance',
            tips: [
                'Focus on whole foods',
                'Adjust based on activity',
                'Listen to your body'
            ]
        }
    };

    return recommendations[goal] || recommendations['Maintain Weight'];
};

// Calculate recommended water intake (ml)
export const calculateWaterIntake = (weight, activityLevel) => {
    const w = parseFloat(weight);
    let baseWater = w * 35; // 35ml per kg body weight

    // Add more for active people
    if (activityLevel === 'active' || activityLevel === 'veryActive') {
        baseWater += 500;
    }

    return Math.round(baseWater);
};

// Calculate ideal weight range based on height and gender
export const calculateIdealWeightRange = (height, gender) => {
    const h = parseFloat(height) / 100; // convert to meters

    // Using BMI range of 18.5-24.9 for healthy weight
    const minWeight = Math.round(18.5 * h * h);
    const maxWeight = Math.round(24.9 * h * h);

    return { min: minWeight, max: maxWeight };
};