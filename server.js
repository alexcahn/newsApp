var express = require("express");
var exphbs = require("express-handlebars");
var logger = require("morgan")
var mongoose = require("mongoose");
var mongojs = require("mongojs");

var cheerio = require("cheerio");
var axios = require("axios");

var app = express();

app.use(logger("dev"));

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

app.use(express.static("public"));
app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

mongoose.connect("mongodb://localhost/newyorktimes", {
    useNewUrlParser: true
});

var databaseUrl = "newyorktimes";
var collections = ["articles"];

var db = mongojs(databaseUrl, collections);
db.on("error", function (error) {
    console.log("Database Error:", error);
});

axios.get("https://www.nytimes.com").then(function (response) {

    var $ = cheerio.load(response.data);

    var results = [];

    $("article").each(function (i, element) {

        var title = $(element).children().text();
        var link = $(element).find("a").attr("href");
        var summary = $(element).find("p").text()

        results.push({
            title: title,
            link: link,
            summary: summary
        });
    });
    db.articles.insert(results)
    console.log(results)
});

app.get("/", function (req, res) {
    db.articles.find({}, null, {
        sort: {
            created: -1
        }
    }, function (err, data) {
        if (data.length === 0) {
            res.render("placeholder", {
                message: "There's nothing scraped yet. Please click \"Scrape For Newest Articles\" for fresh and delicious news."
            });
        } else {
            res.render("index", {
                articles: data
            });
        }
    });
});

app.get("/scrape", function (req, res) {
    db.articles.find({}, function (error, articles) {
        if (error) {
            console.log(error)
        } else {
            res.json(articles)
        }
    })
});

// app.get("/:id", function (req, res) {
//     db.articles.find({
//             _id: req.params.id
//         })
//         .then(function (articles) {
//             res.json(articles)
//         })
//         .catch(function (err) {
//             res.json(err)
//         })
// });

app.listen(3000, function () {
    console.log("App running on port 3000!");
});