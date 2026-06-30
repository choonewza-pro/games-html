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
  },
  eng_verbs: {
    title: "English Verbs Challenge",
    mission: "Pop only the balloons containing English VERBS (action words)!",
    correctCatName: "English Verbs",
    incorrectCatName: "Nouns or Adjectives",
    praWords: ["run", "jump", "swim", "walk", "read", "write", "speak", "listen", "eat", "drink", "sleep", "play", "sing", "dance", "fly", "drive", "cook", "build", "think", "learn"],
    nonPraWords: ["apple", "happy", "beautiful", "table", "house", "green", "quick", "doctor", "car", "book", "sky", "chair", "river", "mountain", "smart"]
  },
  eng_body_parts: {
    title: "Body Parts Challenge",
    mission: "Pop only the balloons containing human BODY PARTS!",
    correctCatName: "Body Parts",
    incorrectCatName: "Other Words",
    praWords: ["head", "hair", "eye", "ear", "nose", "mouth", "teeth", "neck", "shoulder", "arm", "elbow", "hand", "finger", "chest", "stomach", "leg", "knee", "foot", "toe", "brain"],
    nonPraWords: ["pencil", "computer", "bicycle", "window", "tree", "dog", "bottle", "shoe", "shirt", "spoon", "clock", "flower", "bread", "paper"]
  },
  math_addition: {
    title: "Math Addition Challenge",
    mission: "Pop only the balloons with CORRECT math addition equations!",
    correctCatName: "Correct Equations",
    incorrectCatName: "Incorrect Equations",
    praWords: ["5+3=8", "2+2=4", "10+5=15", "7+4=11", "6+6=12", "8+2=10", "1+9=10", "4+3=7", "9+5=14", "3+5=8", "12+4=16", "15+5=20", "7+7=14", "9+9=18", "11+2=13"],
    nonPraWords: ["5+3=9", "2+2=5", "10+5=14", "7+4=12", "6+6=11", "8+2=9", "1+9=8", "4+3=8", "9+5=13", "3+5=7"]
  },
  sci_plant_parts: {
    title: "ส่วนประกอบของพืช Challenge",
    mission: "จงใช้ \"นิ้วชี้\" ของคุณผ่านกล้อง หรือใช้ \"นิ้วแตะหน้าจอ/เมาส์\" แตะเฉพาะลูกโป่งที่เป็น ส่วนประกอบของพืช เท่านั้น!",
    correctCatName: "ส่วนประกอบของพืช",
    incorrectCatName: "ส่วนประกอบของสัตว์หรืออื่นๆ",
    praWords: ["ราก", "ลำต้น", "ใบ", "ดอก", "ผล", "เมล็ด", "กลีบดอก", "เกสร", "กิ่งก้าน", "หน่อ", "เปลือกไม้", "คลอโรฟิลล์"],
    nonPraWords: ["ปีก", "หาง", "ขนนก", "เขา", "เปลือกหอย", "ปากนก", "ขนสัตว์", "อุ้งเท้า", "กรงเล็บ", "ล้อรถ", "เครื่องยนต์", "พลาสติก"]
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
let opponentMaxCombo = 0;
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
