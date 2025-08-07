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
        if (currentLocation) {
            fetchWeatherData(currentLocation);
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
    }
    
    function celsiusToFahrenheit(celsius) {
        return (celsius * 9/5) + 32;
    }
    
    function celsiusToKelvin(celsius) {
        return celsius + 273.15;
    }
    
    // Weather App Core Functionality
    function handleSearch() {
        const location = locationInput.value.trim();
        
        if (location) {
            fetchWeatherData(location);
        }
    }
    
    async function fetchWeatherData(location) {
        try {
            // Show loading state
            weatherContainer.innerHTML = '<div class="loading"></div>';
            weatherContainer.style.display = 'block';
            
            // Build API URL
            const url = `${API_BASE_URL}${encodeURIComponent(location)}?unitGroup=metric&key=${API_KEY}&include=hours&elements=datetime,temp,feelslike,conditions,icon,windspeed,precipprob`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Weather data not available');
            }
            
            const data = await response.json();
            currentLocation = location;
            
            // Display weather data
            displayWeatherData(data);
            
        } catch (error) {
            weatherContainer.innerHTML = `
                <div class="error">
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    function displayWeatherData(data) {
        // Store current temperature values (in Celsius by default from API)
        currentTemperature = data.currentConditions.temp;
        currentFeelsLike = data.currentConditions.feelslike;
        
        // Update location and date
        locationElement.textContent = data.resolvedAddress;
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
        conditionElement.textContent = data.currentConditions.conditions;
        weatherIcon.src = getWeatherIconUrl(data.currentConditions.icon);
        
        // Update weather details
        windSpeed.textContent = `${data.currentConditions.windspeed} km/h`;
        precipitation.textContent = `${data.currentConditions.precipprob}%`;
        
        // Update hourly forecast
        displayHourlyForecast(data.hours);
        
        // Show weather container
        weatherContainer.style.display = 'block';
    }
    
    function displayHourlyForecast(hours) {
        // Clear previous forecast
        hourlyForecast.innerHTML = '';
        
        // Get current hour
        const currentHour = new Date().getHours();
        
        // Display 24 hours (12 before and 12 after current hour)
        const startIndex = Math.max(currentHour - 12, 0);
        const endIndex = Math.min(startIndex + 24, hours.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            const hour = hours[i];
            const date = new Date(hour.datetime);
            const hourlyTemp = hour.temp;
            
            const hourlyItem = document.createElement('div');
            hourlyItem.classList.add('hourly-item');
            
            hourlyItem.innerHTML = `
                <p>${date.getHours()}:00</p>
                <img src="${getWeatherIconUrl(hour.icon)}" alt="${hour.conditions}">
                <p>${Math.round(hourlyTemp)}°C</p>
            `;
            
            hourlyForecast.appendChild(hourlyItem);
        }
    }
    
    function getWeatherIconUrl(iconCode) {
        // Map API icon codes to icon URLs
        // You can replace these with actual weather icons
        const iconMap = {
            'clear-day': 'https://cdn-icons-png.flaticon.com/512/6974/6974833.png',
            'clear-night': 'https://cdn-icons-png.flaticon.com/512/3222/3222800.png',
            'partly-cloudy-day': 'https://cdn-icons-png.flaticon.com/512/1146/1146869.png',
            'partly-cloudy-night': 'https://cdn-icons-png.flaticon.com/512/3313/3313998.png',
            'cloudy': 'https://cdn-icons-png.flaticon.com/512/414/414927.png',
            'rain': 'https://cdn-icons-png.flaticon.com/512/3767/3767039.png',
            'snow': 'https://cdn-icons-png.flaticon.com/512/642/642000.png',
            'wind': 'https://cdn-icons-png.flaticon.com/512/2011/2011448.png',
            'fog': 'https://cdn-icons-png.flaticon.com/512/4005/4005901.png',
            'default': 'https://cdn-icons-png.flaticon.com/512/1779/1779940.png'
        };
        
        return iconMap[iconCode] || iconMap.default;
    }
});
