@echo off
cd C:\Users\MAE\Downloads\claude
start "Python Server" cmd /c "python -m http.server 8000"
start "" "msedge" "http://localhost:8000/tools/seo-helper.html"