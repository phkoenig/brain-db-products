# Design Guidelines - BRAIN DB Products A

## **Übersicht**
Diese Design Guidelines basieren auf dem Subframe-Design-System und definieren die visuellen Standards für die BRAIN DB Products Anwendung.

---

## **🎨 Farbsystem**

### **Primärfarben (Brand)**
```css
brand-50:   rgb(253, 242, 248)   /* Sehr helles Pink */
brand-100:  rgb(252, 231, 243)   /* Helles Pink */
brand-200:  rgb(251, 207, 232)   /* Mittleres Pink */
brand-300:  rgb(249, 168, 212)   /* Pink */
brand-400:  rgb(244, 114, 182)   /* Kräftiges Pink */
brand-500:  rgb(236, 72, 153)    /* Haupt-Pink */
brand-600:  rgb(219, 39, 119)    /* Dunkles Pink (Primary) */
brand-700:  rgb(190, 24, 93)     /* Sehr dunkles Pink */
brand-800:  rgb(157, 23, 77)     /* Fast schwarz-Pink */
brand-900:  rgb(131, 24, 67)     /* Schwarz-Pink */
```

### **Neutrale Farben**
```css
neutral-0:    rgb(255, 255, 255)  /* Weiß */
neutral-50:   rgb(250, 250, 250)  /* Sehr helles Grau */
neutral-100:  rgb(245, 245, 245)  /* Helles Grau */
neutral-200:  rgb(229, 229, 229)  /* Mittleres Grau (Border) */
neutral-300:  rgb(212, 212, 212)  /* Grau */
neutral-400:  rgb(163, 163, 163)  /* Mittleres Grau */
neutral-500:  rgb(115, 115, 115)  /* Subtext */
neutral-600:  rgb(82, 82, 82)     /* Dunkles Grau */
neutral-700:  rgb(64, 64, 64)     /* Sehr dunkles Grau */
neutral-800:  rgb(38, 38, 38)     /* Fast schwarz */
neutral-900:  rgb(23, 23, 23)     /* Haupttext */
neutral-950:  rgb(10, 10, 10)     /* Schwarz */
```

### **Semantische Farben**
```css
/* Erfolg */
success-500:  rgb(6, 182, 212)    /* Türkis */

/* Warnung */
warning-500:  rgb(234, 179, 8)    /* Gelb */

/* Fehler */
error-500:    rgb(217, 70, 239)   /* Lila */
error-600:    rgb(192, 38, 211)   /* Dunkles Lila */

/* Spezielle Farben */
brand-primary:    rgb(219, 39, 119)   /* Hauptfarbe */
default-font:     rgb(23, 23, 23)     /* Haupttext */
subtext-color:    rgb(115, 115, 115)  /* Nebentext */
neutral-border:   rgb(229, 229, 229)  /* Rahmen */
default-background: rgb(255, 255, 255) /* Hintergrund */
```

---

## **📝 Typografie**

### **Schriftart**
- **Primär:** `Inter` (Sans-Serif)
- **Monospace:** `monospace` (für Code)

### **Schriftgrößen**
```css
caption:        12px / 16px / 400    /* Kleine Beschriftungen */
caption-bold:   12px / 16px / 500    /* Fette Beschriftungen */
body:           14px / 20px / 400    /* Haupttext */
body-bold:      14px / 20px / 500    /* Fetter Haupttext */
heading-3:      16px / 20px / 600    /* Kleine Überschriften */
heading-2:      20px / 24px / 600    /* Mittlere Überschriften */
title:          30px / 36px / 700    /* Große Überschriften */
monospace-body: 14px / 20px / 400    /* Code-Text */
```

---

## **📏 Spacing & Layout**

### **Abstände**
```css
4px   /* Sehr kleine Abstände */
8px   /* Kleine Abstände */
16px  /* Standard-Abstände */
24px  /* Mittlere Abstände */
32px  /* Große Abstände */
```

### **Border Radius**
```css
sm:    2px   /* Sehr kleine Rundungen */
md:    4px   /* Standard-Rundungen */
lg:    8px   /* Große Rundungen */
full:  9999px /* Vollständig rund */
```

