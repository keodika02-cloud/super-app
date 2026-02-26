# 📁 App Tree – QVC Super App

> Auto-generated luc: 26/02/2026  8:58:09,88
> Project: `F:\project\appqvc2026`

---

## 📂 src/ – Core Source

```
Folder PATH listing for volume data2
Volume serial number is 00000015 5638:1482
F:\PROJECT\APPQVC2026\SRC
+---components
|   +---blocks
|   |       BannerBlock.tsx
|   |       CameraBlock.tsx
|   |       CommentBlock.tsx
|   |       DetailViewBlock.tsx
|   |       FeedActionBlock.tsx
|   |       FormInputBlock.tsx
|   |       GpsBlock.tsx
|   |       GridMenuBlock.tsx
|   |       HtmlBlock.tsx
|   |       ImageBlock.tsx
|   |       ListGroupBlock.tsx
|   |       PostComposerBlock.tsx
|   |       ProfileHeaderBlock.tsx
|   |       SduiEngine.tsx
|   |       SocialFeedBlock.tsx
|   |       StoryBlock.tsx
|   |       SummaryCardBlock.tsx
|   |       TaskBoardBlock.tsx
|   |       UnknownBlock.tsx
|   |       UploadBlock.tsx
|   |       
|   +---error
|   |       BlockBoundary.tsx
|   |       ErrorBoundary.tsx
|   |       
|   +---layout
|   |       SafeScreen.tsx
|   |       ScreenWrapper.tsx
|   |       
|   +---modals
|   |       CreatePostModal.tsx
|   |       
|   \---ui
|           AppButton.tsx
|           GlassCard.tsx
|           SkeletonCard.tsx
|           
+---config
|       api-endpoints.ts
|       env.ts
|       query-client.ts
|       query-keys.ts
|       ScreenConfigs.ts
|       
+---core
|   |   query-client.ts
|   |   
|   +---hardware
|   |       useSafeHardware.ts
|   |       useSafeLocation.ts
|   |       
|   +---hooks
|   |       useNetworkStatus.ts
|   |       
|   +---sdui
|   |       LayoutEngine.tsx
|   |       
|   \---storage
|           storage.service.ts
|           
+---domain
|   \---auth
|           auth.types.ts
|           
+---hooks
|       useHybridData.ts
|       useNavigation.ts
|       useScreenData.ts
|       
+---screens
|       CheckInScreen.tsx
|       CrmWebViewScreen.tsx
|       LoginScreen.tsx
|       NotificationScreen.tsx
|       ProfileScreen.tsx
|       
+---services
|       ApiClient.ts
|       BridgeService.ts
|       HardwareService.ts
|       MediaService.ts
|       NotificationService.ts
|       RemoteLogger.ts
|       SocketService.ts
|       StorageService.ts
|       
+---stores
|       useAuthStore.ts
|       useChatStore.ts
|       useUserStore.ts
|       
+---types
|       api.ts
|       auth.ts
|       
\---utils
        ActionRegistry.ts
        safe.ts
        
```

## 📂 app/ – Expo Router Pages

```
Folder PATH listing for volume data2
Volume serial number is 000000BE 5638:1482
F:\PROJECT\APPQVC2026\APP
|   +not-found.tsx
|   newsfeed.tsx
|   _layout.tsx
|   
+---(auth)
|       login.tsx
|       _layout.tsx
|       
+---(main)
|       chat.tsx
|       checkin.tsx
|       crm.tsx
|       index.tsx
|       more.tsx
|       notifications.tsx
|       profile.tsx
|       reports.tsx
|       tasks.tsx
|       _layout.tsx
|       
+---admin
|       broadcast.tsx
|       
\---chat
        create.tsx
        [id].tsx
        
```

## 📂 docs/ – Tài liệu

```
apptreecurrent.md
archive
AUDIT_REPORT.md
BACKEND_CONTROL_GUIDE.md
BUILD_AND_TEST_GUIDE.md
CODE_STRUCTURE_AND_SDUI_SYNC.md
EXPO_BUILD_WINDOWS.md
POLYMORPHIC_INTERACTION_SYSTEM.md
SDUI_ARCHITECTURE.md
SDUI_CONTROL_STRUCTURE.json
SYSTEM_OVERVIEW.md
```

## 📄 Root Config Files

```
.env
.env.example
.gitignore
app.json
App.tsx
babel.config.js
eas.json
expo-env.d.ts
generate_apptree.bat
global.css
index.ts
metro.config.js.bak
package-lock.json
package.json
REAL_DATA_MAPPING.md
tailwind.config.js
temp_app.txt
temp_docs.txt
temp_src.txt
test-push.js
tsconfig.json
```

---

## 📊 Thống kê
 
| Muc | So luong | 
|---|---| 
| TypeScript files (src/ + app/) | 81 | 
| Core Services | 8 | 
 
--- 
 
*Chay lai `generate_apptree.bat` de cap nhat* 
