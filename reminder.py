#!/usr/bin/env python3
"""Reminder OSIS -> Google Chat (jalan via GitHub Actions)."""
import json
import os
import urllib.request
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Asia/Jakarta")

# Kirim reminder berapa hari sebelum kegiatan (2 = persiapan, 1 = H-1 / BC malam ini)
REMIND_DAYS_BEFORE = [2, 1]

# Sapaan di BC. Ganti ke nama divisi kalau mau spesifik, mis. "CHATTRADHYARA 7️⃣, DYAGASVARA ♾️, PD 09 ❾"
AUDIENCE = "seluruh anggota OSIS"

HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
BULAN = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
         "Agustus", "September", "Oktober", "November", "Desember"]

# ---------------------------------------------------------------------------
# EDIT DI SINI: detail tiap kegiatan. Yang tertulis "(isi)" harus kamu lengkapi.
# ---------------------------------------------------------------------------
EVENTS = {
    "olahraga": {
        "nama": "Olahraga Pagi",
        "judul": "PENGUMUMAN OLAHRAGA PAGI",
        "pembuka": "Mari kita mulai pagi esok dengan ber…",
        "kegiatan": "🎉Lari + Olahraga bebas🎉",
        "waktu": "Setelah Subuh",
        "tempat": "Lapangan Bola",
        "dresscode": "Baju Hitam & Bawahan gelap",
        "persiapan": [
            "Konfirmasi lapangan bola bisa dipakai",
            "Tentukan PIC yang pimpin pemanasan",
            "Siapkan air minum / P3K",
            "Siapkan absensi peserta",
        ],
    },
    "sotd": {
        "nama": "SoTD (Speakers of the Day)",
        "judul": "PENGUMUMAN SPEAKERS OF THE DAY",
        "pembuka": "Besok kita akan kedatangan para…",
        "kegiatan": "🎤Speakers of the Day (SoTD)🎤",
        "waktu": "(isi)",
        "tempat": "(isi)",
        "dresscode": "(isi)",
        "persiapan": [
            "Konfirmasi daftar speaker besok",
            "Cek topik & durasi tiap speaker",
            "Siapkan MC, mic, dan sound system",
            "Siapkan dokumentasi",
        ],
    },
    "cas": {
        "nama": "CAS",
        "judul": "PENGUMUMAN CAS",
        "pembuka": "Besok kita akan melaksanakan…",
        "kegiatan": "🌱CAS (Creativity, Activity, Service)🌱",
        "waktu": "(isi)",
        "tempat": "(isi)",
        "dresscode": "(isi)",
        "persiapan": [
            "Konfirmasi rangkaian kegiatan CAS dengan koordinator",
            "Siapkan perlengkapan & lokasi",
            "Bagi PJ per kelompok",
            "Siapkan absensi & dokumentasi",
        ],
    },
    "awarding": {
        "nama": "Awarding (Saintek)",
        "judul": "PENGUMUMAN AWARDING",
        "pembuka": "Besok kita akan menyaksikan…",
        "kegiatan": "🏆Awarding (Saintek)🏆",
        "waktu": "(isi)",
        "tempat": "(isi)",
        "dresscode": "(isi)",
        "persiapan": [
            "Koordinasi dengan Saintek: daftar penerima award",
            "Siapkan piala / sertifikat / hadiah",
            "Siapkan MC & rundown",
            "Siapkan dokumentasi",
        ],
    },
    "morning": {
        "nama": "Morning Creativity (Sebubu)",
        "judul": "PENGUMUMAN MORNING CREATIVITY",
        "pembuka": "Besok pagi kita akan tampil kreatif bersama…",
        "kegiatan": "🎨Morning Creativity🎨",
        "waktu": "(isi)",
        "tempat": "(isi)",
        "dresscode": "(isi)",
        "persiapan": [
            "Koordinasi dengan Sebubu: konsep & rundown",
            "Cek perlengkapan (sound, properti, dll.)",
            "Konfirmasi tampilan / pengisi acara",
            "Siapkan dokumentasi",
        ],
    },
    "proker": {
        "nama": "Proker Divisi Lain",
        "judul": "PENGUMUMAN PROKER OSIS",
        "pembuka": "Besok akan ada program kerja dari…",
        "kegiatan": "(isi nama proker & divisi)",
        "waktu": "(isi)",
        "tempat": "(isi)",
        "dresscode": "(isi)",
        "persiapan": [
            "Tanyakan divisi terkait: proker apa & butuh bantuan apa",
            "Minta detail waktu, tempat, dan dress code",
            "Koordinasi perlengkapan",
        ],
    },
}


