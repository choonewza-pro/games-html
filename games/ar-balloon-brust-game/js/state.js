// ==========================================
// APPLICATION STATE (GLOBAL VARIABLES)
// ==========================================

// Educational Word DB Definitions (Fallback templates, full database loaded from /data/ar-balloon-brust-game.json)
const GAME_TEMPLATES = {
  thai_visanjanee: {
    title: "คำประวิสรรชนีย์ Challenge",
    mission: "จงใช้ \"นิ้วชี้\" ของคุณผ่านกล้อง หรือใช้ \"นิ้วแตะหน้าจอ/เมาส์\" แตะเฉพาะลูกโป่งที่เป็น คำประวิสรรชนีย์ (มีรูป ะ) เท่านั้น!",
    correctCatName: "คำประวิสรรชนีย์",
    incorrectCatName: "คำไม่ประวิสรรชนีย์",
    praWords: ["มะม่วง", "มะพร้าว", "มะละกอ", "มะเขือ", "มะนาว", "กะทิ", "กะปิ", "กะละมัง", "ตะกร้า", "ตะวัน", "สะพาน", "สะอาด", "สะดวก", "สะกด", "ชะนี", "ชะอม", "ทะเล", "ทะนุถนอม", "พระอาทิตย์", "ระฆัง"],
    nonPraWords: ["ตลาด", "ขนม", "ถนน", "สบาย", "สมัคร", "สมุด", "ผลิต", "ขยาย", "ฉลาด", "แสดง"]
  }
};

let GAME_TITLE = "คำประวิสรรชนีย์ Challenge";
let GAME_MISSION = `จงใช้ <span class="text-rose-500 font-bold">"นิ้วชี้"</span> ของคุณผ่านกล้อง หรือใช้ <span class="text-sky-500 font-bold">"นิ้วแตะหน้าจอ/เมาส์"</span> แตะเฉพาะลูกโป่งที่เป็น <span class="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-md font-bold">คำประวิสรรชนีย์ (มีรูป ะ)</span> เท่านั้น!`;
let CORRECT_CAT_NAME = "คำประวิสรรชนีย์";
let INCORRECT_CAT_NAME = "คำไม่ประวิสรรชนีย์";

let PRA_WORDS = [...GAME_TEMPLATES.thai_visanjanee.praWords];
let NON_PRA_WORDS = [...GAME_TEMPLATES.thai_visanjanee.nonPraWords];

const BALLOON_COLORS = [
  "#FF5A5F", "#FFB400", "#FF8000", "#3CAEA3", 
  "#20639B", "#F6D55C", "#ED553B", "#9B5DE5", 
  "#F15BB5", "#00F5D4", "#00BBF9"
];

// Game variables state
let gameActive = false;
let gameMode = "ai"; 
let score = 0;
let timeLeft = 60;
let gameDuration = 60; 
let gameSpeed = 5; 
let gameInterval = null;
let balloons = [];
let particles = [];
let textParticles = [];
let activePointer = { x: -100, y: -100 }; 
let targetPointer = { x: -100, y: -100 }; 
let trackingActive = false;
let listPoppedCorrect = [];
let listPoppedIncorrect = [];

// Multiplayer state variables
let isMultiplayer = false;
let myPlayerRole = "host"; 
let roomId = null;
let opponentScore = 0;
let opponentCombo = 0;
let opponentPointer = { x: -100, y: -100, active: false };
let opponentTargetPointer = { x: -100, y: -100 };
let matchMode = "share"; // v3: "share" (แย่งกันเจาะ) or "individual" (ต่างคนต่างเจาะ)
let localInputReady = false;
let opponentInputReady = false;

let peerInstance = null;
let networkConnection = null; 

let randomSeed = 1;
let balloonSeqId = 0;
let spawnTimer = 0;
const spawnInterval = 1500; 

// Combo and Juiciness variables
let comboCount = 0;
let maxCombo = 0;
let shakeIntensity = 0;
let activeComboAnnounce = null; 
let lastTime = 0; 
let lastTimePointerSent = 0; 

// MediaPipe variables
let cameraInstance = null;
let handsDetector = null;

// Adjust canvas resolution dynamically relative to wrapper sizing
let lastLogicWidth = 0;
let lastLogicHeight = 0;
