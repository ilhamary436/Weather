// ===== KONFIGURASI =====
const API_KEY = "7b70cd28ed1841ec99a33528251811";
const API_URL = "https://api.weatherapi.com/v1/current.json";
const FORECAST_API = "https://api.weatherapi.com/v1/forecast.json";
const SEARCH_API = "https://api.weatherapi.com/v1/search.json";

// ===== STATE GLOBAL =====
let currentWeatherData = null;
let isCelsius = true;
let localTimeInterval = null;

// ===== ELEMEN DOM =====
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const compareBtn = document.getElementById("compareBtn");
const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");
const closeError = document.getElementById("closeError");
const weatherCard = document.getElementById("weatherCard");
const recentCitiesDiv = document.getElementById("recentCities");
const citiesList = document.getElementById("citiesList");
const tempToggle = document.getElementById("tempToggle");
const localTimeEl = document.getElementById("localTime");
const localDateEl = document.getElementById("localDate");
const thermometerFill = document.getElementById("thermometerFill");
const weatherEmoji = document.getElementById("weatherEmoji");
const tipText = document.getElementById("tipText");
const forecastContainer = document.getElementById("forecastContainer");
const weatherAlert = document.getElementById("weatherAlert");
const alertText = document.getElementById("alertText");

// Compare elements
const compareContainer = document.getElementById("compareContainer");
const closeCompare = document.getElementById("closeCompare");
const compareCity1 = document.getElementById("compareCity1");
const compareCity2 = document.getElementById("compareCity2");
const compareSearchBtn = document.getElementById("compareSearchBtn");
const compareResults = document.getElementById("compareResults");

// ===== AUTOCOMPLETE =====
let autocompleteTimeout;
const autocompleteDiv = document.createElement("div");
autocompleteDiv.className = "autocomplete-list hidden";
cityInput.parentNode.appendChild(autocompleteDiv);

cityInput.addEventListener("input", e => {
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
        console.error("Autocomplete error:", error);
        hideAutocomplete();
    }
}

function displayAutocomplete(cities) {
    autocompleteDiv.innerHTML = "";

    cities.slice(0, 5).forEach(city => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
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

        item.addEventListener("click", () => {
            cityInput.value = city.name;
            getWeather(city.name);
            hideAutocomplete();
        });

        autocompleteDiv.appendChild(item);
    });

    autocompleteDiv.classList.remove("hidden");
}

function hideAutocomplete() {
    autocompleteDiv.classList.add("hidden");
}

document.addEventListener("click", e => {
    if (!cityInput.contains(e.target) && !autocompleteDiv.contains(e.target)) {
        hideAutocomplete();
    }
});

// ===== TEMPERATURE TOGGLE =====
tempToggle.addEventListener("click", e => {
    if (e.target.classList.contains("temp-unit")) {
        const unit = e.target.dataset.unit;

        document.querySelectorAll(".temp-unit").forEach(el => {
            el.classList.remove("active");
        });
        e.target.classList.add("active");

        isCelsius = unit === "c";

        if (currentWeatherData) {
            updateTemperatureDisplay();
        }
    }
});

function updateTemperatureDisplay() {
    if (!currentWeatherData) return;

    const { current } = currentWeatherData;

    if (isCelsius) {
        document.getElementById("temperature").textContent = `${Math.round(
            current.temp_c
        )}°C`;
        document.getElementById("feelsLike").textContent = `${Math.round(
            current.feelslike_c
        )}°C`;
    } else {
        document.getElementById("temperature").textContent = `${Math.round(
            current.temp_f
        )}°F`;
        document.getElementById("feelsLike").textContent = `${Math.round(
            current.feelslike_f
        )}°F`;
    }

    updateThermometer(isCelsius ? current.temp_c : current.temp_f);
}

// ===== THERMOMETER =====
function updateThermometer(temp) {
    const maxTemp = isCelsius ? 50 : 122;
    const minTemp = isCelsius ? -10 : 14;

    let percentage = ((temp - minTemp) / (maxTemp - minTemp)) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    thermometerFill.style.height = percentage + "%";
}

