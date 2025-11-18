// ===== KONFIGURASI =====
const API_KEY = '7b70cd28ed1841ec99a33528251811'; // Ganti dengan API key kamu dari weatherapi.com
const API_URL = 'https://api.weatherapi.com/v1/current.json';
const SEARCH_API = 'https://api.weatherapi.com/v1/search.json';

// ===== ELEMEN DOM =====
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const closeError = document.getElementById('closeError');
const weatherCard = document.getElementById('weatherCard');
const recentCitiesDiv = document.getElementById('recentCities');
const citiesList = document.getElementById('citiesList');

// ===== AUTOCOMPLETE =====
let autocompleteTimeout;
const autocompleteDiv = document.createElement('div');
autocompleteDiv.className = 'autocomplete-list hidden';
cityInput.parentNode.appendChild(autocompleteDiv);

// Event listener untuk autocomplete
cityInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    clearTimeout(autocompleteTimeout);
    
    if (query.length < 2) {
        hideAutocomplete();
        return;
    }
    
    autocompleteTimeout = setTimeout(() => {
        searchCities(query);
    }, 300);
});

// Search cities untuk autocomplete
async function searchCities(query) {
    try {
        const response = await fetch(`${SEARCH_API}?key=${API_KEY}&q=${query}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            displayAutocomplete(data);
        } else {
            hideAutocomplete();
        }
    } catch (error) {
        console.error('Autocomplete error:', error);
    }
}

// Tampilkan autocomplete suggestions
function displayAutocomplete(cities) {
    autocompleteDiv.innerHTML = '';
    
    cities.slice(0, 5).forEach(city => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <div>
                <div class="city-name">${city.name}</div>
                <div class="city-region">${city.region}, ${city.country}</div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            cityInput.value = city.name;
            getWeather(city.name);
            hideAutocomplete();
        });
        
        autocompleteDiv.appendChild(item);
    });
    
    autocompleteDiv.classList.remove('hidden');
}

function hideAutocomplete() {
    autocompleteDiv.classList.add('hidden');
}

// Click di luar autocomplete untuk menutup
document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !autocompleteDiv.contains(e.target)) {
        hideAutocomplete();
    }
});

// ===== FUNGSI UTAMA =====

// Ambil data cuaca dari API
async function getWeather(query) {
    try {
        showLoading();
        hideError();
        hideWeatherCard();
        hideAutocomplete();

        const response = await fetch(`${API_URL}?key=${API_KEY}&q=${query}&aqi=no`);
        
        if (!response.ok) {
            throw new Error('Kota tidak ditemukan. Coba lagi!');
        }

        const data = await response.json();
        hideLoading();
        displayWeather(data);
        saveToRecent(data.location.name, data.location.country);
        
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Tampilkan data cuaca
function displayWeather(data) {
    const { location, current } = data;
    
    // Update informasi lokasi
    document.getElementById('cityName').textContent = location.name;
    document.getElementById('country').textContent = location.country;
    
    // Update ikon cuaca
    document.getElementById('weatherIcon').innerHTML = `<img src="https:${current.condition.icon}" alt="${current.condition.text}" style="width: 80px; height: 80px;">`;
    
    // Update suhu
    document.getElementById('temperature').textContent = `${Math.round(current.temp_c)}°C`;
    document.getElementById('feelsLike').textContent = `${Math.round(current.feelslike_c)}°C`;
    document.getElementById('condition').textContent = current.condition.text;
    
    // Update detail cuaca
    document.getElementById('windSpeed').textContent = `${current.wind_kph} km/h`;
    document.getElementById('humidity').textContent = `${current.humidity}%`;
    document.getElementById('visibility').textContent = `${current.vis_km} km`;
    document.getElementById('pressure').textContent = `${current.pressure_mb} mb`;
    
    // Ubah background sesuai kondisi cuaca
    changeBackground(current.condition.text);
    
    // Tampilkan card cuaca
    showWeatherCard();
}

// Ubah background berdasarkan kondisi cuaca
function changeBackground(condition) {
    const body = document.body;
    body.className = ''; // Reset class
    
    const cond = condition.toLowerCase();
    
    if (cond.includes('clear') || cond.includes('sunny')) {
        body.classList.add('clear');
    } else if (cond.includes('cloud') || cond.includes('overcast')) {
        body.classList.add('cloudy');
    } else if (cond.includes('rain') || cond.includes('drizzle')) {
        body.classList.add('rainy');
    } else if (cond.includes('snow')) {
        body.classList.add('snowy');
    } else if (cond.includes('mist') || cond.includes('fog')) {
        body.classList.add('misty');
    }
}

// Simpan kota ke riwayat (localStorage)
function saveToRecent(city, country) {
    let recent = JSON.parse(localStorage.getItem('recentCities')) || [];
    
    // Hapus duplikat jika ada
    recent = recent.filter(item => item.city !== city);
    
    // Tambahkan kota baru di awal
    recent.unshift({ city, country });
    
    // Batasi maksimal 5 kota
    if (recent.length > 5) {
        recent = recent.slice(0, 5);
    }
    
    localStorage.setItem('recentCities', JSON.stringify(recent));
    displayRecentCities();
}

// Tampilkan daftar kota terakhir
function displayRecentCities() {
    const recent = JSON.parse(localStorage.getItem('recentCities')) || [];
    
    if (recent.length === 0) {
        recentCitiesDiv.classList.add('hidden');
        return;
    }
    
    citiesList.innerHTML = '';
    
    recent.forEach(item => {
        const tag = document.createElement('div');
        tag.className = 'city-tag';
        tag.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${item.city}, ${item.country}
        `;
        tag.addEventListener('click', () => {
            getWeather(item.city);
        });
        citiesList.appendChild(tag);
    });
    
    recentCitiesDiv.classList.remove('hidden');
}

// Gunakan geolokasi untuk mendapatkan cuaca lokasi saat ini
function useCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation tidak didukung oleh browser Anda');
        return;
    }
    
    showLoading();
    hideError();
    
    // Options untuk geolocation yang lebih akurat
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Lokasi didapat:', latitude, longitude);
            getWeather(`${latitude},${longitude}`);
        },
        (error) => {
            hideLoading();
            let errorMsg = 'Gagal mendapatkan lokasi. ';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += 'Anda menolak akses lokasi. Silakan aktifkan di pengaturan browser.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += 'Informasi lokasi tidak tersedia. Pastikan GPS aktif.';
                    break;
                case error.TIMEOUT:
                    errorMsg += 'Request timeout. Coba lagi.';
                    break;
                default:
                    errorMsg += 'Terjadi kesalahan tidak diketahui.';
            }
            
            showError(errorMsg);
            console.error('Geolocation error:', error);
        },
        options
    );
}

// ===== FUNGSI UI =====

function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function showWeatherCard() {
    weatherCard.classList.remove('hidden');
}

function hideWeatherCard() {
    weatherCard.classList.add('hidden');
}

// ===== EVENT LISTENERS =====

// Tombol search
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
        cityInput.value = '';
    } else {
        showError('Masukkan nama kota terlebih dahulu!');
    }
});

// Enter key pada input
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// Tombol gunakan lokasi
locationBtn.addEventListener('click', useCurrentLocation);

// Tombol close error
closeError.addEventListener('click', hideError);

// ===== INISIALISASI =====

// Tampilkan riwayat kota saat halaman dimuat
displayRecentCities();

// Load cuaca default (opsional - bisa diaktifkan)
// getWeather('Jakarta');