// Global State
let allProducts = [];
let quoteList = JSON.parse(localStorage.getItem('emishell-quotes')) || [];
let wishlist = JSON.parse(localStorage.getItem('emishell-wishlist')) || [];

const WHATSAPP_NUMBER = "263772857034";

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();

    updateCounters();
    setupHeaderScroll();
    setupRevealAnimation();
    setupMobileMenu();
    setupHeroCarousel();
    setupFlashSaleTimer();
    setupQuoteModal();

    // Page specific initializations
    const path = window.location.pathname;

    if (document.getElementById('product-grid')) {
        const urlParams = new URLSearchParams(window.location.search);
        const catParam = urlParams.get('category');

        if (catParam) {
            filterShopState.category = catParam;
        } else {
            const fileName = path.split(/[/\\]/).pop().toLowerCase();
            if (fileName.includes('women')) filterShopState.category = 'Women';
            else if (fileName.includes('men')) filterShopState.category = 'Men';
            else if (fileName.includes('kids')) filterShopState.category = 'Kids';
            else if (fileName.includes('accessories')) filterShopState.category = 'Accessories';
        }

        renderFilteredProducts();
        setupShopFilters();
    }

    if (document.getElementById('wishlist-grid')) renderWishlist();

    // Homepage section renders
    renderHomepageSections();

    injectWhatsAppButton();
});

function loadProducts() {
    try {
        if (typeof PRODUCTS_DATA !== 'undefined') {
            allProducts = PRODUCTS_DATA;
        } else {
            console.warn('PRODUCTS_DATA not found, products might not load correctly.');
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderHomepageSections() {
    const featuredGrid = document.getElementById('featured-grid');
    const trendingGrid = document.getElementById('trending-grid');
    const flashSaleGrid = document.getElementById('flash-sale-grid');
    const hotDealsGrid = document.getElementById('hot-deals-grid');

    if (featuredGrid) {
        const featured = allProducts.filter(p => p.featured);
        featuredGrid.innerHTML = featured.slice(0, 3).map(p => createProductCard(p)).join('');
    }

    if (trendingGrid) {
        const bestSellers = allProducts.filter(p => p.best_seller);
        trendingGrid.innerHTML = bestSellers.slice(0, 8).map(p => createProductCard(p, true)).join('');
    }

    if (flashSaleGrid) {
        const flashSale = allProducts.filter(p => p.flash_sale);
        flashSaleGrid.innerHTML = flashSale.slice(0, 4).map(p => createCompactProductCard(p)).join('');
    }

    if (hotDealsGrid) {
        const hotDeals = allProducts.filter(p => p.hot_deal);
        hotDealsGrid.innerHTML = hotDeals.slice(0, 4).map(p => createProductCard(p)).join('');
    }

    setupRevealAnimation();
}

function injectWhatsAppButton() {
    if (document.getElementById('whatsapp-fixed')) return;
    const btn = document.createElement('a');
    btn.id = "whatsapp-fixed";
    btn.href = `https://wa.me/${WHATSAPP_NUMBER}`;
    btn.target = "_blank";
    btn.className = "fixed bottom-8 left-8 z-50 w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 group";
    btn.innerHTML = `
        <div class="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20"></div>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:rotate-12 transition-transform">
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
        </svg>
    `;
    document.body.appendChild(btn);
}

// Hero Carousel
function setupHeroCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-nav-dot');

    if (slides.length === 0) return;

    let currentSlide = 0;

    function goToSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }

    setInterval(() => {
        const nextSlide = (currentSlide + 1) % slides.length;
        goToSlide(nextSlide);
    }, 6000);

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });
}

