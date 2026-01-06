import * as React from "react"
import { addDays, eachDayOfInterval, endOfWeek, format, getDay, startOfWeek, subWeeks, startOfDay, parseISO, isSameDay } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ActivityHeatmapProps {
  data: { date: string; count: number }[]
  className?: string
}

export function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
  // Config: Show last 52 weeks (approx 1 year) or less depending on space
  // For this layout, maybe 6 months is better? Let's do ~6 months (26 weeks)
  const weeksToShow = 26
  const today = new Date()
  const endDate = endOfWeek(today, { weekStartsOn: 1 }) // End on Sunday
  const startDate = startOfWeek(subWeeks(endDate, weeksToShow - 1), { weekStartsOn: 1 })

  // Generate all days
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  // Map data to a dictionary for fast lookup
  const dataMap = React.useMemo(() => {
    const map = new Map<string, number>()
    data.forEach(item => {
      // Normalize to YYYY-MM-DD
      const dateKey = format(parseISO(item.date), "yyyy-MM-dd")
      map.set(dateKey, (map.get(dateKey) || 0) + item.count)
    })
    return map
  }, [data])

  // Group by week for column-based rendering
  const weeks = React.useMemo(() => {
    const weeksArr: Date[][] = []
    let currentWeek: Date[] = []

    days.forEach((day) => {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek)
        currentWeek = []
      }
    })
    // Push partial week if any (though logic above should ensure full weeks due to start/endOfWeek)
    if (currentWeek.length > 0) weeksArr.push(currentWeek)
    
    return weeksArr
  }, [days])

  const getLevel = (count: number) => {
    if (count === 0) return 0
    if (count <= 1) return 1
    if (count <= 3) return 2
    if (count <= 5) return 3
    return 4
  }

  const getColorClass = (level: number) => {
    switch (level) {
      case 0: return "bg-secondary/30"
      case 1: return "bg-green-200 dark:bg-green-900"
      case 2: return "bg-green-400 dark:bg-green-700"
      case 3: return "bg-green-600 dark:bg-green-500"
      case 4: return "bg-green-800 dark:bg-green-300"
      default: return "bg-secondary/30"
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground">完成记录 (近半年)</h4>
        <span className="text-xs text-muted-foreground">
          {data.reduce((acc, curr) => acc + curr.count, 0)} 项已完成
        </span>
      </div>
      
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-1">
            {week.map((day, dIdx) => {
              const dateKey = format(day, "yyyy-MM-dd")
              const count = dataMap.get(dateKey) || 0
              const level = getLevel(count)
              
              return (
                <TooltipProvider key={dIdx}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          "w-2.5 h-2.5 rounded-[2px] transition-colors hover:ring-1 hover:ring-ring hover:ring-offset-1",
                          getColorClass(level)
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="text-xs">
                        <p className="font-semibold">{count} 项任务</p>
                        <p className="text-muted-foreground">{format(day, "yyyy年M月d日", { locale: zhCN })}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-end">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-[2px] bg-secondary/30" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-green-200 dark:bg-green-900" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-green-400 dark:bg-green-700" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-green-600 dark:bg-green-500" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-green-800 dark:bg-green-300" />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
