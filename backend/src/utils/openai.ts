import OpenAI from 'openai';
import { IOnboarding } from '../models/User';

export interface TaskSummary {
  title: string;
  subject: string;
  dueDays: number;
  estimatedHours: number;
  priority: string;
}

// Instantiated lazily so dotenv.config() in server.ts runs first
let _openai: OpenAI | null = null;
const getClient = () => {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
};

// Build a prompt from the user's onboarding data and optional pending tasks
const buildPrompt = (onboarding: IOnboarding, tasks?: TaskSummary[]): string => {
  const classesText = onboarding.classes.length > 0
    ? onboarding.classes.map(c => `${c.name} on ${c.day} from ${c.startTime} to ${c.endTime}`).join(', ')
    : 'No fixed classes';

  const tasksText = tasks && tasks.length > 0
    ? `\nPending tasks to schedule (prioritise by urgency):\n${tasks
        .sort((a, b) => a.dueDays - b.dueDays)
        .map(t => `- "${t.title}"${t.subject ? ` (${t.subject})` : ''}, due in ${t.dueDays} day${t.dueDays !== 1 ? 's' : ''}, needs ~${t.estimatedHours}h total, priority: ${t.priority}`)
        .join('\n')}\nAllocate dedicated study sessions for these tasks across the week. Label those slots as "Study: [Task Title]". Spread hours across days based on due date urgency.`
    : '';

  return `You are a smart scheduling assistant. Create a structured weekly timetable for a student based on their routine preferences.

Student Profile:
- Sleep: ${onboarding.sleepTime} to ${onboarding.wakeTime} (~${onboarding.sleepHours}h/night)
- Chronotype: ${onboarding.chronotype || 'morning'} person — schedule deep study during ${onboarding.chronotype === 'afternoon' ? '12pm–6pm' : onboarding.chronotype === 'evening' ? '6pm–11pm' : '6am–12pm'}
- Daily study goal: ${onboarding.studyGoalHours} hours using ${
  onboarding.studyStyle === 'pomodoro' ? 'Pomodoro blocks (25 min focus + 5 min break)' :
  onboarding.studyStyle === 'long' ? 'long deep-work sessions (2+ hours)' :
  'medium blocks (1–1.5 hours)'
}
- Subjects: ${onboarding.subjects.join(', ') || 'General'}
- Hobbies: ${onboarding.hobbies.join(', ') || 'None'}
- Screen time limit: ${onboarding.screenTimeLimitHours}h/day
- Exercise: ${onboarding.exerciseEnabled ? `${onboarding.exerciseDuration} min in the ${onboarding.exerciseTime || 'morning'}` : 'none'}
- Work schedule: ${onboarding.workEnabled && onboarding.workDays?.length ? `${onboarding.workDays.join(', ')} from ${onboarding.workStartTime} to ${onboarding.workEndTime} (block these hours — no study/class during work)` : 'none'}
- Fixed classes: ${classesText}
${tasksText}
Generate a realistic, balanced weekly schedule for Monday through Sunday.

IMPORTANT: Return ONLY valid JSON in this exact format, no extra text:
{
  "schedule": [
    {
      "day": "Monday",
      "slots": [
        {
          "startTime": "06:30",
          "endTime": "07:00",
          "activity": "Morning Routine",
          "category": "other",
          "color": "#6366f1"
        }
      ]
    }
  ]
}

Category must be one of: study, sleep, hobby, class, break, exercise, meal, screen, other
Color hex codes to use:
- study: #6366f1 (indigo)
- sleep: #8b5cf6 (purple)
- class: #3b82f6 (blue)
- exercise: #10b981 (green)
- meal: #f59e0b (amber)
- hobby: #ec4899 (pink)
- screen: #f97316 (orange)
- break: #6b7280 (gray)
- other: #14b8a6 (teal)

Include proper meal times, breaks, and make the schedule realistic and achievable. Cover the full day from wake time to sleep time.`;
};

