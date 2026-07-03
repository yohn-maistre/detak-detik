#!/usr/bin/env python3
"""
DAFTAR MERAH NUSANTARA — the REFRESH pipeline (§13.13: sources are open
public APIs, the registry is the reviewed snapshot the newsroom rotates).

The ROSTER (which 30 species; id/ilmiah/pulau/koordinat/endemik) is curated
and read from newsroom/data/atlas/hayati.json; every API-sourced field
(ringkas, gambar+license, IUCN status) is RE-PULLED on each run:
Verifies each species against:
  - id.wikipedia REST summary  (verbatim lead `ringkas` + lead image)
  - Commons imageinfo          (license + attribution for the lead image)
  - GBIF iucnRedListCategory   (authoritative IUCN status code)
Wikimedia requests are spaced >= 2.2s (a sibling agent shares that pool).
GBIF is a different host -> lighter spacing.
"""
import json, sys, time, urllib.parse, urllib.request, re, html

UA = "detak-detik-factdesk/1.0 (civic newspaper; https://detak-detik) python-urllib"
_last_wm = [0.0]  # last wikimedia hit
WM_GAP = 2.2

def _get(url, timeout=15):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))

def wm_get(url, timeout=15):
    dt = time.time() - _last_wm[0]
    if dt < WM_GAP:
        time.sleep(WM_GAP - dt)
    try:
        return _get(url, timeout)
    finally:
        _last_wm[0] = time.time()

def strip_html(s):
    if not s: return ""
    s = re.sub(r"<[^>]*>", "", s)
    return html.unescape(s).strip()

def commons_file_from_url(u):
    """Derive 'File:Name.ext' from an upload.wikimedia commons url (orig or thumb)."""
    if not u: return None
    if "/commons/" not in u: return None
    tail = u.split("/commons/", 1)[1]
    parts = tail.split("/")
    # thumb path: thumb/a/ab/Name.ext/NNNpx-Name.ext
    if parts and parts[0] == "thumb":
        # filename is second-to-last component
        name = parts[-2]
    else:
        name = parts[-1]
    return "File:" + urllib.parse.unquote(name)

def commons_license(filetitle):
    if not filetitle: return None
    u = ("https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*"
         "&prop=imageinfo&iiprop=url|extmetadata"
         "&iiextmetadatafilter=LicenseShortName|Artist|Credit|Attribution"
         "&titles=" + urllib.parse.quote(filetitle))
    try:
        d = wm_get(u)
    except Exception as e:
        return {"error": str(e)}
    pages = d.get("query", {}).get("pages", {})
    for _, p in pages.items():
        ii = (p.get("imageinfo") or [{}])[0]
        em = ii.get("extmetadata", {})
        lic = strip_html(em.get("LicenseShortName", {}).get("value", ""))
        artist = strip_html(em.get("Artist", {}).get("value", ""))
        return {"lisensi": lic or None, "artist": artist or None, "url": ii.get("url")}
    return None

def gbif_iucn(sci):
    try:
        m = _get("https://api.gbif.org/v1/species/match?strict=false&name=" + urllib.parse.quote(sci), 15)
    except Exception as e:
        return {"error": "match:" + str(e)}
    key = m.get("usageKey")
    if not key:
        return {"error": "no usageKey", "matchType": m.get("matchType")}
    time.sleep(0.4)
    try:
        c = _get("https://api.gbif.org/v1/species/%d/iucnRedListCategory" % key, 15)
    except Exception as e:
        return {"error": "iucn:" + str(e), "usageKey": key}
    return {"code": c.get("code"), "category": c.get("category"),
            "sci": c.get("scientificName"), "usageKey": key}

# IUCN code -> Indonesian label (house convention from PetaKabar/SisaAlam)
LABEL = {
    "CR": "Kritis", "EN": "Genting", "VU": "Rentan", "NT": "Hampir Terancam",
    "LC": "Risiko Rendah", "DD": "Data Kurang", "EW": "Punah di Alam Liar",
    "EX": "Punah", "NE": "Belum Dinilai",
}

