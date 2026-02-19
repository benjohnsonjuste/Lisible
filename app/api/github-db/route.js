import { NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt-ts';
const localCache = new Map();
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const GITHUB_CONFIG = { owner: "benjohnsonjuste", repo: "Lisible", token: process.env.GITHUB_TOKEN };
const ECONOMY = { MIN_TRANSFER: 1000, WITHDRAWAL_THRESHOLD: 25000, REQUIRED_FOLLOWERS: 250, LI_VALUE_USD: 0.0002 };
async function getFile(path) {
try {
const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, { headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Lisible-App' }, cache: 'no-store' });
if (!res.ok) return null;
const data = await res.json();
if (Array.isArray(data)) return { content: data };
const b64 = data.content.replace(/\s/g, '');
const decodedContent = new TextDecoder().decode(Uint8Array.from(atob(b64), (m) => m.codePointAt(0)));
return { content: JSON.parse(decodedContent), sha: data.sha };
} catch { return null; }
}
async function updateFile(path, content, sha, message) {
try {
const jsonString = JSON.stringify(content, null, 2);
const encodedContent = btoa(Array.from(new TextEncoder().encode(jsonString), (b) => String.fromCodePoint(b)).join(""));
const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json', 'User-Agent': 'Lisible-App' }, body: JSON.stringify({ message: `[DATA] ${message} [skip ci]`, content: encodedContent, sha: sha || undefined }), });
return res.ok;
} catch { return false; }
}
const getSafePath = (email) => email ? `data/users/${email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_')}.json` : null;
const globalSort = (list) => !Array.isArray(list) ? [] : [...list].sort((a, b) => (Number(b.certified || 0) - Number(a.certified || 0)) || (Number(b.likes || 0) - Number(a.likes || 0)) || (new Date(b.date) - new Date(a.date)));
export async function POST(req) {
try {
const body = await req.json();
const { action, userEmail, amount, currentPassword, newPassword, ...data } = body;
const targetPath = getSafePath(userEmail || data.email);
if (action === 'register') {
if (await getFile(targetPath)) return NextResponse.json({ error: "Existe déjà" }, { status: 400 });
const userData = { email: data.email.toLowerCase().trim(), li: data.referralCode ? 250 : 50, notifications: [], followers: [], following: [], works: [], created_at: new Date().toISOString(), ...data, password: bcrypt.hashSync(data.password.trim(), 10) };
await updateFile(targetPath, userData, null, `Reg: ${data.email}`);
const { password, ...safe } = userData; return NextResponse.json({ success: true, user: safe });
}
if (action === 'login') {
const file = await getFile(targetPath);
if (!file || !bcrypt.compareSync(data.password.trim(), file.content.password)) return NextResponse.json({ error: "Invalide" }, { status: 401 });
const { password, ...safe } = file.content; return NextResponse.json({ success: true, user: safe });
}
if (action === 'publish') {
const id = data.id || `txt_${Date.now()}`;
const isC = data.isConcours || data.genre === "Battle Poétique";
const newPub = { ...data, id, isConcours: isC, date: new Date().toISOString(), views: 0, likes: 0, comments: [], certified: 0 };
await updateFile(`data/texts/${id}.json`, newPub, null, `Pub: ${data.title}`);
const idxFile = await getFile(`data/publications/index.json`) || { content: [] };
idxFile.content.unshift({ id, title: data.title, author: data.authorName, authorEmail: data.authorEmail, category: data.category, genre: data.genre, image: isC ? null : data.image, date: newPub.date, views: 0, likes: 0, certified: 0 });
await updateFile(`data/publications/index.json`, globalSort(idxFile.content), idxFile.sha, `Index`);
return NextResponse.json({ success: true, id });
}
if (action === 'follow' || action === 'unfollow') {
const f = await getFile(getSafePath(userEmail)), t = await getFile(getSafePath(data.targetEmail));
const eT = data.targetEmail.toLowerCase().trim(), eF = userEmail.toLowerCase().trim();
if (action === 'follow') { f.content.following.push(eT); t.content.followers.push(eF); } 
else { f.content.following = f.content.following.filter(e => e !== eT); t.content.followers = t.content.followers.filter(e => e !== eF); }
await updateFile(getSafePath(userEmail), f.content, f.sha, `Follow`);
await updateFile(getSafePath(data.targetEmail), t.content, t.sha, `Follow`);
return NextResponse.json({ success: true });
}
return NextResponse.json({ error: "N/A" }, { status: 400 });
} catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function GET(req) {
const { searchParams: s } = new URL(req.url);
const type = s.get('type'), id = s.get('id');
try {
if (type === 'gallery' || type === 'library' || type === 'publications') {
const index = await getFile(`data/publications/index.json`);
return NextResponse.json(index ? globalSort(index.content) : []);
}
if (type === 'text') return NextResponse.json(await getFile(`data/texts/${id}.json`));
if (type === 'user') {
const u = await getFile(getSafePath(id));
if (u) { u.content.li_usd = (u.content.li * ECONOMY.LI_VALUE_USD).toFixed(2); delete u.content.password; }
return NextResponse.json(u);
}
return NextResponse.json({ error: "Type invalide" }, { status: 400 });
} catch { return NextResponse.json({ error: "Err" }, { status: 500 }); }
}
export async function PATCH(req) {
try {
const { id, action } = await req.json();
const f = await getFile(`data/texts/${id}.json`);
if (!f) return NextResponse.json({ error: "N/A" });
if (action === 'view') f.content.views++;
if (action === 'like') f.content.likes++;
if (action === 'certify') f.content.certified++;
await updateFile(`data/texts/${id}.json`, f.content, f.sha, `Stat: ${action}`);
const idx = await getFile(`data/publications/index.json`);
if (idx) {
const i = idx.content.findIndex(t => t.id === id);
if (i > -1) { idx.content[i].views = f.content.views; idx.content[i].likes = f.content.likes; idx.content[i].certified = f.content.certified; await updateFile(`data/publications/index.json`, globalSort(idx.content), idx.sha, `Sync`); }
}
return NextResponse.json({ success: true });
} catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
