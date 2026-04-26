import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addHabit, checkinHabit, uncheckinHabit } from './db';
import { Check, Plus, Flame, Snowflake, Award, Calendar, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday } from 'date-fns';

import './index.css';

const playPopSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch(e) {
    console.log("Audio not supported");
  }
};

const HabitHeatmap = ({ habit, checkins }) => {
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "yyyy-MM-dd";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px dashed var(--border-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{format(currentDate, 'MMMM yyyy')}</h4>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: habit.color || 'var(--success)' }}>
          {checkins?.filter(c => c.habitId === habit.id && c.date.startsWith(format(currentDate, 'yyyy-MM'))).length} check-ins this month
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
        {weekDays.map(day => (
          <div key={day} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{day}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {days.map(day => {
          const formattedDate = format(day, dateFormat);
          const isChecked = checkins?.some(c => c.habitId === habit.id && c.date === formattedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          let bgColor = 'var(--surface-color)';
          let opacity = isCurrentMonth ? 1 : 0.3;
          let border = '2px solid var(--border-light)';
          
          if (isChecked) {
            bgColor = habit.color || 'var(--success)';
            border = `2px solid ${bgColor}`;
          } else if (isToday(day)) {
            border = '2px solid var(--primary)';
          }

          return (
            <div 
              key={day.toString()} 
              style={{
                aspectRatio: '1/1', borderRadius: '6px',
                backgroundColor: bgColor, border: border, opacity: opacity,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', color: isChecked ? 'white' : 'var(--text-primary)', fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
              title={formattedDate}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HabitItem = ({ habit, checkins }) => {
  const [expanded, setExpanded] = useState(false);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isChecked = checkins?.some(c => c.habitId === habit.id && c.date === todayStr);

  const toggleCheck = async (e) => {
    e.stopPropagation();
    if (isChecked) {
      await uncheckinHabit(habit.id, todayStr);
    } else {
      await checkinHabit(habit.id, todayStr);
      playPopSound();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, colors: [habit.color || '#58cc02', '#ffc800', '#1cb0f6'] });
    }
  };

  // Gamification: Calculate simple streak
  // A true streak calculation would iterate backwards from today. 
  // For now, we'll display total checkins as a basic metric if streak isn't perfectly calculated yet
  const habitCheckins = checkins?.filter(c => c.habitId === habit.id) || [];
  const total = habitCheckins.length;

  return (
    <div className="card" style={{ marginBottom: '16px', borderLeft: `6px solid ${habit.color || '#58cc02'}`, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '28px' }}>{habit.icon || '🔥'}</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{habit.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning-hover)', fontSize: '14px', fontWeight: 'bold' }}>
                <Flame size={16} /> {total} Total
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>•</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {expanded ? <ChevronUp size={14} /> : <Calendar size={14} />} {expanded ? 'Hide' : 'History'}
              </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={toggleCheck}
          style={{
            width: '48px', height: '48px', borderRadius: '50%',
            backgroundColor: isChecked ? 'var(--success)' : '#e5e7eb',
            color: isChecked ? 'white' : 'transparent',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            border: isChecked ? 'none' : '3px solid #d1d5db',
            boxShadow: isChecked ? '0 4px 0 var(--success-shadow)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: isChecked ? 'scale(1.1)' : 'scale(1)',
            cursor: 'pointer'
          }}
        >
          <Check size={28} strokeWidth={4} />
        </button>
      </div>
      {expanded && <HabitHeatmap habit={habit} checkins={checkins} />}
    </div>
  );
};

export default function App() {
  const habits = useLiveQuery(() => db.habits.toArray());
  const checkins = useLiveQuery(() => db.checkins.toArray());
  const stats = useLiveQuery(() => db.stats.toArray());
  const fileInputRef = useRef(null);
  
  const freezes = stats?.find(s => s.key === 'freezes')?.value || 0;
  const [newHabitName, setNewHabitName] = useState('');

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const colors = ['#1cb0f6', '#58cc02', '#ff4b4b', '#ffc800', '#ce82ff'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    await addHabit(newHabitName, randomColor, '🎯');
    setNewHabitName('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Loop typically names the CSV after the habit, e.g., "Reading.csv"
    const habitName = file.name.replace('.csv', '');
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const csvData = event.target.result;
      const lines = csvData.split('\n');
      
      const colors = ['#1cb0f6', '#58cc02', '#ff4b4b', '#ffc800', '#ce82ff'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      try {
          const newHabitId = await addHabit(habitName, randomColor, '📦');
          const validCheckins = [];
          
          for (let i = 1; i < lines.length; i++) { // skip header
            const line = lines[i].trim();
            if (!line) continue;
            
            // Loop uses: date,value (or something similar). Value > 0 is usually checked
            const [dateStr, val] = line.split(','); 
            if (dateStr && (val === '2' || val === '1' || val === 'true')) {
                // Take just YYYY-MM-DD
                const formattedDate = dateStr.substring(0, 10);
                validCheckins.push({ habitId: newHabitId, date: formattedDate });
            }
          }
          
          if (validCheckins.length > 0) {
            await db.checkins.bulkPut(validCheckins);
          }
          
          alert(`Successfully imported ${validCheckins.length} past check-ins for "${habitName}"!`);
      } catch (err) {
          alert('Failed to import CSV. Make sure it is a valid Loop export.');
      }
    };
    
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalCheckins = checkins?.length || 0;
  const plantStage = Math.floor(totalCheckins / 5);
  const plantIcons = ['🌱', '🌿', '🌳', '🌲', '✨🌲✨'];
  const currentPlant = plantIcons[Math.min(plantStage, plantIcons.length - 1)];

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontWeight: 900, color: 'var(--primary)', margin: 0, fontSize: '32px' }}>Habits</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
            {format(new Date(), 'EEEE, MMMM do')}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="card" title="Streak Freezes" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', border: '2px solid var(--warning)', backgroundColor: 'var(--warning-hover)', color: 'white', fontWeight: 800 }}>
            <Snowflake size={20} fill="white" />
            <span>{freezes}</span>
          </div>
          <div className="card" title="Evolving Plant (Grows with checkins)" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', border: '2px solid var(--success)', backgroundColor: 'var(--success-hover)', color: 'white', fontWeight: 800 }}>
            <span style={{ fontSize: '20px' }}>{currentPlant}</span>
          </div>
        </div>
      </div>

      <div>
        {habits?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <Award size={64} color="var(--border-light)" style={{ marginBottom: '16px', margin: '0 auto' }} />
            <h3>No habits yet!</h3>
            <p>Add one below or import from Loop CSV.</p>
          </div>
        ) : (
          habits?.map(habit => (
            <HabitItem key={habit.id} habit={habit} checkins={checkins} />
          ))
        )}
      </div>

      <form onSubmit={handleAddHabit} style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          placeholder="I want to..."
          style={{
            flex: 1, padding: '16px', borderRadius: 'var(--radius-md)',
            border: '2px solid var(--border-light)', fontSize: '16px',
            fontFamily: 'var(--font-family)', fontWeight: 600, outline: 'none'
          }}
        />
        <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', padding: 0 }}>
          <Plus size={24} strokeWidth={4} />
        </button>
      </form>
      
      {/* Import Section */}
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef}
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
            id="csv-upload" 
        />
        <label htmlFor="csv-upload" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px',
            fontWeight: 'bold'
        }}>
            <Upload size={16} /> Import from Loop Habit Tracker (CSV)
        </label>
      </div>
    </div>
  );
}
