const searchInput = document.querySelector("#search");
const main = document.querySelector(".main");
const message = document.querySelector(".message");
const cardsList = document.querySelector(".cards-list");
const detail = document.querySelector(".detail");

// Las direcciones (URLs):
const API_URL = "https://api.restcountries.com/countries/v5";
const API_KEY = "rc_live_14239569407b43b597ea52b72a6976c0"; // solo para pruebas
const FIELDS =
  "names.common,flag.url_svg,capitals,population,region,subregion,timezones";

const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const WEATHER_KEY = "83fd7778db264fe6bb0befeffafa8fbb"; // solo para pruebas

let countries = [];
const weatherCache = {};

// funcion para descargar los paises:
const getCountries = async () => {
  try {
    const response = await fetch(
      `${API_URL}/names.common?q=v&limit=100&response_fields=${FIELDS}`,
      { headers: { Authorization: `Bearer ${API_KEY}` } },
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    const result = await response.json();
    countries = result.data.objects;
  } catch (error) {
    console.log("No se pudieron traer los países:", error);
  }
};

getCountries();

// Obtener clima:

const getWeather = async (country) => {
  const name = country.names.common;

  if (weatherCache[name]) {
    return weatherCache[name];
  }

  const coordinates = country.capitals?.[0]?.coordinates;
  if (!coordinates) {
    return null;
  }

  try {
    const response = await fetch(
      `${WEATHER_URL}?lat=${coordinates.lat}&lon=${coordinates.lng}&units=metric&lang=es&appid=${WEATHER_KEY}`,
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    const data = await response.json();
    weatherCache[name] = data;
    return data;
  } catch (error) {
    console.log("No se pudo traer el clima:", error);
    return null;
  }
};

//Muestra el clima en los contenedores:

const showWeather = async (country, weatherBar) => {
  const weather = await getWeather(country);

  if (!weatherBar.isConnected) {
    return;
  }

  if (!weather) {
    weatherBar.textContent = "Clima no disponible";
    return;
  }

  const { description, icon } = weather.weather[0];
  const temperature = weather.main.temp.toFixed(1);

  weatherBar.innerHTML = `
    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" />
    <span>${description}</span>
    <span>|</span>
    <span>${temperature} °C</span>
  `;
};

// Limpia los mensajes en pantalla:

const clearResults = () => {
  message.textContent = "";
  cardsList.innerHTML = "";
  detail.innerHTML = "";
};

const showMessage = (text) => {
  clearResults();
  message.textContent = text;
};

//Renderizado:

const showCards = (countriesToShow) => {
  clearResults();

  countriesToShow.forEach((country) => {
    const card = document.createElement("li");
    card.classList.add("card");
    card.innerHTML = `
      <img class="card-flag" src="${country.flag.url_svg}" alt="Bandera de ${country.names.common}" />
      <p class="card-name">${country.names.common}</p>
    `;
    cardsList.appendChild(card);
  });
};

// Muestra Detalles de cada pais.:
const showDetail = (country) => {
  clearResults();

  const capital = country.capitals?.[0]?.name ?? "Sin capital";
  const population = country.population?.toLocaleString("es") ?? "Sin datos";
  const region = country.region ?? "Sin datos";
  const subregion = country.subregion ?? "Sin datos";
  const timezones = country.timezones?.join(", ") ?? "Sin datos";

  detail.innerHTML = `
    <article class="detail-card">
      <div class="detail-media">
        <img class="detail-flag" src="${country.flag.url_svg}" alt="Bandera de ${country.names.common}" />
        <div class="detail-weather">Cargando clima...</div>
      </div>
      <div class="detail-info">
        <h2 class="detail-name">${country.names.common}</h2>
        <p>${capital}</p>
        <p>${population} habitantes</p>
        <p>${region}</p>
        <p>${subregion}</p>
        <p>${timezones}</p>
      </div>
    </article>
  `;

  const weatherBar = detail.querySelector(".detail-weather");
  showWeather(country, weatherBar);
};

//Interacciones

searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.trim().toLowerCase();

  main.classList.toggle("searching", searchTerm !== "");

  if (searchTerm === "") {
    clearResults();
    return;
  }

  //Parte de Filtrado

  const filteredCountries = countries.filter((country) => {
    const countryName = country.names.common.trim().toLowerCase();
    return countryName.startsWith(searchTerm);
  });

  if (filteredCountries.length === 0) {
    showMessage("País no disponible por el momento.");
  } else if (filteredCountries.length === 1) {
    showDetail(filteredCountries[0]);
  } else if (filteredCountries.length <= 10) {
    showCards(filteredCountries);
  } else {
    showMessage("Demasiados países, especifica mejor tu búsqueda");
  }
});
