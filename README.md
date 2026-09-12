# বাংলা ফন্ট লাইব্রেরি | Bangla Font Library

A **complete, production-ready, fully static** Bangla font library website.  
Browse, preview, and download **700+ Bangla fonts** — works directly on [GitHub Pages](https://pages.github.com/).

---

## 🌐 Live Demo

> **https://mehdiakram.github.io/bangla-fonts/**

---

## ✨ Features

- **700+ Bangla fonts** — TTF and OTF
- **Live preview** — type custom Bengali text and see all fonts update instantly
- **Lazy font loading** — only loads fonts as they scroll into view (great for 500+ fonts)
- **Search** — instant client-side search by name, ID, category, format
- **Filter** — by format (All, TTF, OTF)
- **Sort** — A–Z, Z–A, file size
- **Dark / Light mode** — with `localStorage` persistence
- **Select & bulk download** — select multiple fonts → download as a single ZIP file
- **Individual downloads** — download any font with one click
- **Font preview modal** — large preview with custom text and size control
- **Pagination** — 24 fonts per page, scales to thousands
- **Fully responsive** — mobile, tablet, desktop
- **No backend required** — pure HTML + CSS + vanilla JavaScript
- **GitHub Pages compatible** — all relative paths, `.nojekyll` included

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
└── fonts/                  ← সব ফন্ট এখানে
    ├── FontName.ttf        ← সরাসরি ফন্ট ফাইল
    ├── font-folder/        ← গ্রুপ করা ফন্ট ফোল্ডার
    │   └── FontName.ttf
    └── ...
```

---

## 🚀 Deploy to GitHub Pages

1. **Fork or upload** this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set **Source** to `main` branch, `/ (root)`.
4. Your site will be live at `https://<username>.github.io/<repo-name>/`.

> The `.nojekyll` file prevents GitHub Pages from running Jekyll preprocessing, which would break font file paths with underscores.

---

## ➕ How to Add a New Font

### Step 1 — Add the font file

Place your font file inside the `fonts/` directory:

```
fonts/FontName.ttf                    ← directly in fonts/
fonts/font-folder/FontName.ttf        ← inside a subfolder of fonts/
```

### Step 2 — Update `fonts.json`

Open `fonts.json` and add an entry:

```json
{
  "id": "my-font-name",
  "name": "My Font Name",
  "file": "FontName.ttf",
  "format": "TTF",
  "size": "120 KB",
  "sizeBytes": 122880,
  "category": "Bangla",
  "license": "OFL",
  "folder": null
}
```

For a font inside a subfolder:

```json
{
  "id": "my-font-name",
  "name": "My Font Name",
  "file": "fonts/my-folder/FontName.ttf",
  "format": "TTF",
  "size": "120 KB",
  "sizeBytes": 122880,
  "category": "Bangla",
  "license": "OFL",
  "folder": "fonts/my-folder"
}
```

| Field       | Description                                     |
|-------------|-------------------------------------------------|
| `id`        | Unique slug (lowercase, hyphens only)           |
| `name`      | Display name shown on the font card             |
| `file`      | Relative path to the font file from root        |
| `format`    | `"TTF"` or `"OTF"`                              |
| `size`      | Human-readable file size (e.g. `"256 KB"`)      |
| `sizeBytes` | Raw byte count for sorting                      |
| `category`  | Category label (e.g. `"Bangla"`)                |
| `license`   | License name (e.g. `"OFL"`, `"Unknown"`)        |
| `folder`    | Parent folder name, or `null` for root-level    |

### Step 3 — Push and deploy

```bash
git add .
git commit -m "Add new font: My Font Name"
git push
```

GitHub Pages will rebuild automatically.

---

## 🔄 How to Regenerate `fonts.json` Automatically

If you have **PowerShell** available, run:

```powershell
$fontsDir = "."
$fonts = @()

function Format-Size($bytes) {
    if ($bytes -lt 1024) { return "$bytes B" }
    elseif ($bytes -lt 1MB) { return "{0:N1} KB" -f ($bytes/1KB) }
    else { return "{0:N2} MB" -f ($bytes/1MB) }
}

function Make-Id($name) {
    return ($name.ToLower() -replace '[^a-z0-9]+', '-').Trim('-')
}

Get-ChildItem -Path $fontsDir -File | Where-Object { $_.Extension -match '\.(ttf|otf)$' } | Sort-Object Name | ForEach-Object {
    $name = [IO.Path]::GetFileNameWithoutExtension($_.Name)
    $fonts += [PSCustomObject]@{
        id = Make-Id $name; name = $name; file = $_.Name
        format = $_.Extension.TrimStart('.').ToUpper()
        size = Format-Size $_.Length; sizeBytes = $_.Length
        category = "Bangla"; license = "Unknown"; folder = $null
    }
}

Get-ChildItem -Path $fontsDir -Directory | Sort-Object Name | ForEach-Object {
    $dir = $_
    Get-ChildItem -Path $dir.FullName -File -Recurse | Where-Object { $_.Extension -match '\.(ttf|otf)$' } | Sort-Object Name | ForEach-Object {
        $name = [IO.Path]::GetFileNameWithoutExtension($_.Name)
        $rel = $_.FullName.Substring((Resolve-Path $fontsDir).Path.Length + 1).Replace('\','/')
        $fonts += [PSCustomObject]@{
            id = Make-Id $name; name = $name; file = $rel
            format = $_.Extension.TrimStart('.').ToUpper()
            size = Format-Size $_.Length; sizeBytes = $_.Length
            category = "Bangla"; license = "Unknown"; folder = $dir.Name
        }
    }
}

$fonts | ConvertTo-Json -Depth 5 | Set-Content fonts.json -Encoding UTF8
Write-Host "Generated $($fonts.Count) fonts"
```

---

## 📦 How Bulk ZIP Download Works

1. User **selects** multiple fonts via checkboxes (or "Select All").
2. User clicks **"নির্বাচিত ডাউনলোড করুন"** in the sticky bar.
3. The app **fetches** each selected font file directly from the server.
4. Files are **zipped in-browser** using [JSZip](https://stuk.github.io/jszip/).
5. A single `Bangla-Fonts.zip` file is downloaded automatically.

No server-side processing is needed. The ZIP is generated entirely in the browser.

> **Performance note:** Fetching many large font files simultaneously can be slow on a slow connection. The progress bar shows real-time status.

---

## 🖋️ Font Licensing Considerations

> ⚠️ **Important:** This collection aggregates fonts from various authors and sources. **Licenses vary per font.**

Before using any font commercially or redistributing it:

1. Check the font's original source and license file.
2. Common licenses include:
   - **OFL (SIL Open Font License)** — free for personal and commercial use, modification allowed.
   - **Freeware** — free for personal use only.
   - **Unknown** — verify before commercial use.
3. Do **not** assume all fonts are free for commercial redistribution.

The `license` field in `fonts.json` is a best-effort indicator — always verify from the original source.

---

## 🛠️ Technology

| Tech             | Purpose                              |
|------------------|--------------------------------------|
| HTML5            | Semantic markup                      |
| CSS3             | Variables, grid, animations          |
| Vanilla JS ES6+  | App logic, lazy loading, search      |
| JSZip (CDN)      | In-browser ZIP generation            |
| IntersectionObserver API | Lazy font loading             |
| FontFace API     | Programmatic font loading + detection|

---

## 📄 License

The **website code** (HTML, CSS, JS) is released under the **MIT License**.  
The **font files** belong to their respective authors — see individual font sources for licensing.

---

*Built with ❤️ for the Bangla-speaking community.*
