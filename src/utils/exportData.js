import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const isWeb = Platform.OS === 'web';

// ─── Web export (download file) ───────────────────────────────────────────────
const exportOnWeb = (content, filename, mimeType) => {
    try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return { success: true };
    } catch (error) {
        console.error('Web export error:', error);
        return { success: false, error };
    }
};

// ─── Native CSV export ────────────────────────────────────────────────────────
const exportCSVOnNative = async (content, filename) => {
    try {
        const fileUri = FileSystem.cacheDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, content, {
            encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export CSV',
            UTI: 'public.comma-separated-values-text',
        });
        return { success: true };
    } catch (error) {
        if (error.message?.includes('cancelled')) return { success: true };
        console.error('Native CSV export error:', error);
        return { success: false, error };
    }
};

// ─── Native PDF export ────────────────────────────────────────────────────────
const exportPDFOnNative = async (html) => {
    try {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Export PDF Report',
            UTI: 'com.adobe.pdf',
        });
        return { success: true };
    } catch (error) {
        if (error.message?.includes('cancelled')) return { success: true };
        console.error('Native PDF export error:', error);
        return { success: false, error };
    }
};

// ─── SVG Chart Helpers ────────────────────────────────────────────────────────
const W = 700, H = 260;
const PAD = { top: 20, right: 30, bottom: 50, left: 55 };
const IW = W - PAD.left - PAD.right; // inner width
const IH = H - PAD.top - PAD.bottom; // inner height

const lerp = (val, inMin, inMax, outMin, outMax) =>
    outMin + ((val - inMin) / ((inMax - inMin) || 1)) * (outMax - outMin);

const svgWrap = (inner, title, gradColor) => `
<svg width="${W}" height="${H + 30}" viewBox="0 0 ${W} ${H + 30}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad_${gradColor}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${gradColor}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${gradColor}" stop-opacity="0.02"/>
    </linearGradient>
  </defs>
  <text x="${W / 2}" y="20" text-anchor="middle" font-family="Arial" font-size="14"
        font-weight="bold" fill="#444">${title}</text>
  <g transform="translate(${PAD.left},${PAD.top + 14})">${inner}</g>
</svg>`;

// Y-axis grid + labels
const yGrid = (minV, maxV, steps = 5) => {
    let out = '';
    for (let i = 0; i <= steps; i++) {
        const v = minV + (i / steps) * (maxV - minV);
        const y = lerp(v, minV, maxV, IH, 0);
        out += `<line x1="0" y1="${y.toFixed(1)}" x2="${IW}" y2="${y.toFixed(1)}"
                      stroke="#ebebeb" stroke-width="1"/>`;
        out += `<text x="-6" y="${(y + 4).toFixed(1)}" text-anchor="end"
                      font-family="Arial" font-size="10" fill="#aaa">${Number(v.toFixed(1))}</text>`;
    }
    return out;
};

// Axes
const axes = (xLabel, yLabel) => `
  <line x1="0" y1="0" x2="0" y2="${IH}" stroke="#ccc" stroke-width="1"/>
  <line x1="0" y1="${IH}" x2="${IW}" y2="${IH}" stroke="#ccc" stroke-width="1"/>
  <text x="${IW / 2}" y="${IH + 36}" text-anchor="middle"
        font-family="Arial" font-size="11" fill="#bbb">${xLabel}</text>
  <text x="-40" y="${IH / 2}" text-anchor="middle" font-family="Arial" font-size="11"
        fill="#bbb" transform="rotate(-90,-40,${IH / 2})">${yLabel}</text>`;

// X-axis date labels (up to maxLabels evenly spaced)
const xDateLabels = (arr, maxLabels = 7) => {
    let out = '';
    const step = Math.max(1, Math.floor(arr.length / maxLabels));
    for (let i = 0; i < arr.length; i += step) {
        const x = lerp(i, 0, arr.length - 1, 0, IW);
        out += `<text x="${x.toFixed(1)}" y="${IH + 16}" text-anchor="middle"
                      font-family="Arial" font-size="9" fill="#bbb">${arr[i].slice(5)}</text>`;
    }
    return out;
};