### **Container Padding**
```css
DEFAULT: 16px
sm:      calc((100vw + 16px - 640px) / 2)
md:      calc((100vw + 16px - 768px) / 2)
lg:      calc((100vw + 16px - 1024px) / 2)
xl:      calc((100vw + 16px - 1280px) / 2)
2xl:     calc((100vw + 16px - 1536px) / 2)
```

---

## **🎯 Komponenten**

### **Button**
**Größen:**
- `small`: `h-6 px-2` (24px Höhe)
- `medium`: `h-8 px-3` (32px Höhe) - **Standard**
- `large`: `h-10 px-4` (40px Höhe)

**Varianten:**
- `brand-primary`: Pink Hintergrund, weißer Text
- `brand-secondary`: Helles Pink Hintergrund, dunkler Text
- `brand-tertiary`: Transparent, Pink Hover
- `neutral-primary`: Grauer Hintergrund
- `neutral-secondary`: Weißer Hintergrund, Rahmen
- `neutral-tertiary`: Transparent, Grau Hover
- `destructive-primary`: Roter Hintergrund
- `destructive-secondary`: Helles Rot
- `destructive-tertiary`: Transparent, Rot Hover
- `inverse`: Für dunkle Hintergründe

### **TextField**
**Größe:** `h-8` (32px Höhe)
**Varianten:**
- `outline`: Rahmen, weißer Hintergrund
- `filled`: Grauer Hintergrund, Rahmen beim Hover

**Zustände:**
- `default`: Neutraler Rahmen
- `focus`: Pinker Rahmen (`brand-primary`)
- `error`: Roter Rahmen (`error-600`)
- `disabled`: Grauer Hintergrund

### **Card**
**Schatten:**
- `sm`: `0px 1px 2px 0px rgba(0, 0, 0, 0.05)`
- `default`: `0px 1px 2px 0px rgba(0, 0, 0, 0.05)`
- `md`: `0px 4px 16px -2px rgba(0, 0, 0, 0.08), 0px 2px 4px -1px rgba(0, 0, 0, 0.08)`
- `lg`: `0px 12px 32px -4px rgba(0, 0, 0, 0.08), 0px 4px 8px -2px rgba(0, 0, 0, 0.08)`

---

## **📱 Responsive Design**

### **Breakpoints**
```css
mobile: max-width 767px
sm:     640px
md:     768px
lg:     1024px
xl:     1280px
2xl:    1536px
```

### **Mobile-First Ansatz**
- Alle Komponenten sind standardmäßig mobile-optimiert
- Größere Breakpoints fügen zusätzliche Styles hinzu

---

## **🎨 Icon Guidelines**

### **Größen**
- **Small:** `text-body` (14px)
- **Medium:** `text-heading-3` (16px)
- **Large:** `text-heading-2` (20px)

### **Farben**
- **Primary:** `text-white` (auf dunklen Hintergründen)
- **Secondary:** `text-subtext-color` (neutral)
- **Brand:** `text-brand-700` (für Akzente)

---

## **🔧 Verwendung**

### **CSS-Klassen**
Verwende immer die vordefinierten Tailwind-Klassen:
```jsx
// ✅ Richtig
className="text-body font-body text-default-font"

// ❌ Falsch
className="text-sm font-normal text-gray-900"
```

### **Komponenten**
Verwende die vordefinierten React-Komponenten:
```jsx
// ✅ Richtig
<Button variant="brand-primary" size="medium">
  Speichern
</Button>

// ❌ Falsch
<button className="bg-pink-600 text-white px-3 py-1">
  Speichern
</button>
```

---

## **📋 Checkliste für neue Features**

- [ ] Verwendet vordefinierte Farben aus dem Farbsystem
- [ ] Verwendet korrekte Typografie-Klassen
- [ ] Verwendet standardisierte Spacing-Werte
- [ ] Ist responsive (mobile-first)
- [ ] Verwendet vordefinierte Komponenten
- [ ] Folgt den Hover/Focus-States
- [ ] Ist barrierefrei (ARIA-Labels, etc.)

---

## **🔄 Updates**

Diese Guidelines werden bei Änderungen am Design-System aktualisiert. Alle Entwickler müssen sich an diese Standards halten, um Konsistenz zu gewährleisten.

**Letzte Aktualisierung:** 2025-08-07 