// ===== WEATHER EMOJI =====
function getWeatherEmoji(condition, isDay = 1) {
    const cond = condition.toLowerCase();

    if (cond.includes("sunny") || cond.includes("clear")) {
        return isDay ? "☀️" : "🌙";
    } else if (cond.includes("partly cloudy")) {
        return isDay ? "⛅" : "☁️";
    } else if (cond.includes("cloud") || cond.includes("overcast")) {
        return "☁️";
    } else if (cond.includes("rain") || cond.includes("drizzle")) {
        return "🌧️";
    } else if (cond.includes("thunder") || cond.includes("storm")) {
        return "⛈️";
    } else if (cond.includes("snow")) {
        return "❄️";
    } else if (cond.includes("mist") || cond.includes("fog")) {
        return "🌫️";
    } else if (cond.includes("wind")) {
        return "💨";
    }

    return "🌤️";
}

// ===== WEATHER TIPS =====
function getWeatherTip(temp, condition, humidity, windSpeed, aqi, uv) {
    const cond = condition.toLowerCase();

    // AQI based tips (priority)
    if (aqi > 150) {
        return "😷 Kualitas udara buruk! Sebaiknya di dalam ruangan dan pakai masker.";
    } else if (aqi > 100) {
        return "⚠️ Kualitas udara tidak sehat. Kurangi aktivitas outdoor.";
    }

    // UV based tips
    if (uv >= 8) {
        return "🧴 UV Index sangat tinggi! Pakai sunscreen SPF 50+ dan hindari sinar matahari.";
    } else if (uv >= 6) {
        return "☀️ UV Index tinggi. Pakai sunscreen dan topi saat keluar.";
    }

    // Temperature based tips
    if (temp > 32) {
        return "🥵 Cuaca sangat panas! Minum banyak air dan hindari aktivitas outdoor.";
    } else if (temp > 28) {
        return "🥤 Cuaca panas, jangan lupa minum air yang cukup!";
    } else if (temp < 15) {
        return "🧥 Cuaca dingin, pakai jaket agar tetap hangat!";
    } else if (temp < 20) {
        return "👕 Cuaca sejuk, pakai baju hangat ya!";
    }

    // Condition based tips
    if (cond.includes("rain") || cond.includes("drizzle")) {
        return "☔ Jangan lupa bawa payung, cuaca hujan nih!";
    } else if (cond.includes("thunder") || cond.includes("storm")) {
        return "⚡ Waspadai petir! Sebaiknya di dalam ruangan saja.";
    } else if (cond.includes("snow")) {
        return "❄️ Bersalju! Pakai jaket tebal dan hati-hati di jalan.";
    } else if (cond.includes("fog") || cond.includes("mist")) {
        return "🌫️ Berkabut, hati-hati saat berkendara!";
    }

    // Humidity based tips
    if (humidity > 80) {
        return "💧 Kelembaban tinggi, terasa gerah. Gunakan AC atau kipas.";
    }

    // Wind based tips
    if (windSpeed > 30) {
        return "💨 Angin kencang! Amankan barang-barang di luar.";
    }

    // Default tips
    if (cond.includes("sunny") || cond.includes("clear")) {
        return "😎 Cuaca cerah! Waktu yang tepat untuk aktivitas outdoor.";
    } else if (cond.includes("cloud")) {
        return "☁️ Cuaca berawan, cukup nyaman untuk beraktivitas.";
    }

    return "🌤️ Cuaca cukup baik, selamat beraktivitas!";
}