// ─── Chart 1: Calories over time ─────────────────────────────────────────────
const buildCaloriesChart = (dates, history) => {
    if (dates.length < 2) return '';
    const vals = dates.map(d => history[d].calories || 0);
    const maxV = Math.max(...vals, 500);
    const pts = dates.map((d, i) => {
        const x = lerp(i, 0, dates.length - 1, 0, IW);
        const y = lerp(vals[i], 0, maxV, IH, 0);
        return [x.toFixed(1), y.toFixed(1)];
    });
    const linePts = pts.map(p => p.join(',')).join(' L');
    const areaPts = `M0,${IH} L${pts.map(p => p.join(',')).join(' L')} L${IW},${IH} Z`;

    const inner = `
      ${yGrid(0, maxV)}
      <path d="${areaPts}" fill="url(#grad_FF6B6B)"/>
      <polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none"
                stroke="#FF6B6B" stroke-width="2.5" stroke-linejoin="round"/>
      ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="#FF6B6B"/>`).join('')}
      ${xDateLabels(dates)}
      ${axes('Date', 'kcal')}`;
    return svgWrap(inner, 'Calories Over Time', 'FF6B6B');
};

// ─── Chart 2: Weight over time ───────────────────────────────────────────────
const buildWeightChart = (dates, history) => {
    const wd = dates.filter(d => history[d].weight);
    if (wd.length < 2) return '<p style="color:#bbb;text-align:center;padding:30px 0">Not enough weight entries</p>';
    const vals = wd.map(d => parseFloat(history[d].weight));
    const minV = Math.min(...vals) - 0.5;
    const maxV = Math.max(...vals) + 0.5;
    const pts = wd.map((d, i) => {
        const x = lerp(i, 0, wd.length - 1, 0, IW);
        const y = lerp(vals[i], minV, maxV, IH, 0);
        return [x.toFixed(1), y.toFixed(1)];
    });
    const areaPts = `M0,${IH} L${pts.map(p => p.join(',')).join(' L')} L${IW},${IH} Z`;

    const inner = `
      ${yGrid(minV, maxV)}
      <path d="${areaPts}" fill="url(#grad_4ECDC4)"/>
      <polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none"
                stroke="#4ECDC4" stroke-width="2.5" stroke-linejoin="round"/>
      ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="#4ECDC4"/>`).join('')}
      ${xDateLabels(wd)}
      ${axes('Date', 'kg')}`;
    return svgWrap(inner, 'Weight Over Time', '4ECDC4');
};

// ─── Chart 3: Macros pie chart ───────────────────────────────────────────────
const buildMacroPie = (dates, history) => {
    const tot = dates.reduce((a, d) => {
        a.protein += history[d].protein || 0;
        a.carbs   += history[d].carbs   || 0;
        a.fat     += history[d].fat     || 0;
        return a;
    }, { protein: 0, carbs: 0, fat: 0 });

    const total = (tot.protein + tot.carbs + tot.fat) || 1;
    const slices = [
        { label: 'Protein', value: tot.protein, color: '#FF6B6B' },
        { label: 'Carbs',   value: tot.carbs,   color: '#FFD93D' },
        { label: 'Fat',     value: tot.fat,      color: '#6BCB77' },
    ];

    const CX = 130, CY = 115, R = 95;
    let startA = -Math.PI / 2;
    let paths = '', legend = '';

    slices.forEach((s, i) => {
        const pct = s.value / total;
        const angle = pct * 2 * Math.PI;
        const endA = startA + angle;
        const x1 = CX + R * Math.cos(startA);
        const y1 = CY + R * Math.sin(startA);
        const x2 = CX + R * Math.cos(endA);
        const y2 = CY + R * Math.sin(endA);
        const large = angle > Math.PI ? 1 : 0;

        if (pct > 0.005) {
            paths += `<path d="M${CX},${CY} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z"
                           fill="${s.color}" opacity="0.88"/>`;
            if (pct > 0.06) {
                const mx = CX + R * 0.62 * Math.cos(startA + angle / 2);
                const my = CY + R * 0.62 * Math.sin(startA + angle / 2);
                paths += `<text x="${mx.toFixed(1)}" y="${(my + 4).toFixed(1)}" text-anchor="middle"
                               font-family="Arial" font-size="12" font-weight="bold" fill="white">
                               ${(pct * 100).toFixed(0)}%</text>`;
            }
        }
        startA = endA;

        const ly = 50 + i * 42;
        legend += `<rect x="280" y="${ly}" width="13" height="13" rx="3" fill="${s.color}"/>`;
        legend += `<text x="300" y="${ly + 11}" font-family="Arial" font-size="13" fill="#444">${s.label}</text>`;
        legend += `<text x="300" y="${ly + 26}" font-family="Arial" font-size="11" fill="#aaa">${s.value.toFixed(0)}g · ${(pct * 100).toFixed(1)}%</text>`;
    });

    return `
<svg width="${W}" height="260" viewBox="0 0 ${W} 260" xmlns="http://www.w3.org/2000/svg">
  <text x="${W / 2}" y="20" text-anchor="middle" font-family="Arial" font-size="14"
        font-weight="bold" fill="#444">Macros Breakdown</text>
  ${paths}${legend}
</svg>`;
};

