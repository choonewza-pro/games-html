# Games HTML

รวมเกม HTML แบบโต้ตอบด้วยมือผ่านกล้อง (AR Hand Tracking)

## โครงสร้างโปรเจกต์

| โฟลเดอร์ | รายละเอียด |
|----------|------------|
| `/games` | เกมที่พัฒนาเสร็จพร้อมเล่น |
| `/dev-games` | เกมที่กำลังพัฒนายังไม่สมบูรณ์ |

## เกมที่พร้อมเล่น

- [Balloon Burst v1](games/ar_balloon_burst_game_v1.html) — เกมเป่าลูกโป่ง คำประวิสรรชนีย์ และคำไม่ประวิสรรชนีย์
- [Balloon Burst v2](games/ar_balloon_burst_game_v2.html) — เกมเป่าลูกโป่งออนไลน์แบบผู้เล่นหลายคน (Multiplayer - Firebase)
- [Balloon Burst v3 (P2P VS)](games/ar-balloon-brust-game/index.html) — เกมเป่าลูกโป่งคำวิชาการแบบโต้ตอบด้วยมือ (AR) มีโหมดแข่งออนไลน์แบบ P2P (PeerJS) ซิงค์ตำแหน่งนิ้ว ตรวจสอบความพร้อม และตัวเลขนับถอยหลังพร้อมเสียงประกอบ

## เทคโนโลยี

- MediaPipe Hands (AR Hand Tracking)
- PeerJS / WebRTC (P2P Multiplayer ใน v3)
- Tailwind CSS
- Firebase Realtime Database (ใน v2)
- Web Audio API & Web Speech API (สังเคราะห์เสียงเอฟเฟกต์และการออกเสียงคำศัพท์ใน v3)
- External JSON Database (แยกคลังคำศัพท์วิชาการใน v3)
