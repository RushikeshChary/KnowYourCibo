const express = require("express");
const mongoose = require("mongoose");
const Item = require('./models/item')
const path = require('path');

const Port = 3000;

const app = express();

// connect to mongodb & listen for requests
const dbURI = "mongodb+srv://rushi:rushi@cluster.8ailuyg.mongodb.net/Food-items?retryWrites=true&w=majority&appName=Cluster";

mongoose.connect(dbURI)
  .then(result => app.listen(Port, () => {
    console.log('Database connection established');
    console.log(`Server is running at http://localhost:${Port}`);
  }))
  .catch(err => console.log(err));


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname,"public")));

// register view engine
app.set('view engine', 'ejs');

// middleware & static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// this middleware function sets a local variable (path) on the response object, making it available to views. This variable contains the path of the current request, and it can be utilized in templates or views when rendering HTML pages.
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

app.use(express.json());

// Search route
// app.get('/search', (req, res) => {
//   const query = req.query.q.toLowerCase();

//   // Filter recipes based on query
//   const filteredRecipes = recipes.filter(recipe => recipe.name.toLowerCase().includes(query));

//   if (filteredRecipes.length) {
//     res.json(filteredRecipes);
//   } else {
//     res.status(404).send('No matching recipes found.');
//   }
// });

// Homepage route
app.get("/", (req, res) => {
    res.redirect('home');
});
app.get('/home', (req, res) => {
    res.render('home');
})

//Database check
app.post('/check', (req, res) => {
  const item = new Item({
    name: 'Paneer kabab',
    hall: 'Hall-2',
    category: 'veg',
    rating: 4,
    price: 65
  })
  item.save()
    .then((result) =>{
      res.send(result);
    })
    .catch((err) =>console.error(err));

})

app.get('/find', (req, res) => {
  Item.find({category: 'veg'})
    .then((result) =>{
      res.send(result);
    })
    .catch((err) =>console.error(err));
})

app.post('/search', (req, res) => {
  const search = req.body.search;
  // console.log(req.query.q.toLowerCase());
  Item.find({$or: [ { name: search }, { hall : search }, {category : search} ] } )
    .then((result) =>{
      res.render('search', {items: result});
    })
    .catch((err) =>console.error(err));
  console.log(req.body);
})

// Hall page route
app.get("/hall", (req, res) => {
    res.render('hall');
});

// Profile page route
app.get("/profile", (req, res) => {
  res.render('profile');
});

//edit profile page route
app.get("/editProfile", (req, res) => {
  res.render('editProfile');
})