// ─── Chart 4: Calories vs Goal bar chart ─────────────────────────────────────
const buildCalVsGoalChart = (dates, history, calorieGoal) => {
    const recent = dates.slice(-14);
    if (recent.length === 0) return '';
    const vals = recent.map(d => history[d].calories || 0);
    const maxV = Math.max(...vals, calorieGoal) * 1.12;
    const bw = Math.max(8, Math.floor(IW / recent.length) - 5);

    let bars = '';
    recent.forEach((d, i) => {
        const cal = vals[i];
        const x = lerp(i, 0, recent.length - 1, bw / 2, IW - bw / 2) - bw / 2;
        const bh = lerp(cal, 0, maxV, 0, IH);
        const by = IH - bh;
        const color = cal <= calorieGoal ? '#6BCB77' : '#FF6B6B';
        bars += `<rect x="${x.toFixed(1)}" y="${by.toFixed(1)}" width="${bw}"
                       height="${bh.toFixed(1)}" rx="3" fill="${color}" opacity="0.85"/>`;
        bars += `<text x="${(x + bw / 2).toFixed(1)}" y="${IH + 16}" text-anchor="middle"
                       font-family="Arial" font-size="9" fill="#bbb">${d.slice(5)}</text>`;
    });

    const goalY = lerp(calorieGoal, 0, maxV, IH, 0);
    const goalLine = `
      <line x1="0" y1="${goalY.toFixed(1)}" x2="${IW}" y2="${goalY.toFixed(1)}"
            stroke="#764ba2" stroke-width="2" stroke-dasharray="6,3"/>
      <text x="${IW + 4}" y="${(goalY + 4).toFixed(1)}"
            font-family="Arial" font-size="10" fill="#764ba2">Goal</text>`;

    const legend = `
      <rect x="4" y="-14" width="11" height="11" rx="2" fill="#6BCB77"/>
      <text x="19" y="-5" font-family="Arial" font-size="10" fill="#666">Under goal</text>
      <rect x="100" y="-14" width="11" height="11" rx="2" fill="#FF6B6B"/>
      <text x="115" y="-5" font-family="Arial" font-size="10" fill="#666">Over goal</text>`;

    const inner = `
      ${yGrid(0, maxV)}
      ${bars}
      ${goalLine}
      ${legend}
      ${axes('Last 14 Days', 'kcal')}`;
    return svgWrap(inner, 'Calories vs Goal', '764ba2');
};