// Flash Sale Timer
function setupFlashSaleTimer() {
    const timerDays = document.getElementById('timer-days');
    if (!timerDays) return;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 2);
    endDate.setHours(23, 59, 59);

    function updateTimer() {
        const now = new Date();
        const diff = endDate - now;

        if (diff <= 0) return;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('timer-days').textContent = String(days).padStart(2, '0');
        document.getElementById('timer-hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('timer-mins').textContent = String(mins).padStart(2, '0');
        document.getElementById('timer-secs').textContent = String(secs).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

// Filtering Logic
let filterShopState = {
    query: '',
    category: 'All',
    subcategory: 'All'
};

function setupShopFilters() {
    const searchInput = document.getElementById('shop-search');
    const catContainer = document.getElementById('category-filters');
    const subContainer = document.getElementById('subcategory-filters');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterShopState.query = e.target.value.toLowerCase();
            renderFilteredProducts();
        });
    }

    if (catContainer) {
        const categories = ['All', ...new Set(allProducts.map(p => p.category))];
        catContainer.innerHTML = categories.map(cat => `
            <button onclick="setCategory('${cat}')" class="category-btn px-8 py-3 rounded-full border text-[10px] font-black tracking-[0.2em] uppercase transition-all whitespace-nowrap ${filterShopState.category === cat ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' : 'border-slate-100 text-slate-400 hover:border-brand hover:text-brand'}">
                ${cat}
            </button>
        `).join('');
    }

    renderSubcategories();
}

function renderSubcategories() {
    const subContainer = document.getElementById('subcategory-filters');
    if (!subContainer) return;

    let availableSubs = [];
    if (filterShopState.category === 'All') {
        availableSubs = [...new Set(allProducts.map(p => p.subcategory))];
    } else {
        availableSubs = [...new Set(allProducts.filter(p => p.category === filterShopState.category).map(p => p.subcategory))];
    }

    if (availableSubs.length > 0) {
        subContainer.classList.remove('hidden');
        const subs = ['All', ...availableSubs];
        subContainer.innerHTML = subs.map(sub => `
            <button onclick="setSubcategory('${sub}')" class="subcategory-btn px-4 py-2 rounded-lg border text-[9px] font-bold tracking-[0.1em] uppercase transition-all ${filterShopState.subcategory === sub ? 'bg-brand border-brand text-white' : 'border-slate-100 text-slate-400 hover:border-brand hover:text-brand'}">
                ${sub}
            </button>
        `).join('');
    } else {
        subContainer.classList.add('hidden');
    }
}

function setCategory(cat) {
    filterShopState.category = cat;
    filterShopState.subcategory = 'All';

    document.querySelectorAll('.category-btn').forEach(btn => {
        if (btn.textContent.trim() === cat) {
            btn.classList.add('bg-slate-900', 'border-slate-900', 'text-white', 'shadow-xl', 'shadow-slate-200');
            btn.classList.remove('border-slate-100', 'text-slate-400');
        } else {
            btn.classList.remove('bg-slate-900', 'border-slate-900', 'text-white', 'shadow-xl', 'shadow-slate-200');
            btn.classList.add('border-slate-100', 'text-slate-400');
        }
    });

    renderSubcategories();
    renderFilteredProducts();
}

function setSubcategory(sub) {
    filterShopState.subcategory = sub;
    document.querySelectorAll('.subcategory-btn').forEach(btn => {
        if (btn.textContent.trim() === sub) {
            btn.classList.add('bg-brand', 'border-brand', 'text-white');
            btn.classList.remove('border-slate-100', 'text-slate-400');
        } else {
            btn.classList.remove('bg-brand', 'border-brand', 'text-white');
            btn.classList.add('border-slate-100', 'text-slate-400');
        }
    });
    renderFilteredProducts();
}

function renderFilteredProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const filtered = allProducts.filter(p => {
        const matchesQuery = p.name.toLowerCase().includes(filterShopState.query) || p.description.toLowerCase().includes(filterShopState.query);
        const matchesCat = filterShopState.category === 'All' || p.category === filterShopState.category;
        const matchesSub = filterShopState.subcategory === 'All' || p.subcategory === filterShopState.subcategory;
        return matchesQuery && matchesCat && matchesSub;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-20 bg-slate-50 rounded-[3rem]">
                <p class="text-slate-400 font-serif text-2xl">No products found in this selection.</p>
                <button onclick="setCategory('All')" class="mt-4 text-brand font-bold uppercase tracking-widest text-[10px] hover:underline">View All Products</button>
            </div>
        `;
    } else {
        grid.innerHTML = filtered.map(p => createProductCard(p)).join('');
    }
    setupRevealAnimation();
}

// Product Card Templates
function createProductCard(p, isTrending = false) {
    const isLiked = wishlist.some(item => item.id === p.id);
    return `
        <div class="reveal product-card flex flex-col group ${isTrending ? 'scale-95' : ''}">
            <div class="relative aspect-[4/5] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-slate-100 mb-4 md:mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000">
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-40 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div class="absolute top-4 right-4 md:top-6 md:right-6 flex flex-col gap-3 md:transform md:translate-x-12 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 transition-all duration-500 ease-out">
                    <button onclick="toggleWishlist('${p.id}')" class="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-xl backdrop-blur-xl transition-all flex items-center justify-center ${isLiked ? 'bg-brand text-white' : 'bg-white/90 text-slate-900 hover:bg-brand hover:text-white'}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </button>
                </div>

                <div class="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 md:transform md:translate-y-12 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500 ease-out">
                    <button onclick="openQuoteModal('${p.id}')" class="w-full py-3 md:py-4 bg-slate-900 text-white font-black rounded-xl md:rounded-2xl tracking-[0.2em] uppercase text-[9px] md:text-[10px] hover:bg-brand transition-all shadow-2xl flex items-center justify-center gap-2 md:gap-3">
                        <span class="hidden md:inline">Request Quote</span>
                        <span class="md:hidden">Get Quote</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </button>
                </div>

                <div class="absolute top-4 left-4 md:top-6 md:left-6">
                    <span class="px-3 py-1.5 md:px-4 md:py-2 bg-white/90 backdrop-blur-xl rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-xl border border-white/20">${p.subcategory}</span>
                </div>
            </div>

            <div class="space-y-1.5 md:space-y-2 px-1 md:px-2 text-left">
                <h3 class="text-base md:text-xl font-serif font-bold text-slate-900 leading-tight line-clamp-1">${p.name}</h3>
                <p class="text-slate-400 text-[11px] md:text-sm line-clamp-1">${p.description}</p>
                <div class="pt-1 md:pt-2">
                    <span class="text-[9px] md:text-[10px] font-black text-brand uppercase tracking-widest">${p.category}</span>
                </div>
            </div>
        </div>
    `;
}

function createCompactProductCard(p) {
    const isLiked = wishlist.some(item => item.id === p.id);
    return `
        <div class="reveal product-card flex flex-col group">
            <div class="relative aspect-square rounded-[2rem] overflow-hidden bg-white/10 mb-5 group-hover:shadow-2xl transition-all duration-500">
                <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="absolute top-4 right-4 transform translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                    <button onclick="toggleWishlist('${p.id}')" class="p-3 rounded-full shadow-lg backdrop-blur-md transition-all ${isLiked ? 'bg-brand text-white' : 'bg-white/90 text-slate-900 hover:text-brand'}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </button>
                </div>

                <div class="absolute bottom-4 left-4 right-4 transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <button onclick="openQuoteModal('${p.id}')" class="w-full py-3 bg-white text-slate-900 font-black rounded-xl tracking-[0.1em] uppercase text-[9px] hover:bg-brand hover:text-white transition-all">
                        Request Quote
                    </button>
                </div>
            </div>

            <div class="space-y-1 text-center">
                <h3 class="text-sm font-bold text-white group-hover:text-brand transition-colors">${p.name}</h3>
                <span class="text-[9px] font-black text-white/40 uppercase tracking-widest">${p.subcategory}</span>
            </div>
        </div>
    `;
}

// Quote Modal System
function setupQuoteModal() {
    if (document.getElementById('quote-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'quote-modal';
    modal.className = 'fixed inset-0 z-[1000] hidden bg-slate-900/60 backdrop-blur-md opacity-0 transition-opacity duration-500 flex items-center justify-center p-4 md:p-10';
    modal.innerHTML = `
        <div class="bg-white/90 backdrop-blur-xl w-full max-w-4xl rounded-[2.5rem] md:rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] overflow-hidden transform scale-95 opacity-0 transition-all duration-700 flex flex-col md:flex-row h-auto max-h-[95vh] border border-white/20">
            <!-- Left: Product Image & Experience -->
            <div class="h-[280px] md:h-auto md:w-[45%] relative bg-slate-100 overflow-hidden group shrink-0">
                <img id="quote-product-img" src="" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Product">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-60"></div>
                
                <!-- Badge -->
                <div class="absolute top-6 left-6 md:top-8 md:left-8">
                    <span class="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[9px] md:text-[10px] font-bold text-white uppercase tracking-[0.2em]">Enquiry Only</span>
                </div>
            </div>

            <!-- Right: Content & Action -->
            <div class="md:w-[55%] p-6 md:p-14 flex flex-col justify-between bg-white/50 relative overflow-y-auto">
                <!-- Close Button -->
                <button onclick="closeQuoteModal()" class="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand hover:bg-white hover:shadow-lg transition-all duration-300 z-10 group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover:rotate-90 transition-transform duration-500"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>

                <div class="relative">
                    <div class="mb-8 md:mb-10">
                        <span id="quote-product-cat" class="inline-block px-3 py-1 rounded-lg bg-brand/5 text-[9px] md:text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-3 md:mb-4">Category</span>
                        <h2 id="quote-product-name" class="text-3xl md:text-5xl font-serif font-black text-slate-900 leading-tight mb-4 md:mb-6">Product Name</h2>
                        <div class="w-12 h-1 bg-brand/20 rounded-full mb-4 md:mb-6"></div>
                        <p id="quote-product-desc" class="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">Product description goes here.</p>
                    </div>
                    
                    <div class="space-y-6 md:space-y-8">
                        <div>
                            <label class="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 md:mb-4 block">Select Quantity</label>
                            <div class="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
                                <div class="flex items-center bg-slate-50 rounded-2xl p-1 md:p-1.5 border border-slate-100 shadow-inner w-max">
                                    <button onclick="updateQuoteQty(-1)" class="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-brand hover:bg-white transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    </button>
                                    <span id="quote-qty" class="w-12 md:w-14 text-center text-lg md:text-xl font-serif font-black text-slate-900">1</span>
                                    <button onclick="updateQuoteQty(1)" class="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-brand hover:bg-white transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    </button>
                                </div>
                                <span class="text-[10px] text-slate-400 font-medium">Bulk orders may qualify for discounts</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-8 md:mt-12">
                    <button id="send-quote-btn" class="group w-full py-5 md:py-6 bg-slate-900 text-white font-bold rounded-2xl tracking-[0.2em] uppercase text-[10px] md:text-xs hover:bg-brand transition-all shadow-xl flex items-center justify-center gap-3">
                        Confirm Quote on WhatsApp
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover:translate-x-1 transition-transform"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

let activeQuote = {
    product: null,
    qty: 1
};

function openQuoteModal(productId) {
    const p = allProducts.find(item => item.id === productId);
    if (!p) return;

    activeQuote = { product: p, qty: 1 };

    document.getElementById('quote-product-img').src = p.image;
    document.getElementById('quote-product-name').textContent = p.name;
    document.getElementById('quote-product-cat').textContent = `${p.category} / ${p.subcategory}`;
    document.getElementById('quote-product-desc').textContent = p.description;
    document.getElementById('quote-qty').textContent = '1';

    const modal = document.getElementById('quote-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        const content = modal.querySelector('div');
        content.classList.remove('scale-95', 'opacity-0');
    }, 10);

    document.getElementById('send-quote-btn').onclick = () => {
        const message = `Hello Emishell Boutique! \n\nI am interested in getting a quote for the following product:\n\n*Product:* ${p.name}\n*Category:* ${p.category} / ${p.subcategory}\n*Quantity:* ${activeQuote.qty}\n\nPlease let me know the pricing and any other details. Thank you!`;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
        closeQuoteModal();
    };
}

function updateQuoteQty(delta) {
    activeQuote.qty = Math.max(1, activeQuote.qty + delta);
    document.getElementById('quote-qty').textContent = activeQuote.qty;
}

function closeQuoteModal() {
    const modal = document.getElementById('quote-modal');
    modal.classList.add('opacity-0');
    const content = modal.querySelector('div');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 500);
}