// Scan a class schedule image using GPT-4o Vision and return extracted classes
export const scanClassScheduleImage = async (imageBase64: string, mimeType: string) => {
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: `You are a class schedule parser. Extract every class, lecture, or subject from this timetable image.

Return ONLY valid JSON in this exact format, no markdown, no extra text:
{
  "classes": [
    {
      "name": "Mathematics",
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "10:00"
    }
  ]
}

Rules:
- "day" must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- "startTime" and "endTime" must be 24-hour HH:MM format (convert AM/PM if needed)
- If a class repeats on multiple days, add a separate entry for each day
- Include ALL visible classes — do not skip any
- If you cannot find a class schedule in the image, return: {"classes": [], "error": "No schedule found in image"}`,
          },
        ],
      },
    ],
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from OpenAI Vision');

  // Strip markdown code fences if present
  const clean = content.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

export const generateTimetable = async (onboarding: IOnboarding, tasks?: TaskSummary[]) => {
  try {
    const prompt = buildPrompt(onboarding, tasks);
    const completion = await getClient().chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');
    const clean = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return parsed.schedule;
  } catch (err: unknown) {
    // Quota exceeded or API unavailable — fall back to algorithmic generation
    const code = (err as { code?: string })?.code;
    const status = (err as { status?: number })?.status;
    if (code === 'insufficient_quota' || status === 429 || status === 503) {
      console.warn('[openai] quota/unavailable — using fallback generator');
      return generateFallbackTimetable(onboarding, tasks);
    }
    throw err;
  }
};

// ─── Fallback: algorithm-based timetable (no AI needed) ──────────────────────

type Slot = { startTime: string; endTime: string; activity: string; category: string; color: string };
type DaySchedule = { day: string; slots: Slot[] };

const COLORS: Record<string, string> = {
  sleep: '#8b5cf6', meal: '#f59e0b', study: '#6366f1', class: '#3b82f6',
  exercise: '#10b981', hobby: '#ec4899', screen: '#f97316', break: '#6b7280', other: '#14b8a6',
};

const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fromMins = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const slot = (start: number, end: number, activity: string, cat: string): Slot =>
  ({ startTime: fromMins(start), endTime: fromMins(end), activity, category: cat, color: COLORS[cat] });

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function addStudyBlocks(slots: Slot[], labels: string[], cur: number, limit: number, studyLeft: number): [number, number] {
  let c = cur;
  let left = studyLeft;
  while (left >= 60 && c + 60 <= limit) {
    const block = Math.min(left, 90);
    const label = labels[slots.filter(s => s.category === 'study').length % labels.length];
    slots.push(slot(c, c + block, `Study: ${label}`, 'study'));
    left -= block; c += block;
    if (left >= 60 && c + 60 <= limit) { slots.push(slot(c, c + 15, 'Break', 'break')); c += 15; }
  }
  return [c, left];
}

