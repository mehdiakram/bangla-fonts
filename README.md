# বাংলা ফন্ট লাইব্রেরি | Bangla Font Library

A **complete, production-ready, fully static** Bangla font library website.  
Browse, preview, and download **1400+ Bangla fonts** — Unicode ও ANSI উভয় ধরনের ফন্ট সমর্থিত।

---

## 🌐 Live Demo

> **https://mehdiakram.github.io/bangla-fonts/**

---

## ✨ Features

- **1400+ Bangla fonts** — TTF, OTF, WOFF, WOFF2
- **Unicode ও ANSI filter** — এনকোডিং অনুযায়ী ফন্ট আলাদা করুন
- **Format filter** — TTF, OTF, WOFF, WOFF2 আলাদাভাবে ফিল্টার করুন
- **Live preview** — নিজের বাংলা টেক্সট লিখে সব ফন্ট তাৎক্ষণিক প্রিভিউ করুন
- **Lazy font loading** — শুধুমাত্র দেখা যাওয়া ফন্টই লোড হয় (১৫০০+ ফন্টের জন্য পারফরম্যান্ট)
- **Search** — নাম, ক্যাটাগরি, ফরম্যাট ও এনকোডিং দিয়ে সার্চ
- **Sort** — A–Z, Z–A, ফাইল সাইজ
- **Dark / Light mode** — `localStorage` এ সংরক্ষিত
- **Select & bulk download** — একাধিক ফন্ট সিলেক্ট করে একটি ZIP ফাইল হিসেবে ডাউনলোড
- **Individual download** — যেকোনো ফন্ট এক ক্লিকে ডাউনলোড
- **Font preview modal** — বড় প্রিভিউ, কাস্টম টেক্সট ও সাইজ নিয়ন্ত্রণ
- **Pagination** — প্রতি পেজে ২৪টি ফন্ট, হাজারো ফন্টের জন্য স্কেলযোগ্য
- **Fully responsive** — মোবাইল, ট্যাবলেট, ডেস্কটপ
- **No backend required** — pure HTML + CSS + Vanilla JavaScript
- **GitHub Pages compatible** — সম্পূর্ণ স্ট্যাটিক, কোনো সার্ভার দরকার নেই

---

## 📁 Project Structure

```
bangla-fonts/
│
├── index.html          ← Main HTML page
├── style.css           ← All styles (CSS Variables + dark mode)
├── app.js              ← Vanilla JS application
├── fonts.json          ← Font registry (auto-generated)
├── README.md
├── .nojekyll           ← Required for GitHub Pages
│
├── assets/
│   ├── logo.svg
│   └── favicon.svg
│
└── fonts/                   ← সব ফন্ট এখানে
    ├── FontName.ttf         ← সরাসরি ফন্ট ফাইল
    ├── new_fonts/           ← নতুন যোগ করা ফন্ট
    ├── google_fonts/        ← Google Fonts থেকে আনা
    └── font-folder/         ← গ্রুপ করা ফন্ট ফোল্ডার
        └── FontName.ttf
```

---

## 🚀 Deploy to GitHub Pages

1. **Fork or upload** এই repository টি GitHub-এ।
2. **Settings → Pages** এ যান।
3. **Source** → `main` branch, `/ (root)` সিলেক্ট করুন।
4. আপনার সাইট লাইভ হবে: `https://<username>.github.io/<repo-name>/`

> `.nojekyll` ফাইলটি GitHub Pages-কে Jekyll preprocessing থেকে বিরত রাখে, নাহলে আন্ডারস্কোর-যুক্ত ফন্ট পাথ ভেঙে যেত।

---

## ➕ How to Add a New Font

### Step 1 — ফন্ট ফাইল যোগ করুন

ফন্ট ফাইলটি `fonts/` ডিরেক্টরিতে রাখুন:

```
fonts/FontName.ttf                    ← সরাসরি fonts/ এ
fonts/font-folder/FontName.ttf        ← fonts/ এর সাবফোল্ডারে
```

### Step 2 — `fonts.json` আপডেট করুন

`fonts.json` খুলে একটি entry যোগ করুন:

```json
{
  "id": "my-font-name",
  "name": "My Font Name",
  "file": "fonts/FontName.ttf",
  "format": "TTF",
  "size": "120 KB",
  "sizeBytes": 122880,
  "category": "Bangla",
  "license": "OFL",
  "encoding": "Unicode",
  "folder": null
}
```

| Field       | Description                                            |
|-------------|--------------------------------------------------------|
| `id`        | Unique slug (lowercase, hyphens only)                  |
| `name`      | ফন্ট কার্ডে দেখানো নাম                               |
| `file`      | Root থেকে ফন্ট ফাইলের relative path                   |
| `format`    | `"TTF"`, `"OTF"`, `"WOFF"` বা `"WOFF2"`               |
| `size`      | Human-readable ফাইল সাইজ (যেমন `"256 KB"`)            |
| `sizeBytes` | Sorting-এর জন্য byte count                             |
| `category`  | Category label (যেমন `"Bangla"`)                       |
| `license`   | License (যেমন `"OFL"`, `"Unknown"`)                    |
| `encoding`  | `"Unicode"` বা `"ANSI"` — এনকোডিং ধরন                |
| `folder`    | Parent folder নাম, অথবা root-level হলে `null`          |

