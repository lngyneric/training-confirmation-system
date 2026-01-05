import { useState, useEffect, useMemo } from "react";
import { parseTasks } from "@/lib/data-parser";
import type { Section, Task, RawTaskRow } from "@/lib/data-parser";
import { TaskCard } from "@/components/TaskCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Download, 
  Upload, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  ListTodo,
  FileText,
  Menu,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { saveAs } from "file-saver";
import heroBanner from "@/assets/hero-banner.jpeg";
import emptyState from "@/assets/empty-state.jpeg";
import rawTasks from "@/assets/tasks.json";
import rawMeta from "@/assets/meta.json";

// Types for Local Storage
interface ConfirmationState {
  [id: string]: {
    confirmed: boolean;
    date: string;
  };
}

export default function Home() {
  // --- State ---
  const [sections, setSections] = useState<Section[]>([]);
  const [confirmations, setConfirmations] = useState<ConfirmationState>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar

  // --- Initialization ---
  useEffect(() => {
    // Parse initial data
    const parsed = parseTasks(rawTasks as RawTaskRow[]);
    setSections(parsed);

    // Load local storage
    const stored = localStorage.getItem("training-confirmations");
    if (stored) {
      try {
        setConfirmations(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load local storage", e);
      }
    }
  }, []);

  // --- Handlers ---
  const handleConfirm = (id: string, checked: boolean) => {
    const newState = {
      ...confirmations,
      [id]: {
        confirmed: checked,
        date: checked ? new Date().toISOString() : "",
      },
    };
    setConfirmations(newState);
    localStorage.setItem("training-confirmations", JSON.stringify(newState));
    
    if (checked) {
      toast.success("任务状态已更新", {
        description: "已标记为完成",
      });
    }
  };

  const handleExport = () => {
    const exportData = {
      meta: rawMeta,
      progress: stats,
      tasks: sections.flatMap(s => s.tasks.map(t => ({
        ...t,
        confirmed: confirmations[t.id]?.confirmed || false,
        completionDate: confirmations[t.id]?.date || null,
      })))
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    saveAs(blob, `training-export-${new Date().toISOString().slice(0, 10)}.json`);
    toast.success("导出成功");
  };

  const handleReset = () => {
    if (confirm("确定要重置所有进度吗？此操作无法撤销。")) {
      setConfirmations({});
      localStorage.removeItem("training-confirmations");
      toast.success("进度已重置");
    }
  };

  // --- Derived State (Stats & Filtering) ---
  const allTasks = useMemo(() => sections.flatMap(s => s.tasks), [sections]);
  
  const stats = useMemo(() => {
    const total = allTasks.length;
    const completed = allTasks.filter(t => confirmations[t.id]?.confirmed).length;
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [allTasks, confirmations]);

  const filteredSections = useMemo(() => {
    return sections.map(section => ({
      ...section,
      tasks: section.tasks.map(task => ({
        ...task,
        confirmed: confirmations[task.id]?.confirmed || false,
        completionDate: confirmations[task.id]?.date || undefined
      })).filter(task => {
        const matchesSearch = task.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              task.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === "all" ? true :
                           activeTab === "completed" ? task.confirmed :
                           !task.confirmed; // pending
        return matchesSearch && matchesTab;
      })
    })).filter(s => s.tasks.length > 0);
  }, [sections, confirmations, searchQuery, activeTab]);

  const { logout, user } = useAuth();
  const employeeName = user?.name || (rawMeta as any)["员工"] || "学员";
  const position = (rawMeta as any)["岗位"] || "岗位未知";

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* --- Header / Hero --- */}
      <div className="relative h-64 w-full bg-slate-900 overflow-hidden shadow-xl">
        <img 
          src={heroBanner} 
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute top-4 right-4 z-20">
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={logout} title="退出登录">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="space-y-2 animate-in slide-in-from-bottom-5 duration-700">
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 backdrop-blur-sm mb-2">
              入职培训计划
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary drop-shadow-sm">
              {employeeName}
            </h1>
            <p className="text-muted-foreground/80 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              {position}
            </p>
          </div>

          <Card className="p-4 bg-background/80 backdrop-blur-md border-primary/10 shadow-lg w-full md:w-80 animate-in fade-in zoom-in duration-700 delay-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">总进度</span>
              <span className="text-2xl font-bold text-primary">{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-2.5 bg-secondary" />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{stats.completed} 完成</span>
              <span>{stats.total} 总计</span>
            </div>
          </Card>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
        
        {/* --- Sidebar (Navigation) --- */}
        <aside className="hidden md:block w-64 shrink-0 space-y-6 sticky top-8 h-fit">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight px-2">阶段导航</h3>
            <ScrollArea className="h-[calc(100vh-400px)]">
              <nav className="space-y-1 p-1">
                {sections.map((section, idx) => {
                  const sStats = {
                    total: section.tasks.length,
                    done: section.tasks.filter(t => confirmations[t.id]?.confirmed).length
                  };
                  return (
                    <a
                      key={idx}
                      href={`#section-${idx}`}
                      className="group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="truncate flex-1 mr-2">{section.title}</span>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-secondary text-muted-foreground group-hover:bg-white group-hover:text-primary transition-colors">
                        {sStats.done}/{sStats.total}
                      </Badge>
                    </a>
                  );
                })}
              </nav>
            </ScrollArea>
          </div>

          <Card className="p-4 bg-secondary/30 border-none">
            <h4 className="font-medium text-sm mb-3">操作面板</h4>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2 bg-background hover:bg-primary hover:text-primary-foreground transition-colors" onClick={handleExport}>
                <Download className="w-4 h-4" /> 导出记录 (JSON)
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const json = JSON.parse(ev.target?.result as string);
                        if (json.tasks && Array.isArray(json.tasks)) {
                          // Reconstruct confirmation state from imported tasks
                          const newConf: ConfirmationState = {};
                          json.tasks.forEach((t: any) => {
                            if (t.confirmed) {
                              newConf[t.id] = { confirmed: true, date: t.completionDate || new Date().toISOString() };
                            }
                          });
                          setConfirmations(newConf);
                          localStorage.setItem("training-confirmations", JSON.stringify(newConf));
                          toast.success("导入成功", { description: `已恢复 ${Object.keys(newConf).length} 条记录` });
                        } else {
                          toast.error("无效的文件格式");
                        }
                      } catch (err) {
                        toast.error("解析失败");
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = ""; // Reset
                  }}
                />
                <Button variant="outline" className="w-full justify-start gap-2 bg-background hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Upload className="w-4 h-4" /> 导入进度 (JSON)
                </Button>
              </div>
              <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" /> 重置进度
              </Button>
            </div>
          </Card>
        </aside>

        {/* --- Main List --- */}
        <main className="flex-1 space-y-6">
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索任务..."
                className="pl-9 bg-secondary/30 border-primary/10 focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="pending">待办</TabsTrigger>
                <TabsTrigger value="completed">已完成</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="space-y-8 pb-20">
            {filteredSections.length > 0 ? (
              filteredSections.map((section, idx) => (
                <div key={idx} id={`section-${idx}`} className="scroll-mt-24 space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className="h-6 w-1 rounded-full bg-primary" />
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      {section.title}
                    </h2>
                  </div>
                  
                  <div className="grid gap-2">
                    {section.tasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onConfirm={handleConfirm} 
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                <img src={emptyState} alt="Empty" className="w-48 h-48 opacity-80 mb-6 mix-blend-multiply" />
                <h3 className="text-xl font-semibold text-foreground mb-2">暂无任务</h3>
                <p className="text-muted-foreground max-w-sm">
                  没有找到匹配的任务。尝试调整搜索关键词或切换筛选状态。
                </p>
                <Button 
                  variant="link" 
                  className="mt-4 text-primary"
                  onClick={() => {setSearchQuery(""); setActiveTab("all");}}
                >
                  清除所有筛选
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
