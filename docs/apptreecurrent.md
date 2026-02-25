# 📁 App Tree – QVC Super App

> Auto-generated luc: 25/02/2026 16:05:50,21
> Project: `F:\project\appqvc2026`

---

## 📂 src/ – Core Source

```
Folder PATH listing for volume data2
Volume serial number is 00000042 5638:1482
F:\PROJECT\APPQVC2026\SRC
+---components
|   +---blocks
|   |       BannerBlock.tsx
|   |       CameraBlock.tsx
|   |       CommentBlock.tsx
|   |       FeedActionBlock.tsx
|   |       GpsBlock.tsx
|   |       GridMenuBlock.tsx
|   |       HtmlBlock.tsx
|   |       ImageBlock.tsx
|   |       PostComposerBlock.tsx
|   |       ProfileHeaderBlock.tsx
|   |       SduiEngine.tsx
|   |       SocialFeedBlock.tsx
|   |       StoryBlock.tsx
|   |       SummaryCardBlock.tsx
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
|       SocketService.ts
|       StorageService.ts
|       
+---stores
|       useAuthStore.ts
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
Volume serial number is 00000001 5638:1482
F:\PROJECT\APPQVC2026\APP
|   +not-found.tsx
|   _layout.tsx
|   
+---(auth)
|       login.tsx
|       _layout.tsx
|       
\---(main)
        chat.tsx
        checkin.tsx
        crm.tsx
        index.tsx
        more.tsx
        notifications.tsx
        profile.tsx
        reports.tsx
        tasks.tsx
        _layout.tsx
        
```

## 📂 docs/ – Tài liệu

```
apptreecurrent.md
AUDIT_REPORT.md
AUDIT_SYSTEM_V3.md
BACKEND_CONTROL_GUIDE.md
BUILD_AND_TEST_GUIDE.md
CODE_STRUCTURE_AND_SDUI_SYNC.md
Danh_Sach_API.md
EXPO_BUILD_WINDOWS.md
Ho_so_thiet_ke_he_thong.md
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
tsconfig.json
```

---

## 📊 Thống kê
 
| Muc | So luong | 
|---|---| 
| TypeScript files (src/ + app/) | 70 | 
| Core Services | 7 | 
 
--- 
 
*Chay lai `generate_apptree.bat` de cap nhat* 
