# TAEKWONDO GO 🥋🎮

[![Demo Live](https://img.shields.io/badge/Demo-Live%20Preview-success?style=for-the-badge&logo=github)](https://ramandaputra.github.io/tkdgo/)

🔗 **Live Demo:** [https://ramandaputra.github.io/tkdgo/](https://ramandaputra.github.io/tkdgo/)

**Taekwondo Go** adalah aplikasi papan skor digital profesional bergaya *dual-sided handheld gamepad controller* yang dirancang khusus untuk pertandingan Taekwondo modern dengan sistem **Best of 3 Rounds** sesuai standar World Taekwondo (WT).

---

## ✨ Fitur Unggulan

- 🎮 **Desain Antarmuka Gamepad Ergonomis**:
  - **Wing Kiri (Chung / Sudut Biru)**: Kontrol serang +3, +6, +2, +4, +1, Gam-jeom, dan trigger L1 Undo.
  - **Wing Kanan (Hung / Sudut Merah)**: Kontrol serang simetris (mirrored layout) +6, +3, +4, +2, Gam-jeom, +1, dan trigger R1 Undo.
  - **Layar Pusat (OLED Monitor)**: Timer digital, pelacak ronde (round dots), papan skor, dan panel kontrol utama.
- ⏱️ **Timer Pertandingan & Konfigurasi**:
  - Tombol kontrol utama: **MULAI / JEDA**, **SELESAI RONDE**, **RESET WAKTU**, dan **RESET MATCH**.
  - Konfigurasi durasi ronde fleksibel (menit & detik) dan batas poin kemenangan otomatis (*Max Score Ceiling*, default: 20 poin).
- 🥋 **Aturan Pertandingan Resmi WT (Best of 3)**:
  - Atlet yang memenangkan 2 ronde berturut-turut langsung dinobatkan sebagai pemenang.
  - Jika seri 1-1 setelah ronde ke-2, pertandingan otomatis berlanjut ke **Ronde 3 (Golden Round / Penentu)**.
  - Evaluasi batas 5 Gam-jeom (diskualifikasi otomatis ronde untuk pihak pelanggar dan poin +1 untuk lawan).
  - Keputusan wasit keunggulan teknik jika skor ronde seri (*Tie-breaker decision*).
- ✎ **Revisi Skor Cepat**:
  - Klik angka skor untuk memunculkan popover revisi instan (`+1`, `+2`, `+3`, `-1`, `-2`, `-3`) atau ketik langsung angka manual.
- 📱 **Responsif & Kompatibel Mobile Landscape 16:9**:
  - Tampilan landscape ponsel (rasio 16:9 hingga 20:9) mempertahankan tata letak gamepad 3 kolom tanpa terpotong dan tanpa perlu scroll.
- ⌨️ **Keyboard Shortcut Support**:
  - Kontrol pertandingan menggunakan keyboard dua tangan untuk Chung (tangan kiri) dan Hung (tangan kanan).

---

## ⌨️ Pintasan Keyboard (Keyboard Shortcuts)

| Sudut Chung (Kiri) | Aksi | Sudut Hung (Kanan) | Aksi |
| :---: | :--- | :---: | :--- |
| <kbd>Q</kbd> | Poin +3 (Kepala) | <kbd>U</kbd> | Poin +3 (Kepala) |
| <kbd>W</kbd> | Poin +6 (Kepala Putar) | <kbd>I</kbd> | Poin +6 (Kepala Putar) |
| <kbd>A</kbd> | Poin +2 (Badan) | <kbd>J</kbd> | Poin +2 (Badan) |
| <kbd>S</kbd> | Poin +4 (Badan Putar) | <kbd>K</kbd> | Poin +4 (Badan Putar) |
| <kbd>D</kbd> | Poin +1 (Pukulan) | <kbd>L</kbd> | Poin +1 (Pukulan) |
| <kbd>E</kbd> | Gam-jeom (Lawan +1) | <kbd>O</kbd> | Gam-jeom (Lawan +1) |
| <kbd>Z</kbd> | L1 Undo Poin | <kbd>M</kbd> | R1 Undo Poin |

**Pusat & Timer:**
- <kbd>SPACE</kbd> : Mulai / Jeda Timer
- Klik Angka Skor : Buka Panel Revisi Skor Cepat

---

## 🚀 Cara Menjalankan

Aplikasi ini dibangun menggunakan teknologi web murni (**HTML5, Vanilla CSS3, dan Vanilla JavaScript**) tanpa dependensi build/framework eksternal.

1. Clone repositori ini:
   ```bash
   git clone https://github.com/ramandaputra/tkdgo.git
   ```
2. Buka folder proyek:
   ```bash
   cd tkdgo
   ```
3. Buka file `index.html` langsung di browser Anda (Google Chrome, Firefox, Safari, atau Edge) atau gunakan ekstensi seperti Live Server.

---

## 📂 Struktur File

```
tkdgo/
├── icon/
│   ├── app.svg         # Logo aplikasi Taekwondo Go
│   ├── gamjeom.svg     # Ikon Gam-jeom
│   ├── poin 1.svg      # Ikon serangan pukulan (+1)
│   ├── poin 2.svg      # Ikon tendangan badan (+2)
│   ├── poin 3.svg      # Ikon tendangan kepala (+3)
│   ├── poin 4.svg      # Ikon tendangan putar badan (+4)
│   └── poin 6.svg      # Ikon tendangan putar kepala (+6)
├── index.html          # Struktur tata letak gamepad & scoreboard
├── style.css           # Styling gamepad, neon glow, dan responsivitas mobile landscape
├── script.js           # Logika timer, aturan best of 3, gamjeom, dan audio synthesizer
└── README.md           # Dokumentasi proyek
```

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan turnamen, dojang, dan latihan atlet Taekwondo.