// ===== AIR QUALITY INDEX =====
function displayAQI(aqi) {
    const aqiValue = document.getElementById("aqiValue");
    const aqiStatus = document.getElementById("aqiStatus");
    const aqiFill = document.getElementById("aqiFill");
    const aqiCard = document.getElementById("aqiCard");

    aqiValue.textContent = Math.round(aqi);

    let status, color, percentage;

    if (aqi <= 50) {
        status = "Baik";
        color = "#10b981";
        percentage = (aqi / 50) * 100;
    } else if (aqi <= 100) {
        status = "Sedang";
        color = "#f59e0b";
        percentage = ((aqi - 50) / 50) * 100;
    } else if (aqi <= 150) {
        status = "Tidak Sehat";
        color = "#f97316";
        percentage = ((aqi - 100) / 50) * 100;
    } else if (aqi <= 200) {
        status = "Sangat Tidak Sehat";
        color = "#ef4444";
        percentage = ((aqi - 150) / 50) * 100;
    } else {
        status = "Berbahaya";
        color = "#991b1b";
        percentage = 100;
    }

    aqiStatus.textContent = status;
    aqiStatus.style.color = color;
    aqiFill.style.width = Math.min(percentage, 100) + "%";
    aqiFill.style.background = color;
    aqiCard.style.borderColor = color + "50";
}

// ===== UV INDEX =====
function displayUV(uv) {
    const uvValue = document.getElementById("uvValue");
    const uvStatus = document.getElementById("uvStatus");
    const uvFill = document.getElementById("uvFill");
    const uvCard = document.getElementById("uvCard");

    uvValue.textContent = Math.round(uv);

    let status, color, percentage;

    if (uv <= 2) {
        status = "Rendah";
        color = "#10b981";
        percentage = (uv / 2) * 100;
    } else if (uv <= 5) {
        status = "Sedang";
        color = "#f59e0b";
        percentage = ((uv - 2) / 3) * 100;
    } else if (uv <= 7) {
        status = "Tinggi";
        color = "#f97316";
        percentage = ((uv - 5) / 2) * 100;
    } else if (uv <= 10) {
        status = "Sangat Tinggi";
        color = "#ef4444";
        percentage = ((uv - 7) / 3) * 100;
    } else {
        status = "Ekstrim";
        color = "#991b1b";
        percentage = 100;
    }

    uvStatus.textContent = status;
    uvStatus.style.color = color;
    uvFill.style.width = Math.min(percentage, 100) + "%";
    uvFill.style.background = color;
    uvCard.style.borderColor = color + "50";
}

// ===== WEATHER ALERTS =====
function checkWeatherAlerts(current) {
    const alerts = [];

    if (current.temp_c > 35) {
        alerts.push(
            "🔥 Suhu sangat tinggi (>35°C)! Hindari aktivitas outdoor."
        );
    }
    if (current.wind_kph > 50) {
        alerts.push(
            "💨 Angin sangat kencang (>50 km/h)! Hati-hati saat berkendara."
        );
    }
    if (current.vis_km < 1) {
        alerts.push(
            "🌫️ Jarak pandang sangat terbatas (<1km)! Berkendara dengan hati-hati."
        );
    }
    if (current.condition.text.toLowerCase().includes("thunder")) {
        alerts.push(
            "⚡ Potensi petir! Hindari tempat terbuka dan pohon tinggi."
        );
    }

    if (alerts.length > 0) {
        alertText.textContent = alerts.join(" ");
        weatherAlert.classList.remove("hidden");
    } else {
        weatherAlert.classList.add("hidden");
    }
}

// ===== LOCAL TIME =====
function updateLocalTime(timezone) {
    if (localTimeInterval) {
        clearInterval(localTimeInterval);
    }

    function updateClock() {
        try {
            const now = new Date();

            const timeString = now.toLocaleTimeString("id-ID", {
                timeZone: timezone,
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });

            const dateString = now.toLocaleDateString("id-ID", {
                timeZone: timezone,
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });

            localTimeEl.textContent = timeString;
            localDateEl.textContent = dateString;
        } catch (error) {
            console.error("Time update error:", error);
            localTimeEl.textContent = "--:--:--";
            localDateEl.textContent = "Timezone tidak valid";
        }
    }

    updateClock();
    localTimeInterval = setInterval(updateClock, 1000);
}