// ─── Export CSV ───────────────────────────────────────────────────────────────
export const exportCSV = async (history, profile) => {
    console.log('🔍 Starting CSV export...');
    try {
        const { name, weight, height, goal, calorieGoal, proteinGoal, carbsGoal, fatGoal } = profile;

        let csv = 'CaloMate Nutrition Export\n\n';
        csv += `User: ${name || 'User'}\n`;
        csv += `Current Weight: ${weight}kg\n`;
        csv += `Height: ${height}cm\n`;
        csv += `Goal: ${goal}\n`;
        csv += `Calorie Goal: ${calorieGoal} kcal\n`;
        csv += `Protein Goal: ${proteinGoal}g\n`;
        csv += `Carbs Goal: ${carbsGoal}g\n`;
        csv += `Fat Goal: ${fatGoal}g\n`;
        csv += `Export Date: ${new Date().toLocaleDateString()}\n\n`;
        csv += 'Date,Calories,Protein (g),Carbs (g),Fat (g),Weight (kg)\n';

        const dates = Object.keys(history).sort();
        dates.forEach(date => {
            const day = history[date];
            csv += `${date},${day.calories || 0},${day.protein || 0},${day.carbs || 0},${day.fat || 0},${day.weight || ''}\n`;
        });

        const calories = dates.map(d => history[d].calories || 0);
        const avg = calories.length ? (calories.reduce((a, b) => a + b, 0) / calories.length).toFixed(0) : 0;
        csv += '\nSummary Statistics\n';
        csv += `Total Days Tracked,${dates.length}\n`;
        csv += `Average Calories,${avg}\n`;
        csv += `Max Calories,${Math.max(...calories, 0)}\n`;
        csv += `Min Calories,${calories.length ? Math.min(...calories.filter(c => c > 0)) : 0}\n`;

        const filename = `CaloMate_Export_${new Date().toISOString().split('T')[0]}.csv`;
        let result;
        if (isWeb) {
            result = exportOnWeb(csv, filename, 'text/csv');
            if (result.success) Alert.alert('✅ Success', 'CSV file downloaded!');
        } else {
            result = await exportCSVOnNative(csv, filename);
        }
        if (!result.success) throw result.error;
        return result;
    } catch (error) {
        console.error('❌ CSV Export Error:', error);
        Alert.alert('❌ Export Failed', `Could not export CSV.\n\nError: ${error.message}`);
        return { success: false, error };
    }
};

