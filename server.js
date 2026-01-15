import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8000;

app.use(express.json());
app.use(express.static(__dirname)); // slouží HTML a JS soubory

// Proxy endpoint pro Gemini API
app.post('/api/chat', async (req, res) => {
    try {
        const messages = req.body.messages;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: messages })
            }
        );

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.[0]?.text || 'Omlouvám se, došlo k chybě.';
        res.json({ reply });
    } catch (err) {
        console.error(err);
        res.json({ reply: 'Omlouvám se, došlo k chybě.' });
    }
});

// HTML frontend s chatbotem
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>Terezka - EDC Chatbot</title>
<style>
/* --- vlož sem své styly pro .tereza-* --- */
.tereza-wrapper { position: fixed; bottom: 20px; right: 20px; cursor: pointer; z-index: 999; }
.tereza-pulse-ring { width: 60px; height: 60px; border-radius: 50%; background: rgba(255,0,0,0.3); position: absolute; top: 0; left: 0; animation: pulse 2s infinite; }
@keyframes pulse { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }
.tereza-toggle img { width: 60px; height: 60px; border-radius: 50%; position: relative; z-index: 2; }
.tereza-modern { position: fixed; bottom: 90px; right: 20px; width: 350px; max-height: 500px; background: #fff; border-radius: 10px; box-shadow: 0 0 15px rgba(0,0,0,0.2); display: none; flex-direction: column; font-family: sans-serif; }
.tereza-modern.open { display: flex; }
.tereza-header { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f5f5f5; border-bottom: 1px solid #ddd; }
.tereza-content { flex: 1; display: flex; flex-direction: column; }
.tereza-messages { flex: 1; overflow-y: auto; padding: 10px; }
.tereza-bot, .tereza-user { display: flex; margin-bottom: 10px; }
.tereza-bot img { width: 40px; height: 40px; border-radius: 50%; margin-right: 5px; }
.tereza-bubble { padding: 8px 12px; border-radius: 15px; background: #e0e0e0; max-width: 75%; }
.tereza-user .tereza-bubble { background: #007bff; color: #fff; margin-left: auto; }
.tereza-input { display: flex; border-top: 1px solid #ddd; }
#tereza-input { flex: 1; padding: 8px; border: none; outline: none; }
#tereza-send { background: none; border: none; cursor: pointer; padding: 0 10px; }
.tereza-typing { display: none; padding: 5px; }
.tereza-sidebar { padding: 5px; border-top: 1px solid #ddd; background: #fafafa; }
.tereza-item { cursor: pointer; margin: 3px 0; color: #007bff; }
</style>
</head>
<body>

<div class="tereza-wrapper">
    <div class="tereza-pulse-ring"></div>
    <div class="tereza-toggle">
        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=140&h=140&fit=crop&crop=face" alt="Terezka">
    </div>
</div>

<div id="tereza-chat" class="tereza-modern">
    <div class="tereza-header">
        <div class="tereza-info">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" alt="Terezka">
            <div>
                <div class="tereza-name">Terezka</div>
                <div class="tereza-status">Online • EDC Asistentka</div>
            </div>
        </div>
        <div class="tereza-actions">
            <button class="tereza-newchat" title="Nový chat">↺</button>
            <button class="tereza-close">×</button>
        </div>
    </div>

    <div class="tereza-sidebar">
        <div class="tereza-title">Rychlé odkazy</div>
        <div class="tereza-item" data-q="Co je EDC?">O společnosti</div>
        <div class="tereza-item" data-q="Jaké jsou kontakty na EDC?">Kontakty a sídlo</div>
        <div class="tereza-item" data-q="Co je sdílení energie v komunitě?">Komunitní energetika</div>
        <div class="tereza-item" data-q="Jak fungují videonávody ke sdílení?">Video návody</div>
        <div class="tereza-item" data-q="Kde najdu dokumenty ke sdílení?">Dokumenty</div>
        <div class="tereza-item" data-q="FAQ ke sdílení elektřiny">FAQ</div>
    </div>

    <div class="tereza-content">
        <div id="tereza-messages" class="tereza-messages"></div>
        <div id="tereza-typing" class="tereza-typing"><span></span><span></span><span></span></div>
        <div class="tereza-input">
            <input type="text" id="tereza-input" placeholder="Napište zprávu…" autocomplete="off">
            <button id="tereza-send">
                <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
                </svg>
            </button>
        </div>
    </div>
</div>

<script>
(function(){
    const systemPrompt = \`Jsi Terezka, milá a lidská virtuální asistentka EDC. Odpovídej vždy česky, přátelsky a primárně z EDC.\`;

    const welcomeMessage = { role:'model', parts:[{text:'Vítejte! Jsem Terezka, vaše virtuální asistentka EDC. Jak vám dnes mohu pomoci?'}]};
    let messages = [welcomeMessage];

    function saveMessages(){ localStorage.setItem('terezaMessages', JSON.stringify(messages)); }
    function loadMessages(){ try { return JSON.parse(localStorage.getItem('terezaMessages'))||[welcomeMessage]; } catch { return [welcomeMessage]; } }
    function renderMessages(){
        const box=document.getElementById('tereza-messages'); box.innerHTML='';
        messages.forEach(m=>{
            const html = m.role==='model'? \`<div class="tereza-bot"><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"><div class="tereza-bubble">\${m.parts[0].text}</div></div>\` :
                \`<div class="tereza-user"><div class="tereza-bubble">\${m.parts[0].text}</div></div>\`;
            box.insertAdjacentHTML('beforeend',html);
        });
        box.scrollTop=box.scrollHeight;
    }

    async function send(){
        const input=document.getElementById('tereza-input');
        let msg=input.value.trim(); if(!msg)return; input.value='';
        messages.push({role:'user', parts:[{text:msg}]});
        renderMessages();
        document.getElementById('tereza-typing').style.display='flex';
        try{
            const res=await fetch('/api/chat',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({messages:[{role:'system', content:[{text:systemPrompt}]} , ...messages]})});
            const data=await res.json();
            const reply=data.reply||'Omlouvám se, došlo k chybě.';
            messages.push({role:'model', parts:[{text:reply}]});
            saveMessages();
            renderMessages();
        }catch(e){
            messages.push({role:'model', parts:[{text:'Omlouvám se, došlo k chybě.'}]});
            renderMessages();
        }finally{ document.getElementById('tereza-typing').style.display='none'; }
    }

    document.querySelector('.tereza-toggle').onclick=()=>document.getElementById('tereza-chat').classList.toggle('open');
    document.querySelector('.tereza-close').onclick=()=>document.getElementById('tereza-chat').classList.remove('open');
    document.querySelector('.tereza-newchat').onclick=()=>{messages=[welcomeMessage]; localStorage.removeItem('terezaMessages'); renderMessages();};
    document.getElementById('tereza-send').onclick=send;
    document.getElementById('tereza-input').addEventListener('keydown',e=>{if(e.key==='Enter')send();});

    renderMessages();
})();
</script>

</body>
</html>`);
});

app.listen(PORT, () => console.log(`Server běží na http://localhost:${PORT}`));
