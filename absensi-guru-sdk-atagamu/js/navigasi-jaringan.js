(function () {
  let tujuanTerakhir = null;
  let labelTerakhir = "halaman";
  let timerMuatHalaman = null;

  function hitungBatasWaktuMs() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return 10000;

    const tipe = (conn.effectiveType || "").toLowerCase();
    const rtt = Number(conn.rtt) || 0;

    if (conn.saveData || tipe === "slow-2g" || tipe === "2g") {
      return 16000;
    }
    if (tipe === "3g" || rtt > 600) {
      return 13000;
    }
    return 10000;
  }

  function tampilkanLoading(pesan, detail) {
    const overlay = document.getElementById("overlayLoadingJaringan");
    const popupError = document.getElementById("popupKesalahanJaringan");
    const elPesan = document.getElementById("teksLoadingJaringan");
    const elDetail = document.getElementById("detailLoadingJaringan");

    if (popupError) popupError.classList.add("tersembunyi");
    if (elPesan) elPesan.textContent = pesan || "Menyiapkan halaman...";
    if (elDetail) elDetail.textContent = detail || "Menyesuaikan kondisi jaringan Anda...";
    if (overlay) overlay.classList.remove("tersembunyi");
  }

  function sembunyikanLoading() {
    const overlay = document.getElementById("overlayLoadingJaringan");
    if (overlay) overlay.classList.add("tersembunyi");
    if (timerMuatHalaman) {
      clearTimeout(timerMuatHalaman);
      timerMuatHalaman = null;
    }
  }

  function tampilkanPopupError(pesanError) {
    sembunyikanLoading();
    const popupError = document.getElementById("popupKesalahanJaringan");
    const elDeskripsi = document.getElementById("deskripsiErrorJaringan");

    if (elDeskripsi) {
      elDeskripsi.textContent =
        pesanError || "Jaringan sedang tidak stabil atau lambat. Silakan periksa koneksi Anda lalu coba lagi.";
    }
    if (popupError) popupError.classList.remove("tersembunyi");
  }

  function tutupPopupError() {
    const popupError = document.getElementById("popupKesalahanJaringan");
    if (popupError) popupError.classList.add("tersembunyi");
  }

  function navigasiAman(url, namaHalaman) {
    if (!url) return;

    tujuanTerakhir = url;
    labelTerakhir = namaHalaman || "halaman";
    tutupPopupError();

    if (!navigator.onLine) {
      tampilkanPopupError(
        "Perangkat sedang offline. Aktifkan Wi-Fi atau data seluler terlebih dahulu."
      );
      return;
    }

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const tipeKoneksi = conn && conn.effectiveType ? conn.effectiveType.toUpperCase() : "STANDAR";
    const batasMs = hitungBatasWaktuMs();

    tampilkanLoading(
      `Membuka ${labelTerakhir}...`,
      `Koneksi: ${tipeKoneksi} · Batas tunggu ${Math.round(batasMs / 1000)} detik.`
    );

    // Jika halaman belum selesai terbuka melewati batas waktu, tampilkan pop-up kesalahan jaringan
    timerMuatHalaman = setTimeout(() => {
      tampilkanPopupError(
        "Halaman terlalu lama dimuat karena jaringan lambat atau tidak stabil."
      );
    }, batasMs);

    // Beri jeda singkat agar loading sempat terlihat lalu pindah halaman
    setTimeout(() => {
      window.location.href = url;
    }, 180);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const tombolCek = document.querySelectorAll("[data-cek-jaringan='true']");
    tombolCek.forEach((el) => {
      el.addEventListener("click", (event) => {
        const href = el.getAttribute("href");
        if (!href || href.startsWith("#")) return;
        event.preventDefault();
        const label = el.getAttribute("data-label-tujuan") || el.textContent.trim();
        navigasiAman(href, label);
      });
    });

    const btnBatal = document.getElementById("btnBatalLoading");
    if (btnBatal) {
      btnBatal.addEventListener("click", () => {
        sembunyikanLoading();
      });
    }

    const btnTutup = document.getElementById("btnTutupPopupJaringan");
    if (btnTutup) {
      btnTutup.addEventListener("click", tutupPopupError);
    }

    const btnCobaLagi = document.getElementById("btnCobaLagiJaringan");
    if (btnCobaLagi) {
      btnCobaLagi.addEventListener("click", () => {
        if (tujuanTerakhir) {
          navigasiAman(tujuanTerakhir, labelTerakhir);
        }
      });
    }

    // Bersihkan loading otomatis saat kembali ke halaman lewat tombol Back browser
    window.addEventListener("pageshow", () => {
      sembunyikanLoading();
    });

    window.addEventListener("offline", () => {
      if (timerMuatHalaman) {
        tampilkanPopupError(
          "Koneksi jaringan terputus saat membuka halaman. Silakan coba lagi setelah tersambung."
        );
      }
    });
  });
})();