function generateFallbackTimetable(onboarding: IOnboarding, tasks?: TaskSummary[]): DaySchedule[] {
  const wakeMin = toMins(onboarding.wakeTime);
  const sleepMin = toMins(onboarding.sleepTime) <= wakeMin
    ? toMins(onboarding.sleepTime) + 24 * 60
    : toMins(onboarding.sleepTime);

  const studyMinsPerDay = (onboarding.studyGoalHours || 4) * 60;
  const screenMins = Math.min((onboarding.screenTimeLimitHours || 2) * 60, 90);
  const subjects = onboarding.subjects.length > 0 ? onboarding.subjects : ['General Study'];
  const hobbies = onboarding.hobbies.length > 0 ? onboarding.hobbies : [];
  const exerciseMins = onboarding.exerciseEnabled ? (onboarding.exerciseDuration || 30) : 0;
  const exerciseInMorning = onboarding.exerciseTime !== 'evening';
  const taskLabels = tasks && tasks.length > 0
    ? tasks.sort((a, b) => a.dueDays - b.dueDays).map(t => t.title)
    : subjects;

  return DAYS.map(day => {
    const slots: Slot[] = [];
    const isWorkDay = onboarding.workEnabled && (onboarding.workDays || []).includes(day);
    const workStart = isWorkDay ? toMins(onboarding.workStartTime || '09:00') : -1;
    const workEnd   = isWorkDay ? toMins(onboarding.workEndTime   || '17:00') : -1;

    let cur = wakeMin;
    let studyLeft = studyMinsPerDay;

    // Morning routine + breakfast
    slots.push(slot(cur, cur + 30, 'Morning Routine', 'other')); cur += 30;

    // Morning exercise (if enabled)
    if (exerciseMins > 0 && exerciseInMorning && cur + exerciseMins <= sleepMin - 6 * 60) {
      slots.push(slot(cur, cur + exerciseMins, 'Exercise', 'exercise')); cur += exerciseMins;
    }

    slots.push(slot(cur, cur + 30, 'Breakfast', 'meal')); cur += 30;

    // Work block — insert and skip over
    if (isWorkDay && workStart > cur) {
      [cur, studyLeft] = addStudyBlocks(slots, taskLabels, cur, workStart, studyLeft);
      if (cur < workStart) { slots.push(slot(cur, workStart, 'Break', 'break')); cur = workStart; }
      slots.push(slot(workStart, workEnd, 'Work', 'other')); cur = workEnd;
    }

    // Fixed classes for this day
    const dayClasses = (onboarding.classes || [])
      .filter(c => c.day === day)
      .sort((a, b) => toMins(a.startTime) - toMins(b.startTime));

    // Schedule around fixed classes, filling gaps with study
    const lunchTarget = wakeMin + 5 * 60; // ~5 hrs after wake = lunch target

    for (const cls of dayClasses) {
      const clsStart = toMins(cls.startTime);
      const clsEnd = toMins(cls.endTime);
      if (clsStart > cur) {
        const fillLimit = Math.min(clsStart, lunchTarget);
        if (fillLimit > cur) {
          [cur, studyLeft] = addStudyBlocks(slots, taskLabels, cur, fillLimit, studyLeft);
        }
        if (cur < clsStart) { slots.push(slot(cur, clsStart, 'Break', 'break')); cur = clsStart; }
      }
      slots.push(slot(clsStart, clsEnd, cls.name, 'class')); cur = clsEnd;
    }

    // Morning study (fill up to lunch target)
    if (cur < lunchTarget) {
      [cur, studyLeft] = addStudyBlocks(slots, taskLabels, cur, lunchTarget, studyLeft);
    }

    // Lunch
    if (cur + 45 < sleepMin - 3 * 60) {
      if (cur < lunchTarget) { slots.push(slot(cur, lunchTarget, 'Break', 'break')); cur = lunchTarget; }
      slots.push(slot(cur, cur + 45, 'Lunch', 'meal')); cur += 45;
    }

    // Afternoon study
    const eveningStart = sleepMin - 4 * 60;
    [cur, studyLeft] = addStudyBlocks(slots, taskLabels, cur, eveningStart, studyLeft);

    // Exercise
    if (cur + 30 < sleepMin - 2 * 60) {
      slots.push(slot(cur, cur + 30, 'Exercise', 'exercise')); cur += 30;
    }

    // Hobby
    if (hobbies.length > 0 && cur + 45 < sleepMin - 2 * 60) {
      const hobby = hobbies[Math.floor(Math.random() * hobbies.length)];
      slots.push(slot(cur, cur + 45, hobby, 'hobby')); cur += 45;
    }

    // Screen time
    if (screenMins > 0 && cur + screenMins < sleepMin - 90) {
      slots.push(slot(cur, cur + screenMins, 'Screen Time', 'screen')); cur += screenMins;
    }

    // Dinner
    const dinnerTarget = sleepMin - 3 * 60;
    if (cur < dinnerTarget) { slots.push(slot(cur, dinnerTarget, 'Relaxation', 'other')); cur = dinnerTarget; }
    if (cur + 45 < sleepMin - 30) { slots.push(slot(cur, cur + 45, 'Dinner', 'meal')); cur += 45; }

    // Wind down + sleep
    if (cur < sleepMin - 30) slots.push(slot(cur, sleepMin - 30, 'Wind Down', 'other'));
    slots.push(slot(sleepMin - 30, sleepMin % (24 * 60) || sleepMin, 'Sleep', 'sleep'));

    return { day, slots: slots.filter(s => s.startTime !== s.endTime) };
  });
}