// ─── Export PDF ───────────────────────────────────────────────────────────────
export const exportPDF = async (history, profile, stats) => {
    console.log('🔍 Starting PDF export...');
    try {
        const { name, weight, height, goal, calorieGoal, proteinGoal, carbsGoal, fatGoal, bmr, tdee } = profile;
        const { avgCalories, trackedDays, weightChange } = stats;

        const dates = Object.keys(history).sort();

        // Fallback: calculate avgCalories if not provided in stats
        const allCalories = dates.map(d => history[d].calories || 0).filter(c => c > 0);
        const computedAvg = allCalories.length
            ? Math.round(allCalories.reduce((a, b) => a + b, 0) / allCalories.length)
            : 0;
        const resolvedAvgCalories = avgCalories ?? computedAvg;

        // Build all 4 charts as inline SVG
        const chart1 = buildCaloriesChart(dates, history);
        const chart2 = buildWeightChart(dates, history);
        const chart3 = buildMacroPie(dates, history);
        const chart4 = buildCalVsGoalChart(dates, history, calorieGoal);

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CaloMate Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 820px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 { color: #667eea; text-align: center; font-size: 34px; margin-bottom: 8px; }
        .date { text-align: center; color: #aaa; margin-bottom: 30px; font-size: 13px; }
        .emoji { font-size: 56px; text-align: center; margin-bottom: 16px; }
        .section { margin: 28px 0; padding: 22px; background: #f8f9fa; border-radius: 15px; }
        h2 { color: #333; margin-bottom: 18px; font-size: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
        .stat {
            background: white; padding: 18px; border-radius: 12px;
            text-align: center; border: 2px solid #eee;
        }
        .label {
            font-size: 10px; color: #888; margin-bottom: 8px;
            text-transform: uppercase; letter-spacing: 1px; font-weight: 700;
        }
        .value { font-size: 26px; font-weight: bold; color: #667eea; }
        .unit { font-size: 13px; color: #aaa; font-weight: normal; }
        .chart-box {
            background: white; border-radius: 12px; padding: 12px;
            margin-top: 14px; border: 1px solid #eee; overflow: hidden;
        }
        .chart-box svg { width: 100%; height: auto; display: block; }
        .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; background: white; border-radius: 10px; overflow: hidden; }
        th { background: #667eea; color: white; padding: 11px 13px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 11px 13px; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
        tr:nth-child(even) td { background: #fafafa; }
        .footer { text-align: center; margin-top: 44px; padding-top: 26px; border-top: 2px solid #eee; color: #bbb; font-size: 13px; }
    </style>
</head>
<body>
<div class="container">

    <div class="emoji">🏋️</div>
    <h1>CaloMate Report</h1>
    <div class="date">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>

    <div class="section">
        <h2>👤 Profile</h2>
        <div class="grid">
            <div class="stat"><div class="label">Name</div><div class="value" style="font-size:18px">${name || 'User'}</div></div>
            <div class="stat"><div class="label">Goal</div><div class="value" style="font-size:15px">${goal || 'Health'}</div></div>
            <div class="stat"><div class="label">Weight</div><div class="value">${weight}<span class="unit"> kg</span></div></div>
            <div class="stat"><div class="label">Height</div><div class="value">${height}<span class="unit"> cm</span></div></div>
        </div>
    </div>

    <div class="section">
        <h2>🎯 Daily Goals</h2>
        <div class="grid">
            <div class="stat"><div class="label">Calories</div><div class="value">${calorieGoal}<span class="unit"> kcal</span></div></div>
            <div class="stat"><div class="label">Protein</div><div class="value">${proteinGoal}<span class="unit"> g</span></div></div>
            <div class="stat"><div class="label">Carbs</div><div class="value">${carbsGoal}<span class="unit"> g</span></div></div>
            <div class="stat"><div class="label">Fat</div><div class="value">${fatGoal}<span class="unit"> g</span></div></div>
        </div>
    </div>

    <div class="section">
        <h2>📊 Statistics</h2>
        <div class="grid">
            <div class="stat"><div class="label">Days Tracked</div><div class="value">${trackedDays}</div></div>
            <div class="stat"><div class="label">Avg Calories</div><div class="value">${resolvedAvgCalories}<span class="unit"> kcal</span></div></div>
            <div class="stat">
                <div class="label">Weight Change</div>
                <div class="value" style="color:${weightChange < 0 ? '#10b981' : weightChange > 0 ? '#ef4444' : '#aaa'}">
                    ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}<span class="unit"> kg</span>
                </div>
            </div>
            <div class="stat"><div class="label">BMR / TDEE</div><div class="value" style="font-size:17px">${bmr || '--'} / ${tdee || '--'}</div></div>
        </div>
    </div>

    <div class="section">
        <h2>📈 Charts</h2>

        <div class="chart-box">${chart1}</div>
        <div class="chart-box">${chart2}</div>

        <div class="chart-row">
            <div class="chart-box">${chart3}</div>
            <div class="chart-box">${chart4}</div>
        </div>
    </div>

    <div class="section">
        <h2>📅 Recent History</h2>
        <table>
            <thead>
                <tr>
                    <th>Date</th><th>Calories</th><th>Protein</th>
                    <th>Carbs</th><th>Fat</th><th>Weight</th>
                </tr>
            </thead>
            <tbody>
                ${Object.keys(history).sort().reverse().slice(0, 30).map(date => {
                    const day = history[date];
                    return `<tr>
                        <td><strong>${new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></td>
                        <td>${day.calories || 0} kcal</td>
                        <td>${day.protein || 0}g</td>
                        <td>${day.carbs || 0}g</td>
                        <td>${day.fat || 0}g</td>
                        <td>${day.weight ? day.weight + ' kg' : '—'}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p><strong>CaloMate</strong> — Your Personal Nutrition Tracker</p>
        <p style="margin-top:10px">Keep crushing your goals! 💪</p>
    </div>

</div>
</body>
</html>`;

        console.log('✅ HTML + charts built');

        let result;
        if (isWeb) {
            const filename = `CaloMate_Report_${new Date().toISOString().split('T')[0]}.html`;
            result = exportOnWeb(html, filename, 'text/html');
            if (result.success) Alert.alert('✅ Success', 'Report downloaded!');
        } else {
            result = await exportPDFOnNative(html);
        }

        if (!result.success) throw result.error;
        console.log('✅ Export successful');
        return result;

    } catch (error) {
        console.error('❌ PDF Export Error:', error);
        Alert.alert('❌ Export Failed', `Could not export report.\n\nError: ${error.message}`);
        return { success: false, error };
    }
};