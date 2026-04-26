import Dexie from 'dexie';

export const db = new Dexie('HabitTrackerDB');

db.version(1).stores({
  habits: '++id, name, color, icon, createdAt', // Core habits
  checkins: '[habitId+date], habitId, date', // Compound primary key for unique daily checkins
  stats: 'key, value' // Key-value store for user stats (e.g., available freezes)
});

// Helper functions for easy access
export const getHabits = () => db.habits.toArray();
export const addHabit = (name, color, icon) => db.habits.add({ name, color, icon, createdAt: new Date().toISOString() });
export const checkinHabit = (habitId, date) => db.checkins.put({ habitId, date }); // overwrites if exists (no-op)
export const uncheckinHabit = (habitId, date) => db.checkins.where({ habitId, date }).delete();

// Set default stats if they don't exist
db.on('populate', () => {
  db.stats.add({ key: 'freezes', value: 2 });
});