// ===== FORECAST =====
async function getForecast(query) {
    try {
        const response = await fetch(
            `${FORECAST_API}?key=${API_KEY}&q=${query}&days=3&aqi=yes&alerts=yes`
        );

        if (!response.ok) {
            throw new Error("Gagal mengambil data forecast");
        }

        const data = await response.json();
        displayForecast(data.forecast.forecastday);

        // Display AQI if available
        if (data.current.air_quality) {
            const aqi =
                data.current.air_quality["us-epa-index"] * 50 ||
                data.current.air_quality.pm2_5;
            displayAQI(aqi);
        } else {
            // Fallback
            displayAQI(50);
        }

        // Display UV
        displayUV(data.current.uv);

        // Check alerts
        checkWeatherAlerts(data.current);

        // Update tip with all data
        tipText.textContent = getWeatherTip(
            data.current.temp_c,
            data.current.condition.text,
            data.current.humidity,
            data.current.wind_kph,
            data.current.air_quality ? data.current.air_quality.pm2_5 : 50,
            data.current.uv
        );
    } catch (error) {
        console.error("Forecast error:", error);
        forecastContainer.innerHTML =
            '<div class="forecast-loading">Gagal memuat prakiraan</div>';
    }
}

function displayForecast(forecastDays) {
    forecastContainer.innerHTML = "";

    forecastDays.forEach((day, index) => {
        const date = new Date(day.date);
        const dayName =
            index === 0
                ? "Hari Ini"
                : index === 1
                ? "Besok"
                : date.toLocaleDateString("id-ID", { weekday: "long" });

        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <div class="forecast-date">${dayName}</div>
            <div class="forecast-icon">
                <img src="https:${day.day.condition.icon}" alt="${
                    day.day.condition.text
                }">
            </div>
            <div class="forecast-temps">
                <div class="forecast-temp">
                    <div class="forecast-temp-label">Max</div>
                    <div class="forecast-temp-value">${Math.round(
                        isCelsius ? day.day.maxtemp_c : day.day.maxtemp_f
                    )}°${isCelsius ? "C" : "F"}</div>
                </div>
                <div class="forecast-temp">
                    <div class="forecast-temp-label">Min</div>
                    <div class="forecast-temp-value">${Math.round(
                        isCelsius ? day.day.mintemp_c : day.day.mintemp_f
                    )}°${isCelsius ? "C" : "F"}</div>
                </div>
            </div>
            <div class="forecast-condition">${day.day.condition.text}</div>
        `;

        forecastContainer.appendChild(card);
    });
}

// ===== COMPARE CITIES =====
compareBtn.addEventListener("click", () => {
    compareContainer.classList.remove("hidden");
    compareResults.classList.add("hidden");
    compareCity1.value = "";
    compareCity2.value = "";
});

closeCompare.addEventListener("click", () => {
    compareContainer.classList.add("hidden");
});

compareSearchBtn.addEventListener("click", async () => {
    const city1 = compareCity1.value.trim();
    const city2 = compareCity2.value.trim();

    if (!city1 || !city2) {
        showError("Masukkan kedua nama kota!");
        return;
    }

    try {
        showLoading();

        const [data1, data2] = await Promise.all([
            fetch(`${API_URL}?key=${API_KEY}&q=${city1}&aqi=no`).then(r =>
                r.json()
            ),
            fetch(`${API_URL}?key=${API_KEY}&q=${city2}&aqi=no`).then(r =>
                r.json()
            )
        ]);

        hideLoading();
        displayComparison(data1, data2);
    } catch (error) {
        hideLoading();
        showError("Gagal membandingkan kota. Periksa nama kota!");
        console.error("Compare error:", error);
    }
});

function displayComparison(data1, data2) {
    const temp1 = isCelsius ? data1.current.temp_c : data1.current.temp_f;
    const temp2 = isCelsius ? data2.current.temp_c : data2.current.temp_f;

    const hotter = temp1 > temp2 ? 1 : 2;
    const tempDiff = Math.abs(temp1 - temp2).toFixed(1);

    compareResults.innerHTML = `
        <div class="compare-city-card ${hotter === 1 ? "compare-winner" : ""}">
            <div class="compare-city-name">${data1.location.name}</div>
            <div class="compare-temp">${Math.round(temp1)}°${
                isCelsius ? "C" : "F"
            }</div>
            <div class="compare-condition">${data1.current.condition.text}</div>
            <div class="compare-details">
                <div>💧 ${data1.current.humidity}%</div>
                <div>💨 ${data1.current.wind_kph} km/h</div>
                <div>👁️ ${data1.current.vis_km} km</div>
                <div>🌡️ Feels ${Math.round(
                    isCelsius
                        ? data1.current.feelslike_c
                        : data1.current.feelslike_f
                )}°</div>
            </div>
            ${
                hotter === 1
                    ? '<div style="margin-top: 10px; color: #10b981; font-weight: 700;">🔥 Lebih Panas!</div>'
                    : ""
            }
        </div>
        
        <div class="compare-city-card ${hotter === 2 ? "compare-winner" : ""}">
            <div class="compare-city-name">${data2.location.name}</div>
            <div class="compare-temp">${Math.round(temp2)}°${
                isCelsius ? "C" : "F"
            }</div>
            <div class="compare-condition">${data2.current.condition.text}</div>
            <div class="compare-details">
                <div>💧 ${data2.current.humidity}%</div>
                <div>💨 ${data2.current.wind_kph} km/h</div>
                <div>👁️ ${data2.current.vis_km} km</div>
                <div>🌡️ Feels ${Math.round(
                    isCelsius
                        ? data2.current.feelslike_c
                        : data2.current.feelslike_f
                )}°</div>
            </div>
            ${
                hotter === 2
                    ? '<div style="margin-top: 10px; color: #10b981; font-weight: 700;">🔥 Lebih Panas!</div>'
                    : ""
            }
        </div>
    `;

    compareResults.classList.remove("hidden");

    // Show summary
    const summary = document.createElement("div");
    summary.style.cssText =
        "grid-column: 1/-1; text-align: center; padding: 15px; background: rgba(167,139,250,0.1); border-radius: 12px; margin-top: 10px;";
    summary.innerHTML = `<strong>${data1.location.name}</strong> lebih ${
        hotter === 1 ? "panas" : "dingin"
    } <strong>${tempDiff}°${isCelsius ? "C" : "F"}</strong> dari <strong>${
        data2.location.name
    }</strong>`;
    compareResults.appendChild(summary);
}

// ===== MAIN FUNCTION =====
async function getWeather(query) {
    try {
        showLoading();
        hideError();
        hideWeatherCard();
        hideAutocomplete();

        // UBAH INI - Pakai FORECAST_API
        const response = await fetch(`${FORECAST_API}?key=${API_KEY}&q=${query}&days=1&aqi=yes`);
        
        if (!response.ok) {
            throw new Error('Kota tidak ditemukan. Coba lagi!');
        }

        const data = await response.json();
        currentWeatherData = data;
        
        hideLoading();
        displayWeather(data);
        getForecast(query);
        saveToRecent(data.location.name, data.location.country);
        
        compareBtn.classList.remove('hidden');
        
    } catch (error) {
        hideLoading();
        showError(error.message);
        console.error('Weather fetch error:', error);
    }
}

function displayWeather(data) {
    // UBAH INI - Tambah forecast
    const { location, current, forecast } = data;
    
    document.getElementById('cityName').textContent = location.name;
    document.getElementById('country').textContent = location.country;
    document.getElementById('weatherIcon').innerHTML = `<img src="https:${current.condition.icon}" alt="${current.condition.text}">`;
    weatherEmoji.textContent = getWeatherEmoji(current.condition.text, current.is_day);
    
    updateTemperatureDisplay();
    
    document.getElementById('condition').textContent = current.condition.text;
    document.getElementById('windSpeed').textContent = `${current.wind_kph} km/h`;
    document.getElementById('humidity').textContent = `${current.humidity}%`;
    document.getElementById('visibility').textContent = `${current.vis_km} km`;
    document.getElementById('pressure').textContent = `${current.pressure_mb} mb`;
    
    // UBAH INI - Sunrise & Sunset
    if (forecast && forecast.forecastday && forecast.forecastday[0] && forecast.forecastday[0].astro) {
        const astro = forecast.forecastday[0].astro;
        document.getElementById('sunriseTime').textContent = astro.sunrise;
        document.getElementById('sunsetTime').textContent = astro.sunset;
    } else {
        document.getElementById('sunriseTime').textContent = '06:00 AM';
        document.getElementById('sunsetTime').textContent = '06:00 PM';
    }
    
    updateLocalTime(location.tz_id);
    changeBackground(current.condition.text);
    showWeatherCard();
}

function changeBackground(condition) {
    const body = document.body;
    body.className = "";

    const cond = condition.toLowerCase();

    if (cond.includes("clear") || cond.includes("sunny")) {
        body.classList.add("clear");
    } else if (cond.includes("cloud") || cond.includes("overcast")) {
        body.classList.add("cloudy");
    } else if (cond.includes("rain") || cond.includes("drizzle")) {
        body.classList.add("rainy");
    } else if (cond.includes("snow")) {
        body.classList.add("snowy");
    } else if (cond.includes("mist") || cond.includes("fog")) {
        body.classList.add("misty");
    }
}

function saveToRecent(city, country) {
    try {
        let recent = JSON.parse(localStorage.getItem("recentCities")) || [];
        recent = recent.filter(item => item.city !== city);
        recent.unshift({ city, country });

        if (recent.length > 5) {
            recent = recent.slice(0, 5);
        }

        localStorage.setItem("recentCities", JSON.stringify(recent));
        displayRecentCities();
    } catch (error) {
        console.error("LocalStorage error:", error);
    }
}

function displayRecentCities() {
    try {
        const recent = JSON.parse(localStorage.getItem("recentCities")) || [];

        if (recent.length === 0) {
            recentCitiesDiv.classList.add("hidden");
            return;
        }

        citiesList.innerHTML = "";

        recent.forEach(item => {
            const tag = document.createElement("div");
            tag.className = "city-tag";
            tag.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                ${item.city}, ${item.country}
            `;
            tag.addEventListener("click", () => {
                getWeather(item.city);
            });
            citiesList.appendChild(tag);
        });

        recentCitiesDiv.classList.remove("hidden");
    } catch (error) {
        console.error("Display recent cities error:", error);
    }
}

