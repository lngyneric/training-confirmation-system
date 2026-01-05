# Docker 本地发布与测试环境部署指南

本文档介绍如何使用 Docker 在本地构建和部署“培训任务确认管理系统”的发布服务器。该方案包含完整的构建流程（源码 -> 构建 -> 静态资源 -> Nginx 托管）。

## 1. 所需组件

要构建本地发布应用服务器，您的环境需要以下基础组件：

*   **Docker Engine**: 容器运行环境。
*   **Docker Compose**: 用于编排和管理多容器应用的工具（通常随 Docker Desktop 一起安装）。
*   **源代码**: 本项目的完整代码（包含 `package.json`, `src/`, `nginx.conf` 等）。

## 2. 部署文件说明

我们在项目中预置了以下关键文件用于部署：

*   **`Dockerfile`**: 
    *   **Stage 1 (Build)**: 使用 `node:20-alpine` 镜像，安装依赖并执行 `pnpm build`，生成生产环境的静态文件 (`dist/`)。
    *   **Stage 2 (Serve)**: 使用 `nginx:alpine` 镜像，将生成的静态文件复制到 Nginx 目录，并应用自定义配置。
*   **`nginx.conf`**: 
    *   Nginx 配置文件，专门针对 SPA（单页应用）进行了优化。
    *   配置了 `try_files` 以支持前端路由（防止刷新 404）。
    *   开启了 Gzip 压缩以提高加载速度。
*   **`docker-compose.yml`**: 
    *   编排文件，定义了服务名称、端口映射 (`8080:80`) 和重启策略。

## 3. 部署步骤

### 第一步：启动服务

在项目根目录（包含 `docker-compose.yml` 的目录）打开终端，运行以下命令：

```bash
# 构建镜像并后台启动容器
docker-compose up -d --build
```

系统将会：
1.  下载 Node.js 和 Nginx 基础镜像。
2.  自动安装依赖并编译 React 代码（构建时间取决于电脑性能）。
3.  启动 Nginx 服务并映射到本地端口。

### 第二步：访问测试

部署完成后，打开浏览器访问：

**http://localhost:8080**

### 第三步：管理命令

*   **查看运行状态**:
    ```bash
    docker-compose ps
    ```

*   **查看服务日志** (如果遇到访问问题):
    ```bash
    docker-compose logs -f
    ```

*   **停止服务**:
    ```bash
    docker-compose down
    ```

## 4. 常见问题

*   **端口冲突**: 如果 8080 端口已被占用，请修改 `docker-compose.yml` 中的 `ports` 部分，例如改为 `"8081:80"`。
*   **代码更新**: 如果您修改了源代码，请再次运行 `docker-compose up -d --build` 以重新构建镜像。
