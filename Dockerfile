# === Stage 1: 构建阶段 (Build Stage) ===
# 使用 Node.js Alpine 镜像作为构建环境
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm (使用 corepack 或 npm 全局安装)
RUN npm install -g pnpm

# 复制依赖定义文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制项目源代码
COPY . .

# 执行构建 (生成 dist 目录)
RUN pnpm build

# === Stage 2: 运行阶段 (Production Stage) ===
# 使用轻量级 Nginx Alpine 镜像
FROM nginx:alpine

# 复制自定义 Nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从 Stage 1 复制构建产物到 Nginx 托管目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
