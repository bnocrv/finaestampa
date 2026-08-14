@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://docs.google.com/spreadsheets/d/e/2PACX-1vStGTh9ffFAbSMZouqq61hP9D_FTPxEGHVbi2EJs2vhtKWJkzdEtCFbICb_Lp8MIx_NMD4f8XpRxWZZ/pub?gid=0&single=true&output=csv' -OutFile 'produtos.csv'"
node -e "const fs=require('fs');const csv=fs.readFileSync('produtos.csv','utf8');fs.writeFileSync('produtos.js','window.PRODUTOS_CSV = '+JSON.stringify(csv)+';\n','utf8');"
echo Base atualizada.
pause
