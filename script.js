const ramenData = [
    { name: "신라면", time: 270, icon: "🔥", desc: "4분 30초", tip: "파, 표고버섯, 계란을 곁들이면 더 맛있습니다." },
    { name: "너구리", time: 300, icon: "🦝", desc: "5분", tip: "다시마는 물과 함께 처음부터 끓여주세요." },
    { name: "짜파게티", time: 300, icon: "🍝", desc: "5분", tip: "물 8스푼 정도 남기고 약불에 비벼주세요." },
    { name: "진라면(순/매)", time: 240, icon: "🍜", desc: "4분", tip: "취향에 따라 대파, 김치, 계란을 넣어보세요." },
    { name: "안성탕면", time: 270, icon: "🍲", desc: "4분 30초", tip: "계란을 풀지 않고 그대로 익히면 국물이 깔끔합니다." },
    { name: "삼양라면", time: 240, icon: "🟠", desc: "4분", tip: "햄, 소시지 등을 넣으면 부대찌개 풍미가 납니다." },
    { name: "불닭볶음면", time: 300, icon: "🐔", desc: "5분", tip: "물을 따라낸 후 약불에서 30초간 볶아주세요." },
    { name: "팔도비빔면", time: 180, icon: "❄️", desc: "3분", tip: "찬물에 헹궈 물기를 꽉 짠 후 비벼주세요." },
    { name: "육개장 사발면", time: 180, icon: "🥣", desc: "3분", tip: "뚜껑을 열고 끓는 물을 붓고 기다리세요." },
    { name: "참깨라면", time: 240, icon: "🥚", desc: "4분", tip: "계란 블럭은 끓는 물에 넣고, 유성 스프는 마지막에!" },
    { name: "무파마", time: 270, icon: "🥬", desc: "4분 30초", tip: "시원한 국물을 위해 꼭 4분 30초를 지켜주세요." },
    { name: "틈새라면", time: 210, icon: "🥵", desc: "3분 30초", tip: "매운맛을 즐기려면 콩나물을 넣어보세요." },
    { name: "오징어짬뽕", time: 270, icon: "🦑", desc: "4분 30초", tip: "해물을 추가하면 더욱 풍성한 맛이 납니다." }
];

const timerDisplay = {
    min: document.getElementById('minutes'),
    sec: document.getElementById('seconds'),
    status: document.getElementById('status-text'),
    tip: document.getElementById('cooking-tip'),
    ring: document.querySelector('.progress-ring__circle')
};

const controls = {
    start: document.getElementById('btn-start'),
    pause: document.getElementById('btn-pause'),
    reset: document.getElementById('btn-reset'),
    customMin: document.getElementById('custom-min'),
    customSec: document.getElementById('custom-sec'),
    setCustom: document.getElementById('btn-set-custom'),
    searchInput: document.getElementById('ramen-search') // Added search input
};

let timerInterval = null;
let totalTime = 270; // Default 4:30
let currentTime = 270;
let isRunning = false;
let currentRamenName = "신라면";

// SVG Circle Logic
let circleRadius = timerDisplay.ring.r.baseVal.value;
let circumference = 2 * Math.PI * circleRadius;

function updateCircumference() {
    // With viewBox scaling, we always use the base size (120)
    circleRadius = 120;
    circumference = 2 * Math.PI * circleRadius;

    timerDisplay.ring.style.strokeDasharray = `${circumference} ${circumference}`;
    timerDisplay.ring.style.strokeDashoffset = circumference;

    // Update progress based on current state
    if (isRunning || currentTime !== totalTime) {
        setProgress(currentTime / totalTime);
    } else {
        setProgress(1); // Full if reset
    }
}

function setProgress(percent) {
    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;
    const offset = circumference - (percent * circumference);
    timerDisplay.ring.style.strokeDashoffset = offset;
}

function updateDisplay() {
    const m = Math.floor(currentTime / 60);
    const s = currentTime % 60;
    timerDisplay.min.textContent = String(m).padStart(2, '0');
    timerDisplay.sec.textContent = String(s).padStart(2, '0');

    // Update Ring
    // We want the ring to empty as time goes down.
    // Percent remaining = currentTime / totalTime
    setProgress(currentTime / totalTime);
}

