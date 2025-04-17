let data;

document.addEventListener('DOMContentLoaded', function() {
  setUp();
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

