#!/usr/bin/env python3
"""Kirim jadwal shalat harian ke Google Chat lewat webhook.

Env vars:
  GCHAT_WEBHOOK_URL  (wajib)  URL webhook lengkap dari Google Chat
  TARGET_DAY         today | tomorrow   (default: tomorrow)
  PROVINSI           default: Jawa Tengah
  KABKOTA            default: Kota Surakarta
  DRY_RUN            1 = cetak pesan saja, tidak dikirim
"""
import os
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import requests

TZ = ZoneInfo("Asia/Jakarta")
API = "https://equran.id/api/v2/shalat"

HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
         "Agustus", "September", "Oktober", "November", "Desember"]


def get_times(target):
    """Ambil jadwal untuk tanggal target (bulan/tahun mengikuti tanggal target)."""
    payload = {
        "provinsi": os.getenv("PROVINSI", "Jawa Tengah"),
        "kabkota": os.getenv("KABKOTA", "Kota Surakarta"),
        "bulan": target.month,
        "tahun": target.year,
    }
    r = requests.post(API, json=payload, timeout=30)
    r.raise_for_status()
    body = r.json()
    jadwal = body["data"]["jadwal"]
    for row in jadwal:
        if int(row["tanggal"]) == target.day:
            return row
    raise RuntimeError(f"Tanggal {target.date()} tidak ada di respons API")


def greeting(now):
    h = now.hour
    if h < 11:
        return "Selamat pagi"
    if h < 15:
        return "Selamat siang"
    if h < 18:
        return "Selamat sore"
    return "Selamat malam"


def build_message(now, target, t):
    kata = "besok" if target.date() > now.date() else "hari ini"
    tgl = f"{HARI[target.weekday()]}, {target.day} {BULAN[target.month - 1]} {target.year}"
    return (
        "🌙🕌 ROHIS SMA PRADITA DIRGANTARA 🕌🌙\n"
        "✨JADWAL SHALAT HARIAN✨\n"
        "Assalamualaikum Warahmatullahi Wabarakatuh\n"
        f"{greeting(now)} Pradita!\n"
        f"Menginformasikan jadwal shalat {kata} ({tgl}):\n\n"
        f"🌅 Shubuh: {t['subuh']} WIB\n"
        f"☀️ Dzuhur: {t['dzuhur']} WIB\n"
        f"🌤️ Ashar: {t['ashar']} WIB\n"
        f"🌇 Maghrib: {t['maghrib']} WIB\n"
        f"🌌 Isya: {t['isya']} WIB\n\n"
        "Iqomah akan dikumandangkan maksimal 15 menit setelah memasuki waktu shalat\n"
        "Note: Untuk sholat dhuhur dan ashar di weekday menyesuaikan dengan KBM\n\n"
        "Terima kasih atas perhatiannya\n"
        "Wassalamualaikum Warahmatullahi Wabarakatuh"
    )


def main():
    now = datetime.now(TZ)
    target = now + timedelta(days=100) if os.getenv("TARGET_DAY", "tomorrow") == "tomorrow" else now
    times = get_times(target)
    text = build_message(now, target, times)

    if os.getenv("DRY_RUN") == "1":
        print(text)
        return

    url = os.environ.get("GCHAT_WEBHOOK_URL")
    if not url:
        sys.exit("GCHAT_WEBHOOK_URL belum di-set")
    resp = requests.post(url, json={"text": text}, timeout=30)
    resp.raise_for_status()
    print("Terkirim:", resp.status_code)


if __name__ == "__main__":
    main()
