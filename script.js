/**
 * TUGAS PEMROGRAMAN WEB: IKEA INDONESIA
 * Implementasi: JavaScript, jQuery, dan AJAX
 * Sumber API: DummyJSON (https://dummyjson.com)
 */

$(document).ready(function () {
  console.log("jQuery siap dan dokumen berhasil dimuat.");

  // Kurs konversi simulasi USD ke IDR untuk tema IKEA Indonesia
  const USD_TO_IDR = 16000;

  // Format angka ke format mata uang Rupiah
  function formatRupiah(usd) {
    const idr = Math.round(usd * USD_TO_IDR);
    return "Rp " + idr.toLocaleString("id-ID");
  }

  // Helper untuk membuat elemen rating bintang
  function renderStars(rating) {
    const fullStars = Math.round(rating);
    return "★".repeat(fullStars) + "☆".repeat(Math.max(0, 5 - fullStars));
  }

  // ==========================================================================
  // 1. MANAJEMEN KERANJANG (JAVASCRIPT LOCALSTORAGE & JQUERY)
  // ==========================================================================
  function getCart() {
    return JSON.parse(localStorage.getItem("ikea_cart")) || [];
  }

  function getCartCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.qty, 0);
  }

  function updateCartBadge() {
    const count = getCartCount();
    const $badge = $("#cart-badge");
    if ($badge.length) {
      $badge.text(count);
      // Efek jQuery animasi bump
      $badge.addClass("bump");
      setTimeout(() => $badge.removeClass("bump"), 250);
    }
  }

  // Tampilkan notifikasi pop-up (Toast) menggunakan animasi jQuery fadeIn/fadeOut
  function showToast(message) {
    let $toast = $("#toast-notification");
    if (!$toast.length) {
      $("body").append('<div id="toast-notification" class="toast-notification"></div>');
      $toast = $("#toast-notification");
    }
    $toast.html(`<span>🛒</span> <span>${message}</span>`);
    $toast.stop(true, true).fadeIn(300).delay(2500).fadeOut(400);
  }

  function addToCart(product, quantity = 1) {
    const cart = getCart();
    const existingIndex = cart.findIndex((item) => item.id === product.id);

    if (existingIndex > -1) {
      cart[existingIndex].qty += quantity;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail,
        qty: quantity,
      });
    }

    localStorage.setItem("ikea_cart", JSON.stringify(cart));
    updateCartBadge();
    showToast(`<strong>${product.title}</strong> (${quantity} barang) berhasil ditambahkan ke keranjang!`);
  }

  // Inisialisasi badge keranjang saat awal buka halaman
  updateCartBadge();

  // ==========================================================================
  // 2. HALAMAN UTAMA (INDEX.HTML): AJAX LOAD PRODUK & FILTER KATEGORI
  // ==========================================================================
  const $productGrid = $("#product-grid");

  if ($productGrid.length) {
    let currentCategory = "furniture"; // Default kategori IKEA
    let currentSearch = "";

    // Fungsi utama AJAX untuk memuat produk secara dinamis tanpa refresh halaman
    function fetchProducts(category, search = "") {
      // Tampilkan indikator Loading (animasi spinner)
      $productGrid.html(`
        <div class="loading-box">
          <div class="spinner"></div>
          <p class="loading-text">Memuat produk pilihan via AJAX...</p>
        </div>
      `);

      let apiUrl = "";
      if (search.trim() !== "") {
        // Hit API pencarian DummyJSON
        apiUrl = `https://dummyjson.com/products/search?q=${encodeURIComponent(search)}`;
      } else if (category === "all") {
        apiUrl = `https://dummyjson.com/products?limit=12`;
      } else {
        // Hit API kategori spesifik DummyJSON
        apiUrl = `https://dummyjson.com/products/category/${category}`;
      }

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
              <p style="color: #c00; font-weight: bold; margin-bottom: 10px;">Gagal memuat produk dari server API.</p>
              <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Pastikan koneksi internet aktif.</p>
              <button id="btn-retry" class="btn-ikea" style="padding: 8px 18px; font-size: 14px;">Coba Lagi</button>
            </div>
          `);

          // Event jQuery untuk tombol Retry
          $("#btn-retry").on("click", function () {
            fetchProducts(currentCategory, currentSearch);
          });
        },
      });
    }

    // Render daftar produk ke DOM menggunakan jQuery
    function renderProductList(products) {
      $productGrid.empty();

      if (products.length === 0) {
        $productGrid.html(`
          <div class="empty-box">
            <p>Tidak ada produk yang cocok dengan pencarian atau kategori ini.</p>
          </div>
        `);
        return;
      }

      // Loop setiap produk dan buat elemen HTML
      products.forEach(function (item) {
        const productCardHtml = `
          <div class="product-card" data-id="${item.id}" style="display: none;">
            <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
            <div class="card-body">
              <div class="rating">${renderStars(item.rating)} (${item.rating})</div>
              <h3>${item.title}</h3>
              <p>${item.description.length > 70 ? item.description.substring(0, 70) + "..." : item.description}</p>
              <div class="price">${formatRupiah(item.price)}</div>
            </div>
            <div class="card-actions">
              <a href="product.html?id=${item.id}" class="btn-detail">Lihat Detail</a>
              <button class="btn-quick-add" title="Tambah Cepat" data-id="${item.id}" data-title="${item.title.replace(/"/g, '&quot;')}" data-price="${item.price}" data-thumb="${item.thumbnail}">
                + Keranjang
              </button>
            </div>
          </div>
        `;
        $productGrid.append(productCardHtml);
      });

      // Animasi jQuery: Tampilkan kartu produk secara halus (fadeIn)
      $productGrid.find(".product-card").fadeIn(400);
    }

    // Event Handler jQuery: Tab Filter Kategori (Ruang Tamu / Kamar Tidur / Dapur / Dekorasi)
    $(".category-btn").on("click", function (e) {
      e.preventDefault();
      $(".category-btn").removeClass("active");
      $(this).addClass("active");

      // Reset input search saat ganti kategori
      $("#search-input").val("");
      currentSearch = "";

      currentCategory = $(this).data("category");
      fetchProducts(currentCategory);
    });

    // Event Handler jQuery: Pencarian Produk (Live Search / Submit)
    $("#search-form").on("submit", function (e) {
      e.preventDefault();
      const query = $("#search-input").val().trim();
      currentSearch = query;
      fetchProducts(currentCategory, query);
    });

    // Event Handler jQuery: Delegasi klik untuk tombol "+ Keranjang" di kartu produk
    $productGrid.on("click", ".btn-quick-add", function () {
      const $btn = $(this);
      const product = {
        id: $btn.data("id"),
        title: $btn.data("title"),
        price: parseFloat($btn.data("price")),
        thumbnail: $btn.data("thumb"),
      };
      addToCart(product, 1);
    });

    // Panggil AJAX pertama kali saat index.html dibuka
    fetchProducts(currentCategory);
  }

  // ==========================================================================
  // 3. HALAMAN DETAIL PRODUK (PRODUCT.HTML): AJAX LOAD DETAIL BY ID
  // ==========================================================================
  const $detailContainer = $("#product-detail-container");

  if ($detailContainer.length) {
    // Ambil parameter ID dari URL (misal: product.html?id=12)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id") || "11"; // Default ke id 11 (produk furniture) jika dibuka langsung

    let currentProductData = null;
    let selectedQuantity = 1;

    function fetchProductDetail(id) {
      $detailContainer.html(`
        <div class="loading-box" style="grid-column: 1 / -1;">
          <div class="spinner"></div>
          <p class="loading-text">Mengambil rincian produk via AJAX...</p>
        </div>
      `);

      // AJAX Request ke DummyJSON Product Detail
      $.ajax({
        url: `https://dummyjson.com/products/${id}`,
        method: "GET",
        dataType: "json",
        timeout: 10000,
        success: function (product) {
          currentProductData = product;
          renderProductDetail(product);
        },
        error: function (xhr, status, error) {
          console.error("AJAX Error:", status, error);
          $detailContainer.html(`
            <div class="empty-box" style="grid-column: 1 / -1;">
              <h2 style="color: #c00; margin-bottom: 10px;">Produk Tidak Ditemukan</h2>
              <p style="margin-bottom: 20px;">Gagal memuat detail produk dari server API.</p>
              <a href="index.html" class="btn-ikea">Kembali ke Beranda</a>
            </div>
          `);
        },
      });
    }

    function renderProductDetail(product) {
      // Perbarui judul halaman di browser
      document.title = `IKEA - ${product.title}`;

      // Perbarui breadcrumb
      $("#breadcrumb-category").text(product.category.toUpperCase());
      $("#breadcrumb-title").text(product.title);

      // Siapkan galeri thumbnail jika ada beberapa gambar
      let thumbnailsHtml = "";
      const images = product.images && product.images.length ? product.images : [product.thumbnail];
      images.forEach((imgUrl, index) => {
        thumbnailsHtml += `
          <img src="${imgUrl}" alt="${product.title}" class="thumbnail-item ${index === 0 ? "active" : ""}" data-full="${imgUrl}">
        `;
      });

      // Render Ulasan (Reviews) jika disediakan oleh API
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

      // Bangun struktur detail produk
      const detailHtml = `
        <div class="product-detail">
          <!-- Kolom Galeri Foto -->
          <div class="product-detail-img">
            <img id="main-product-img" src="${product.thumbnail || images[0]}" alt="${product.title}">
            <div class="thumbnail-gallery">
              ${thumbnailsHtml}
            </div>
          </div>

          <!-- Kolom Informasi Produk -->
          <div class="product-detail-info">
            <h1>${product.title}</h1>
            <p class="category-tag">Kategori: <strong>${product.category}</strong> | Merek: <strong>${product.brand || "IKEA Original"}</strong></p>
            
            <div class="rating" style="margin-bottom: 15px; font-size: 15px;">
              ${renderStars(product.rating)} <strong>${product.rating}</strong> / 5
            </div>

            <div class="price-tag">${formatRupiah(product.price)}</div>

            <p class="description">${product.description}</p>

            <!-- Informasi Spesifikasi Produk dari API DummyJSON -->
            <ul class="spec-list">
              <li><strong>Stok Tersedia:</strong> ${product.stock} unit</li>
              <li><strong>Status Garansi:</strong> ${product.warrantyInformation || "Garansi Resmi IKEA 1 Tahun"}</li>
              <li><strong>Kebijakan Pengembalian:</strong> ${product.returnPolicy || "30 Hari Pengembalian"}</li>
              <li><strong>Informasi Pengiriman:</strong> ${product.shippingInformation || "Gratis Ongkir ke Seluruh Indonesia"}</li>
            </ul>

            <!-- Kontrol Kuantitas Barang -->
            <div class="qty-wrapper">
              <label style="font-weight: bold;">Jumlah:</label>
              <button type="button" id="btn-qty-minus" class="qty-btn">-</button>
              <span id="qty-display" class="qty-value">1</span>
              <button type="button" id="btn-qty-plus" class="qty-btn">+</button>
            </div>

            <!-- Tombol Aksi -->
            <div>
              <button id="btn-add-detail-cart" class="btn-cart">+ Tambah ke Keranjang</button>
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

      // Event jQuery: Interaktivitas Galeri Foto Thumbnail
      $(".thumbnail-item").on("click", function () {
        const newSrc = $(this).data("full");
        $(".thumbnail-item").removeClass("active");
        $(this).addClass("active");

        // Efek animasi jQuery perpindahan gambar
        $("#main-product-img").fadeOut(150, function () {
          $(this).attr("src", newSrc).fadeIn(200);
        });
      });

      // Event jQuery: Penyesuaian Kuantitas (+ / -)
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
        } else {
          showToast(`Maksimal stok tersedia hanya ${product.stock} unit.`);
        }
      });

      // Event jQuery: Tombol Tambah ke Keranjang dari Halaman Detail
      $("#btn-add-detail-cart").on("click", function () {
        if (currentProductData) {
          addToCart(currentProductData, selectedQuantity);
        }
      });
    }

    // Jalankan AJAX detail produk saat halaman product.html dibuka
    fetchProductDetail(productId);
  }
});