def events_for(d: date) -> list[str]:
    """Kegiatan yang jatuh pada tanggal d."""
    wd = d.weekday()  # Senin=0 ... Minggu=6
    if wd == 1:                      # Selasa
        return ["sotd"]
    if wd in (2, 5):                 # Rabu & Sabtu
        return ["olahraga"]
    if wd == 4 and d.day <= 7:       # Jumat minggu pertama
        return ["olahraga"]
    if wd == 3:                      # Kamis
        if d.day % 2 == 0:
            return ["cas"]
        # Kamis tanggal ganjil ke-1/2/3 dalam bulan itu
        odd_thursdays = [
            day for day in range(1, d.day + 1)
            if date(d.year, d.month, day).weekday() == 3 and day % 2 == 1
        ]
        urutan = ["awarding", "morning", "proker"]
        idx = len(odd_thursdays) - 1
        return [urutan[idx]] if idx < len(urutan) else []
    return []


def fmt_date(d: date) -> str:
    return f"{HARI[d.weekday()]}, {d.day} {BULAN[d.month]} {d.year}"


def relative_label(n: int) -> str:
    return {1: "Besok", 2: "Lusa"}.get(n, f"{n} hari lagi")


def build_message(key: str, d: date, n: int) -> str:
    e = EVENTS[key]
    persiapan = "\n".join(f"  ☐ {p}" for p in e["persiapan"])
    bc = (
        "🏅OSIS SMA PRADITA DIRGANTARA🏅\n"
        f"⚠️ {e['judul']}⚠️\n\n"
        f"Selamat malam {AUDIENCE}\n\n"
        f"{e['pembuka']}\n"
        f"{e['kegiatan']}\n\n"
        f"📆 {fmt_date(d)}\n"
        f"🕠 {e['waktu']}\n"
        f"📍 {e['tempat']}\n"
        f"👕 {e['dresscode']}"
    )
    if n == 1:
        aksi = "📢 *Kirim BC malam ini ya!*"
    else:
        aksi = "📢 *Mulai siapin BC & koordinasi*, BC dikirim malam sebelum hari-H."
    return (
        f"⏰ *REMINDER OSIS* — {relative_label(n)} ada *{e['nama']}*\n"
        f"🗓 {fmt_date(d)}\n\n"
        f"✅ *Persiapan:*\n{persiapan}\n\n"
        f"{aksi}\n"
        f"Draft BC (tinggal copy & lengkapi yang bertanda (isi)):\n"
        f"```\n{bc}\n```"
    )


def send(webhook: str, text: str) -> None:
    req = urllib.request.Request(
        webhook,
        data=json.dumps({"text": text}).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=UTF-8"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        print("Terkirim:", r.status)


def main() -> None:
    override = os.environ.get("TARGET_DATE", "").strip()  # untuk testing: YYYY-MM-DD
    today = date.fromisoformat(override) if override else datetime.now(TZ).date()
    webhook = os.environ.get("GCHAT_WEBHOOK_URL", "").strip()
    dry = os.environ.get("DRY_RUN", "").lower() in ("1", "true", "yes") or not webhook

    print(f"Hari ini (WIB): {fmt_date(today)}  | dry_run={dry}")
    sent = 0
    for n in REMIND_DAYS_BEFORE:
        target = today + timedelta(days=n)
        for key in events_for(target):
            msg = build_message(key, target, n)
            print("-" * 50)
            print(msg)
            if not dry:
                send(webhook, msg)
            sent += 1
    if sent == 0:
        print("Tidak ada reminder hari ini.")


if __name__ == "__main__":
    main()
