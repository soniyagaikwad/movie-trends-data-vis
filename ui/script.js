let data;

let activeFilters = {
    genre: [],
    year: [],
    mpaa_rating: [],
    rating: []
};

let filterDropdownVisible = false;

let xAxisDropdownVisible = false;
let yAxisDropdownVisible = false;

let currentXAxis = 'rating';
let currentYAxis = 'gross_revenue';

let selectedXAxis = currentXAxis;
let selectedYAxis = currentYAxis;

document.addEventListener('DOMContentLoaded', function () {
    setUp();

    const filterButton = document.querySelector('.filter-button');
    const cancelButton = document.querySelector('.cancel-button');

    filterButton.addEventListener('click', displayFilterDropdown);
    cancelButton.addEventListener('click', clearFilters);

    createFilterDropdown();

    const xAxisButton = document.querySelector('.axis-button:nth-child(1)');
    const yAxisButton = document.querySelector('.axis-button:nth-child(2)');

    xAxisButton.addEventListener('click', displayXAxisDropdown);
    yAxisButton.addEventListener('click', displayYAxisDropdown);

    createXAxisDropdown();
    createYAxisDropdown();
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
    createBoxPlot();
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
    if (value >= 1000000000) {
        return (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
}

/*
display movie details in the movie summary section based on the selected movie
*/
function displayMovieDetails(movie) {
    const movieSummaryTitle = document.querySelector('.movie-summary h2');
    movieSummaryTitle.textContent = movie.movie;

    const movieSummaryText = document.querySelector('.movie-summary p');
    movieSummaryText.textContent = movie.summary;

    displayDonutChart(movie);
    displayBarChart(movie);
}

function displayDonutChart(movie) {
    d3.select("#donut-chart svg").remove();

    const width = 150;
    const height = 150;
    const thickness = 20;
    const radius = Math.min(width, height) / 2;

    const percentage = Math.round(movie.rating * 10);

    const svg = d3.select("#donut-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const backgroundArc = d3.arc()
        .innerRadius(radius - thickness)
        .outerRadius(radius)
        .startAngle(0)
        .endAngle(2 * Math.PI);

    svg.append("path")
        .attr("d", backgroundArc())
        .attr("fill", "#f27341");

    const foregroundArc = d3.arc()
        .innerRadius(radius - thickness)
        .outerRadius(radius)
        .startAngle(0)
        .endAngle((percentage / 100) * 2 * Math.PI);

    svg.append("path")
        .attr("d", foregroundArc())
        .attr("fill", "#294a96");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-family", "'Courier Prime', monospace")
        .style("font-size", "18px")
        // .style("font-weight", "bold")
        .style("fill", "#294a96")
        .text(`${percentage}%`);
}

function displayBarChart(movie) {
    d3.select(".bar-chart").select("svg").remove();

    // Set up dimensions
    const margin = {top: 10, right: 10, bottom: 30, left: 50};
    const width = 250 - margin.left - margin.right;
    const height = 150 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(".bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Data
    const barData = [
        { name: "Budget", value: movie.budget / 1_000_000 }, // in millions
        { name: "Revenue", value: movie.gross_revenue / 1_000_000 }
    ];

    // X-axis
    const x = d3.scaleBand()
        .domain(barData.map(d => d.name))
        .range([0, width])
        .padding(0.4);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "10px")
        .style("fill", "#294a96");

    // Y-axis
    const y = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.value) * 1.1])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .selectAll("text")
        .style("font-size", "10px")
        .style("fill", "#294a96");

    // Bars
    svg.selectAll("rect")
        .data(barData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.name))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value))
        .attr("fill", d => d.name === "Budget" ? "#f27341" : "#294a96");

}

