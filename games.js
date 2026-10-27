// 迷霧探測對決、AI 戰術回放（從舊版研究網站搬過來）
        // --- 🌟 迷霧對決小遊戲邏輯 🌟 ---
        const fogCols = 4;
        const fogRows = 6;
        const fogCellSize = 75; // 70px + 5px gap
        let fogMap = []; // 0: empty, 1: obstacle
        let fogStartX = 3, fogStartY = 5;
        let fogTargetX = 0, fogTargetY = 0;
        let fogCurrentX = 3, fogCurrentY = 5;
        
        let fogIsHumanTurn = false;
        let fogSteps = 0;
        let fogAiTimeout = null;
        
        let fogAiKnownMap = []; 
        let fogAiVisited = [];

        function fogInitArrays() {
            fogMap = Array(fogCols * fogRows).fill(0);
            fogAiKnownMap = Array(fogCols * fogRows).fill(0);
            fogAiVisited = Array(fogCols * fogRows).fill(0);
        }

        function fogIsSolvable(testMap) {
            let queue = [{x: fogStartX, y: fogStartY}];
            let visited = Array(fogCols * fogRows).fill(false);
            visited[fogStartY * fogCols + fogStartX] = true;
            let dirs = [[0,-1], [1,0], [0,1], [-1,0]];

            while(queue.length > 0) {
                let curr = queue.shift();
                if(curr.x === fogTargetX && curr.y === fogTargetY) return true;

                for(let d of dirs) {
                    let nx = curr.x + d[0];
                    let ny = curr.y + d[1];
                    let nIdx = ny * fogCols + nx;

                    if(nx >= 0 && nx < fogCols && ny >= 0 && ny < fogRows) {
                        if(!visited[nIdx] && testMap[nIdx] === 0) {
                            visited[nIdx] = true;
                            queue.push({x: nx, y: ny});
                        }
                    }
                }
            }
            return false;
        }

        function fogGenerateMap() {
            if(fogAiTimeout) clearTimeout(fogAiTimeout);
            let mapValid = false;
            
            while(!mapValid) {
                fogInitArrays();
                let numObstacles = 6; // 固定 6 個障礙物
                let count = 0;
                while(count < numObstacles) {
                    let rx = Math.floor(Math.random() * fogCols);
                    let ry = Math.floor(Math.random() * fogRows);
                    if((rx === fogStartX && ry === fogStartY) || (rx === fogTargetX && ry === fogTargetY)) continue;
                    
                    let idx = ry * fogCols + rx;
                    if(fogMap[idx] === 0) {
                        fogMap[idx] = 1;
                        count++;
                    }
                }
                mapValid = fogIsSolvable(fogMap);
            }
            
            document.getElementById('fog-human-steps').innerText = '0';
            document.getElementById('fog-ai-steps').innerText = '0';
            fogDrawGrid(true);
            document.getElementById('fog-game-message').innerText = "地圖已生成（固定 6 個障礙物且保證有解）！";
            document.getElementById('fog-game-message').style.color = "#2F5D46";
            document.getElementById('fog-player').style.display = "none";
            fogIsHumanTurn = false;
        }

        function fogDrawGrid(isFogged) {
            const grid = document.getElementById('fog-grid');
            if(!grid) return;
            grid.innerHTML = '';
            for(let y = 0; y < fogRows; y++) {
                for(let x = 0; x < fogCols; x++) {
                    let cell = document.createElement('div');
                    cell.className = 'fog-cell';
                    cell.id = `fog-cell-${x}-${y}`;
                    
                    if(x === fogStartX && y === fogStartY) cell.classList.add('start');
                    else if(x === fogTargetX && y === fogTargetY) cell.classList.add('target');
                    
                    if(isFogged && !(x === fogStartX && y === fogStartY) && !(x === fogTargetX && y === fogTargetY)) {
                        cell.classList.add('fog');
                    } else {
                        if(fogMap[y * fogCols + x] === 1) cell.classList.add('obstacle');
                        else cell.classList.add('clear');
                    }
                    grid.appendChild(cell);
                }
            }
        }

        function fogUpdatePlayerPosition() {
            const player = document.getElementById('fog-player');
            if(!player) return;
            player.style.display = "flex";
            player.style.left = (fogCurrentX * fogCellSize + 20) + 'px'; // 調整中心偏移
            player.style.top = (fogCurrentY * fogCellSize + 20) + 'px';
            
            fogRevealCell(fogCurrentX, fogCurrentY);
            fogRevealCell(fogCurrentX + 1, fogCurrentY);
            fogRevealCell(fogCurrentX - 1, fogCurrentY);
            fogRevealCell(fogCurrentX, fogCurrentY + 1);
            fogRevealCell(fogCurrentX, fogCurrentY - 1);
        }

        function fogRevealCell(x, y) {
            if(x < 0 || x >= fogCols || y < 0 || y >= fogRows) return;
            let cell = document.getElementById(`fog-cell-${x}-${y}`);
            if(cell && cell.classList.contains('fog')) {
                cell.classList.remove('fog');
                if(fogMap[y * fogCols + x] === 1) {
                    cell.classList.add('obstacle');
                    fogAiKnownMap[y * fogCols + x] = 1;
                } else {
                    cell.classList.add('clear');
                }
            }
        }

        function fogStartHuman() {
            if(fogAiTimeout) clearTimeout(fogAiTimeout);
            if(fogMap.length === 0) fogGenerateMap(); // 保險機制
            fogDrawGrid(true);
            fogCurrentX = fogStartX; fogCurrentY = fogStartY;
            fogSteps = 0;
            document.getElementById('fog-human-steps').innerText = fogSteps;
            const p = document.getElementById('fog-player');
            p.className = "fog-player";
            fogUpdatePlayerPosition();
            fogIsHumanTurn = true;
            document.getElementById('fog-game-message').innerText = "人類回合：請使用鍵盤方向鍵 (↑ ↓ ← →) 尋找終點！";
            document.getElementById('fog-game-message').style.color = "#9A520B";
        }

        window.addEventListener('keydown', function(e) {
            if(!fogIsHumanTurn) return;
            // 只有在畫面看到遊戲時才觸發
            const wrapper = document.getElementById('fog-game-wrapper');
            if(wrapper.style.display === 'none') return;

            if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.key) > -1) {
                e.preventDefault();
            }

            let nx = fogCurrentX, ny = fogCurrentY;
            if(e.key === 'ArrowUp') ny--;
            if(e.key === 'ArrowDown') ny++;
            if(e.key === 'ArrowLeft') nx--;
            if(e.key === 'ArrowRight') nx++;
            
            if(nx >= 0 && nx < fogCols && ny >= 0 && ny < fogRows) {
                if(fogMap[ny * fogCols + nx] === 1) {
                    fogRevealCell(nx, ny);
                    document.getElementById('fog-game-message').innerText = "⚠️ 哎呀！前方有死角障礙物，請換路！";
                } else {
                    fogCurrentX = nx; fogCurrentY = ny;
                    fogSteps++;
                    document.getElementById('fog-human-steps').innerText = fogSteps;
                    fogUpdatePlayerPosition();
                    document.getElementById('fog-game-message').innerText = "探索中...";
                    
                    if(fogCurrentX === fogTargetX && fogCurrentY === fogTargetY) {
                        document.getElementById('fog-game-message').innerText = "🎉 人類挑戰成功！總共花了 " + fogSteps + " 步。";
                        fogIsHumanTurn = false;
                    }
                }
            }
        });

        function fogStartAI() {
            fogIsHumanTurn = false;
            if(fogAiTimeout) clearTimeout(fogAiTimeout);
            if(fogMap.length === 0) fogGenerateMap(); // 保險機制
            fogDrawGrid(true);
            fogCurrentX = fogStartX; fogCurrentY = fogStartY;
            fogSteps = 0;
            
            fogAiKnownMap = Array(fogCols * fogRows).fill(0);
            fogAiVisited = Array(fogCols * fogRows).fill(0);
            
            document.getElementById('fog-ai-steps').innerText = fogSteps;
            document.getElementById('fog-player').className = "fog-player ai-mode";
            fogUpdatePlayerPosition();
            document.getElementById('fog-game-message').innerText = "🤖 AI 大腦開始演算...";
            document.getElementById('fog-game-message').style.color = "#2F7A4F";
            
            fogAiTimeout = setTimeout(fogAiMove, 300);
        }

        function fogAiMove() {
            if(fogCurrentX === fogTargetX && fogCurrentY === fogTargetY) {
                document.getElementById('fog-game-message').innerText = "🤖 AI 挑戰成功！花了 " + fogSteps + " 步。快對比看看誰比較聰明！";
                return;
            }

            fogAiVisited[fogCurrentY * fogCols + fogCurrentX] += 1;
            let dirs = [[0,-1], [1,0], [0,1], [-1,0]];
            let bestDir = -1;
            let minScore = 99999;

            for(let i=0; i<dirs.length; i++) {
                let nx = fogCurrentX + dirs[i][0];
                let ny = fogCurrentY + dirs[i][1];
                
                if(nx >= 0 && nx < fogCols && ny >= 0 && ny < fogRows && fogAiKnownMap[ny * fogCols + nx] === 0) {
                    if(fogMap[ny * fogCols + nx] === 1) {
                        fogRevealCell(nx, ny);
                        fogAiKnownMap[ny * fogCols + nx] = 1;
                        document.getElementById('fog-game-message').innerText = "⚠️ AI 發現死角障礙物，寫入黑名單！重新演算...";
                        fogAiTimeout = setTimeout(fogAiMove, 500);
                        return;
                    }

                    let vCount = fogAiVisited[ny * fogCols + nx];
                    let distToTarget = Math.abs(fogTargetX - nx) + Math.abs(fogTargetY - ny);
                    let score = (vCount * 20) + distToTarget;

                    if(score < minScore) {
                        minScore = score;
                        bestDir = i;
                    }
                }
            }

            if(bestDir !== -1) {
                fogCurrentX += dirs[bestDir][0];
                fogCurrentY += dirs[bestDir][1];
                fogSteps++;
                document.getElementById('fog-ai-steps').innerText = fogSteps;
                fogUpdatePlayerPosition();
                
                if(fogCurrentX === fogTargetX && fogCurrentY === fogTargetY) {
                     document.getElementById('fog-game-message').innerText = "🤖 抵達終點！";
                } else {
                     document.getElementById('fog-game-message').innerText = "🤖 AI 安全導航中...";
                }
                
                fogAiTimeout = setTimeout(fogAiMove, 300);
            } else {
                document.getElementById('fog-game-message').innerText = "❌ 糟糕！地圖發生異常死胡同。";
            }
        }


        // --- 🌟 V4.0 實驗五-B 戰術地圖邏輯 (A* 終極大腦版) 🌟 ---
        const scenarios = {
            'trap': {
                start: {x:3, y:3}, target: {x:0, y:5},
                dynamicObstacles: [{x:2, y:5}, {x:2, y:4}],
                steps: [
                    {x:3,y:3, log:"出發 (3,3)，目標 (0,5)", type:"normal"},
                    {x:3,y:4, log:"前往 (3,4)", type:"normal"},
                    {x:3,y:5, log:"前往 (3,5)", type:"normal"},
                    {x:3,y:5, log:"⚠️ 偵測石虎! 寫入黑名單(2,5)", type:"warning"},
                    {x:3,y:4, log:"退回 (3,4)", type:"normal"},
                    {x:3,y:4, log:"⚠️ 偵測石虎! 寫入黑名單(2,4)", type:"warning"},
                    {x:3,y:5, log:"嘗試 (3,5) 碰運氣", type:"normal"},
                    {x:3,y:5, log:"死胡同！足跡懲罰分數超越倒退扣分", type:"warning"},
                    {x:3,y:4, log:"果斷放棄北邊，開始向南撤退", type:"highlight"},
                    {x:3,y:3, log:"退回起點 (3,3)", type:"normal"},
                    {x:2,y:3, log:"繞道 (2,3) 尋找新路線", type:"highlight"},
                    {x:1,y:3, log:"前往 (1,3)", type:"normal"},
                    {x:1,y:4, log:"前往 (1,4)", type:"normal"},
                    {x:1,y:5, log:"前往 (1,5)", type:"normal"},
                    {x:0,y:5, log:"🏁 成功避障，抵達終點 (0,5)！", type:"success"}
                ]
            },
            'perfect': {
                start: {x:3, y:3}, target: {x:0, y:0},
                dynamicObstacles: [{x:1, y:1}, {x:2, y:1}],
                steps: [
                    {x:3,y:3, log:"出發 (3,3)，目標 (0,0)", type:"normal"},
                    {x:2,y:3, log:"移除偏見，完全信任運算距離", type:"highlight"},
                    {x:1,y:3, log:"前往 (1,3)", type:"normal"},
                    {x:0,y:3, log:"前往 (0,3)", type:"normal"},
                    {x:0,y:2, log:"前往 (0,2)", type:"normal"},
                    {x:0,y:1, log:"前往 (0,1)", type:"normal"},
                    {x:0,y:0, log:"🏁 完美導航，抵達終點 (0,0)！", type:"success"}
                ]
            },
            'test1': {
                start: {x:3, y:0}, target: {x:0, y:5},
                dynamicObstacles: [{x:3, y:2}, {x:2, y:3}, {x:1, y:3}],
                steps: [
                    {x:3,y:0, log:"出發 (3,0)，目標 (0,5)", type:"normal"},
                    {x:3,y:1, log:"前往 (3,1)", type:"normal"},
                    {x:3,y:1, log:"⚠️ 偵測小狗! 寫入黑名單(3,2)", type:"warning"},
                    {x:2,y:1, log:"向左轉向，繞道前往 (2,1)", type:"highlight"},
                    {x:2,y:2, log:"前往 (2,2)", type:"normal"},
                    {x:2,y:2, log:"⚠️ 偵測小狗! 寫入黑名單(2,3)", type:"warning"},
                    {x:1,y:2, log:"向左轉向，繞道前往 (1,2)", type:"highlight"},
                    {x:1,y:2, log:"⚠️ 偵測行人! 寫入黑名單(1,3)", type:"warning"},
                    {x:0,y:2, log:"向左轉向，繞道前往 (0,2)", type:"highlight"},
                    {x:0,y:3, log:"前往 (0,3)", type:"normal"},
                    {x:0,y:4, log:"前往 (0,4)", type:"normal"},
                    {x:0,y:5, log:"🏁 成功避開三重障礙，抵達終點 (0,5)！", type:"success"}
                ]
            },
            'test2': {
                start: {x:3, y:0}, target: {x:0, y:5},
                dynamicObstacles: [{x:3, y:3}, {x:2, y:2}, {x:1, y:2}],
                steps: [
                    {x:3,y:0, log:"出發 (3,0)，目標 (0,5)", type:"normal"},
                    {x:3,y:1, log:"前往 (3,1)", type:"normal"},
                    {x:3,y:2, log:"前往 (3,2)", type:"normal"},
                    {x:3,y:2, log:"⚠️ 偵測小狗! 寫入黑名單(3,3)", type:"warning"},
                    {x:3,y:2, log:"⚠️ 轉向再偵測小狗! 寫入黑名單(2,2)", type:"warning"},
                    {x:3,y:2, log:"死胡同！果斷放棄向北，開始撤退", type:"highlight"},
                    {x:3,y:1, log:"退回 (3,1)", type:"normal"},
                    {x:2,y:1, log:"繞道前往 (2,1)", type:"highlight"},
                    {x:1,y:1, log:"前往 (1,1)", type:"normal"},
                    {x:1,y:1, log:"⚠️ 偵測小狗! 寫入黑名單(1,2)", type:"warning"},
                    {x:0,y:1, log:"繞道前往 (0,1)", type:"highlight"},
                    {x:0,y:2, log:"前往 (0,2)", type:"normal"},
                    {x:0,y:3, log:"前往 (0,3)", type:"normal"},
                    {x:0,y:4, log:"前往 (0,4)", type:"normal"},
                    {x:0,y:5, log:"🏁 成功逃脫死胡同，抵達終點 (0,5)！", type:"success"}
                ]
            }
        };

        let currentScenario = 'trap';
        let replayTimeout = null;

        function initGrid() {
            const grid = document.getElementById('grid-map');
            if(!grid) return;
            grid.innerHTML = '';
            for (let y = 5; y >= 0; y--) {
                for (let x = 0; x <= 3; x++) {
                    let cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    cell.id = `cell-${x}-${y}`;
                    cell.setAttribute('data-coords', `${x},${y}`);
                    grid.appendChild(cell);
                }
            }
        }

        // 🌟 新增：模擬 A* 終極大腦演算法
        function simulateCustomScenario(sx, sy, tx, ty, dynamicObsList, staticObsList = []) {
            let cx = sx, cy = sy;
            // 🧠 1. 大腦開機就載入「高精地圖」(預知施工放入黑名單)
            let bad = [...staticObsList];
            let visited = new Array(24).fill(0);
            visited[cx + cy * 4] = 1;

            let steps = [];
            steps.push({x: cx, y: cy, log: `出發 (${cx},${cy})，目標 (${tx},${ty})`, type: "normal"});
            if (staticObsList.length > 0) {
                let staticLogs = staticObsList.map(o => `(${o.x},${o.y})`).join(" 及 ");
                steps.push({x: cx, y: cy, log: `🗺️ 下載高精地圖... 已知前方 ${staticLogs} 道路施工！`, type: "highlight"});
            }

            // 🌟 2. 升級版 A* 核心：計算「真實繞道路徑長度」而非直線距離
            function getTrueDistance(startX, startY, targetX, targetY, badList) {
                let queue = [{x: startX, y: startY, d: 0}];
                let vMap = new Array(24).fill(false);
                vMap[startX + startY * 4] = true;

                while(queue.length > 0) {
                    let curr = queue.shift();
                    if (curr.x === targetX && curr.y === targetY) return curr.d;

                    let dirs = [[0,1], [1,0], [0,-1], [-1,0]];
                    for (let d of dirs) {
                        let nx = curr.x + d[0], ny = curr.y + d[1];
                        if (nx>=0 && nx<=3 && ny>=0 && ny<=5) {
                            // 避開牆壁與黑名單
                            if (!vMap[nx + ny*4] && !badList.some(b => b.x === nx && b.y === ny)) {
                                vMap[nx + ny*4] = true;
                                queue.push({x: nx, y: ny, d: curr.d + 1});
                            }
                        }
                    }
                }
                return 999; // 死胡同
            }

            let stepCount = 0;
            while(cx !== tx || cy !== ty) {
                if (stepCount++ > 100) {
                    steps.push({x: cx, y: cy, log: "⚠️ 迷路或陷入無限迴圈，模擬中斷", type: "warning"});
                    break;
                }

                let safeDirs = [];
                let checkSafe = (x, y) => !bad.some(b => b.x === x && b.y === y);

                if (cy < 5 && checkSafe(cx, cy + 1)) safeDirs.push(0);
                if (cx < 3 && checkSafe(cx + 1, cy)) safeDirs.push(1);
                if (cy > 0 && checkSafe(cx, cy - 1)) safeDirs.push(2);
                if (cx > 0 && checkSafe(cx - 1, cy)) safeDirs.push(3);

                if (safeDirs.length === 0) {
                    steps.push({x: cx, y: cy, log: "⚠️ 死胡同！完全無路可走，任務失敗。", type: "warning"});
                    break;
                }

                let bestDir = -1;
                let minScore = 99999;

                // 🧠 3. 大腦運算：每一格都用 A* 推演未來的真實步數
                for (let d of safeDirs) {
                    let nx = cx, ny = cy;
                    if (d === 0) ny += 1; else if (d === 1) nx += 1; else if (d === 2) ny -= 1; else if (d === 3) nx -= 1;

                    let vCount = visited[nx + ny * 4];
                    let trueDist = getTrueDistance(nx, ny, tx, ty, bad); // 取代原本的曼哈頓距離
                    let score = (vCount * 20) + trueDist; // 足跡懲罰 + 真實剩餘步數

                    if (score < minScore) {
                        minScore = score;
                        bestDir = d;
                    }
                }

                let nx = cx, ny = cy;
                if (bestDir === 0) ny += 1; else if (bestDir === 1) nx += 1; else if (bestDir === 2) ny -= 1; else if (bestDir === 3) nx -= 1;

                // 👁️ 4. 感測器啟動：確認下一步有沒有突發狀況
                if (dynamicObsList.some(o => o.x === nx && o.y === ny)) {
                    steps.push({x: cx, y: cy, log: `⚠️ 突發狀況! 光學雷達偵測到路障，寫入黑名單(${nx},${ny})`, type: "warning"});
                    bad.push({x: nx, y: ny}); // 動態融合新的黑名單，下次運算就會避開！
                } else {
                    let isRetreat = (visited[nx + ny * 4] > 0); 
                    cx = nx; cy = ny;
                    visited[cx + cy * 4] += 1;

                    if (isRetreat) {
                        steps.push({x: cx, y: cy, log: `退回 (${cx},${cy}) 重新規劃全域路線`, type: "highlight"});
                    } else {
                        steps.push({x: cx, y: cy, log: `前往 (${cx},${cy})`, type: "normal"});
                    }
                }
            }

            if (cx === tx && cy === ty) {
                steps.push({x: cx, y: cy, log: `🏁 成功結合地圖與雷達避障，抵達終點 (${tx},${ty})！`, type: "success"});
            }

            return steps;
        }

        // 🌟 新增：執行自訂戰役的觸發器 (支援靜態與動態路障)
        function runCustomScenario(btn) {
            const sx = parseInt(document.getElementById('custom-sx').value);
            const sy = parseInt(document.getElementById('custom-sy').value);
            const tx = parseInt(document.getElementById('custom-tx').value);
            const ty = parseInt(document.getElementById('custom-ty').value);
            const obsStr = document.getElementById('custom-obs').value;
            const staticObsStr = document.getElementById('custom-static-obs').value;

            let parseObs = (str) => {
                let list = [];
                if (str.trim() !== '') {
                    str.split(';').forEach(p => {
                        const coords = p.split(',');
                        if (coords.length === 2) {
                            list.push({x: parseInt(coords[0].trim()), y: parseInt(coords[1].trim())});
                        }
                    });
                }
                return list;
            }

            let dynObs = parseObs(obsStr);
            let staticObs = parseObs(staticObsStr);

            const steps = simulateCustomScenario(sx, sy, tx, ty, dynObs, staticObs);

            scenarios['custom'] = {
                start: {x: sx, y: sy},
                target: {x: tx, y: ty},
                dynamicObstacles: dynObs,
                staticObstacles: staticObs,
                steps: steps
            };

            loadScenario('custom', btn);
        }

        function loadScenario(scenarioId, btn) {
            const btns = document.querySelectorAll('#exp5b-visualizer .nav-btn');
            btns.forEach(b => b.classList.remove('active'));
            if(btn) btn.classList.add('active');
            currentScenario = scenarioId;
            resetReplay();
            
            // 如果是自訂戰役，直接幫老師按播放
            if (scenarioId === 'custom') {
                playScenario();
            }
        }

        function resetReplay() {
            if (replayTimeout) clearTimeout(replayTimeout);
            initGrid();
            const logBody = document.getElementById('log-body');
            if(logBody) logBody.innerHTML = "按「播放」開始重播…";
            
            const data = scenarios[currentScenario];
            if(!data) return;
            
            const startCell = document.getElementById(`cell-${data.start.x}-${data.start.y}`);
            if(startCell) { startCell.classList.add('start'); startCell.innerHTML = '🚗'; }
            
            const targetCell = document.getElementById(`cell-${data.target.x}-${data.target.y}`);
            if(targetCell) { targetCell.classList.add('target'); targetCell.innerHTML = '🏁'; }
            
            // 渲染預知施工 🚧
            data.staticObstacles?.forEach(obs => {
                let c = document.getElementById(`cell-${obs.x}-${obs.y}`);
                if(c) { c.classList.add('obstacle'); c.style.borderColor = '#f59e0b'; c.style.background = 'rgba(245, 158, 11, 0.2)'; c.innerHTML = '🚧'; }
            });
            // 渲染突發石虎 🐾
            data.dynamicObstacles?.forEach(obs => {
                let c = document.getElementById(`cell-${obs.x}-${obs.y}`);
                if(c) { c.classList.add('obstacle'); c.innerHTML = '🐾'; }
            });
            
            // 相容舊的資料格式
            data.obstacles?.forEach(obs => {
                let c = document.getElementById(`cell-${obs.x}-${obs.y}`);
                if(c && c.innerHTML === '') { c.classList.add('obstacle'); c.innerHTML = '🐾'; }
            });
        }

        function playScenario() {
            resetReplay();
            const data = scenarios[currentScenario];
            const logBody = document.getElementById('log-body');
            if(logBody) logBody.innerHTML = '';

            let i = 0;
            function nextStep() {
                if (i >= data.steps.length) return;
                const step = data.steps[i];

                if (i > 0) {
                    let prev = data.steps[i-1];
                    let pCell = document.getElementById(`cell-${prev.x}-${prev.y}`);
                    if (pCell && !pCell.classList.contains('start') && !pCell.classList.contains('target')) {
                        pCell.innerHTML = '';
                    }
                }

                let cell = document.getElementById(`cell-${step.x}-${step.y}`);
                if(cell) {
                    cell.classList.add('path-active');
                    if (!cell.classList.contains('target')) {
                        cell.innerHTML = '🏎️';
                    }
                }

                if(logBody) {
                    let logEntry = document.createElement('div');
                    logEntry.className = `log-entry ${step.type}`;
                    logEntry.innerText = `> ${step.log}`;
                    logBody.appendChild(logEntry);
                    logBody.scrollTop = logBody.scrollHeight;
                }

                i++;
                replayTimeout = setTimeout(nextStep, 1000);
            }
            nextStep();
        }


        // 手機方向按鈕：送出和鍵盤一樣的方向鍵
        document.querySelectorAll('.pad button').forEach(function (b) {
            b.addEventListener('click', function () {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: b.getAttribute('data-k') }));
            });
        });
        fogGenerateMap();
        resetReplay();
