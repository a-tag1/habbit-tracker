import { useState, useCallback } from 'react'
import './App.css'
import { useHabits } from './hooks/useHabits'
import { useTheme } from './hooks/useTheme'
import { useCoin } from './hooks/useCoin'
import { toDateString } from './utils/dateUtils'
import { getDayOfWeek } from './utils/dateUtils'
import type { AppView, TaskStatus, ImageSettings } from './types'
import { loadImageSettings, saveImageSettings } from './utils/storage'
import DailyView from './components/DailyView/DailyView'
import TaskList from './components/TaskManager/TaskList'
import StatisticsView from './components/Statistics/StatisticsView'
import SettingsView from './components/Settings/SettingsView'
import BottomNav from './components/Navigation/BottomNav'
import GachaView from './components/Gacha/GachaView'

function App() {
  const [currentView, setCurrentView] = useState<AppView>('daily')
  const [currentDate, setCurrentDate] = useState(toDateString(new Date()))
  const { theme, setTheme } = useTheme()
  const [imageSettings, setImageSettings] = useState<ImageSettings>(() => loadImageSettings())
  const handleImageSettingsChange = useCallback((s: ImageSettings) => {
    setImageSettings(s)
    saveImageSettings(s)
  }, [])
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
  const {
    coins,
    ownedCards,
    customSeasons,
    activeSeasonId,
    lastCoinGain,
    gainKey,
    earnCoins,
    spendCoins,
    refundCoins,
    addOwnedCards,
    replaceOwnedCard,
    createSeason,
    switchSeason,
  } = useCoin()

  const handleSetStatus = useCallback((date: string, taskId: string, status: TaskStatus) => {
    const prevStatus = getStatusForDate(date, taskId)
    setStatus(date, taskId, status)

    if (status === 'completed' && prevStatus !== 'completed') {
      const task = tasks.find(t => t.id === taskId)
      const dow = getDayOfWeek(date)
      const visibleTasks = tasks.filter(t => {
        if (t.frequencyType !== 'weekly') return true
        if (!t.weekDays || t.weekDays.length === 0) return true
        return t.weekDays.includes(dow)
      })
      const completedBefore = visibleTasks.filter(
        t => t.id !== taskId && getStatusForDate(date, t.id) === 'completed'
      ).length
      const completedAfter = completedBefore + 1
      const isHard = task?.difficulty === 'hard'
      earnCoins(date, completedAfter, visibleTasks.length, isHard)
    }
  }, [tasks, getStatusForDate, setStatus, earnCoins])

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
            onSetStatus={handleSetStatus}
            getStatus={getStatusForDate}
            coins={coins}
            lastCoinGain={lastCoinGain}
            gainKey={gainKey}
            onNavigateGacha={() => setCurrentView('gacha')}
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
            imageSettings={imageSettings}
            onImageSettingsChange={handleImageSettingsChange}
          />
        )}
        {currentView === 'gacha' && (
          <GachaView
            coins={coins}
            ownedCards={ownedCards}
            customSeasons={customSeasons}
            activeSeasonId={activeSeasonId}
            onSpendCoins={spendCoins}
            onAddCards={addOwnedCards}
            onAddCoins={refundCoins}
            onReplaceCard={replaceOwnedCard}
            onCreateSeason={createSeason}
            onSwitchSeason={switchSeason}
            imageProvider={imageSettings.provider}
            hfToken={imageSettings.hfToken}
            hfModel={imageSettings.hfModel}
            cfAccountId={imageSettings.cfAccountId}
            cfToken={imageSettings.cfToken}
            cfModel={imageSettings.cfModel}
          />
        )}
      </main>

      {/* ボトムナビゲーション */}
      <BottomNav current={currentView} onChange={setCurrentView} />
    </div>
  )
}

export default App
