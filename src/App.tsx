import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { useHabits } from './hooks/useHabits'
import { useTheme } from './hooks/useTheme'
import { useCoin } from './hooks/useCoin'
import { toDateString } from './utils/dateUtils'
import { getDayOfWeek } from './utils/dateUtils'
import type { AppView, TaskStatus, ImageSettings, RegisteredCardImages } from './types'
import { loadImageSettings, saveImageSettings, loadRegisteredCardImages, saveRegisteredCardImages, defaultImageSettings } from './utils/storage'
import DailyView from './components/DailyView/DailyView'
import TaskList from './components/TaskManager/TaskList'
import StatisticsView from './components/Statistics/StatisticsView'
import SettingsView from './components/Settings/SettingsView'
import BottomNav from './components/Navigation/BottomNav'
import GachaView from './components/Gacha/GachaView'

const VIEW_ORDER: AppView[] = ['daily', 'tasks', 'statistics', 'gacha', 'settings']

function App() {
  const [currentView, setCurrentView] = useState<AppView>('daily')
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const [viewKey, setViewKey] = useState(0)
  const [currentDate, setCurrentDate] = useState(toDateString(new Date()))
  const { theme, setTheme } = useTheme()
  const [imageSettings, setImageSettings] = useState<ImageSettings>(defaultImageSettings)
  const [registeredCardImages, setRegisteredCardImages] = useState<RegisteredCardImages>({})
  useEffect(() => {
    Promise.all([loadImageSettings(), loadRegisteredCardImages()]).then(([settings, images]) => {
      setImageSettings(settings)
      setRegisteredCardImages(images)
    })
  }, [])
  const handleImageSettingsChange = useCallback((s: ImageSettings) => {
    setImageSettings(s)
    saveImageSettings(s)
  }, [])
  const handleRegisteredCardImagesChange = useCallback((images: RegisteredCardImages) => {
    setRegisteredCardImages(images)
    saveRegisteredCardImages(images)
  }, [])

  const navigateTo = useCallback((view: AppView) => {
    if (view === currentView) return
    const dir = VIEW_ORDER.indexOf(view) > VIEW_ORDER.indexOf(currentView) ? 'right' : 'left'
    setSlideDir(dir)
    setViewKey(k => k + 1)
    setCurrentView(view)
  }, [currentView])
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
    setMemo,
    getMemoForDate,
    setNumber,
    getNumberForDate,
    statsTaskOrder,
    setStatsTaskOrder,
    importAppData,
    ready,
    loadFailed,
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

    if ((status === 'completed' || status === 'skipped') && prevStatus !== status) {
      const task = tasks.find(t => t.id === taskId)
      const dow = getDayOfWeek(date)
      const visibleTasks = tasks.filter(t => {
        if (t.paused) return false
        if (t.frequencyType !== 'weekly') return true
        if (!t.weekDays || t.weekDays.length === 0) return true
        return t.weekDays.includes(dow)
      })
      const completedAfter = visibleTasks.filter(
        t => t.id !== taskId ? getStatusForDate(date, t.id) === 'completed' : status === 'completed'
      ).length
      const skippedAfter = visibleTasks.filter(
        t => t.id !== taskId ? getStatusForDate(date, t.id) === 'skipped' : status === 'skipped'
      ).length
      const isHard = task?.difficulty === 'hard'
      earnCoins(date, completedAfter, skippedAfter, visibleTasks.length, isHard, status === 'completed')
    }
  }, [tasks, getStatusForDate, setStatus, earnCoins])

  if (loadFailed) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 text-sm text-zinc-600">
        <p>データを読み込めませんでした。</p>
        <button onClick={() => window.location.reload()} className="underline">再読み込み</button>
      </div>
    )
  }

  if (!ready) {
    return <div className="flex h-dvh items-center justify-center text-sm text-zinc-500">読み込み中...</div>
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div
          key={viewKey}
          className={`flex flex-col flex-1 overflow-hidden${slideDir === 'right' ? ' view-from-right' : slideDir === 'left' ? ' view-from-left' : ''}`}
        >
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
            onNavigateGacha={() => navigateTo('gacha')}
            getMemo={getMemoForDate}
            onMemoChange={setMemo}
            getNumber={getNumberForDate}
            onNumberChange={setNumber}
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
          <StatisticsView
            tasks={tasks}
            history={history}
            statsTaskOrder={statsTaskOrder}
            onStatsReorder={setStatsTaskOrder}
          />
        )}
        {currentView === 'settings' && (
          <SettingsView
            data={data}
            onImport={importAppData}
            theme={theme}
            onThemeChange={setTheme}
            imageSettings={imageSettings}
            onImageSettingsChange={handleImageSettingsChange}
            customSeasons={customSeasons}
            registeredCardImages={registeredCardImages}
            onRegisteredCardImagesChange={handleRegisteredCardImagesChange}
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
            cfWorkerUrl={imageSettings.cfWorkerUrl}
            cfModel={imageSettings.cfModel}
            aihordeKey={imageSettings.aihordeKey}
            aihordeModel={imageSettings.aihordeModel}
            imageSourceMode={imageSettings.sourceMode}
            registeredCardImages={registeredCardImages}
          />
        )}
        </div>
      </main>

      {/* ボトムナビゲーション */}
      <BottomNav current={currentView} onChange={navigateTo} />
    </div>
  )
}

export default App