/*
create filter dropdown element and style
*/
function createFilterDropdown() {
    const filterDropdown = document.createElement('div');
    filterDropdown.className = 'filter-dropdown';

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
create x-axis dropdown element and style
*/
function createXAxisDropdown() {
    const xAxisDropdown = document.createElement('div');
    xAxisDropdown.className = 'filter-dropdown';
    xAxisDropdown.id = 'x-axis-dropdown';

    const xAxisSelector = document.querySelector('.axis-selector');
    xAxisSelector.style.position = 'relative';
    xAxisSelector.appendChild(xAxisDropdown);
}

/*
create y-axis dropdown element and style
*/
function createYAxisDropdown() {
    const yAxisDropdown = document.createElement('div');
    yAxisDropdown.className = 'filter-dropdown';
    yAxisDropdown.id = 'y-axis-dropdown';

    const yAxisSelector = document.querySelector('.axis-selector');
    yAxisSelector.style.position = 'relative';
    yAxisSelector.appendChild(yAxisDropdown);
}

/*
display x-axis dropdown when the x-axis button is clicked
*/
function displayXAxisDropdown() {
    const xAxisDropdown = document.getElementById('x-axis-dropdown');

    if (xAxisDropdownVisible) {
        xAxisDropdown.style.display = 'none';
        xAxisDropdownVisible = false;
    } else {
        updateXAxisDropdownContent();
        xAxisDropdown.style.display = 'block';
        xAxisDropdownVisible = true;

        if (yAxisDropdownVisible) {
            document.getElementById('y-axis-dropdown').style.display = 'none';
            yAxisDropdownVisible = false;
        }
        if (filterDropdownVisible) {
            document.querySelector('.filter-dropdown').style.display = 'none';
            filterDropdownVisible = false;
        }
    }
}

/*
display y-axis dropdown when the y-axis button is clicked
*/
function displayYAxisDropdown() {
    const yAxisDropdown = document.getElementById('y-axis-dropdown');

    if (yAxisDropdownVisible) {
        yAxisDropdown.style.display = 'none';
        yAxisDropdownVisible = false;
    } else {
        updateYAxisDropdownContent();
        yAxisDropdown.style.display = 'block';
        yAxisDropdownVisible = true;

        if (xAxisDropdownVisible) {
            document.getElementById('x-axis-dropdown').style.display = 'none';
            xAxisDropdownVisible = false;
        }
        if (filterDropdownVisible) {
            document.querySelector('.filter-dropdown').style.display = 'none';
            filterDropdownVisible = false;
        }
    }
}

/*
update x-axis dropdown content with options
*/
function updateXAxisDropdownContent() {
    const xAxisDropdown = document.getElementById('x-axis-dropdown');
    xAxisDropdown.innerHTML = '';

    const heading = document.createElement('h3');
    heading.textContent = 'Select X-Axis Variable';
    heading.style.fontWeight = 'normal';
    heading.style.fontSize = '16px';
    heading.style.color = '#294a96';
    heading.style.marginBottom = '10px';
    xAxisDropdown.appendChild(heading);

    const axisOptions = [
        // { value: 'mpaa_rating', label: 'MPAA Rating' },
        { value: 'rating', label: 'Rating' },
        { value: 'year', label: 'Release Year' },
        { value: 'budget', label: 'Budget' },
        { value: 'gross_revenue', label: 'Gross Revenue' },
        { value: 'profit', label: 'Profit' },
    ];

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'filter-options';

    axisOptions.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'filter-option';
        if (option.value === selectedXAxis) {
            optionElement.classList.add('active');
        }
        optionElement.textContent = option.label;

        optionElement.addEventListener('click', () => {
            selectedXAxis = option.value;
            optionsContainer.querySelectorAll('.filter-option').forEach(el => {
                el.classList.remove('active');
            });
            optionElement.classList.add('active');
        });

        optionsContainer.appendChild(optionElement);
    });

    xAxisDropdown.appendChild(optionsContainer);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'filter-buttons';

    const applyButton = document.createElement('button');
    applyButton.className = 'apply-filter';
    applyButton.textContent = 'Apply';
    applyButton.addEventListener('click', () => {
        applyAxisChanges('x');
    });

    const clearButton = document.createElement('button');
    clearButton.className = 'clear-filter';
    clearButton.textContent = 'Cancel';
    clearButton.addEventListener('click', () => {
        selectedXAxis = currentXAxis;
        displayXAxisDropdown();
    });

    buttonContainer.appendChild(clearButton);
    buttonContainer.appendChild(applyButton);
    xAxisDropdown.appendChild(buttonContainer);
}

