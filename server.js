var express = require("express");
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
});

app.get("/", function (req, res) {
    res.send("hello")
});

app.get("/articles", function (req, res) {
    db.articles.find({}, function (error, articles) {
        if (error) {
            console.log(error)
        } else {
            res.json(articles)
        }
    })
});

app.get("/articles/:id", function (req, res) {
    db.articles.find({
            _id: req.params.id
        })
        .then(function (articles) {
            res.json(articles)
        })
        .catch(function (err) {
            res.json(err)
        })
});

app.listen(3000, function () {
    console.log("App running on port 3000!");
});