### Step 3 — Push করুন

```bash
git add .
git commit -m "Add new font: My Font Name"
git push
```

---

## 🔄 fonts.json স্বয়ংক্রিয়ভাবে তৈরি করুন (PowerShell)

```powershell
$rootDir  = "D:\path\to\bangla-fonts"
$fontsDir = "$rootDir\fonts"
$fonts    = @()
$seenIds  = @{}

function Format-Size($bytes) {
    if ($bytes -lt 1024)   { return "$bytes B" }
    elseif ($bytes -lt 1MB){ return "{0:N1} KB" -f ($bytes/1KB) }
    else                   { return "{0:N2} MB" -f ($bytes/1MB) }
}

function Make-UniqueId($base, $seen) {
    $id = ($base.ToLower() -replace '[^a-z0-9]+', '-').Trim('-')
    if (-not $seen.ContainsKey($id)) { $seen[$id] = 1; return $id }
    $c = $seen[$id]; $seen[$id]++
    return "$id-$c"
}

function Detect-Encoding($name, $folder) {
    $lowerName = $name.ToLower()
    $lowerFolder = if ($folder) { $folder.ToLower() } else { "" }
    if ($lowerName -match "ansi" -or $lowerFolder -match "ansi") { return "ANSI" }
    if ($lowerName -match "bijoy") { return "ANSI" }
    if ($lowerName -match "\bmj\b" -or $lowerName -match "omj") { return "ANSI" }
    return "Unicode"
}

# Root-level fonts
Get-ChildItem $fontsDir -File | Where-Object { $_.Extension -match '\.(ttf|otf|woff|woff2)$' } | ForEach-Object {
    $name = [IO.Path]::GetFileNameWithoutExtension($_.Name)
    $fonts += [PSCustomObject]@{
        id = Make-UniqueId $name $seenIds; name = $name
        file = "fonts/$($_.Name)"; format = $_.Extension.TrimStart('.').ToUpper()
        size = Format-Size $_.Length; sizeBytes = $_.Length
        category = "Bangla"; license = "Unknown"
        encoding = Detect-Encoding $name $null; folder = $null
    }
}

# Subdirectory fonts
Get-ChildItem $fontsDir -Directory | ForEach-Object {
    $sub = $_
    Get-ChildItem $sub.FullName -File -Recurse | Where-Object { $_.Extension -match '\.(ttf|otf|woff|woff2)$' } | ForEach-Object {
        $name = [IO.Path]::GetFileNameWithoutExtension($_.Name)
        $rel = "fonts/" + $_.FullName.Substring($fontsDir.Length + 1).Replace('\','/')
        $fonts += [PSCustomObject]@{
            id = Make-UniqueId $name $seenIds; name = $name
            file = $rel; format = $_.Extension.TrimStart('.').ToUpper()
            size = Format-Size $_.Length; sizeBytes = $_.Length
            category = "Bangla"; license = "Unknown"
            encoding = Detect-Encoding $name $sub.Name; folder = $sub.Name
        }
    }
}

$fonts | ConvertTo-Json -Depth 5 | Set-Content "$rootDir\fonts.json" -Encoding UTF8
Write-Host "Generated $($fonts.Count) fonts"
```

---

## 📦 Bulk ZIP Download কীভাবে কাজ করে

1. ব্যবহারকারী চেকবক্স দিয়ে ফন্ট সিলেক্ট করেন (অথবা "সব নির্বাচন")।
2. Sticky bar থেকে **"নির্বাচিত ডাউনলোড করুন"** ক্লিক করেন।
3. প্রতিটি ফন্ট ফাইল সরাসরি সার্ভার থেকে fetch করা হয়।
4. ব্রাউজারেই [JSZip](https://stuk.github.io/jszip/) দিয়ে ZIP তৈরি হয়।
5. `Bangla-Fonts.zip` ফাইল স্বয়ংক্রিয়ভাবে ডাউনলোড শুরু হয়।

কোনো server-side processing দরকার নেই।

---

## 🛠️ Technology

| Tech                     | Purpose                                      |
|--------------------------|----------------------------------------------|
| HTML5                    | Semantic markup                              |
| CSS3                     | Variables, grid, dark mode, animations       |
| Vanilla JS ES6+          | App logic, lazy loading, search, filter      |
| JSZip (CDN)              | In-browser ZIP generation                    |
| IntersectionObserver API | Lazy font loading                            |
| FontFace API             | Programmatic font loading                    |

---

## 📄 License

The **website code** (HTML, CSS, JS) is released under the **MIT License**.  
The **font files** belong to their respective authors — licensing varies per font.

---

*তৈরি করেছে [Royal Technologies](https://www.royaltechbd.com/) — বাংলাভাষী কমিউনিটির জন্য ❤️*
