# 📁 App Tree – QVC Super App

> Auto-generated luc: 25/02/2026  8:42:22,72
> Project: `F:\project\appqvc2026`

---

## 📂 src/ – Core Source

```
Folder PATH listing for volume data2
Volume serial number is 000000AD 5638:1482
F:\PROJECT\APPQVC2026\SRC
+---components
|   +---error
|   |       ErrorBoundary.tsx
|   |       
|   +---layout
|   |       ScreenWrapper.tsx
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
Volume serial number is 0000004B 5638:1482
F:\PROJECT\APPQVC2026\APP
|   +not-found.tsx
|   _layout.tsx
|   
+---(auth)
|       login.tsx
|       _layout.tsx
|       
\---(main)
        checkin.tsx
        crm.tsx
        index.tsx
        notifications.tsx
        profile.tsx
        tasks.tsx
        _layout.tsx
        
```

## 📂 docs/ – Tài liệu

```
apptreecurrent.md
AUDIT_REPORT.md
BUILD_AND_TEST_GUIDE.md
CODE_REVIEW_2026.md
CODE_STRUCTURE_AND_SDUI_SYNC.md
Danh_Sach_API.md
EXPO_BUILD_WINDOWS.md
Ho_so_thiet_ke_he_thong.md
SDUI_100_PERCENT_SYNC_STRATEGY.md
SDUI_ARCHITECTURE.md
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
| TypeScript files (src/ + app/) | 44 | 
| Core Services | 6 | 
 
--- 
 
*Chay lai `generate_apptree.bat` de cap nhat* 
