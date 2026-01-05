import type { Task } from "@/lib/data-parser";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, User, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
  onConfirm: (id: string, checked: boolean) => void;
}

export function TaskCard({ task, onConfirm }: TaskCardProps) {
  return (
    <Card className={cn(
      "mb-3 transition-all duration-200 border-l-4 hover:shadow-md",
      task.confirmed ? "border-l-primary bg-primary/5 border-primary/20" : "border-l-muted-foreground/30"
    )}>
      <CardContent className="p-4 flex items-start gap-4">
        <div className="pt-1">
          <Checkbox 
            id={task.id} 
            checked={task.confirmed} 
            onCheckedChange={(checked) => onConfirm(task.id, checked as boolean)}
            className="w-5 h-5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <label 
                htmlFor={task.id}
                className={cn(
                  "font-semibold text-base block cursor-pointer leading-tight",
                  task.confirmed ? "text-primary line-through decoration-primary/50" : "text-foreground"
                )}
              >
                {task.content}
              </label>
              {task.category && (
                <span className="text-xs text-muted-foreground mt-1 inline-block bg-secondary px-2 py-0.5 rounded-sm">
                  {task.category}
                </span>
              )}
            </div>
            {task.confirmed && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 animate-in fade-in zoom-in">
                <CheckCircle2 className="w-3 h-3 mr-1" /> 已确认
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
            {task.mentor && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>带教: {task.mentor}</span>
              </div>
            )}
            {task.deadline && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>截止: {task.deadline}</span>
              </div>
            )}
            {task.form && (
              <div className="flex items-center gap-1.5 col-span-full">
                <span className="px-1.5 py-0.5 border rounded text-xs bg-background/50">
                  {task.form}
                </span>
              </div>
            )}
          </div>
          
          {task.confirmed && task.completionDate && (
            <div className="text-xs text-primary/80 mt-2 font-medium">
              确认时间: {format(new Date(task.completionDate), "yyyy-MM-dd HH:mm")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
