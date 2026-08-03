import { useState } from 'react'
import './App.css'
import { useHabits } from './hooks/useHabits'
import { useTheme } from './hooks/useTheme'
import { toDateString } from './utils/dateUtils'
import type { AppView } from './types'
import DailyView from './components/DailyView/DailyView'
import TaskList from './components/TaskManager/TaskList'
import StatisticsView from './components/Statistics/StatisticsView'
import SettingsView from './components/Settings/SettingsView'
import BottomNav from './components/Navigation/BottomNav'

function App() {
  const [currentView, setCurrentView] = useState<AppView>('daily')
  const [currentDate, setCurrentDate] = useState(toDateString(new Date()))
  const { theme, setTheme } = useTheme()
  const {
    tasks,
    history,
    data,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    setStatus,
    getStatusForDate,
    importAppData,
  } = useHabits()

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'daily' && (
          <DailyView
            tasks={tasks}
            history={history}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onSetStatus={setStatus}
            getStatus={getStatusForDate}
          />
        )}
        {currentView === 'tasks' && (
          <TaskList
            tasks={tasks}
            onAdd={addTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onReorder={reorderTasks}
          />
        )}
        {currentView === 'statistics' && (
          <StatisticsView tasks={tasks} history={history} />
        )}
        {currentView === 'settings' && (
          <SettingsView
            data={data}
            onImport={importAppData}
            theme={theme}
            onThemeChange={setTheme}
          />
        )}
      </main>

      {/* ボトムナビゲーション */}
      <BottomNav current={currentView} onChange={setCurrentView} />
    </div>
  )
}

export default App
