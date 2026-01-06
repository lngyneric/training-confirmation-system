"use client"

import {
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface TrainingDimensionsChartProps {
  creditProgress: number
  ceibsProgress: number
  aiProgress: number
  showCeibs?: boolean // Kept for prop compatibility but unused for dimension structure
}

export function TrainingDimensionsChart({ 
  creditProgress, 
  ceibsProgress, 
  aiProgress,
  showCeibs = true
}: TrainingDimensionsChartProps) {
  
  // Fixed 3 dimensions as per requirement: 学分制培训, 中欧培训, AI培训
  const chartData = [
    { subject: "学分制培训", A: creditProgress, fullMark: 100 },
    { subject: "中欧培训", A: ceibsProgress, fullMark: 100 },
    { subject: "AI培训", A: aiProgress, fullMark: 100 },
  ]

  return (
    <Card className="flex flex-col border-none shadow-none bg-transparent">
      <CardContent className="flex-1 pb-0 p-0">
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="80%" outerRadius="70%" data={chartData} startAngle={180} endAngle={0}>
                <PolarGrid stroke="rgba(255,255,255,0.3)" gridType="circle" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: 'white', fontSize: 12 }} 
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                    name="完成进度"
                    dataKey="A"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.5}
                />
                <Tooltip 
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                        return (
                            <div className="rounded-lg border bg-background/90 p-2 shadow-sm text-xs">
                                <span className="font-bold">{payload[0].payload.subject}</span>: {payload[0].value}%
                            </div>
                        )
                        }
                        return null
                    }}
                />
            </RadarChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
