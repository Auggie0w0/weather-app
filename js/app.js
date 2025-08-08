document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const locationInput = document.getElementById('location-input');
    const searchBtn = document.getElementById('search-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const locationElement = document.getElementById('location');
    const dateElement = document.getElementById('date');
    const temperatureElement = document.getElementById('temperature');
    const conditionElement = document.getElementById('condition');
    const weatherIcon = document.getElementById('weather-icon');
    const windSpeed = document.getElementById('wind-speed');
    const precipitation = document.getElementById('precipitation');
    const feelsLike = document.getElementById('feels-like');
    const hourlyForecast = document.getElementById('hourly-forecast');
    const weatherContainer = document.querySelector('.weather-container');
    const cookieConsent = document.getElementById('cookie-consent');
    const acceptCookiesBtn = document.getElementById('accept-cookies');
    const declineCookiesBtn = document.getElementById('decline-cookies');
    
    // Variables
    let currentTemperature = null;
    let currentFeelsLike = null;
    let currentUnit = 'celsius';
    let currentLocation = '';
    let currentCoordinates = null;
    
    // Initialize features
    initCookieConsent();
    initCustomDropdown();
    initTemperatureConverter();
    
    // Event Listeners
    searchBtn.addEventListener('click', handleSearch);
    locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    refreshBtn.addEventListener('click', () => {
        if (currentCoordinates) {
            fetchWeatherData(currentCoordinates);
        }
    });

    // Feature: Cookie Consent Banner
    function initCookieConsent() {
        // Check if user has already made a choice
        const cookieChoice = localStorage.getItem('cookieConsent');
        
        if (cookieChoice) {
            cookieConsent.style.display = 'none';
        }
        
        acceptCookiesBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            cookieConsent.style.display = 'none';
        });
        
        declineCookiesBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'declined');
            cookieConsent.style.display = 'none';
        });
    }
    
    // Feature: Custom Dropdown
    function initCustomDropdown() {
        const dropdown = document.querySelector('.custom-dropdown');
        const selected = dropdown.querySelector('.dropdown-selected');
        const options = dropdown.querySelector('.dropdown-options');
        const optionItems = options.querySelectorAll('li');
        
        selected.addEventListener('click', () => {
            dropdown.classList.toggle('open');
        });
        
        optionItems.forEach(item => {
            item.addEventListener('click', () => {
                const value = item.dataset.value;
                selected.querySelector('span').textContent = item.textContent;
                dropdown.classList.remove('open');
                
                // Set the input value and trigger search
                locationInput.value = value;
                handleSearch();
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    }
    
    // Feature: Temperature Converter
    function initTemperatureConverter() {
        const tempUnits = document.querySelectorAll('.temp-unit');
        
        tempUnits.forEach(unit => {
            unit.addEventListener('click', () => {
                // Remove active class from all units
                tempUnits.forEach(u => u.classList.remove('active'));
                
                // Add active class to clicked unit
                unit.classList.add('active');
                
                // Update temperature display
                const unitType = unit.dataset.unit;
                currentUnit = unitType;
                updateTemperatureDisplay();
            });
        });
    }
    
    function updateTemperatureDisplay() {
        if (currentTemperature === null) return;
        
        let tempValue, feelsLikeValue, unitSymbol;
        
        switch (currentUnit) {
            case 'celsius':
                tempValue = currentTemperature;
                feelsLikeValue = currentFeelsLike;
                unitSymbol = '°C';
                break;
            case 'fahrenheit':
                tempValue = celsiusToFahrenheit(currentTemperature);
                feelsLikeValue = celsiusToFahrenheit(currentFeelsLike);
                unitSymbol = '°F';
                break;
            case 'kelvin':
                tempValue = celsiusToKelvin(currentTemperature);
                feelsLikeValue = celsiusToKelvin(currentFeelsLike);
                unitSymbol = 'K';
                break;
        }
        
        temperatureElement.textContent = `${Math.round(tempValue)}${unitSymbol}`;
        feelsLike.textContent = `${Math.round(feelsLikeValue)}${unitSymbol}`;
        
        // Update hourly forecast temperatures if they exist
        const hourlyItems = hourlyForecast.querySelectorAll('.hourly-item');
        hourlyItems.forEach(item => {
            const tempElement = item.querySelector('.hourly-temp');
            if (tempElement) {
                const originalTemp = parseFloat(tempElement.dataset.celsius);
                let convertedTemp;
                
                switch (currentUnit) {
                    case 'celsius':
                        convertedTemp = originalTemp;
                        break;
                    case 'fahrenheit':
                        convertedTemp = celsiusToFahrenheit(originalTemp);
                        break;
                    case 'kelvin':
                        convertedTemp = celsiusToKelvin(originalTemp);
                        break;
                }
                
                tempElement.textContent = `${Math.round(convertedTemp)}${unitSymbol}`;
            }
        });
    }
    
    function celsiusToFahrenheit(celsius) {
        return (celsius * 9/5) + 32;
    }
    
    function celsiusToKelvin(celsius) {
        return celsius + 273.15;
    }
    
    // Weather App Core Functionality
    async function handleSearch() {
        const location = locationInput.value.trim();
        
        if (location) {
            try {
                // Show loading state
                weatherContainer.innerHTML = '<div class="loading"></div>';
                weatherContainer.style.display = 'block';
                
                // First, geocode the location to get coordinates
                const coordinates = await geocodeLocation(location);
                
                if (coordinates) {
                    currentCoordinates = coordinates;
                    currentLocation = location;
                    // Then fetch weather data using the coordinates
                    fetchWeatherData(coordinates);
                } else {
                    throw new Error('Location not found. Please try another search term.');
                }
            } catch (error) {
                weatherContainer.innerHTML = `
                    <div class="error">
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }
    }
    
    async function geocodeLocation(location) {
        try {
            const url = `${GEOCODING_API_URL}?name=${encodeURIComponent(location)}&count=1`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Geocoding service unavailable');
            }
            
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                return {
                    latitude: result.latitude,
                    longitude: result.longitude,
                    name: result.name,
                    country: result.country,
                    admin1: result.admin1
                };
            }
            
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            throw new Error('Unable to find location. Please try again.');
        }
    }
    
    async function fetchWeatherData(coordinates) {
        try {
            // Build API URL with parameters based on Open-Meteo documentation
            const url = `${FORECAST_API_URL}?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Weather data not available');
            }
            
            const data = await response.json();
            
            // Display weather data
            displayWeatherData(data, coordinates);
            
        } catch (error) {
            weatherContainer.innerHTML = `
                <div class="error">
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    function displayWeatherData(data, coordinates) {
        // Store current temperature values (in Celsius by default from API)
        currentTemperature = data.current.temperature_2m;
        currentFeelsLike = data.current.apparent_temperature;
        
        // Update location and date
        const locationName = coordinates.name ? 
            `${coordinates.name}${coordinates.admin1 ? ', ' + coordinates.admin1 : ''}${coordinates.country ? ', ' + coordinates.country : ''}` : 
            `${coordinates.latitude.toFixed(2)}, ${coordinates.longitude.toFixed(2)}`;
        
        locationElement.textContent = locationName;
        
        const currentDate = new Date();
        dateElement.textContent = currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Update temperature with current unit
        updateTemperatureDisplay();
        
        // Update weather condition and icon
        const weatherCode = data.current.weather_code;
        conditionElement.textContent = getWeatherDescription(weatherCode);
        weatherIcon.src = getWeatherIconUrl(weatherCode, data.current.is_day);
        
        // Update weather details
        windSpeed.textContent = `${data.current.wind_speed_10m} ${data.current_units.wind_speed_10m}`;
        
        // Calculate precipitation probability from hourly data (current hour)
        const currentHourIndex = new Date().getHours();
        const precipProb = data.hourly.precipitation_probability[currentHourIndex] || 0;
        precipitation.textContent = `${precipProb}%`;
        
        // Update hourly forecast
        displayHourlyForecast(data.hourly);
        
        // Show weather container
        weatherContainer.style.display = 'block';
    }
    
    function displayHourlyForecast(hourlyData) {
        // Clear previous forecast
        hourlyForecast.innerHTML = '';
        
        // Get current hour
        const currentHour = new Date().getHours();
        
        // Calculate start and end indices for 24 hours (12 before and 12 after current hour if available)
        const startIndex = Math.max(currentHour - 12, 0);
        const endIndex = Math.min(startIndex + 24, hourlyData.time.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            const time = new Date(hourlyData.time[i]);
            const temp = hourlyData.temperature_2m[i];
            const weatherCode = hourlyData.weather_code[i];
            const isDay = time.getHours() >= 6 && time.getHours() < 18; // Simple day/night check
            
            const hourlyItem = document.createElement('div');
            hourlyItem.classList.add('hourly-item');
            
            hourlyItem.innerHTML = `
                <p>${time.getHours()}:00</p>
                <img src="${getWeatherIconUrl(weatherCode, isDay)}" alt="${getWeatherDescription(weatherCode)}">
                <p class="hourly-temp" data-celsius="${temp}">${Math.round(temp)}°C</p>
            `;
            
            hourlyForecast.appendChild(hourlyItem);
        }
    }
    
    function getWeatherDescription(code) {
        // WMO Weather interpretation codes from Open-Meteo documentation
        const weatherCodes = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            56: 'Light freezing drizzle',
            57: 'Dense freezing drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            66: 'Light freezing rain',
            67: 'Heavy freezing rain',
            71: 'Slight snow fall',
            73: 'Moderate snow fall',
            75: 'Heavy snow fall',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with slight hail',
            99: 'Thunderstorm with heavy hail'
        };
        
        return weatherCodes[code] || 'Unknown';
    }
    
    function getWeatherIconUrl(code, isDay) {
        // Map WMO codes to icon URLs
        const iconMap = {
            // Clear sky
            0: isDay ? 'https://cdn-icons-png.flaticon.com/512/6974/6974833.png' : 'https://cdn-icons-png.flaticon.com/512/3222/3222800.png',
            // Mainly clear, partly cloudy
            1: isDay ? 'https://cdn-icons-png.flaticon.com/512/1146/1146869.png' : 'https://cdn-icons-png.flaticon.com/512/3313/3313998.png',
            2: isDay ? 'https://cdn-icons-png.flaticon.com/512/1146/1146869.png' : 'https://cdn-icons-png.flaticon.com/512/3313/3313998.png',
            // Overcast
            3: 'https://cdn-icons-png.flaticon.com/512/414/414927.png',
            // Fog
            45: 'https://cdn-icons-png.flaticon.com/512/4005/4005901.png',
            48: 'https://cdn-icons-png.flaticon.com/512/4005/4005901.png',
            // Drizzle
            51: 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            53: 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            55: 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            56: 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            57: 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            // Rain
            61: 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            63: 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            65: 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            66: 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            67: 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            // Snow
            71: 'https://cdn-icons-png.flaticon.com/512/642/642000.png',
            73: 'https://cdn-icons-png.flaticon.com/512/642/642000.png',
            75: 'https://cdn-icons-png.flaticon.com/512/642/642000.png',
            77: 'https://cdn-icons-png.flaticon.com/512/642/642000.png',
            // Rain showers
            80: 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            81: 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            82: 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            // Snow showers
            85: 'https://cdn-icons-png.flaticon.com/512/642/642000.png',
            86: 'https://cdn-icons-png.flaticon.com/512/642/642000.png',
            // Thunderstorm
            95: 'https://cdn-icons-png.flaticon.com/512/1779/1779927.png',
            96: 'https://cdn-icons-png.flaticon.com/512/1779/1779927.png',
            99: 'https://cdn-icons-png.flaticon.com/512/1779/1779927.png',
            // Default
            default: 'https://cdn-icons-png.flaticon.com/512/1779/1779940.png'
        };
        
        return iconMap[code] || iconMap.default;
    }
});