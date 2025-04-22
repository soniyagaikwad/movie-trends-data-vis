let data;

let activeFilters = {
  genre: [],
  year: [],
  mpaa_rating: [],
  rating: []
};

let filterDropdownVisible = false;

document.addEventListener('DOMContentLoaded', function() {
  setUp();

  const filterButton = document.querySelector('.filter-button');
  const cancelButton = document.querySelector('.cancel-button');
  
  filterButton.addEventListener('click', displayFilterDropdown);
  cancelButton.addEventListener('click', clearFilters);
  
  createFilterDropdown();
});

/*
  data cleaning and loading
*/
function setUp() {
  d3.csv('../data/movies.csv')
      .then(dataOutput => {
          dataOutput = dataOutput.slice(0, 509); 
          console.log('CSV data loaded successfully');
          processData(dataOutput);
      })
      .catch(e => {
          console.error('Error loading CSV:', e);
          alert('Error loading movie data!');
      });
}

/*
process data structure
*/
function processData(rawData) {
  data = rawData.map((d) => ({
      movie: d.Title,
      mpaa_rating: d['MPAA Rating'],
      budget: parseInt(d.Budget) || 0,
      gross_revenue: parseInt(d.Gross) || 0,
      genre: d.Genre,
      runtime: parseInt(d.Runtime) || 0,
      rating: parseFloat(d.Rating) || 0,
      year: d['Release Date'] ? parseInt(d['Release Date'].split('-')[0]) : 0,
      profit: (parseInt(d.Gross) || 0) - (parseInt(d.Budget) || 0),
      summary: d.Summary || "No summary available."
  }));
  
  populateTable(data);
}

/*
populate the table with movie info
*/
function populateTable(movies) {
  const tableBody = document.getElementById('movieTableBody');
  tableBody.innerHTML = '';
  
  movies.forEach(movie => {
      const row = document.createElement('tr');
      row.innerHTML = `
          <td>${movie.movie}</td>
          <td>${movie.mpaa_rating}</td>
          <td>${movie.genre}</td>
          <td>${movie.year}</td>
          <td>$${formatMoney(movie.budget)}</td>
          <td>$${formatMoney(movie.gross_revenue)}</td>
          <td>$${formatMoney(movie.profit)}</td>
          <td>${movie.rating.toFixed(1)}</td>
      `;
      
      row.addEventListener('click', () => displayMovieDetails(movie));
      
      tableBody.appendChild(row);
  });
}

function formatMoney(value) {
  if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}

/*
search and filter movies according to the search query
*/
// function searchMovies() {
//   const searchInput = document.querySelector('.search-box input');
//   const searchTerm = searchInput.value.toLowerCase().trim();
  
//   if (!data) {
//       console.error("Data not loaded yet.");
//       return;
//   }
  
//   let filteredData;
  
//   if (searchTerm === '') {
//       filteredData = data;
//   } else {
//       filteredData = data.filter(movieInfo => {
//           return (
//               movieInfo.movie.toLowerCase().includes(searchTerm) ||
//               movieInfo.mpaa_rating.toLowerCase().includes(searchTerm) ||
//               movieInfo.genre.toLowerCase().includes(searchTerm) ||
//               movieInfo.year.toString().includes(searchTerm) ||
//               movieInfo.budget.toString().includes(searchTerm) ||
//               movieInfo.gross_revenue.toString().includes(searchTerm) ||
//               movieInfo.profit.toString().includes(searchTerm) ||
//               movieInfo.rating.toString().includes(searchTerm)
//           );
//       });
//   }
  
//   populateTable(filteredData);
// }