function startTimer() {
    if (isRunning) return;

    // Initialize Audio Context on user gesture
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    // Request Notification Permission
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }

    if (currentTime <= 0) {
        currentTime = totalTime; // Restart if finished
    }

    isRunning = true;
    controls.start.disabled = true;
    controls.pause.disabled = false;
    controls.start.innerHTML = '<i class="fa-solid fa-play"></i> 진행중';
    timerDisplay.status.textContent = "맛있게 끓는 중...";

    timerInterval = setInterval(() => {
        currentTime--;
        updateDisplay();

        if (currentTime <= 0) {
            clearInterval(timerInterval);
            finishTimer();
        }
    }, 1000);
}

function finishTimer() {
    isRunning = false;
    controls.start.disabled = false;
    controls.pause.disabled = true;
    controls.start.innerHTML = '<i class="fa-solid fa-play"></i> 시작';
    timerDisplay.status.textContent = "완성! 불을 꺼주세요.";

    // Stop music & Play alarm
    bgMusic.pause();
    bgMusic.currentTime = 0;
    playAlarm();

    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("라면 완성!", {
            body: `${currentRamenName}이(가) 맛있게 익었습니다. 불을 끄고 즐기세요!`,
            icon: "https://cdn-icons-png.flaticon.com/512/3014/3014520.png"
        });
    }
}

function resetTimer() {
    pauseTimer();
    currentTime = totalTime;
    updateDisplay();
    controls.start.innerHTML = '<i class="fa-solid fa-play"></i> 시작';
    timerDisplay.status.textContent = "준비";
    timerDisplay.tip.textContent = currentRamenName === "직접 설정" ? "" : ramenData.find(r => r.name === currentRamenName)?.tip || "";
    setProgress(1);
    stopAlarm(); // Stop alarm if playing
}

// Audio Alarm & Music
let audioCtx;
let oscillator;
const bgMusic = document.getElementById('bg-music');
bgMusic.volume = 0.4; // Set initial volume

function playAlarm() {
    bgMusic.pause(); // Stop music when alarm rings
    bgMusic.currentTime = 0;

    // Create AudioContext on user interaction first time usually, but here calling in callback.
    // Browsers might block if not initiated by user. 
    // We will assume user clicked Start, so Context is allowed to resume/start.
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1);

    // Repeat for a few beeps
    let count = 0;
    const beepInterval = setInterval(() => {
        count++;
        if (count > 5) clearInterval(beepInterval);

        const osc = audioCtx.createOscillator();
        const gn = audioCtx.createGain();
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gn.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gn.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gn);
        gn.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }, 1000);
}

function stopAlarm() {
    if (audioCtx) {
        audioCtx.close().then(() => { audioCtx = null; });
    }
}

// Timer Functions (with Music Control)
function startTimer() {
    if (isRunning) return;

    // Start Music
    bgMusic.play().catch(e => console.log("Music play failed (user interaction needed?):", e));

    // Initialize Audio Context on user gesture
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    // Request Notification Permission
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }

    if (currentTime <= 0) {
        currentTime = totalTime; // Restart if finished
    }

    isRunning = true;
    controls.start.disabled = true;
    controls.pause.disabled = false;
    controls.start.innerHTML = '<i class="fa-solid fa-play"></i> 진행중';
    timerDisplay.status.textContent = "맛있게 끓는 중...";

    timerInterval = setInterval(() => {
        currentTime--;
        updateDisplay();

        if (currentTime <= 0) {
            clearInterval(timerInterval);
            finishTimer();
        }
    }, 1000);
}

function pauseTimer() {
    if (!isRunning) return;

    bgMusic.pause(); // Pause music

    clearInterval(timerInterval);
    isRunning = false;
    controls.start.disabled = false;
    controls.pause.disabled = true;
    controls.start.innerHTML = '<i class="fa-solid fa-play"></i> 계속';
    timerDisplay.status.textContent = "일시정지";
}

function resetTimer() {
    pauseTimer();
    bgMusic.pause();
    bgMusic.currentTime = 0; // Rewind

    currentTime = totalTime;
    updateDisplay();
    controls.start.innerHTML = '<i class="fa-solid fa-play"></i> 시작';
    timerDisplay.status.textContent = "준비";
    timerDisplay.tip.textContent = currentRamenName === "직접 설정" ? "" : ramenData.find(r => r.name === currentRamenName)?.tip || "";
    setProgress(1);
    stopAlarm(); // Stop alarm if playing
}

