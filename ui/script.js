let data;
setUp();

/*
  data cleaning and making a generic data structure that can be used to render any graph.
*/
function setUp() {
    d3.csv('../data/movies.csv')
    .then(dataOutput => {
      dataOutput = dataOutput.slice(0, 509); 
    data = dataOutput.map((d) => ({
        movie: d.Title,
        mpaa_rating: d['MPAA Rating'],
        budget: parseInt(d.Budget),
        gross_revenue: parseInt(d.Gross),
        genre: d.Genre,
        runtime: parseInt(d.Runtime),
        rating: parseFloat(d.Rating),
        year: parseInt(d3.timeFormat("%Y")(d3.timeParse("%Y-%m-%d")(d['Release Date'])))
      }));
    }).catch(e => {
      console.log(e);
      alert('Error!');
    });
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

  // console.log(movies);

  return movies;
}

