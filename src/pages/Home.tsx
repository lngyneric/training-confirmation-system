import { useState, useEffect, useMemo, useRef } from "react";
import { parseTasks, parseCSV, exportToCSV } from "@/lib/data-parser";
import type { Section, Task, RawTaskRow } from "@/lib/data-parser";
import { loadConfirmationsFromSqlite, saveConfirmationsToSqlite } from "@/lib/sqlite";
import { TaskCard } from "@/components/TaskCard";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { TrainingDimensionsChart } from "@/components/TrainingDimensionsChart";
import { useSync } from "@/hooks/use-sync";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  LogOut,
  FileSpreadsheet,
  TrendingUp,
  Settings2
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

interface UserSettings {
  showSection2: boolean;
  setupCompleted: boolean;
}

export default function Home() {
  // --- State ---
  const [sections, setSections] = useState<Section[]>([]);
  const [confirmations, setConfirmations] = useState<ConfirmationState>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activePage, setActivePage] = useState("onboarding"); // onboarding, ceibs, ai
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar
  const [showSetup, setShowSetup] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({ showSection2: false, setupCompleted: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Initialization ---
  useEffect(() => {
    // Parse initial data
    const parsed = parseTasks(rawTasks as RawTaskRow[]);
    
    // Filter out unwanted sections (Requirements: Remove Periodic generic header if strictly "周期", Name/Score sections)
    // Keep "第一阶段", "第二阶段", "第三阶段" as per user request
    const cleanSections = parsed.filter(s => {
       const title = s.title || "";
       // Exclude Name/Score summary sections
       if (title.includes("个人学分制汇总") ||
           title.includes("姓名")) {
           return false;
       }
       // Also exclude if title is exactly "周期" (generic header row)
       if (title === "周期") return false;
       
       return true;
    });

    setSections(cleanSections);

    // Load local storage
    const stored = localStorage.getItem("training-confirmations");
    if (stored) {
      try {
        setConfirmations(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load local storage", e);
      }
    }

    const storedSettings = localStorage.getItem("training-settings");
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    } else {
      setShowSetup(true);
    }
  }, []);

  // --- Handlers ---
  const handleSaveSettings = () => {
    const newSettings = { ...settings, setupCompleted: true };
    setSettings(newSettings);
    localStorage.setItem("training-settings", JSON.stringify(newSettings));
    setShowSetup(false);
    toast.success("设置已保存");
  };

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
    if (user?.id) {
      saveConfirmationsToSqlite(user.id, newState);
    }
    
    // Sync to cloud
    if (isConfigured) {
      saveToCloud(newState);
    }
    
    if (checked) {
      toast.success("任务状态已更新", {
        description: "已标记为完成",
      });
    }
  };

  const handleExportJSON = () => {
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
    toast.success("JSON 导出成功");
  };

  const handleExportCSV = () => {
    const tasksToExport = sections.flatMap(s => s.tasks.map(t => ({
      ...t,
      confirmed: confirmations[t.id]?.confirmed || false,
      completionDate: confirmations[t.id]?.date || undefined,
    })));
    const csvContent = exportToCSV(tasksToExport);
    // Add BOM for Excel UTF-8 compatibility
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `training-export-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("CSV 导出成功");
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const parsedSections = parseCSV(content);
        if (parsedSections.length === 0) {
          toast.error("CSV 解析失败", { description: "未找到有效的任务数据" });
          return;
        }
        
        // Update sections
        setSections(parsedSections);
        
        // Rebuild confirmations state from CSV data
        const newConfirmations: ConfirmationState = {};
        parsedSections.forEach(section => {
          section.tasks.forEach(task => {
            if (task.confirmed) {
              newConfirmations[task.id] = {
                confirmed: true,
                date: task.completionDate || new Date().toISOString()
              };
            }
          });
        });
        
        setConfirmations(newConfirmations);
        localStorage.setItem("training-confirmations", JSON.stringify(newConfirmations));
        toast.success("导入成功", { description: `已加载 ${parsedSections.length} 个版块` });
      } catch (error) {
        console.error("CSV Import Error:", error);
        toast.error("导入失败", { description: "文件格式可能不正确" });
      }
    };
    reader.readAsText(file);
    // Reset input value to allow re-importing same file
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const handleReset = () => {
    if (confirm("确定要重置所有进度吗？此操作无法撤销。")) {
      setConfirmations({});
      localStorage.removeItem("training-confirmations");
      toast.success("进度已重置");
    }
  };

  // --- Derived State (Stats & Filtering) ---
  const enabledSections = useMemo(() => {
    if (!settings.showSection2) {
      return sections.filter(s => !s.title.includes("版块二") && !s.title.includes("小灶"));
    }
    return sections;
  }, [sections, settings.showSection2]);

  const allTasks = useMemo(() => enabledSections.flatMap(s => s.tasks), [enabledSections]);
  
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
    return enabledSections.map(section => ({
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
  }, [enabledSections, confirmations, searchQuery, activeTab]);

  const { logout, user } = useAuth();
  const { isSyncing, lastSynced, saveToCloud, loadFromCloud, isConfigured } = useSync(user?.id, confirmations);
  const employeeName = user?.name || (rawMeta as any)["员工"] || "学员";
  const position = (rawMeta as any)["岗位"] || "岗位未知";
  
  useEffect(() => {
    if (user?.id) {
      loadConfirmationsFromSqlite(user.id).then((sqlData) => {
        if (sqlData) {
          setConfirmations(prev => {
            const merged = { ...prev, ...sqlData };
            localStorage.setItem("training-confirmations", JSON.stringify(merged));
            return merged;
          });
        }
      }).catch(() => {});
    }
  }, [user?.id]);
  
  useEffect(() => {
    if (user?.id && isConfigured) {
      loadFromCloud().then((cloudData) => {
        if (cloudData) {
          setConfirmations(prev => {
            const merged = { ...prev, ...cloudData };
            localStorage.setItem("training-confirmations", JSON.stringify(merged));
            return merged;
          });
          toast.success("云端数据已同步");
        }
      });
    }
  }, [user?.id, isConfigured]);

  // --- Heatmap Data ---
  const heatmapData = useMemo(() => {
    return Object.values(confirmations)
      .filter(c => c.confirmed && c.date)
      .map(c => ({
        date: c.date,
        count: 1
      }));
  }, [confirmations]);

  // --- Dimension Stats ---
  const dimensionStats = useMemo(() => {
    // 1. Credit-based Training (Formerly Onboarding + others) - "学分制培训"
    // Include ALL sections that are currently enabled (onboarding, optional if enabled, stages 1-3, etc.)
    // Basically, everything in the main list contributes to this dimension.
    const creditTasks = enabledSections.flatMap(s => s.tasks);
    let creditProgress = 0;
    if (creditTasks.length > 0) {
        const completed = creditTasks.filter(t => confirmations[t.id]?.confirmed).length;
        creditProgress = Math.round((completed / creditTasks.length) * 100);
    }

    // 2. CEIBS Training (Placeholder)
    let ceibsProgress = 0;
    
    // 3. AI Training - "AI培训"
    const aiProgress = 0;

    return { creditProgress, ceibsProgress, aiProgress };
  }, [enabledSections, confirmations]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* --- Setup Dialog --- */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>欢迎开始学分制培训</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              
              {/* Mandatory Sections */}
              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-secondary/20">
                <Label className="flex flex-col space-y-1">
                  <span className="font-semibold">板块一：入职培训</span>
                  <span className="font-normal text-xs text-muted-foreground">所有员工入职三天内完成（默认）</span>
                </Label>
                <Switch checked={true} disabled />
              </div>

              {/* Optional Section */}
              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg border-primary/20 bg-primary/5">
                 <Label htmlFor="section2" className="flex flex-col space-y-1">
                  <span className="font-semibold text-primary">板块二：小灶培训</span>
                  <span className="font-normal text-xs text-muted-foreground">新入职和新晋主管以上员工（可选）</span>
                </Label>
                <Switch 
                  id="section2" 
                  checked={settings.showSection2} 
                  onCheckedChange={(checked) => setSettings({...settings, showSection2: checked})} 
                />
              </div>

              {/* Other Mandatory Sections */}
              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-secondary/20">
                <Label className="flex flex-col space-y-1">
                  <span className="font-semibold">板块三：集中培训</span>
                  <span className="font-normal text-xs text-muted-foreground">所有员工入职三个月内（默认）</span>
                </Label>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-secondary/20">
                <Label className="flex flex-col space-y-1">
                  <span className="font-semibold">带教第一阶段</span>
                  <span className="font-normal text-xs text-muted-foreground">入职1~2个月（默认）</span>
                </Label>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-secondary/20">
                <Label className="flex flex-col space-y-1">
                  <span className="font-semibold">带教第二阶段</span>
                  <span className="font-normal text-xs text-muted-foreground">入职1~2个月（默认）</span>
                </Label>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-secondary/20">
                <Label className="flex flex-col space-y-1">
                  <span className="font-semibold">带教第三阶段</span>
                  <span className="font-normal text-xs text-muted-foreground">入职1~2个月（默认）</span>
                </Label>
                <Switch checked={true} disabled />
              </div>

            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveSettings}>开始培训</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Header / Hero --- */}
      <div className="relative h-64 w-full bg-slate-900 overflow-hidden shadow-xl">
        <img 
          src={heroBanner} 
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute top-4 right-4 z-20 flex gap-2">
           <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => setShowSetup(true)} title="培训设置">
            <Settings2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={logout} title="退出登录">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="space-y-2 animate-in slide-in-from-bottom-5 duration-700">
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 backdrop-blur-sm mb-2">
              培训计划全景
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary drop-shadow-sm">
              {employeeName}
            </h1>
            <p className="text-muted-foreground/80 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              {position}
            </p>
          </div>

          <div className="w-full md:w-80 animate-in fade-in zoom-in duration-700 delay-200">
             <TrainingDimensionsChart 
                creditProgress={dimensionStats.creditProgress}
                ceibsProgress={dimensionStats.ceibsProgress}
                aiProgress={dimensionStats.aiProgress}
                showCeibs={settings.showSection2}
              />
          </div>
        </div>

        {/* --- Navigation Bar --- */}
        <div className="absolute bottom-0 left-0 right-0 bg-background/50 backdrop-blur-md border-t border-white/10">
             <div className="max-w-7xl mx-auto flex">
                <button 
                    onClick={() => setActivePage("onboarding")}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activePage === "onboarding" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                >
                    学分制培训
                </button>
                <button 
                    onClick={() => setActivePage("ceibs")}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activePage === "ceibs" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                >
                    中欧培训
                </button>
                <button 
                    onClick={() => setActivePage("ai")}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activePage === "ai" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                >
                    AI培训
                </button>
             </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* === Onboarding Page === */}
        {activePage === "onboarding" && (
            <div className="flex flex-col md:flex-row gap-8">
                {/* --- Sidebar (Navigation) --- */}
                <aside className="hidden md:block w-64 shrink-0 space-y-6 sticky top-8 h-fit">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold tracking-tight px-2">阶段导航</h3>
            <ScrollArea className="h-[calc(100vh-400px)]">
              <nav className="space-y-1 p-1">
                {enabledSections.map((section, idx) => {
                  const sStats = {
                    total: section.tasks.length,
                    done: section.tasks.filter(t => confirmations[t.id]?.confirmed).length
                  };
                  const sectionId = `section-${section.title.replace(/\s+/g, '-')}`;
                  return (
                    <button
                      key={idx}
                      onClick={() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" })}
                      className="group w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      <span className="truncate flex-1 mr-2">{section.title}</span>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-secondary text-muted-foreground group-hover:bg-white group-hover:text-primary transition-colors">
                        {sStats.done}/{sStats.total}
                      </Badge>
                    </button>
                  );
                })}
              </nav>
              </ScrollArea>
            </div>
            
            <Card className="p-4 bg-secondary/30 border-none">
                <h4 className="font-medium text-sm mb-3">操作面板</h4>
                <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2 bg-background hover:bg-primary hover:text-primary-foreground transition-colors" onClick={handleExportJSON}>
                    <Download className="w-4 h-4" /> 导出记录 (JSON)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 bg-background hover:bg-primary hover:text-primary-foreground transition-colors" onClick={handleExportCSV}>
                    <FileSpreadsheet className="w-4 h-4" /> 导出记录 (CSV)
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
                <div className="relative">
                    <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleImportCSV}
                    />
                    <Button variant="outline" className="w-full justify-start gap-2 bg-background hover:bg-primary hover:text-primary-foreground transition-colors">
                    <FileSpreadsheet className="w-4 h-4" /> 导入进度 (CSV)
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
          
          {/* Heatmap Section */}
          <div className="hidden md:block pb-4">
             <ActivityHeatmap data={heatmapData} />
          </div>

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
            {/* Note: Removed duplicate/commented out control blocks */}

          {/* Content */}
          <div className="space-y-8 pb-20">
            {filteredSections.length > 0 ? (
              filteredSections.map((section, idx) => {
                const sectionId = `section-${section.title.replace(/\s+/g, '-')}`;
                return (
                <div key={idx} id={sectionId} className="scroll-mt-24 space-y-4">
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
              )})
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
      )}

      {/* === CEIBS Page === */}
      {activePage === "ceibs" && (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4 max-w-lg">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">中欧培训计划</h2>
                <p className="text-muted-foreground text-lg">
                    该模块正在建设中，敬请期待。我们将为您提供专业的中欧商业在线培训课程。
                </p>
                <div className="pt-8">
                        <Button variant="outline" onClick={() => setActivePage("onboarding")}>
                        返回入职培训
                        </Button>
                </div>
            </div>
        </div>
      )}

      {/* === AI Page === */}
      {activePage === "ai" && (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4 max-w-lg">
                    <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-12 h-12 text-purple-500" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">AI能力培训</h2>
                <p className="text-muted-foreground text-lg">
                    探索人工智能的前沿应用，提升您的数字化工作能力。该模块即将上线。
                </p>
                <div className="pt-8">
                        <Button variant="outline" onClick={() => setActivePage("onboarding")}>
                        返回入职培训
                        </Button>
                </div>
            </div>
        </div>
      )}
    </div>
    </div>
  );
}