# ---- the curated seed (id.wikipedia title, my metadata, curated IUCN fallback) ----
SEED = [
  # ===== FAUNA =====
  dict(id="badak-jawa", nama="Badak jawa", ilmiah="Rhinoceros sondaicus", takson="fauna", kelompok="mamalia",
       wilayah="Taman Nasional Ujung Kulon, Banten, Jawa", pulau="jawa", koordinat=[-6.75,105.35],
       endemik="Kini hanya bertahan di Ujung Kulon, ujung barat Jawa.", iucn="CR", judul="Badak jawa"),
  dict(id="badak-sumatra", nama="Badak sumatra", ilmiah="Dicerorhinus sumatrensis", takson="fauna", kelompok="mamalia",
       wilayah="Sumatra dan Kalimantan", pulau="sumatra", koordinat=[0.5,101.5],
       endemik="Badak berbulu terkecil yang tersisa, terbatas di hutan Sumatra dan Kalimantan.", iucn="CR", judul="Badak sumatra"),
  dict(id="harimau-sumatra", nama="Harimau sumatra", ilmiah="Panthera tigris sumatrae", takson="fauna", kelompok="mamalia",
       wilayah="Pulau Sumatra", pulau="sumatra", koordinat=[-0.5,101.5],
       endemik="Subspesies harimau terakhir Indonesia; endemik Sumatra.", iucn="CR", judul="Harimau sumatra"),
  dict(id="orangutan-sumatra", nama="Orangutan sumatra", ilmiah="Pongo abelii", takson="fauna", kelompok="mamalia",
       wilayah="Sumatra bagian utara", pulau="sumatra", koordinat=[3.5,97.8],
       endemik="Endemik hutan utara Sumatra.", iucn="CR", judul="Orangutan sumatra"),
  dict(id="orangutan-tapanuli", nama="Orangutan tapanuli", ilmiah="Pongo tapanuliensis", takson="fauna", kelompok="mamalia",
       wilayah="Ekosistem Batang Toru, Tapanuli, Sumatra Utara", pulau="sumatra", koordinat=[1.55,99.05],
       endemik="Kera besar paling langka di dunia, hanya di Batang Toru.", iucn="CR", judul="Orang utan tapanuli"),
  dict(id="orangutan-kalimantan", nama="Orangutan kalimantan", ilmiah="Pongo pygmaeus", takson="fauna", kelompok="mamalia",
       wilayah="Pulau Kalimantan (Borneo)", pulau="kalimantan", koordinat=[0.5,113.5],
       endemik="Endemik Borneo, terbagi tiga subspesies.", iucn="CR", judul="Orang utan kalimantan"),
  dict(id="anoa", nama="Anoa dataran rendah", ilmiah="Bubalus depressicornis", takson="fauna", kelompok="mamalia",
       wilayah="Pulau Sulawesi", pulau="sulawesi", koordinat=[-1.5,121.0],
       endemik="Kerbau kerdil endemik Sulawesi.", iucn="EN", judul="Anoa"),
  dict(id="babirusa", nama="Babirusa", ilmiah="Babyrousa celebensis", takson="fauna", kelompok="mamalia",
       wilayah="Sulawesi utara dan tengah", pulau="sulawesi", koordinat=[0.5,122.5],
       endemik="Babi bertaring melengkung, endemik Sulawesi.", iucn="VU", judul="Babirusa"),
  dict(id="tarsius", nama="Tarsius", ilmiah="Tarsius", takson="fauna", kelompok="mamalia",
       wilayah="Sulawesi dan pulau sekitarnya", pulau="sulawesi", koordinat=[-1.0,124.0],
       endemik="Primata terkecil, mata sebesar otaknya; endemik Wallacea.", iucn="VU", judul="Tarsius"),
  dict(id="bekantan", nama="Bekantan", ilmiah="Nasalis larvatus", takson="fauna", kelompok="mamalia",
       wilayah="Hutan bakau dan riparian Kalimantan", pulau="kalimantan", koordinat=[-2.0,114.5],
       endemik="Monyet berhidung panjang, endemik Borneo.", iucn="EN", judul="Bekantan"),
  dict(id="yaki", nama="Yaki (monyet hitam sulawesi)", ilmiah="Macaca nigra", takson="fauna", kelompok="mamalia",
       wilayah="Sulawesi utara", pulau="sulawesi", koordinat=[1.4,125.0],
       endemik="Monyet berjambul hitam, endemik Sulawesi utara.", iucn="CR", judul="Monyet hitam sulawesi"),
  dict(id="kucing-merah", nama="Kucing merah", ilmiah="Catopuma badia", takson="fauna", kelompok="mamalia",
       wilayah="Pedalaman Kalimantan (Borneo)", pulau="kalimantan", koordinat=[1.0,114.0],
       endemik="Kucing liar endemik Borneo, sangat jarang teramati.", iucn="EN", judul="Kucing merah"),
  dict(id="owa-jawa", nama="Owa jawa", ilmiah="Hylobates moloch", takson="fauna", kelompok="mamalia",
       wilayah="Hutan Jawa bagian barat", pulau="jawa", koordinat=[-6.7,106.6],
       endemik="Owa kelabu endemik hutan Jawa Barat.", iucn="EN", judul="Owa jawa"),
  dict(id="surili", nama="Surili", ilmiah="Presbytis comata", takson="fauna", kelompok="mamalia",
       wilayah="Jawa Barat", pulau="jawa", koordinat=[-6.9,107.0],
       endemik="Lutung endemik Jawa Barat.", iucn="EN", judul="Surili"),
  dict(id="macan-tutul-jawa", nama="Macan tutul jawa", ilmiah="Panthera pardus melas", takson="fauna", kelompok="mamalia",
       wilayah="Pulau Jawa", pulau="jawa", koordinat=[-7.3,110.0],
       endemik="Karnivora besar terakhir Jawa; subspesies endemik.", iucn="CR", judul="Macan tutul jawa"),
  dict(id="maleo", nama="Maleo", ilmiah="Macrocephalon maleo", takson="fauna", kelompok="burung",
       wilayah="Sulawesi", pulau="sulawesi", koordinat=[-1.0,120.0],
       endemik="Burung gosong endemik Sulawesi; menetaskan telur dengan panas bumi.", iucn="EN", judul="Maleo"),
  dict(id="jalak-bali", nama="Jalak bali", ilmiah="Leucopsar rothschildi", takson="fauna", kelompok="burung",
       wilayah="Bali bagian barat", pulau="bali", koordinat=[-8.15,114.5],
       endemik="Endemik Bali barat, satwa identitas provinsi Bali.", iucn="CR", judul="Jalak bali"),
  dict(id="cendrawasih-merah", nama="Cendrawasih merah", ilmiah="Paradisaea rubra", takson="fauna", kelompok="burung",
       wilayah="Kepulauan Raja Ampat, Papua Barat Daya", pulau="papua", koordinat=[-0.4,130.7],
       endemik="Endemik Raja Ampat (Waigeo, Batanta, Gam).", iucn="NT", judul="Cendrawasih merah"),
  dict(id="kakatua-jambul-kuning", nama="Kakatua-kecil jambul-kuning", ilmiah="Cacatua sulphurea", takson="fauna", kelompok="burung",
       wilayah="Nusa Tenggara, Sulawesi, dan Timor", pulau="nusa-tenggara", koordinat=[-8.5,120.0],
       endemik="Kakatua endemik Wallacea, ditangkap besar-besaran untuk perdagangan.", iucn="CR", judul="Kakatua kecil jambul-kuning"),
  dict(id="komodo", nama="Komodo", ilmiah="Varanus komodoensis", takson="fauna", kelompok="reptil",
       wilayah="Komodo, Rinca, Flores, Nusa Tenggara Timur", pulau="nusa-tenggara", koordinat=[-8.55,119.5],
       endemik="Kadal terbesar di dunia, endemik NTT.", iucn="EN", judul="Komodo"),
  dict(id="ikan-raja-laut", nama="Ikan raja laut", ilmiah="Latimeria menadoensis", takson="fauna", kelompok="ikan",
       wilayah="Perairan dalam Sulawesi utara (Manado)", pulau="sulawesi", koordinat=[1.5,124.8],
       endemik="Coelacanth Sulawesi, 'fosil hidup' endemik perairan Manado.", iucn="VU", judul="Coelacanth"),
  dict(id="rangkong-gading", nama="Rangkong gading", ilmiah="Rhinoplax vigil", takson="fauna", kelompok="burung",
       wilayah="Hutan Sumatra dan Kalimantan", pulau="sumatra", koordinat=[-1.0,102.0],
       endemik="Enggang berbalung padat, diburu untuk 'gading merah'.", iucn="CR", judul="Rangkong gading"),

  # ===== FLORA =====
  dict(id="rafflesia-arnoldii", nama="Rafflesia arnoldii", ilmiah="Rafflesia arnoldii", takson="flora", kelompok="tumbuhan",
       wilayah="Hutan Sumatra dan Kalimantan barat daya", pulau="sumatra", koordinat=[-3.5,102.3],
       endemik="Padma raksasa, bunga tunggal terbesar di dunia; puspa langka nasional.", iucn="", judul="Rafflesia arnoldii"),
  dict(id="bunga-bangkai", nama="Bunga bangkai raksasa", ilmiah="Amorphophallus titanum", takson="flora", kelompok="tumbuhan",
       wilayah="Hutan hujan Sumatra", pulau="sumatra", koordinat=[-2.0,101.5],
       endemik="Perbungaan tak bercabang tertinggi di dunia; endemik Sumatra.", iucn="EN", judul="Bunga bangkai raksasa"),
  dict(id="anggrek-hitam", nama="Anggrek hitam", ilmiah="Coelogyne pandurata", takson="flora", kelompok="tumbuhan",
       wilayah="Kalimantan dan Sumatra", pulau="kalimantan", koordinat=[0.0,114.0],
       endemik="Anggrek berlidah hitam, maskot flora Kalimantan Timur.", iucn="", judul="Anggrek hitam"),
  dict(id="edelweis-jawa", nama="Edelweis jawa", ilmiah="Anaphalis javanica", takson="flora", kelompok="tumbuhan",
       wilayah="Padang tinggi pegunungan Jawa", pulau="jawa", koordinat=[-7.9,112.9],
       endemik="'Bunga abadi' endemik puncak gunung Jawa.", iucn="", judul="Edelweis jawa"),
  dict(id="nepenthes-aristolochioides", nama="Kantong semar", ilmiah="Nepenthes aristolochioides", takson="flora", kelompok="tumbuhan",
       wilayah="Dataran tinggi Sumatra (Jambi)", pulau="sumatra", koordinat=[-1.7,101.3],
       endemik="Kantong semar berkantong unik, endemik pegunungan Sumatra.", iucn="CR", judul="Nepenthes aristolochioides"),
  dict(id="ulin", nama="Ulin (kayu besi)", ilmiah="Eusideroxylon zwageri", takson="flora", kelompok="tumbuhan",
       wilayah="Kalimantan dan Sumatra", pulau="kalimantan", koordinat=[0.0,115.0],
       endemik="Kayu besi Borneo, kayu terkeras dan tahan lama.", iucn="VU", judul="Ulin"),
  dict(id="anggrek-tebu", nama="Anggrek tebu", ilmiah="Grammatophyllum speciosum", takson="flora", kelompok="tumbuhan",
       wilayah="Hutan dataran rendah Nusantara", pulau="sumatra", koordinat=[-2.0,104.0],
       endemik="Anggrek raksasa, jenis anggrek terbesar dan terberat di dunia.", iucn="", judul="Anggrek tebu"),
  dict(id="cendana", nama="Cendana", ilmiah="Santalum album", takson="flora", kelompok="tumbuhan",
       wilayah="Nusa Tenggara Timur (Timor, Sumba)", pulau="nusa-tenggara", koordinat=[-9.7,124.0],
       endemik="Kayu wangi ikon Nusa Tenggara Timur, kian langka akibat penebangan.", iucn="VU", judul="Cendana"),
]

