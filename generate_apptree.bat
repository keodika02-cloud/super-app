@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: =============================================================
:: generate_apptree.bat
:: Tự động tạo docs/apptreecurrent.md với:
::   - Cây thư mục src/ + app/ + docs/
::   - Ngày giờ tạo
::   - Thống kê số file
:: Cách dùng: Double-click file này hoặc chạy trong terminal
:: =============================================================

set "PROJECT_DIR=F:\project\appqvc2026"
set "OUTPUT=%PROJECT_DIR%\docs\apptreecurrent.md"
set "DATE_NOW=%DATE%"
set "TIME_NOW=%TIME%"

echo Dang tao apptreecurrent.md ...

(
echo # 📁 App Tree – QVC Super App
echo.
echo ^> Auto-generated luc: %DATE_NOW% %TIME_NOW%
echo ^> Project: `F:\project\appqvc2026`
echo.
echo ---
echo.
echo ## 📂 src/ – Core Source
echo.
echo ```
) > "%OUTPUT%"

tree "%PROJECT_DIR%\src" /F /A >> "%OUTPUT%" 2>nul

(
echo ```
echo.
echo ## 📂 app/ – Expo Router Pages
echo.
echo ```
) >> "%OUTPUT%"

tree "%PROJECT_DIR%\app" /F /A >> "%OUTPUT%" 2>nul

(
echo ```
echo.
echo ## 📂 docs/ – Tài liệu
echo.
echo ```
) >> "%OUTPUT%"

dir "%PROJECT_DIR%\docs" /B >> "%OUTPUT%" 2>nul

(
echo ```
echo.
echo ## 📄 Root Config Files
echo.
echo ```
) >> "%OUTPUT%"

dir "%PROJECT_DIR%" /B /A:-D >> "%OUTPUT%" 2>nul

(
echo ```
echo.
echo ---
echo.
echo ## 📊 Thống kê
) >> "%OUTPUT%"

:: Đếm file TypeScript
set TSX_COUNT=0
for /R "%PROJECT_DIR%\src" %%F in (*.ts *.tsx) do set /a TSX_COUNT+=1
for /R "%PROJECT_DIR%\app" %%F in (*.ts *.tsx) do set /a TSX_COUNT+=1

:: Đếm file service
set SVC_COUNT=0
for /R "%PROJECT_DIR%\src\services" %%F in (*.ts) do set /a SVC_COUNT+=1

echo. >> "%OUTPUT%"
echo ^| Muc ^| So luong ^| >> "%OUTPUT%"
echo ^|---^|---^| >> "%OUTPUT%"
echo ^| TypeScript files (src/ + app/) ^| %TSX_COUNT% ^| >> "%OUTPUT%"
echo ^| Core Services ^| %SVC_COUNT% ^| >> "%OUTPUT%"

echo. >> "%OUTPUT%"
echo --- >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo *Chay lai `generate_apptree.bat` de cap nhat* >> "%OUTPUT%"

echo.
echo [OK] Da tao: %OUTPUT%
echo Bam phim bat ky de dong...
pause >nul