// State Management
function updateCounters() {
    const wishlistCount = document.querySelectorAll('.wishlist-count');
    wishlistCount.forEach(el => {
        el.textContent = wishlist.length;
        el.style.display = wishlist.length > 0 ? 'flex' : 'none';
    });
    localStorage.setItem('emishell-wishlist', JSON.stringify(wishlist));
}

function toggleWishlist(productId) {
    const index = wishlist.findIndex(p => p.id === productId);
    const product = allProducts.find(p => p.id === productId);

    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(product);
    }

    updateCounters();
    if (document.getElementById('product-grid')) renderFilteredProducts();
    if (document.getElementById('wishlist-grid')) renderWishlist();
    renderHomepageSections();
}

// UI Utilities
function setupHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 42) {
            header.classList.add('shadow-xl', 'top-0', 'bg-white');
            header.classList.remove('shadow-sm', 'top-[42px]', 'bg-white/95');
        } else {
            header.classList.remove('shadow-xl', 'top-0', 'bg-white');
            header.classList.add('shadow-sm', 'top-[42px]', 'bg-white/95');
        }
    });
}

function setupMobileMenu() {
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
    const openBtn = document.getElementById('open-mobile-menu');
    const closeBtn = document.getElementById('close-mobile-menu');

    if (!mobileMenuOverlay || !openBtn || !closeBtn) return;

    openBtn.onclick = () => {
        mobileMenuOverlay.classList.remove('hidden');
        setTimeout(() => {
            mobileMenuOverlay.classList.remove('opacity-0');
            mobileMenuDrawer.classList.remove('translate-x-full');
        }, 10);
    };

    const closeMenu = () => {
        mobileMenuOverlay.classList.add('opacity-0');
        mobileMenuDrawer.classList.add('translate-x-full');
        setTimeout(() => mobileMenuOverlay.classList.add('hidden'), 300);
    };

    closeBtn.onclick = closeMenu;
}

function setupRevealAnimation() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    reveals.forEach(el => observer.observe(el));
}

function renderWishlist() {
    const grid = document.getElementById('wishlist-grid');
    if (!grid) return;
    if (wishlist.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-20 bg-slate-50 rounded-3xl"><p class="text-slate-400 font-serif text-2xl">Your wishlist is empty.</p></div>';
    } else {
        grid.innerHTML = wishlist.map(p => createProductCard(p)).join('');
    }
    setupRevealAnimation();
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:bottom-8 z-[200] bg-slate-900 text-white px-6 py-4 md:px-8 md:py-5 rounded-2xl md:rounded-[2rem] shadow-2xl flex items-center gap-4 translate-y-20 opacity-0 transition-all duration-500 font-medium border border-white/10 backdrop-blur-xl';
    notification.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove('translate-y-20', 'opacity-0');
    }, 100);

    setTimeout(() => {
        notification.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => notification.remove(), 500);
    }, 4000);
}
