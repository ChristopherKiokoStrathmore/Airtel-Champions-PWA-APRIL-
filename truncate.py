import sys
import os

filename = r"C:\DEV\PWA\Airtel Champions App Web\src\components\hbb\hbb-agent-dashboard.tsx"
lines = []
with open(filename, 'r', encoding='utf-8') as f:
    lines = f.readlines()
with open(filename, 'w', encoding='utf-8') as f:
    f.writelines(lines[:568])