/*
display movie details in the movie summary section based on the selected movie
*/
function displayMovieDetails(movie) {
  const movieSummaryTitle = document.querySelector('.movie-summary h2');
  movieSummaryTitle.textContent = movie.movie;
  
  const movieSummaryText = document.querySelector('.movie-summary p');
  movieSummaryText.textContent = movie.summary;
  
  const percentage = Math.round(movie.rating * 10);
  const donutChart = document.querySelector('.donut-chart');
  donutChart.style.background = `conic-gradient(#294a96 ${percentage}%, #f27341 ${percentage}%)`;
  
  const percentageDisplay = document.querySelector('.percentage');
  percentageDisplay.textContent = `${percentage}%`;
  
  // TODO: fix implementation
  const maxValue = Math.max(movie.budget, movie.gross_revenue);
  const budgetHeight = movie.budget > 0 ? (movie.budget / maxValue) * 100 : 5;
  const revenueHeight = movie.gross_revenue > 0 ? (movie.gross_revenue / maxValue) * 100 : 5;
  
  document.querySelector('.bar-budget').style.height = `${budgetHeight}%`;
  document.querySelector('.bar .bar-revenue').style.height = `${revenueHeight}%`;
}

/*
create filter dropdown element and style
*/
function createFilterDropdown() {
  const filterDropdown = document.createElement('div');
  filterDropdown.className = 'filter-dropdown';
  filterDropdown.style.display = 'none';
  
  const style = document.createElement('style');
  style.textContent = `
      .filter-dropdown {
          position: absolute;
          top: 60px;
          left: 0;
          width: 550px;
          background-color: white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          z-index: 10;
          padding: 10px;
          color: #294a96;
          max-height: 395px;
          overflow-y: auto;
      }
      
      .filter-section {
          margin-bottom: 15px;
      }
      
      .filter-section h3 {
          margin-bottom: 8px;
          font-weight: normal;
          color: #294a96;
      }
      
      .filter-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
      }
      
      .filter-option {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background-color 0.2s;
      }
      
      .filter-option.active {
          background-color: #f27341;
          color: white;
          border-color: #f27341;
      }
      
      .filter-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
      }
      
      .apply-filter, .clear-filter {
          padding: 8px 15px;
          border: none;
          cursor: pointer;
      }
      
      .apply-filter {
          background-color: #294a96;
          color: white;
      }
      
      .clear-filter {
          background-color: #f5f5f5;
          color: #294a96;
          border: 1px solid #ddd;
      }
      
      .range-filter {
          display: flex;
          gap: 10px;
          align-items: center;
      }
      
      .range-filter input {
          width: 100px;
          padding: 5px;
          border: 1px solid #ddd;
      }
  `;
  document.head.appendChild(style);
  
  const searchContainer = document.querySelector('.search-container');
  searchContainer.style.position = 'relative';
  searchContainer.appendChild(filterDropdown);
}

/*
display filter dropdown when the filter button is clicked
*/
function displayFilterDropdown() {
  const filterDropdown = document.querySelector('.filter-dropdown');
  
  if (filterDropdownVisible) {
      filterDropdown.style.display = 'none';
      filterDropdownVisible = false;
  } else {
      updateFilterDropdownContent();
      filterDropdown.style.display = 'block';
      filterDropdownVisible = true;
  }
}

/*
update filter dropdown content with filter options
*/
function updateFilterDropdownContent() {
  if (!data) return;
  
  const filterDropdown = document.querySelector('.filter-dropdown');
  filterDropdown.innerHTML = '';
  
  const genres = [...new Set(data.map(movie => movie.genre))].sort();
  const years = [...new Set(data.map(movie => movie.year))].sort((a, b) => b - a);
  const mpaaRatings = [...new Set(data.map(movie => movie.mpaa_rating))].sort();
  
  filterDropdown.appendChild(createFilterSection('Genre', 'genre', genres));
  filterDropdown.appendChild(createFilterSection('Year', 'year', years));
  filterDropdown.appendChild(createFilterSection('MPAA Rating', 'mpaa_rating', mpaaRatings));
  filterDropdown.appendChild(createRatingFilterSection());
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'filter-buttons';
  
  const applyButton = document.createElement('button');
  applyButton.className = 'apply-filter';
  applyButton.textContent = 'Apply Filters';
  applyButton.addEventListener('click', applyFilters);
  
  const clearButton = document.createElement('button');
  clearButton.className = 'clear-filter';
  clearButton.textContent = 'Clear All';
  clearButton.addEventListener('click', clearFilters);
  
  buttonContainer.appendChild(clearButton);
  buttonContainer.appendChild(applyButton);
  filterDropdown.appendChild(buttonContainer);
}