/*
update y-axis dropdown content with options
*/
function updateYAxisDropdownContent() {
    const yAxisDropdown = document.getElementById('y-axis-dropdown');
    yAxisDropdown.innerHTML = '';

    const heading = document.createElement('h3');
    heading.textContent = 'Select Y-Axis Variable';
    heading.style.fontWeight = 'normal';
    heading.style.fontSize = '16px';
    heading.style.color = '#294a96';
    heading.style.marginBottom = '10px';
    yAxisDropdown.appendChild(heading);

    const axisOptions = [
        // { value: 'mpaa_rating', label: 'MPAA Rating' },
        { value: 'rating', label: 'Rating' },
        { value: 'year', label: 'Release Year' },
        { value: 'budget', label: 'Budget' },
        { value: 'gross_revenue', label: 'Gross Revenue' },
        { value: 'profit', label: 'Profit' },
    ];

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'filter-options';

    axisOptions.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'filter-option';
        if (option.value === selectedYAxis) {
            optionElement.classList.add('active');
        }
        optionElement.textContent = option.label;

        optionElement.addEventListener('click', () => {
            selectedYAxis = option.value;
            optionsContainer.querySelectorAll('.filter-option').forEach(el => {
                el.classList.remove('active');
            });
            optionElement.classList.add('active');
        });

        optionsContainer.appendChild(optionElement);
    });

    yAxisDropdown.appendChild(optionsContainer);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'filter-buttons';

    const applyButton = document.createElement('button');
    applyButton.className = 'apply-filter';
    applyButton.textContent = 'Apply';
    applyButton.addEventListener('click', () => {
        applyAxisChanges('y');
    });

    const clearButton = document.createElement('button');
    clearButton.className = 'clear-filter';
    clearButton.textContent = 'Cancel';
    clearButton.addEventListener('click', () => {
        selectedYAxis = currentYAxis;
        displayYAxisDropdown();
    });

    buttonContainer.appendChild(clearButton);
    buttonContainer.appendChild(applyButton);
    yAxisDropdown.appendChild(buttonContainer);
}