// Render Ramen List
function renderRamenList(data = ramenData) {
    const grid = document.getElementById('ramen-grid');
    grid.innerHTML = '';

    if (data.length === 0) {
        const query = controls.searchInput.value;
        grid.innerHTML = `
            <div class="no-results" id="no-results-area">
                <p>로컬 데이터에 없습니다.</p>
                <div class="web-search-promo" onclick="handleWebSearch('${query}')">
                    <i class="fa-solid fa-earth-asia"></i> 
                    '${query}' 자동 검색하기
                    <br><span style="font-size:0.8rem; color:#aaa">(서버에서 시간 가져오기)</span>
                </div>
            </div>
        `;
        return;
    }

    data.forEach((ramen) => {
        const item = document.createElement('div');
        item.classList.add('ramen-item');
        if (ramen.name === currentRamenName) item.classList.add('active');

        item.innerHTML = `
            <div class="ramen-item-icon">${ramen.icon}</div>
            <div class="ramen-item-name">${ramen.name}</div>
            <div class="ramen-item-time">${ramen.desc}</div>
        `;

        item.addEventListener('click', () => selectRamen(ramen));
        grid.appendChild(item);
    });
}

async function handleWebSearch(query) {
    if (!query) return;

    const noResultsArea = document.getElementById('no-results-area');
    noResultsArea.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> '${query}' 정보를 분석 중...</div>`;

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.found) {
            // Success! Add to data and select
            const newRamen = {
                name: data.name,
                time: data.time,
                icon: "✨",
                desc: data.desc,
                tip: data.tip
            };

            // Avoid duplicates
            const existingIndex = ramenData.findIndex(r => r.name === newRamen.name);
            if (existingIndex >= 0) {
                ramenData[existingIndex] = newRamen;
            } else {
                ramenData.push(newRamen);
            }

            // Clear search and select
            controls.searchInput.value = '';
            renderRamenList(); // Show all again
            selectRamen(newRamen);

            // Show notification
            timerDisplay.status.textContent = `자동 설정됨: ${newRamen.desc}`;

        } else {
            noResultsArea.innerHTML = `
                <p>자동 분석에 실패했습니다.</p>
                <div class="web-search-promo" onclick="openNaverSearch('${query}')">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> 직접 네이버 검색하기
                </div>
            `;
        }
    } catch (e) {
        console.error(e);
        noResultsArea.innerHTML = `
            <p>검색 오류 발생</p>
            <div class="web-search-promo" onclick="openNaverSearch('${query}')">
                 <i class="fa-solid fa-arrow-up-right-from-square"></i> 직접 네이버 검색하기
            </div>
        `;
    }
}

function openNaverSearch(query) {
    if (!query) return;
    const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(query + ' 조리시간')}`;
    window.open(url, '_blank');
}

function selectRamen(ramen) {
    currentRamenName = ramen.name;
    totalTime = ramen.time;
    resetTimer();

    // Visual update
    const items = document.querySelectorAll('.ramen-item');
    items.forEach(i => {
        if (i.querySelector('.ramen-item-name').textContent === ramen.name) {
            i.classList.add('active');
            i.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            i.classList.remove('active');
        }
    });
}

// Search Functionality
controls.searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = ramenData.filter(ramen =>
        ramen.name.toLowerCase().includes(searchTerm)
    );
    renderRamenList(filtered);
});

controls.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const searchTerm = e.target.value;
        const filtered = ramenData.filter(ramen =>
            ramen.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filtered.length === 0) {
            handleWebSearch(searchTerm);
        } else if (filtered.length === 1) {
            selectRamen(filtered[0]);
            controls.searchInput.value = ''; // clear
            renderRamenList();
        }
    }
});

// Custom Time
controls.setCustom.addEventListener('click', () => {
    const m = parseInt(controls.customMin.value) || 0;
    const s = parseInt(controls.customSec.value) || 0;

    if (m === 0 && s === 0) return;

    totalTime = (m * 60) + s;
    currentRamenName = "직접 설정";

    // Clear active selection
    document.querySelectorAll('.ramen-item').forEach(i => i.classList.remove('active'));

    resetTimer();
});


// Initialization
controls.start.addEventListener('click', startTimer);
controls.pause.addEventListener('click', pauseTimer);
controls.reset.addEventListener('click', resetTimer);

window.addEventListener('resize', updateCircumference);

// Mobile Keyboard Fix
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', () => {
        window.scrollTo(0, 0); // Reset scroll on keyboard close
        document.body.scrollTop = 0;
    });
});

// Init
renderRamenList();
updateCircumference();
resetTimer();

