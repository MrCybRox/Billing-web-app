# Food Shop — License / Admin Server

Ye chhota sa Node.js server aapko ek **admin panel** deta hai jahan se aap apne
saray clients (jo aap ne Food Shop Billing app di hui hai) ka access ek jagah
se manage kar saktay hain — kisi ko bhi kabhi bhi ON/OFF kar sakte hain,
expiry date badal sakte hain, naya access code de saktay hain.

## Ye kaam kaise karta hai

1. Aap is server ko kisi hosting par chala dein (neeche tareeqa likha hai).
2. `/admin` par ja kar login karein (default password: `admin123` — pehli
   fursat mein badal lein "Change password" button se).
3. Har client ke liye "+ Add client" se: shop ka naam, ek unique access code,
   aur expiry date dein.
4. Wo access code apne client ko dein, aur Food Shop Billing app (jo aap ne
   pehle banwaya) mein us client ki copy ke **Settings → License Server URL**
   field mein is server ka address (jaisa `https://aapka-app.onrender.com`)
   daal dein.
5. Ab client ki app jab bhi internet se juray gi, ye server se check karay gi
   ke uska access ON hai ya OFF, expire hua ya nahi. Agar aap ne kisi client
   ko "Turn OFF" kar diya, to uski app agli internet-connect hote hi lock ho
   jayegi.

**Zaroori baat:** client ki billing app roz ka kaam (bill banana, print karna)
bina internet ke bhi karti rahegi. Internet sirf license check ke liye
chahiye hota hai, jo app khud background mein try karti hai.

## Apne computer par test karna (sabse pehle ye karein)

Aapke computer par [Node.js](https://nodejs.org) install hona chahiye
(free, official site se download karein — "LTS" version lein).

```bash
cd food-shop-server
npm install
npm start
```

Phir browser mein kholein: `http://localhost:3000/admin`

## Hamesha ke liye online rakhne ke liye (deploy)

Apne computer ko hamesha chalu rakhna practical nahi hota, is liye ise ek
free/sasti hosting par daal dein. Sabse aasan tareeqa:

### Render.com (free tier available)
1. [render.com](https://render.com) par account banayein.
2. Is `food-shop-server` folder ko GitHub par ek naye repository mein upload
   karein (ya "New Web Service" mein directly zip/folder upload ka option
   dekhein).
3. Render par "New Web Service" → apna repo select karein.
4. Build command: `npm install`  |  Start command: `npm start`
5. Deploy hone ke baad Render aapko ek URL degi, jaisa:
   `https://food-shop-server-xxxx.onrender.com`
6. Yehi URL aap Billing app ke "License Server URL" field mein daalenge.

### Railway.app ya koi bhi VPS (DigitalOcean, Hostinger VPS, etc.)
Wahi teen commands chalengi: `npm install` phir `npm start`. Hosting service
ki apni docs dekh lein "Node.js app deploy" ke liye — sab ka tareeqa milta
julta hai.

## Important: data ka backup

Clients ka data `data/clients.json` file mein save hota hai. Free hosting
plans kabhi kabhi server ko restart/redeploy karte waqt files reset kar
detay hain — is liye:
- Waqtan faqtan `data/clients.json` ka backup apne computer par rakhein, ya
- Agar business bara ho jaye, to iska storage ek proper database (jaisa
  Postgres) mein shift karwa lein — us waqt phir se rabta karein, kaam thora
  barh jayega magar data permanently mehfooz rahega.

## Security note

Ye ek halka-phulka (lightweight) system hai, chhotay business ke liye kaafi
hai. Iska matlab ye nahi ke ye enterprise-level "unbreakable" security hai —
agar koi technical banda chahay to bypass karne ki koshish kar sakta hai.
Lekin normal clients ke liye (jo aam tor par developer tools use nahi
kartay) ye access control theek tarah kaam karega.
