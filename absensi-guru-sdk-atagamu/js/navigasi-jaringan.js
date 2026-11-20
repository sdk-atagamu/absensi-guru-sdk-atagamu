(function () {
  let controllerAktif = null;
  let tujuanTerakhir = null;
  let labelTerakhir = "halaman";

  function ambilInfoJaringan() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const tipe = conn && conn.effectiveType ? String(conn.effectiveType).toLowerCase() : "4g";
    const rtt = conn && Number(conn.rtt) ? Number(conn.rtt) : 0;
    const downlink = conn && Number(conn.downlink) ? Number(conn.downlink) : 0;
    const hematData = Boolean(conn && conn.saveData);

    const jaringanLambat =
      hematData ||
      tipe === "slow-2g" ||
      tipe === "2g" ||
      tipe === "3g" ||
      rtt > 500 ||
      (downlink > 0 && downlink < 0.8);

    return { tipe, rtt, downlink, hematData, jaringanLambat };
  }

  function hitungBatasTimeoutMs(info) {
    if (info.hematData || info.tipe === "slow-2g" || info.tipe === "2g") {
      return 15000;
    }
    if (info.tipe === "3g" || info.rtt > 500) {
      return 11000;
    }
    return 6000;
  }

  function tampilkanSpinnerSaja() {
    const overlay = document.getElementById("overlayLoadingJaringan");
    const popupError = document.getElementById("popupKesalahanJaringan");
    if (popupError) popupError.classList.add("tersembunyi");
    if (overlay) overlay.classList.remove("tersembunyi");
  }

  function sembunyikanSpinner() {
    const overlay = document.getElementById("overlayLoadingJaringan");
    if (overlay) overlay.classList.add("tersembunyi");
  }

  function tampilkanPopupError(pesanError) {
    sembunyikanSpinner();
    const popupError = document.getElementById("popupKesalahanJaringan");
    const elDeskripsi = document.getElementById("deskripsiErrorJaringan");

    if (elDeskripsi) {
      elDeskripsi.textContent =
        pesanError || "Koneksi jaringan sedang jelek atau tidak stabil. Silakan coba lagi.";
    }
    if (popupError) popupError.classList.remove("tersembunyi");
  }

  function tutupPopupError() {
    const popupError = document.getElementById("popupKesalahanJaringan");
    if (popupError) popupError.classList.add("tersembunyi");
  }

  async function bukaHalaman(url, namaHalaman) {
    if (!url) return;

    tujuanTerakhir = url;
    labelTerakhir = namaHalaman || "halaman";
    tutupPopupError();

    if (window.location.protocol === "file:") {
      window.location.href = url;
      return;
    }

    if (controllerAktif) {
      controllerAktif.abort();
    }

    if (!navigator.onLine) {
      tampilkanPopupError(
        "Perangkat sedang offline. Aktifkan Wi-Fi atau data seluler lalu coba lagi."
      );
      return;
    }

    const info = ambilInfoJaringan();
    const batasMs = hitungBatasTimeoutMs(info);

    tampilkanSpinnerSaja();

    const mulai = performance.now();
    controllerAktif = new AbortController();
    const timerId = setTimeout(() => {
      if (controllerAktif) controllerAktif.abort();
    }, batasMs);

    try {
      const pemisah = url.includes("?") ? "&" : "?";
      const urlCek = `${url}${pemisah}_t=${Date.now()}`;

      const respon = await fetch(urlCek, {
        method: "GET",
        cache: "no-store",
        signal: controllerAktif.signal
      });

      clearTimeout(timerId);
      const durasiRespon = performance.now() - mulai;

      if (!respon.ok) {
        tampilkanPopupError(
          `Halaman belum dapat dibuka (status ${respon.status}). Periksa jaringan atau alamat halaman.`
        );
        return;
      }

      // Jika jaringan lambat, beri jeda berputar proporsional sebelum berpindah agar transisi terasa halus
      const jedaAdaptif = info.jaringanLambat
        ? Math.min(1400, Math.max(450, Math.round(durasiRespon * 0.35)))
        : Math.min(450, Math.max(180, Math.round(durasiRespon * 0.2)));

      setTimeout(() => {
        window.location.href = url;
      }, jedaAdaptif);
    } catch (err) {
      clearTimeout(timerId);
      if (err && err.name === "AbortError") {
        tampilkanPopupError(
          "Koneksi jaringan terlalu lambat sehingga waktu memuat halaman habis. Silakan coba lagi."
        );
      } else {
        tampilkanPopupError(
          "Jaringan terputus atau tidak stabil saat memuat halaman. Periksa koneksi Anda lalu coba lagi."
        );
      }
    } finally {
      controllerAktif = null;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const tombolCek = document.querySelectorAll("[data-cek-jaringan='true']");
    tombolCek.forEach((el) => {
      el.addEventListener("click", (event) => {
        const href = el.getAttribute("href");
        if (!href || href.startsWith("#")) return;
        event.preventDefault();
        const label = el.getAttribute("data-label-tujuan") || el.textContent.trim();
        bukaHalaman(href, label);
      });
    });

    const btnTutup = document.getElementById("btnTutupPopupJaringan");
    if (btnTutup) {
      btnTutup.addEventListener("click", tutupPopupError);
    }

    const btnCobaLagi = document.getElementById("btnCobaLagiJaringan");
    if (btnCobaLagi) {
      btnCobaLagi.addEventListener("click", () => {
        if (tujuanTerakhir) {
          bukaHalaman(tujuanTerakhir, labelTerakhir);
        }
      });
    }

    window.addEventListener("pageshow", () => {
      sembunyikanSpinner();
    });
  });
})();