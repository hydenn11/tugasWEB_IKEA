/**
 * TUGAS PEMROGRAMAN WEB: IKEA INDONESIA
 * Implementasi: JavaScript, jQuery, dan AJAX
 * Sumber API: DummyJSON (https://dummyjson.com)
 */

$(document).ready(function () {
  console.log("jQuery siap dan dokumen berhasil dimuat.");

  // Kurs konversi simulasi USD ke IDR untuk tema IKEA Indonesia
  const USD_TO_IDR = 16000;

  // 1. JAVASCRIPT: Format angka ke format mata uang Rupiah
  function formatRupiah(usd) {
    const idr = Math.round(usd * USD_TO_IDR);
    return "Rp " + idr.toLocaleString("id-ID");
  }

  // 2. JAVASCRIPT: Helper untuk membuat elemen rating bintang
  function renderStars(rating) {
    const fullStars = Math.round(rating);
    return "★".repeat(fullStars) + "☆".repeat(Math.max(0, 5 - fullStars));
  }

  // ==========================================================================
  // BAGIAN 1: HALAMAN UTAMA (INDEX.HTML) - AJAX LOAD PRODUK & FILTER
  // ==========================================================================
  const $productGrid = $("#product-grid");

  if ($productGrid.length) {
    let currentCategory = "furniture"; // Default kategori perabot IKEA

    // FUNGSI UTAMA AJAX: Memuat produk secara dinamis tanpa refresh halaman
    function fetchProducts(category) {
      // Tampilkan indikator Loading (animasi spinner)
      $productGrid.html(`
        <div class="loading-box">
          <div class="spinner"></div>
          <p class="loading-text">Memuat produk IKEA via AJAX...</p>
        </div>
      `);

      let apiUrl = category === "all"
        ? "https://dummyjson.com/products?limit=12"
        : `https://dummyjson.com/products/category/${category}`;

      // IMPLEMENTASI AJAX MENGGUNAKAN JQUERY
      $.ajax({
        url: apiUrl,
        method: "GET",
        dataType: "json",
        timeout: 10000,
        success: function (response) {
          const products = response.products || [];
          renderProductList(products);
        },
        error: function (xhr, status, error) {
          console.error("AJAX Error:", status, error);
          $productGrid.html(`
            <div class="empty-box">
              <p style="color: #c00; font-weight: bold;">Gagal memuat produk dari server API.</p>
              <p style="font-size: 14px; color: #666; margin-top: 5px;">Pastikan koneksi internet aktif.</p>
            </div>
          `);
        },
      });
    }

    // JQUERY: Menampilkan data produk ke layar secara dinamis
    function renderProductList(products) {
      $productGrid.empty();

      if (products.length === 0) {
        $productGrid.html(`
          <div class="empty-box">
            <p>Tidak ada produk pada kategori ini.</p>
          </div>
        `);
        return;
      }

      // Loop data produk dari JSON dan buat kartu HTML
      products.forEach(function (item) {
        const productCardHtml = `
          <div class="product-card" style="display: none;">
            <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
            <div class="card-body">
              <div class="rating">${renderStars(item.rating)} (${item.rating})</div>
              <h3>${item.title}</h3>
              <p>${item.description.length > 70 ? item.description.substring(0, 70) + "..." : item.description}</p>
              <div class="price">${formatRupiah(item.price)}</div>
            </div>
            <div class="card-actions">
              <a href="product.html?id=${item.id}" class="btn-detail">Lihat Detail</a>
              <button type="button" class="btn-quick-add disabled-btn" title="Fitur dinonaktifkan">
                + Keranjang
              </button>
            </div>
          </div>
        `;
        $productGrid.append(productCardHtml);
      });

      // Animasi jQuery: Tampilkan kartu produk secara halus (fadeIn)
      $productGrid.find(".product-card").fadeIn(300);
    }

    // JQUERY: Event Klik Filter Kategori (Ganti produk tanpa refresh)
    $(".category-btn").on("click", function (e) {
      e.preventDefault();
      $(".category-btn").removeClass("active");
      $(this).addClass("active");

      currentCategory = $(this).data("category");
      fetchProducts(currentCategory);
    });

    // Panggil AJAX pertama kali saat index.html dibuka
    fetchProducts(currentCategory);
  }

  // ==========================================================================
  // BAGIAN 2: HALAMAN DETAIL (PRODUCT.HTML) - AJAX LOAD DETAIL BY ID
  // ==========================================================================
  const $detailContainer = $("#product-detail-container");

  if ($detailContainer.length) {
    // JAVASCRIPT: Ambil ID produk dari parameter URL (contoh: product.html?id=12)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id") || "11"; // Default ke ID 11 (perabot) jika dibuka langsung

    let selectedQuantity = 1;

    // FUNGSI AJAX: Mengambil rincian produk berdasarkan ID
    function fetchProductDetail(id) {
      $detailContainer.html(`
        <div class="loading-box" style="grid-column: 1 / -1;">
          <div class="spinner"></div>
          <p class="loading-text">Mengambil rincian produk via AJAX...</p>
        </div>
      `);

      // Request AJAX ke DummyJSON
      $.ajax({
        url: `https://dummyjson.com/products/${id}`,
        method: "GET",
        dataType: "json",
        timeout: 10000,
        success: function (product) {
          renderProductDetail(product);
        },
        error: function (xhr, status, error) {
          console.error("AJAX Error:", status, error);
          $detailContainer.html(`
            <div class="empty-box" style="grid-column: 1 / -1;">
              <h2 style="color: #c00;">Produk Tidak Ditemukan</h2>
              <p>Gagal memuat detail produk dari server API.</p>
              <a href="index.html" class="btn-ikea" style="margin-top: 15px; display: inline-block;">Kembali ke Beranda</a>
            </div>
          `);
        },
      });
    }

    // JQUERY: Menampilkan detail produk ke layar
    function renderProductDetail(product) {
      document.title = `IKEA - ${product.title}`;

      // Perbarui breadcrumb
      $("#breadcrumb-category").text(product.category.toUpperCase());
      $("#breadcrumb-title").text(product.title);

      // Buat daftar thumbnail gambar
      let thumbnailsHtml = "";
      const images = product.images && product.images.length ? product.images : [product.thumbnail];
      images.forEach((imgUrl, index) => {
        thumbnailsHtml += `
          <img src="${imgUrl}" alt="${product.title}" class="thumbnail-item ${index === 0 ? "active" : ""}" data-full="${imgUrl}">
        `;
      });

      // Render Ulasan Pelanggan dari API
      let reviewsHtml = "";
      if (product.reviews && product.reviews.length > 0) {
        product.reviews.forEach((rev) => {
          reviewsHtml += `
            <div class="review-card">
              <div class="review-header">
                <span class="review-author">👤 ${rev.reviewerName}</span>
                <span class="review-rating">${renderStars(rev.rating)}</span>
              </div>
              <p class="review-comment">"${rev.comment}"</p>
            </div>
          `;
        });
      } else {
        reviewsHtml = "<p>Belum ada ulasan untuk produk ini.</p>";
      }

      // Template HTML Detail Produk
      const detailHtml = `
        <div class="product-detail">
          <!-- Kolom Foto & Galeri -->
          <div class="product-detail-img">
            <img id="main-product-img" src="${product.thumbnail || images[0]}" alt="${product.title}">
            <div class="thumbnail-gallery">
              ${thumbnailsHtml}
            </div>
          </div>

          <!-- Kolom Informasi Produk -->
          <div class="product-detail-info">
            <h1>${product.title}</h1>
            <p class="category-tag">Kategori: <strong>${product.category}</strong> | Merek: <strong>${product.brand || "IKEA"}</strong></p>
            
            <div class="rating" style="margin-bottom: 15px; font-size: 15px;">
              ${renderStars(product.rating)} <strong>${product.rating}</strong> / 5
            </div>

            <div class="price-tag">${formatRupiah(product.price)}</div>

            <p class="description">${product.description}</p>

            <!-- Rincian Data Asli dari Server API DummyJSON -->
            <ul class="spec-list">
              <li><strong>Stok Tersedia:</strong> ${product.stock} unit</li>
              <li><strong>Status Garansi:</strong> ${product.warrantyInformation || "Garansi Resmi 1 Tahun"}</li>
              <li><strong>Kebijakan Pengembalian:</strong> ${product.returnPolicy || "30 Hari Pengembalian"}</li>
              <li><strong>Informasi Pengiriman:</strong> ${product.shippingInformation || "Pengiriman Cepat"}</li>
            </ul>

            <!-- Kontrol Jumlah (Visual) -->
            <div class="qty-wrapper">
              <label style="font-weight: bold;">Jumlah:</label>
              <button type="button" id="btn-qty-minus" class="qty-btn">-</button>
              <span id="qty-display" class="qty-value">1</span>
              <button type="button" id="btn-qty-plus" class="qty-btn">+</button>
            </div>

            <!-- Tombol Aksi -->
            <div>
              <button type="button" class="btn-cart disabled-btn" title="Fitur dinonaktifkan">+ Tambah ke Keranjang</button>
              <a href="index.html" class="btn-back">Kembali ke Katalog</a>
            </div>
          </div>
        </div>

        <!-- Bagian Ulasan Pelanggan -->
        <div class="reviews-section">
          <h2 class="section-title">Ulasan Pelanggan</h2>
          <div class="reviews-grid">
            ${reviewsHtml}
          </div>
        </div>
      `;

      $detailContainer.html(detailHtml);

      // JQUERY: Klik thumbnail untuk ganti foto utama
      $(".thumbnail-item").on("click", function () {
        const newSrc = $(this).data("full");
        $(".thumbnail-item").removeClass("active");
        $(this).addClass("active");

        $("#main-product-img").fadeOut(150, function () {
          $(this).attr("src", newSrc).fadeIn(200);
        });
      });

      // JQUERY: Penyesuaian Kuantitas (+ / -) secara visual
      $("#btn-qty-minus").on("click", function () {
        if (selectedQuantity > 1) {
          selectedQuantity--;
          $("#qty-display").text(selectedQuantity);
        }
      });

      $("#btn-qty-plus").on("click", function () {
        if (selectedQuantity < product.stock) {
          selectedQuantity++;
          $("#qty-display").text(selectedQuantity);
        }
      });
    }

    // Jalankan AJAX detail produk saat halaman product.html dibuka
    fetchProductDetail(productId);
  }

  // ==========================================================================
  // FITUR SEARCH & KERANJANG DINONAKTIFKAN (HANYA TAMPILAN)
  // ==========================================================================
  // Cegah submit pada form pencarian agar tidak reload halaman
  $("#search-form").on("submit", function (e) {
    e.preventDefault();
  });

  // Fitur keranjang dinonaktifkan (hanya tampilan UI, klik tidak memicu apa pun)
  $(document).on("click", ".disabled-btn, .cart-nav-item a", function (e) {
    e.preventDefault();
  });
});