function applyAxisChanges(axisType) {
    if (axisType === 'x') {
        currentXAxis = selectedXAxis;
        const axisOptions = [
            // { value: 'mpaa_rating', label: 'MPAA Rating' },
            { value: 'rating', label: 'Rating' },
            { value: 'year', label: 'Release Year' },
            { value: 'budget', label: 'Budget' },
            { value: 'gross_revenue', label: 'Gross Revenue' },
            { value: 'profit', label: 'Profit' },
        ];
        const selectedOption = axisOptions.find(option => option.value === currentXAxis);
        document.querySelector('.axis-button:nth-child(1)').innerHTML = `<span class="triangle">▼</span> ${selectedOption.label}`;
        displayXAxisDropdown();
    } else if (axisType === 'y') {
        currentYAxis = selectedYAxis;
        const axisOptions = [
            // { value: 'mpaa_rating', label: 'MPAA Rating' },
            { value: 'rating', label: 'Rating' },
            { value: 'year', label: 'Release Year' },
            { value: 'budget', label: 'Budget' },
            { value: 'gross_revenue', label: 'Gross Revenue' },
            { value: 'profit', label: 'Profit' },
        ];
        const selectedOption = axisOptions.find(option => option.value === currentYAxis);
        document.querySelector('.axis-button:nth-child(2)').innerHTML = `<span class="triangle">▼</span> ${selectedOption.label}`;
        displayYAxisDropdown();
    }

    updateScatterPlot();
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

/*
creates boxplot for all the movie data
*/
function createBoxPlot() {
    if (!data) {
        console.error("Data not loaded yet.");
        return;
    }

    d3.select("#boxplot-container svg").remove();

    const groupedData = groupGrossByRating();

    const summary = Object.keys(groupedData).map(rating => {
        const values = Array.from(groupedData[rating]);
        values.sort(d3.ascending);

        return {
            rating,
            q1: d3.quantile(values, 0.25),
            median: d3.quantile(values, 0.5),
            q3: d3.quantile(values, 0.75),
            min: d3.min(values),
            max: d3.max(values)
        };
    });

    const ratingOrder = ["g", "pg", "pg-13", "r"];
    summary.sort((a, b) => ratingOrder.indexOf(a.rating.toLowerCase()) - ratingOrder.indexOf(b.rating.toLowerCase()));

    const margin = { top: 40, right: 30, bottom: 60, left: 120 },
        width = 1100 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    if (!document.getElementById("boxplot-container")) {
        const boxplotContainer = document.createElement("div");
        boxplotContainer.id = "boxplot-container";
        boxplotContainer.style.gridColumn = "span 2";
        boxplotContainer.style.backgroundColor = "#f9f3f0";
        boxplotContainer.style.padding = "20px";
        boxplotContainer.style.marginTop = "20px";
        boxplotContainer.style.width = "100%";

        const title = document.createElement("h2");
        title.textContent = "Movie Revenue Distribution by MPAA Rating For All Movies";
        title.style.color = "#294a96";
        title.style.marginBottom = "15px";
        title.style.fontWeight = "normal";
        boxplotContainer.appendChild(title);

        document.querySelector('.container').appendChild(boxplotContainer);
    }

    const svg = d3.select("#boxplot-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top - 10})`);

    const x = d3.scaleBand()
        .range([0, width])
        .domain(summary.map(d => d.rating))
        .paddingInner(1)
        .paddingOuter(0.5);

    const y = d3.scaleLinear()
        .domain([0, d3.max(summary, d => d.max)])
        .range([height, 0]);

    function styleAxis(axisGroup) {
        axisGroup.selectAll("text")
            .style("font-family", "'Courier Prime', monospace")
            .style("font-size", "12px")
            .style("fill", "#294a96");

        axisGroup.selectAll("line")
            .style("stroke", "#294a96");

        axisGroup.selectAll("path")
            .style("stroke", "#294a96");
    }

    styleAxis(svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x)));

    styleAxis(svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => {
            if (d >= 1000000000) return (d / 1000000000) + "B";
            if (d >= 1000000) return (d / 1000000) + "M";
            if (d >= 1000) return (d / 1000) + "K";
            return d;
        })));

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("MPAA Rating")
        .style("font-family", "'Courier Prime', monospace")
        .style("font-size", "14px")
        .style("fill", "#294a96");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .text("Gross Revenue ($)")
        .style("font-family", "'Courier Prime', monospace")
        .style("font-size", "14px")
        .style("fill", "#294a96");

    const tooltip = d3.select("#tooltip");

    svg.selectAll("vertLines")
        .data(summary)
        .enter()
        .append("line")
        .attr("x1", d => x(d.rating))
        .attr("x2", d => x(d.rating))
        .attr("y1", d => y(d.min))
        .attr("y2", d => y(d.max))
        .attr("stroke", "#294a96")
        .style("width", 40)
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1)
                .html(`<b>Min:</b> $${formatMoney(d.min)}<br><b>Q1:</b> $${formatMoney(d.q1)}<br><b>Median:</b> $${formatMoney(d.median)}<br><b>Q3:</b> $${formatMoney(d.q3)}<br><b>Max:</b> $${formatMoney(d.max)}`)
                .style("background-color", "white")
                .style("border", "1px solid #f27341")
                .style("padding", "10px")
                .style("font-family", "'Courier Prime', monospace")
                .style("color", "#294a96");
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseleave", () => {
            tooltip.style("opacity", 0);
        });

    svg.selectAll("boxes")
        .data(summary)
        .enter()
        .append("rect")
        .attr("x", d => x(d.rating) - 20)
        .attr("y", d => y(d.q3))
        .attr("height", d => y(d.q1) - y(d.q3))
        .attr("width", 40)
        .attr("stroke", "#294a96")
        .style("fill", "#f27341")
        .on("mouseover", function (event, d) {
            d3.select(this).transition().duration(200).style("opacity", 0.75);
            tooltip.style("opacity", 1)
                .html(`<b>Min:</b> $${formatMoney(d.min)}<br><b>Q1:</b> $${formatMoney(d.q1)}<br><b>Median:</b> $${formatMoney(d.median)}<br><b>Q3:</b> $${formatMoney(d.q3)}<br><b>Max:</b> $${formatMoney(d.max)}`)
                .style("background-color", "white")
                .style("border", "1px solid #f27341")
                .style("padding", "10px")
                .style("font-family", "'Courier Prime', monospace")
                .style("color", "#294a96");
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseleave", function () {
            d3.select(this).transition().duration(200).style("opacity", 1);
            tooltip.style("opacity", 0);
        });

    svg.selectAll("medianLines")
        .data(summary)
        .enter()
        .append("line")
        .attr("x1", d => x(d.rating) - 20)
        .attr("x2", d => x(d.rating) + 20)
        .attr("y1", d => y(d.median))
        .attr("y2", d => y(d.median))
        .attr("stroke", "#294a96")
        .style("stroke-width", "2px");
}