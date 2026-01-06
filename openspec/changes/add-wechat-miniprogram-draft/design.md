# Design: WeChat Mini Program Integration

## Architecture
- **Framework**: Taro with React.
- **Location**: `miniprogram` root directory.
- **Code Sharing**:
  - We will treat the mini-program as a separate client in the same repo.
  - Future refactoring could move shared types/utils to a `packages/shared` workspace, but for now, we will keep them independent to minimize disruption to the web app.

## UI/UX
- **Navigation**: Native Tab bar (Home, Profile).
- **Components**: Native `View`, `Text`, `Image` components from `@tarojs/components`.
- **Styling**: Tailwind CSS (via `taro-plugin-tailwind` or equivalent) to match the web app's design language.

## Data
- **Data Source**: Replicate the static data structure from `src/assets/tasks.json`.
- **State**: React Context or simple hooks.

## Authentication & Enterprise Support
- **Standard WeChat**: Uses `Taro.login` (maps to `wx.login`) to get the code.
- **Enterprise WeChat (WeCom)**: Taro supports Enterprise WeChat as a build target.
  - Authentication uses `wx.qy.login` (Enterprise WeChat specific API).
  - We will implement an abstraction layer for login to support both standard and enterprise modes if needed, but primarily focus on standard `wx.login` initially while ensuring the architecture allows `qy.login`.
  - **Verification**: Confirmed that Taro supports Enterprise WeChat Mini Program development and authentication flows.

## Constraints
- **Authentication**: Will simulate authentication or use `wx.login` stub since there is no real backend.
- **Deployment**: Requires WeChat Developer Tools for preview/upload.