/*
create filter section
*/
function createFilterSection(title, filterType, options) {
  const section = document.createElement('div');
  section.className = 'filter-section';
  
  const heading = document.createElement('h3');
  heading.textContent = title;
  section.appendChild(heading);
  
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'filter-options';
  
  options.forEach(option => {
      if (!option) return;
      
      const optionElement = document.createElement('div');
      optionElement.className = 'filter-option';
      optionElement.textContent = option;
      
      if (activeFilters[filterType].includes(option)) {
          optionElement.classList.add('active');
      }
      
      optionElement.addEventListener('click', () => {
          optionElement.classList.toggle('active');
      });
      
      optionsContainer.appendChild(optionElement);
  });
  
  section.appendChild(optionsContainer);
  return section;
}

/*
filter based on rating range
*/
function createRatingFilterSection() {
  const section = document.createElement('div');
  section.className = 'filter-section';
  
  const heading = document.createElement('h3');
  heading.textContent = 'Rating';
  section.appendChild(heading);
  
  const rangeContainer = document.createElement('div');
  rangeContainer.className = 'range-filter';
  
  const minInput = document.createElement('input');
  minInput.type = 'number';
  minInput.min = '0';
  minInput.max = '10';
  minInput.step = '0.1';
  minInput.placeholder = 'Min (0-10)';
  minInput.value = activeFilters.rating[0] || '';
  
  const toText = document.createElement('span');
  toText.textContent = 'to';
  
  const maxInput = document.createElement('input');
  maxInput.type = 'number';
  maxInput.min = '0';
  maxInput.max = '10';
  maxInput.step = '0.1';
  maxInput.placeholder = 'Max (0-10)';
  maxInput.value = activeFilters.rating[1] || '';
  
  rangeContainer.appendChild(minInput);
  rangeContainer.appendChild(toText);
  rangeContainer.appendChild(maxInput);
  
  section.appendChild(rangeContainer);
  return section;
}

/*
apply filters and update the table
*/
function applyFilters() {
  collectActiveFilters();
  filterAndDisplayMovies();
  displayFilterDropdown();
}

/*
collect active filters from the filter dropdown
*/
function collectActiveFilters() {
  activeFilters = {
      genre: [],
      year: [],
      mpaa_rating: [],
      rating: []
  };
  
  const genreSection = document.querySelector('.filter-section:nth-child(1)');
  const activeGenres = genreSection.querySelectorAll('.filter-option.active');
  activeFilters.genre = Array.from(activeGenres).map(element => element.textContent);
  
  const yearSection = document.querySelector('.filter-section:nth-child(2)');
  const activeYears = yearSection.querySelectorAll('.filter-option.active');
  activeFilters.year = Array.from(activeYears).map(element => parseInt(element.textContent));
  
  const mpaaSection = document.querySelector('.filter-section:nth-child(3)');
  const activeMpaaRatings = mpaaSection.querySelectorAll('.filter-option.active');
  activeFilters.mpaa_rating = Array.from(activeMpaaRatings).map(element => element.textContent);
  
  const ratingSection = document.querySelector('.filter-section:nth-child(4)');
  const minRating = ratingSection.querySelector('input:first-child').value;
  const maxRating = ratingSection.querySelector('input:last-child').value;
  
  if (minRating !== '' || maxRating !== '') {
      activeFilters.rating = [
          minRating !== '' ? parseFloat(minRating) : 0,
          maxRating !== '' ? parseFloat(maxRating) : 10
      ];
  }
}

/*
clear all filters and reset the table
*/
function clearFilters() {
  activeFilters = {
      genre: [],
      year: [],
      mpaa_rating: [],
      rating: []
  };
  
  const searchInput = document.querySelector('.search-box input');
  searchInput.value = '';
  
  populateTable(data);
  
  if (filterDropdownVisible) {
      displayFilterDropdown();
  }
}

