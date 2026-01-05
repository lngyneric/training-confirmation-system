import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Smartphone, Users } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpeg";

// --- CONFIGURATION ---
// 请在此处填入您的企业微信应用配置
const WECOM_CONFIG = {
  appid: "wx1c6695d7030171b2", // 企业ID (CorpID)
  agentid: "1000029", // 应用ID (AgentID)
  redirect_uri: encodeURIComponent(window.location.origin), // 回调地址
  state: "login_state",
  style: "", // 可选 'black', 'white'
  href: "", // 自定义样式链接
};

export default function Login() {
  const { login } = useAuth();
  const [demoName, setDemoName] = useState("邹锋静");

  // Load WeCom Script
  useEffect(() => {
    const scriptId = "ww-login-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://wwcdn.weixin.qq.com/node/wework/wwopen/js/wwLogin-1.2.7.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Initialize WeCom Login Widget
  const initWeComLogin = () => {
    // Check if script is loaded and config is set
    // @ts-ignore
    if (window.WwLogin && WECOM_CONFIG.appid) {
      // @ts-ignore
      new window.WwLogin({
        id: "wx_reg",
        ...WECOM_CONFIG,
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-slate-900/90" />
        <img 
          src={heroBanner} 
          className="w-full h-full object-cover opacity-20 mix-blend-overlay"
          alt="Background" 
        />
      </div>

      <Card className="w-full max-w-md z-10 shadow-2xl border-none bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">培训确认系统</CardTitle>
          <CardDescription>请登录以访问您的培训仪表盘</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="demo" onValueChange={(v) => v === "scan" && setTimeout(initWeComLogin, 100)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="scan">
                <Smartphone className="w-4 h-4 mr-2" />
                企业微信扫码
              </TabsTrigger>
              <TabsTrigger value="demo">
                <Users className="w-4 h-4 mr-2" />
                演示登录
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scan">
              <div className="min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-4 bg-slate-50">
                <div id="wx_reg"></div>
                
                {false && (
                  <div className="text-center space-y-2 mt-4 max-w-xs">
                    <p className="text-sm text-muted-foreground">未检测到企业微信配置</p>
                    <Alert variant="destructive" className="text-left text-xs">
                      <Info className="h-4 w-4" />
                      <AlertTitle>配置说明</AlertTitle>
                      <AlertDescription>
                        请在代码 <code>src/pages/Login.tsx</code> 中填入您的 CorpID 和 AgentID 以启用扫码功能。
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="demo">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>学员姓名</Label>
                  <Input 
                    value={demoName} 
                    onChange={(e) => setDemoName(e.target.value)} 
                    placeholder="请输入姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label>演示说明</Label>
                  <div className="text-sm text-muted-foreground bg-slate-100 p-3 rounded">
                    此模式用于快速预览系统功能。无需真实验证，点击登录即可进入系统。
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => login({ id: "demo", name: demoName })}
                >
                  进入系统
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
