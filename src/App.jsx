import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";

// =============================
// 🔥 ここにFirebaseの設定を貼り付けてください
// Firebase Console → プロジェクト設定 → マイアプリ → SDK設定
// =============================
const firebaseConfig = {
  apiKey: "AIzaSyCq70QhX7IuIucsjF723gFpsWp3XBm29is",
  authDomain: "punishment-list-716b6.firebaseapp.com",
  projectId: "punishment-list-716b6",
  storageBucket: "punishment-list-716b6.firebasestorage.app",
  messagingSenderId: "516090655717",
  appId: "1:516090655717:web:0b66bd9201e647e757f50c",
  measurementId: "G-G76LCQBNL3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DOC_REF = doc(db, "punishment", "data");

// =============================

const MEMBERS = ["池田", "九萬原", "軍地", "郷地", "清水", "土蔵", "山崎"];

const COLORS = [
  { bg: "#FF6B6B", light: "#FFE5E5", text: "#C0392B" },
  { bg: "#FF9F43", light: "#FFF3E0", text: "#E67E22" },
  { bg: "#F7DC6F", light: "#FFFDE7", text: "#B7950B" },
  { bg: "#6BCB77", light: "#E8F8E9", text: "#1E8449" },
  { bg: "#4D96FF", light: "#E3EFFF", text: "#1A5276" },
  { bg: "#C77DFF", light: "#F3E5FF", text: "#7D3C98" },
  { bg: "#FF6EB4", light: "#FFE4F2", text: "#A93226" },
];

function today() {
  return new Date().toISOString().split("T")[0];
}

function isExpired(endDate) {
  if (!endDate) return false;
  return endDate < today();
}

function isExpiringSoon(endDate) {
  if (!endDate) return false;
  const diff = (new Date(endDate) - new Date(today())) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 2;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

function StatusBadge({ task }) {
  if (task.done) return (
    <span style={{ fontSize: 11, background: "#e0e0e0", color: "#888", borderRadius: 10, padding: "2px 8px", fontWeight: 700 }}>完了✓</span>
  );
  if (task.endDate && isExpired(task.endDate)) return (
    <span style={{ fontSize: 11, background: "#FF6B6B", color: "#fff", borderRadius: 10, padding: "2px 8px", fontWeight: 700 }}>期限切れ⚠</span>
  );
  if (task.endDate && isExpiringSoon(task.endDate)) return (
    <span style={{ fontSize: 11, background: "#FF9F43", color: "#fff", borderRadius: 10, padding: "2px 8px", fontWeight: 700 }}>もうすぐ期限</span>
  );
  return null;
}

function AddForm({ color, onAdd, onCancel }) {
  const [form, setForm] = useState({ name: "", memo: "", startDate: "", endDate: "" });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    onAdd(form.name.trim(), form.memo.trim(), form.startDate, form.endDate);
  };

  const inputStyle = {
    width: "100%",
    border: `1.5px solid ${color.bg}88`,
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 14,
    fontFamily: "inherit",
    marginBottom: 8,
    boxSizing: "border-box",
    outline: "none",
    background: "#fff",
  };

  return (
    <div style={{ background: color.light, borderRadius: 12, padding: "12px", border: `1.5px dashed ${color.bg}`, marginTop: 6 }}>
      <input autoFocus placeholder="罰ゲーム内容 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
      <input placeholder="メモ（任意）" value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} style={inputStyle} />
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: color.text, fontWeight: 700, display: "block", marginBottom: 3 }}>開始日</label>
          <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={{ ...inputStyle, marginBottom: 0 }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: color.text, fontWeight: 700, display: "block", marginBottom: 3 }}>終了日</label>
          <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={{ ...inputStyle, marginBottom: 0 }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleAdd} style={{ flex: 1, background: color.bg, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>追加</button>
        <button onClick={onCancel} style={{ background: "#eee", color: "#888", border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>キャンセル</button>
      </div>
    </div>
  );
}

function PunishmentCard({ member, color, tasks, onAdd, onToggle, onDelete }) {
  const [adding, setAdding] = useState(false);
  const done = tasks.filter(t => t.done).length;

  return (
    <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: `0 4px 20px ${color.bg}40`, border: `2px solid ${color.bg}` }}>
      <div style={{ background: `linear-gradient(135deg, ${color.bg}, ${color.bg}CC)`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>🎯</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: 2, textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>{member}</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.3)", borderRadius: 20, padding: "3px 12px", fontSize: 13, color: "#fff", fontWeight: 700 }}>
          {done}/{tasks.length} 完了
        </div>
      </div>

      <div style={{ padding: "12px 14px", minHeight: 60 }}>
        {tasks.length === 0 && !adding && (
          <p style={{ color: "#bbb", textAlign: "center", fontSize: 13, margin: "10px 0" }}>まだ罰ゲームなし 🎉</p>
        )}

        {tasks.map(task => {
          const expired = !task.done && task.endDate && isExpired(task.endDate);
          return (
            <div key={task.id} style={{
              padding: "10px", marginBottom: 8,
              background: task.done ? color.light : expired ? "#FFF5F5" : "#FAFAFA",
              borderRadius: 12,
              border: `1.5px solid ${task.done ? color.bg + "66" : expired ? "#FF6B6B66" : "#eee"}`,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <button onClick={() => onToggle(member, task.id)} style={{
                  width: 26, height: 26, borderRadius: 8,
                  border: `2px solid ${task.done ? color.bg : expired ? "#FF6B6B" : "#ccc"}`,
                  background: task.done ? color.bg : "#fff",
                  cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, marginTop: 1,
                }}>
                  {task.done && <span style={{ color: "#fff", fontWeight: 900 }}>✓</span>}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: task.done ? "#aaa" : "#333", textDecoration: task.done ? "line-through" : "none", lineHeight: 1.4 }}>{task.name}</div>
                  {(task.startDate || task.endDate) && (
                    <div style={{ fontSize: 12, color: task.done ? "#bbb" : expired ? "#FF6B6B" : color.text, fontWeight: 600, marginTop: 3 }}>
                      📅 {task.startDate ? formatDate(task.startDate) : "?"} 〜 {task.endDate ? formatDate(task.endDate) : "?"}
                    </div>
                  )}
                  {task.memo && <div style={{ fontSize: 12, color: "#888", marginTop: 3, fontStyle: "italic" }}>📝 {task.memo}</div>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <button onClick={() => onDelete(member, task.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", fontSize: 16, padding: "0 2px" }}>✕</button>
                  <StatusBadge task={task} />
                </div>
              </div>

              {expired && (
                <button onClick={() => onToggle(member, task.id)} style={{ marginTop: 8, width: "100%", background: "#FF6B6B", color: "#fff", border: "none", borderRadius: 8, padding: "6px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  期限が過ぎました → 完了にする ✓
                </button>
              )}
            </div>
          );
        })}

        {adding ? (
          <AddForm color={color} onAdd={(name, memo, s, e) => { onAdd(member, name, memo, s, e); setAdding(false); }} onCancel={() => setAdding(false)} />
        ) : (
          <button onClick={() => setAdding(true)} style={{ width: "100%", marginTop: tasks.length > 0 ? 4 : 0, background: "none", border: `1.5px dashed ${color.bg}88`, borderRadius: 10, padding: "8px", color: color.text, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            ＋ 罰ゲームを追加
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Firestoreのリアルタイム同期
    const unsub = onSnapshot(DOC_REF, (snap) => {
      if (snap.exists()) {
        setData(snap.data().tasks);
      } else {
        const initial = {};
        MEMBERS.forEach(m => { initial[m] = []; });
        setData(initial);
      }
      setOnline(true);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setOnline(false);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const save = async (newData) => {
    setData(newData);
    try {
      await setDoc(DOC_REF, { tasks: newData });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = (member, name, memo, startDate, endDate) => {
    save({ ...data, [member]: [...(data[member] || []), { id: Date.now() + Math.random(), name, memo, startDate, endDate, done: false }] });
  };

  const handleToggle = (member, id) => {
    save({ ...data, [member]: data[member].map(t => t.id === id ? { ...t, done: !t.done } : t) });
  };

  const handleDelete = (member, id) => {
    if (!confirm("この罰ゲームを削除する？")) return;
    save({ ...data, [member]: data[member].filter(t => t.id !== id) });
  };

  if (loading || !data) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🍶</div>
        <div>読み込み中...</div>
      </div>
    </div>
  );

  const allTasks = Object.values(data).flat();
  const total = allTasks.length;
  const totalDone = allTasks.filter(t => t.done).length;
  const expiredCount = allTasks.filter(t => !t.done && t.endDate && isExpired(t.endDate)).length;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", padding: "0 0 60px", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>
      <div style={{ textAlign: "center", padding: "32px 20px 20px" }}>
        <div style={{ fontSize: 44, marginBottom: 8, filter: "drop-shadow(0 0 20px rgba(255,200,0,0.5))" }}>🍶</div>
        <h1 style={{ color: "#fff", fontSize: "clamp(18px, 5vw, 26px)", fontWeight: 900, margin: 0, letterSpacing: 3, textShadow: "0 0 30px rgba(255,200,0,0.4)" }}>ペットボトルフリップ</h1>
        <h2 style={{ color: "#FFD700", fontSize: "clamp(15px, 4vw, 20px)", fontWeight: 900, margin: "4px 0 12px", letterSpacing: 2 }}>罰ゲームリスト</h2>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {total > 0 && (
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "5px 16px", color: "#fff", fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,0.2)" }}>
              全体: {totalDone}/{total} 完了 {totalDone === total && total > 0 ? "🎉" : ""}
            </div>
          )}
          {expiredCount > 0 && (
            <div style={{ background: "rgba(255,107,107,0.3)", borderRadius: 20, padding: "5px 16px", color: "#FFB3B3", fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,107,107,0.4)" }}>
              ⚠ 期限切れ: {expiredCount}件
            </div>
          )}
          <div style={{ background: online ? "rgba(107,203,119,0.2)" : "rgba(255,100,100,0.2)", borderRadius: 20, padding: "5px 14px", color: online ? "#6BCB77" : "#FF6B6B", fontSize: 12, fontWeight: 700, border: `1px solid ${online ? "rgba(107,203,119,0.4)" : "rgba(255,100,100,0.4)"}` }}>
            {online ? "🟢 リアルタイム同期中" : "🔴 オフライン"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, padding: "0 16px", maxWidth: 1100, margin: "0 auto" }}>
        {MEMBERS.map((member, i) => (
          <PunishmentCard key={member} member={member} color={COLORS[i % COLORS.length]} tasks={data[member] || []} onAdd={handleAdd} onToggle={handleToggle} onDelete={handleDelete} />
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 30, color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
        URLを共有すれば全員がリアルタイムで同じデータを見られます
      </div>
    </div>
  );
}