/*
filter and display movies based on active filters
*/
function filterAndDisplayMovies() {
  if (!data) return;
  
  const searchInput = document.querySelector('.search-box input');
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  let filteredData = searchTerm === '' ? [...data] : data.filter(movie => {
      return (
          movie.movie.toLowerCase().includes(searchTerm) ||
          movie.mpaa_rating.toLowerCase().includes(searchTerm) ||
          movie.genre.toLowerCase().includes(searchTerm) ||
          movie.year.toString().includes(searchTerm) ||
          movie.budget.toString().includes(searchTerm) ||
          movie.gross_revenue.toString().includes(searchTerm) ||
          movie.profit.toString().includes(searchTerm) ||
          movie.rating.toString().includes(searchTerm)
      );
  });
  
  filteredData = filteredData.filter(movie => {
      if (activeFilters.genre.length > 0 && !activeFilters.genre.includes(movie.genre)) {
          return false;
      }
      
      if (activeFilters.year.length > 0 && !activeFilters.year.includes(movie.year)) {
          return false;
      }
      
      if (activeFilters.mpaa_rating.length > 0 && !activeFilters.mpaa_rating.includes(movie.mpaa_rating)) {
          return false;
      }
      
      if (activeFilters.rating.length > 0) {
          const [minRating, maxRating] = activeFilters.rating;
          if (movie.rating < minRating || movie.rating > maxRating) {
              return false;
          }
      }
      
      return true;
  });
  
  populateTable(filteredData);
}

/*
search and filter movies according to the search query
*/
function searchMovies() {
  if (hasActiveFilters()) {
      filterAndDisplayMovies();
  } else {
      const searchInput = document.querySelector('.search-box input');
      const searchTerm = searchInput.value.toLowerCase().trim();
      
      if (!data) {
          console.error("Data not loaded yet.");
          return;
      }
      
      let filteredData;
      
      if (searchTerm === '') {
          filteredData = data;
      } else {
          filteredData = data.filter(movieInfo => {
              return (
                  movieInfo.movie.toLowerCase().includes(searchTerm) ||
                  movieInfo.mpaa_rating.toLowerCase().includes(searchTerm) ||
                  movieInfo.genre.toLowerCase().includes(searchTerm) ||
                  movieInfo.year.toString().includes(searchTerm) ||
                  // movieInfo.budget.toString().includes(searchTerm) ||
                  // movieInfo.gross_revenue.toString().includes(searchTerm) ||
                  // movieInfo.profit.toString().includes(searchTerm) ||
                  movieInfo.rating.toString().includes(searchTerm)
              );
          });
      }
      
      populateTable(filteredData);
  }
}

/*
check if there are any active filters
*/
function hasActiveFilters() {
  return (
      activeFilters.genre.length > 0 ||
      activeFilters.year.length > 0 ||
      activeFilters.mpaa_rating.length > 0 ||
      activeFilters.rating.length > 0
  );
}

/*
  this will return a map, in which key is mpaa rating, and value is a set of gross_revenues in sorted order,
  this will be helpful to create boxplots
*/
function groupGrossByRating() {
    let grouped = {};
    df = data;

    if (!data) {
      console.error("Data not loaded yet.");
      return [];
    }

    // Iterate over unique MPAA ratings
    const uniqueRatings = [...new Set(df.map(row => row.mpaa_rating))];
    
    uniqueRatings.forEach(rating => {
        // Filter gross values for the current rating
        const grossValues = df.filter(row => row.mpaa_rating === rating).map(row => row.gross_revenue);
        
        // Convert to a sorted set of integers
        const sortedGrossSet = [...new Set(grossValues.map(value => parseInt(value)))].sort((a, b) => a - b);
        
        // Add to the dictionary with lowercase rating
        grouped[rating.toLowerCase()] = new Set(sortedGrossSet);
    });
    // console.log(grouped);
    return grouped;
}

/*
  This function filters movies by MPAA rating and release year,
  and returns a list of objects with movie title and gross revenue.
*/
function getMoviesByRatingAndYear(rating, year) {
  if (!data) {
      console.error("Data not loaded yet.");
      return [];
  }
  movies = data
  .filter(d =>
      d.mpaa_rating?.toLowerCase() === rating.toLowerCase() &&
      d.year === year
  )
  .map(d => ({
      movie: d.movie,
      gross_revenue: d.gross_revenue
  }));

  // check console to see if the movies are filtered correctly, if you're playing around
  console.log(movies);

  return movies;
}

