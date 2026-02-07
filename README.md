# Adobe Stock AI Title & Category Autofill (Chrome Extension)

Extension ini membantu mengisi **title** dan **category** secara otomatis pada halaman upload Adobe Stock menggunakan AI (API yang kompatibel dengan OpenAI). Extension akan mendeteksi asset yang sudah diupload (foto/video), lalu mengirimkan nama file dan konteks ke AI untuk menghasilkan metadata.

## Fitur
- Tombol **AI Autofill** muncul di halaman Adobe Stock Contributor.
- Deteksi asset yang sudah diupload dan input metadata yang tersedia.
- Integrasi AI melalui endpoint OpenAI-compatible (bisa OpenAI, Azure OpenAI, atau proxy sendiri).

## Struktur File
```
extension/
  manifest.json
  background.js
  content.js
  options.html
  options.js
```

## Cara Install (Developer Mode)
1. Buka **chrome://extensions**.
2. Aktifkan **Developer mode**.
3. Klik **Load unpacked**.
4. Pilih folder `/workspace/chatgpt/extension`.

## Konfigurasi
1. Klik **Details** pada extension.
2. Pilih **Extension options**.
3. Isi:
   - **API Base URL** (default OpenAI chat completions)
   - **API Key**
   - **Model** (contoh `gpt-4o-mini`)
   - **Category List** (satu per baris)

## Cara Pakai
1. Masuk ke **Adobe Stock Contributor** (https://contributor.stock.adobe.com/).
2. Upload file foto/video seperti biasa.
3. Pada halaman metadata, klik tombol **AI Autofill**.
4. Extension akan mengisi title dan category jika masih kosong.

## Catatan Teknis
- Extension menggunakan `chrome.storage.sync` untuk menyimpan konfigurasi.
- Konten AI harus mengembalikan JSON `{ "title": "...", "category": "..." }`.
- Jika Adobe Stock mengubah DOM, Anda bisa menyesuaikan selector di `content.js`.

## Keamanan
Pastikan API key Anda disimpan dengan aman. Jangan membagikan key tersebut ke publik.