function useCurrentLocation() {
    if (!navigator.geolocation) {
        showError("Geolocation tidak didukung oleh browser Anda");
        return;
    }

    showLoading();
    hideError();

    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            console.log("Lokasi didapat:", latitude, longitude);
            getWeather(`${latitude},${longitude}`);
        },
        error => {
            hideLoading();
            let errorMsg = "Gagal mendapatkan lokasi. ";

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg +=
                        "Anda menolak akses lokasi. Silakan aktifkan di pengaturan browser.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg +=
                        "Informasi lokasi tidak tersedia. Pastikan GPS aktif.";
                    break;
                case error.TIMEOUT:
                    errorMsg += "Request timeout. Coba lagi.";
                    break;
                default:
                    errorMsg += "Terjadi kesalahan tidak diketahui.";
            }

            showError(errorMsg);
            console.error("Geolocation error:", error);
        },
        options
    );
}

// ===== UI FUNCTIONS =====
function showLoading() {
    loading.classList.remove("hidden");
}
function hideLoading() {
    loading.classList.add("hidden");
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove("hidden");
    setTimeout(() => hideError(), 5000);
}

function hideError() {
    errorMessage.classList.add("hidden");
}
function showWeatherCard() {
    weatherCard.classList.remove("hidden");
}
function hideWeatherCard() {
    weatherCard.classList.add("hidden");
}

// ===== EVENT LISTENERS =====
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
        cityInput.value = "";
    } else {
        showError("Masukkan nama kota terlebih dahulu!");
    }
});

cityInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        searchBtn.click();
    }
});

locationBtn.addEventListener("click", useCurrentLocation);
closeError.addEventListener("click", hideError);

// ===== PREVENT ZOOM ON DOUBLE TAP (Mobile) =====
let lastTouchEnd = 0;
document.addEventListener(
    "touchend",
    e => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    },
    { passive: false }
);

// ===== CLEANUP ON PAGE UNLOAD =====
window.addEventListener("beforeunload", () => {
    if (localTimeInterval) {
        clearInterval(localTimeInterval);
    }
});

// ===== INITIALIZATION =====
displayRecentCities();

// Optional: Load default city
// getWeather('Jakarta');