def summary(title):
    u = "https://id.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title, safe="")
    return wm_get(u)

def clean_extract(e):
    if not e: return ""
    # strip MediaWiki lang-template rendering artifacts ("code: la is deprecated")
    e = re.sub(r"\s*code:\s*\w+\s*is deprecated\s*", "", e)
    e = re.sub(r"([A-Za-z])code:\s*", r"\1", e)  # e.g. "arnoldiicode:" -> "arnoldii"
    e = re.sub(r"\s+", " ", e).strip()
    return e

def exintro(title):
    """Full lead-section plaintext; richer than REST summary when that is thin/empty."""
    u = ("https://id.wikipedia.org/w/api.php?action=query&format=json&origin=*"
         "&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=" + urllib.parse.quote(title))
    try:
        d = wm_get(u)
    except Exception:
        return ""
    pages = d.get("query", {}).get("pages", {})
    for _, p in pages.items():
        return clean_extract(p.get("extract", ""))
    return ""

REGISTRY = __file__.rsplit("/scripts/", 1)[0] + "/newsroom/data/atlas/hayati.json"

def main():
    try:
        roster = json.load(open(REGISTRY, encoding="utf-8"))
        seed = [{**r, "judul": (r.get("wikipedia") or {}).get("judul") or r.get("judul")} for r in roster]
        print("roster: %d rows from registry" % len(seed), file=sys.stderr)
    except Exception:
        seed = SEED  # bootstrap roster (first run / lost registry)
        print("roster: bootstrap SEED (%d rows)" % len(seed), file=sys.stderr)
    out = []
    problems = []
    for i, s in enumerate(seed):
        tag = "%2d/%d %s" % (i+1, len(seed), s["id"])
        try:
            d = summary(s["judul"])
        except Exception as e:
            problems.append((s["id"], "summary FAIL: " + str(e)))
            print(tag, "SUMMARY-FAIL", e, file=sys.stderr); continue
        if d.get("type") == "disambiguation":
            problems.append((s["id"], "DISAMBIGUATION at title=" + s["judul"]))
        extract = clean_extract(d.get("extract", ""))
        # thin or empty REST summary -> fall back to the full lead section
        if len(extract) < 200:
            longer = exintro(s["judul"])
            if len(longer) > len(extract):
                extract = longer
                print(tag, "  (used exintro fallback, len=%d)" % len(extract), file=sys.stderr)
        # keep the magazine floor bounded; cut on a sentence boundary near ~760 chars
        if len(extract) > 780:
            cut = extract[:780]
            dot = max(cut.rfind(". "), cut.rfind(".” "))
            extract = (cut[:dot+1] if dot > 400 else cut.rstrip())
        real_title = d.get("title", s["judul"])
        wiki_url = d.get("content_urls", {}).get("desktop", {}).get("page") or \
                   ("https://id.wikipedia.org/wiki/" + urllib.parse.quote(real_title.replace(" ", "_")))
        img_url = (d.get("originalimage") or {}).get("source") or (d.get("thumbnail") or {}).get("source")
        gambar = None
        if img_url:
            ftitle = commons_file_from_url(img_url)
            lic = commons_license(ftitle) if ftitle else None
            atrib = None
            lisensi = None
            if lic and not lic.get("error"):
                lisensi = lic.get("lisensi")
                artist = lic.get("artist")
                bits = [b for b in [artist, lisensi] if b]
                atrib = ", ".join(bits) + (", via Wikimedia Commons" if bits else "")
            gambar = {"url": img_url, "berkas": ftitle, "lisensi": lisensi, "atribusi": atrib or None}
            if not lisensi:
                problems.append((s["id"], "no license resolved for " + str(ftitle)))
        else:
            problems.append((s["id"], "NO IMAGE in summary"))

        g = gbif_iucn(s["ilmiah"])
        code = None
        if g and not g.get("error") and g.get("code"):
            code = g["code"]
        # fall back to curated IUCN when GBIF has no assessment (subspecies / plants)
        used = "gbif"
        if not code:
            code = s.get("iucn") or "NE"
            used = "curated" if s.get("iucn") else "none"
        code = code if code in LABEL else "NE"

        rec = {
            "id": s["id"], "nama": s["nama"], "ilmiah": s["ilmiah"],
            "takson": s["takson"], "kelompok": s["kelompok"],
            "wilayah": s["wilayah"], "pulau": s["pulau"], "koordinat": s["koordinat"],
            "endemik": s["endemik"],
            "status": {"kode": code, "label": LABEL[code], "sumber": used},
            "wikipedia": {"judul": real_title, "url": wiki_url},
            "ringkas": extract,
            "gambar": gambar,
        }
        out.append(rec)
        print(tag, "OK", "img=%s" % bool(gambar and gambar.get("lisensi")),
              "iucn=%s(%s)" % (code, used), "ext=%d" % len(extract), file=sys.stderr)

    dst = REGISTRY
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print("\n=== WROTE %d records to %s ===" % (len(out), dst), file=sys.stderr)
    print("=== PROBLEMS (%d) ===" % len(problems), file=sys.stderr)
    for pid, msg in problems:
        print("  ", pid, "->", msg, file=sys.stderr)

if __name__ == "__main__":
    main()
