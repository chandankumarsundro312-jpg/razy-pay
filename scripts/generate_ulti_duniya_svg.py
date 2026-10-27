import base64
import urllib.request
import os

images_info = {
    'earth': 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=600&q=75',
    'tiger': 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=450&q=75',
    'shark': 'https://images.unsplash.com/photo-1560275619-4662e36fa65c?auto=format&fit=crop&w=450&q=75',
    'car': 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=450&q=75',
    'cat': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=75',
    'taj': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=450&q=75',
    'waterfall': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=450&q=75',
    'paint': 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=450&q=75',
    'robot': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=450&q=75',
    'phone': 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&q=75',
    'explosion': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=75'
}

b64 = {}
for name, url in images_info.items():
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = resp.read()
        b64[name] = f"data:image/jpeg;base64,{base64.b64encode(data).decode('ascii')}"

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <!-- Background Space Gradient -->
    <radialGradient id="spaceBg" cx="50%" cy="25%" r="80%">
      <stop offset="0%" stop-color="#09142e"/>
      <stop offset="35%" stop-color="#050a17"/>
      <stop offset="70%" stop-color="#020408"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>

    <!-- Earth Atmosphere Glow -->
    <radialGradient id="earthGlow" cx="50%" cy="50%" r="50%">
      <stop offset="65%" stop-color="#00c8ff" stop-opacity="0"/>
      <stop offset="85%" stop-color="#00e5ff" stop-opacity="0.45"/>
      <stop offset="95%" stop-color="#38bdf8" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="1"/>
    </radialGradient>

    <!-- Metallic Chrome Gradient for ULTI DUNIYA -->
    <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="25%" stop-color="#f1f5f9"/>
      <stop offset="48%" stop-color="#cbd5e1"/>
      <stop offset="52%" stop-color="#94a3b8"/>
      <stop offset="75%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>

    <!-- Cyan Electric Gradient for AI VIDEOS -->
    <linearGradient id="cyanVideoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e0faff"/>
      <stop offset="25%" stop-color="#67e8f9"/>
      <stop offset="60%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <!-- Yellow Splash Gradient for 1000+ Banner -->
    <linearGradient id="yellowSplashGrad" x1="0%" y1="0%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#ffe600"/>
      <stop offset="30%" stop-color="#ffd000"/>
      <stop offset="70%" stop-color="#ffb700"/>
      <stop offset="100%" stop-color="#ff9900"/>
    </linearGradient>

    <!-- Red 3D Extrusion for 1000+ -->
    <linearGradient id="redNumberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ff1a24"/>
      <stop offset="40%" stop-color="#dc141e"/>
      <stop offset="80%" stop-color="#99000a"/>
      <stop offset="100%" stop-color="#550005"/>
    </linearGradient>

    <!-- Crown Gold Gradient -->
    <linearGradient id="goldCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="25%" stop-color="#fde047"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="85%" stop-color="#ca8a04"/>
      <stop offset="100%" stop-color="#854d0e"/>
    </linearGradient>

    <!-- 4K Ultra HD Badge Gold Frame -->
    <linearGradient id="badgeGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#713f12"/>
    </linearGradient>

    <!-- Glow Filters -->
    <filter id="intenseCyanGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#00f5ff" flood-opacity="0.95"/>
      <feDropShadow dx="0" dy="0" stdDeviation="24" flood-color="#0284c7" flood-opacity="0.75"/>
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.9"/>
    </filter>

    <filter id="yellowSplashShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000000" flood-opacity="0.95"/>
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ffb700" flood-opacity="0.5"/>
    </filter>

    <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.8"/>
    </filter>

    <!-- Circular Clips -->
    <clipPath id="earthClip">
      <circle cx="600" cy="190" r="225"/>
    </clipPath>

    <clipPath id="clipTopLeft1"><polygon points="0,0 230,0 210,310 0,310"/></clipPath>
    <clipPath id="clipTopLeft2"><polygon points="210,0 410,0 380,260 190,260"/></clipPath>
    <clipPath id="clipTopRight1"><polygon points="970,0 1200,0 1200,310 990,310"/></clipPath>
    <clipPath id="clipTopRight2"><polygon points="790,0 990,0 1010,260 820,260"/></clipPath>
    <clipPath id="clipMidLeft1"><polygon points="0,290 250,290 220,550 0,550"/></clipPath>
    <clipPath id="clipMidLeft2"><polygon points="230,250 490,250 460,540 210,540"/></clipPath>
    <clipPath id="clipBottomLeft"><polygon points="0,530 260,530 240,730 0,730"/></clipPath>
    <clipPath id="clipBottomCenter"><polygon points="240,530 960,530 940,730 220,730"/></clipPath>
    <clipPath id="clipMidRight1"><polygon points="970,290 1200,290 1200,550 950,550"/></clipPath>
    <clipPath id="clipBottomRight"><polygon points="940,530 1200,530 1200,730 920,730"/></clipPath>
  </defs>

  <!-- Dark Cosmic Canvas -->
  <rect width="1200" height="800" fill="url(#spaceBg)"/>

  <!-- ============================================================== -->
  <!-- BACKGROUND PHOTO MONTAGE GRID (MATCHING THE ORIGINAL THUMBNAIL) -->
  <!-- ============================================================== -->

  <!-- Top Center: Earth in Space -->
  <g>
    <!-- Outer Glow Orbit -->
    <circle cx="600" cy="190" r="236" fill="none" stroke="#00e5ff" stroke-width="4" opacity="0.6"/>
    <circle cx="600" cy="190" r="230" fill="url(#earthGlow)"/>
    <g clip-path="url(#earthClip)">
      <image href="{b64['earth']}" x="360" y="-40" width="480" height="460" preserveAspectRatio="xMidYMid slice"/>
      <!-- Soft cosmic vignette over earth -->
      <circle cx="600" cy="190" r="225" fill="#000000" opacity="0.15"/>
    </g>
  </g>

  <!-- Top Left: Cyborg / Robot Android Face -->
  <g clip-path="url(#clipTopLeft1)">
    <image href="{b64['robot']}" x="0" y="0" width="240" height="320" preserveAspectRatio="xMidYMid slice"/>
    <rect x="0" y="0" width="240" height="320" fill="#00e5ff" opacity="0.12" style="mix-blend-mode: overlay;"/>
  </g>

  <!-- Top Mid-Left: Royal Bengal Tiger -->
  <g clip-path="url(#clipTopLeft2)">
    <image href="{b64['tiger']}" x="190" y="0" width="220" height="270" preserveAspectRatio="xMidYMid slice"/>
  </g>

  <!-- Top Mid-Right: Mountain Waterfall -->
  <g clip-path="url(#clipTopRight2)">
    <image href="{b64['waterfall']}" x="790" y="0" width="220" height="270" preserveAspectRatio="xMidYMid slice"/>
  </g>

  <!-- Top Right: Great White Shark Leaping from Ocean -->
  <g clip-path="url(#clipTopRight1)">
    <image href="{b64['shark']}" x="970" y="0" width="230" height="320" preserveAspectRatio="xMidYMid slice"/>
  </g>

  <!-- Mid Left: Black Lamborghini / Supercar on Wet Street -->
  <g clip-path="url(#clipMidLeft1)">
    <image href="{b64['car']}" x="0" y="270" width="260" height="290" preserveAspectRatio="xMidYMid slice"/>
  </g>

  <!-- Mid Left Action: Explosion, Fire, Helicopter & Burning Building -->
  <g clip-path="url(#clipMidLeft2)">
    <image href="{b64['explosion']}" x="210" y="240" width="280" height="310" preserveAspectRatio="xMidYMid slice"/>
  </g>

  <!-- Bottom Left: Cute Kitten Waving -->
  <g clip-path="url(#clipBottomLeft)">
    <image href="{b64['cat']}" x="0" y="520" width="260" height="220" preserveAspectRatio="xMidYMid slice"/>
  </g>

  <!-- Bottom Center: Colorful Paint Mixing (Yellow & Red Pouring into Slime) -->
  <g clip-path="url(#clipBottomCenter)">
    <image href="{b64['paint']}" x="220" y="510" width="740" height="230" preserveAspectRatio="xMidYMid slice"/>
  </g>

  <!-- Mid-Right: Taj Mahal Sunset Reflection -->
  <g clip-path="url(#clipMidRight1)">
    <image href="{b64['taj']}" x="950" y="270" width="250" height="290" preserveAspectRatio="xMidYMid slice"/>
  </g>

  <!-- Bottom Right: Modern Smartphone iPhone -->
  <g clip-path="url(#clipBottomRight)">
    <image href="{b64['phone']}" x="920" y="520" width="280" height="220" preserveAspectRatio="xMidYMid slice"/>
  </g>

  <!-- Ambient Vignette & Shadow Across Mid-Section for Text Readability -->
  <rect x="0" y="140" width="1200" height="420" fill="url(#spaceBg)" opacity="0.55"/>
  <circle cx="600" cy="330" r="380" fill="#000000" opacity="0.6" filter="blur(40px)"/>

  <!-- ============================================================== -->
  <!-- TOP RIGHT BADGES -->
  <!-- ============================================================== -->

  <!-- "REALISTIC AI VIDEOS 1000+" Yellow Distressed Splash Tag -->
  <g transform="translate(805, 55) rotate(-3)" filter="url(#badgeShadow)">
    <path d="M 0,15 L 205,0 L 220,48 L 10,65 Z" fill="#ffd000"/>
    <text x="110" y="28" font-family="'Impact', 'Arial Black', sans-serif" font-size="21" font-weight="900" fill="#111827" text-anchor="middle" letter-spacing="0.5">REALISTIC</text>
    <text x="110" y="50" font-family="'Impact', 'Arial Black', sans-serif" font-size="22" font-weight="900" fill="#dc2626" text-anchor="middle" letter-spacing="0.5">AI VIDEOS 1000+</text>
  </g>

  <!-- 4K ULTRA HD Golden Glossy Badge -->
  <g transform="translate(1085, 30)" filter="url(#badgeShadow)">
    <!-- Gold Frame -->
    <rect x="0" y="0" width="95" height="74" rx="10" fill="#000000" stroke="url(#badgeGoldGrad)" stroke-width="4"/>
    <text x="47" y="44" font-family="'Impact', 'Arial Black', sans-serif" font-size="40" font-weight="900" fill="url(#badgeGoldGrad)" text-anchor="middle">4K</text>
    <rect x="5" y="52" width="85" height="16" fill="url(#badgeGoldGrad)" rx="3"/>
    <text x="47" y="64" font-family="'Arial Black', sans-serif" font-size="9" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="0.5">ULTRA HD</text>
  </g>

  <!-- ============================================================== -->
  <!-- CENTER TITLE TYPOGRAPHY (ULTI DUNIYA AI VIDEOS 1000+) -->
  <!-- ============================================================== -->

  <!-- Golden Crown Above Text -->
  <g transform="translate(555, 175)" filter="url(#intenseCyanGlow)">
    <path d="M 0,40 L 15,10 L 45,28 L 75,10 L 90,40 Z" fill="url(#goldCrownGrad)" stroke="#78350f" stroke-width="2"/>
    <!-- Jewels on crown -->
    <circle cx="15" cy="10" r="4" fill="#ffffff"/>
    <circle cx="45" cy="28" r="4" fill="#ef4444"/>
    <circle cx="75" cy="10" r="4" fill="#ffffff"/>
    <circle cx="45" cy="38" r="3" fill="#38bdf8"/>
  </g>

  <!-- LINE 1: "ULTI DUNIYA" in Bold 3D Metallic Chrome -->
  <g transform="translate(600, 275)">
    <!-- 3D Shadow / Extrusion Layers -->
    <text x="0" y="14" font-family="'Impact', 'Arial Black', sans-serif" font-size="118" font-weight="900" fill="#050811" text-anchor="middle" letter-spacing="2">ULTI DUNIYA</text>
    <text x="0" y="10" font-family="'Impact', 'Arial Black', sans-serif" font-size="118" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="2">ULTI DUNIYA</text>
    <text x="0" y="6" font-family="'Impact', 'Arial Black', sans-serif" font-size="118" font-weight="900" fill="#1e293b" text-anchor="middle" letter-spacing="2">ULTI DUNIYA</text>

    <!-- Heavy Black Outline -->
    <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="118" font-weight="900" fill="#000000" stroke="#000000" stroke-width="16" stroke-linejoin="round" text-anchor="middle" letter-spacing="2">ULTI DUNIYA</text>

    <!-- Chrome Gradient Face -->
    <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="118" font-weight="900" fill="url(#chromeGrad)" text-anchor="middle" letter-spacing="2">ULTI DUNIYA</text>
  </g>

  <!-- LINE 2: "AI VIDEOS" in Electric Neon Cyan with Heavy Glow -->
  <g transform="translate(600, 375)" filter="url(#intenseCyanGlow)">
    <!-- 3D Extrusion Shadow -->
    <text x="0" y="12" font-family="'Impact', 'Arial Black', sans-serif" font-size="124" font-weight="900" fill="#082f49" text-anchor="middle" letter-spacing="2">AI VIDEOS</text>
    <text x="0" y="8" font-family="'Impact', 'Arial Black', sans-serif" font-size="124" font-weight="900" fill="#0369a1" text-anchor="middle" letter-spacing="2">AI VIDEOS</text>

    <!-- Heavy Black Outline -->
    <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="124" font-weight="900" fill="#000000" stroke="#000000" stroke-width="18" stroke-linejoin="round" text-anchor="middle" letter-spacing="2">AI VIDEOS</text>

    <!-- Electric Cyan Gradient Face -->
    <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="124" font-weight="900" fill="url(#cyanVideoGrad)" stroke="#e0faff" stroke-width="2" text-anchor="middle" letter-spacing="2">AI VIDEOS</text>
  </g>

  <!-- LINE 3: Yellow Paint Brushstroke Banner Behind "1000+" -->
  <g filter="url(#yellowSplashShadow)">
    <path d="M 330,465 
             Q 350,440 420,448 
             L 760,442 
             Q 820,438 855,472 
             L 865,528 
             Q 840,555 790,550 
             L 370,558 
             Q 320,552 328,505 
             Z" 
          fill="url(#yellowSplashGrad)"/>
    <!-- Distressed paint splatters around the yellow brushstroke -->
    <circle cx="315" cy="460" r="10" fill="#ffd000"/>
    <circle cx="300" cy="485" r="7" fill="#ffb700"/>
    <circle cx="325" cy="545" r="12" fill="#ffd000"/>
    <circle cx="865" cy="455" r="9" fill="#ffd000"/>
    <circle cx="880" cy="490" r="14" fill="#ff9900"/>
    <circle cx="860" cy="540" r="8" fill="#ffd000"/>
    <polygon points="340,435 365,445 350,455" fill="#ffd000"/>
    <polygon points="830,432 855,438 845,450" fill="#ffd000"/>
  </g>

  <!-- "1000+" Bold Red 3D Numbers -->
  <g transform="translate(600, 528)">
    <!-- 3D Shadow Layers -->
    <text x="0" y="14" font-family="'Impact', 'Arial Black', sans-serif" font-size="105" font-weight="900" fill="#260002" text-anchor="middle" letter-spacing="3">1000+</text>
    <text x="0" y="10" font-family="'Impact', 'Arial Black', sans-serif" font-size="105" font-weight="900" fill="#450a0a" text-anchor="middle" letter-spacing="3">1000+</text>
    <text x="0" y="6" font-family="'Impact', 'Arial Black', sans-serif" font-size="105" font-weight="900" fill="#7f1d1d" text-anchor="middle" letter-spacing="3">1000+</text>

    <!-- Heavy Black Outline -->
    <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="105" font-weight="900" fill="#000000" stroke="#000000" stroke-width="16" stroke-linejoin="round" text-anchor="middle" letter-spacing="3">1000+</text>

    <!-- Core Red Gradient -->
    <text x="0" y="0" font-family="'Impact', 'Arial Black', sans-serif" font-size="105" font-weight="900" fill="url(#redNumberGrad)" stroke="#ffe4e6" stroke-width="1" text-anchor="middle" letter-spacing="3">1000+</text>
  </g>

  <!-- ============================================================== -->
  <!-- BOTTOM STRIP / 6 NEON CATEGORY PILLS + ENDLESS ENTERTAINMENT -->
  <!-- ============================================================== -->
  <g transform="translate(0, 730)">
    <!-- Solid Black Bar -->
    <rect width="1200" height="70" fill="#000000"/>
    <line x1="0" y1="0" x2="1200" y2="0" stroke="#1e293b" stroke-width="2"/>

    <!-- 1. NATURE VIDEOS (Green) -->
    <g transform="translate(25, 12)">
      <circle cx="23" cy="23" r="18" fill="#022c22" stroke="#10b981" stroke-width="2.5"/>
      <polygon points="19,16 31,23 19,30" fill="#10b981"/>
      <text x="50" y="22" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" fill="#ffffff" letter-spacing="0.5">NATURE</text>
      <text x="50" y="34" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" fill="#10b981" letter-spacing="0.5">VIDEOS</text>
    </g>

    <!-- 2. AI CREATIONS (Cyan) -->
    <g transform="translate(145, 12)">
      <circle cx="23" cy="23" r="18" fill="#082f49" stroke="#06b6d4" stroke-width="2.5"/>
      <!-- Robot Face Icon -->
      <rect x="14" y="15" width="18" height="16" rx="3" fill="none" stroke="#06b6d4" stroke-width="2"/>
      <circle cx="19" cy="21" r="2" fill="#06b6d4"/>
      <circle cx="27" cy="21" r="2" fill="#06b6d4"/>
      <line x1="18" y1="27" x2="28" y2="27" stroke="#06b6d4" stroke-width="1.5"/>
      <text x="48" y="22" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" fill="#ffffff" letter-spacing="0.5">AI</text>
      <text x="48" y="34" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" fill="#06b6d4" letter-spacing="0.5">CREATIONS</text>
    </g>

    <!-- 3. CARS & BIKES (Pink/Red) -->
    <g transform="translate(275, 12)">
      <circle cx="23" cy="23" r="18" fill="#4c0519" stroke="#f43f5e" stroke-width="2.5"/>
      <!-- Car Icon -->
      <path d="M 13,26 L 16,18 L 30,18 L 33,26 Z" fill="none" stroke="#f43f5e" stroke-width="1.8"/>
      <circle cx="17" cy="27" r="2.5" fill="#f43f5e"/>
      <circle cx="29" cy="27" r="2.5" fill="#f43f5e"/>
      <text x="50" y="22" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" fill="#ffffff" letter-spacing="0.5">CARS &amp;</text>
      <text x="50" y="34" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" fill="#f43f5e" letter-spacing="0.5">BIKES</text>
    </g>

    <!-- 4. ANIMALS VIDEOS (Orange) -->
    <g transform="translate(400, 12)">
      <circle cx="23" cy="23" r="18" fill="#431407" stroke="#f97316" stroke-width="2.5"/>
      <!-- Paw Icon -->
      <circle cx="23" cy="26" r="4.5" fill="#f97316"/>
      <circle cx="16" cy="18" r="2" fill="#f97316"/>
      <circle cx="21" cy="15" r="2" fill="#f97316"/>
      <circle cx="26" cy="15" r="2" fill="#f97316"/>
      <circle cx="31" cy="18" r="2" fill="#f97316"/>
      <text x="50" y="22" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" fill="#ffffff" letter-spacing="0.5">ANIMALS</text>
      <text x="50" y="34" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" fill="#f97316" letter-spacing="0.5">VIDEOS</text>
    </g>

    <!-- 5. SCIENCE & EXPERIMENTS (Purple) -->
    <g transform="translate(535, 12)">
      <circle cx="23" cy="23" r="18" fill="#3b0764" stroke="#a855f7" stroke-width="2.5"/>
      <!-- Flask Icon -->
      <path d="M 20,14 L 26,14 M 23,14 L 23,20 L 16,30 L 30,30 L 23,20" fill="none" stroke="#a855f7" stroke-width="2"/>
      <text x="50" y="22" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" fill="#ffffff" letter-spacing="0.5">SCIENCE &amp;</text>
      <text x="50" y="34" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" fill="#a855f7" letter-spacing="0.5">EXPERIMENTS</text>
    </g>

    <!-- 6. COLOR MIXING & MORE (Cyan/Palette) -->
    <g transform="translate(685, 12)">
      <circle cx="23" cy="23" r="18" fill="#082f49" stroke="#38bdf8" stroke-width="2.5"/>
      <!-- Palette Icon -->
      <circle cx="23" cy="23" r="10" fill="none" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="18" cy="20" r="1.5" fill="#38bdf8"/>
      <circle cx="23" cy="17" r="1.5" fill="#38bdf8"/>
      <circle cx="27" cy="20" r="1.5" fill="#38bdf8"/>
      <text x="50" y="22" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" fill="#ffffff" letter-spacing="0.5">COLOR MIXING</text>
      <text x="50" y="34" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" fill="#38bdf8" letter-spacing="0.5">&amp; MORE</text>
    </g>

    <!-- ENDLESS ENTERTAINMENT Distressed Yellow Tag -->
    <g transform="translate(950, 8) rotate(-2)">
      <path d="M 0,10 L 225,0 L 235,46 L 5,56 Z" fill="#ffd000"/>
      <text x="117" y="28" font-family="'Impact', 'Arial Black', sans-serif" font-size="20" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="1">ENDLESS</text>
      <text x="117" y="47" font-family="'Impact', 'Arial Black', sans-serif" font-size="18" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="1">ENTERTAINMENT</text>
    </g>
  </g>
</svg>'''

os.makedirs('public/thumbnails', exist_ok=True)
os.makedirs('dist/thumbnails', exist_ok=True)

with open('public/thumbnails/ulti-duniya-ai-video-1.svg', 'w', encoding='utf-8') as f:
    f.write(svg)

with open('dist/thumbnails/ulti-duniya-ai-video-1.svg', 'w', encoding='utf-8') as f:
    f.write(svg)

print("SUCCESS: ulti-duniya-ai-video-1.svg created in public/ and dist/!")
