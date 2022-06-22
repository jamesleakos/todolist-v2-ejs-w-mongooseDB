// packages set up
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

// this is a body parser that allows us to read req.body if we have given the user a form
app.use(express.urlencoded({extended: true}));
// push the folder for css, etc.
app.use(express.static("public"));

// DB set up
// connect to our todolistDB (will create it if it doesn't exist)
// local
// mongoose.connect("mongodb://localhost:27017/todolistDB");
// cloud
mongoose.connect("mongodb+srv://jamesleakos:SophieV8@cluster0.upfvo.mongodb.net/todolistDB");

// connect to or create a new schema
const itemsSchema = new mongoose.Schema ({
  // now we scaffold out how we want new data to be structured
  text: String
});
// model is a wrapper on the schema, allowing use to interact with the data
var Item = mongoose.model('item', itemsSchema);

// a new schema for a variable todolist
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("list", listSchema);

// fold: inserting some items

// const firstItem = new Item({
//   text: "first item"
// });
//
// const secondItem = new Item({
//   text: "second item"
// });
//
// const thirdItem = new Item({
//   text: "third item"
// });
//
// const defaultItems = [firstItem, secondItem, thirdItem]
//
// Item.insertMany(defaultItems, function(err) {
//   if (err) {console.log(err);}
//   else {console.log("Successfully saved the items");}
// });

// end fold

// get and post routes

// this is the root route - it deals with the main list, which we have
app.get("/", function(req, res) {

  // find our items
  Item.find({}, function (err, items) {
    if (err) console.log(err);
    else {
      res.render("list", {listTitle: "Today", newListItems: items});
    }
    // close the database - prevents us from having to disconnect in the terminal with ctrl-c
    //mongoose.connection.close();
  });
});

// this deals with custom lists. There is no reason to have a main list, they could all be custom, but we do
app.get("/:listName", function (req, res) {
  const listName = _.capitalize(req.params.listName);

  List.findOne({name: listName}, function(err, foundList) {
    if (err) console.log(err);
    else {
      if (!foundList) {
        // create a new list
        const list = new List({
          name: listName,
          items: []
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        // show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    };
  });
});

app.post("/", function(req, res){
  const item = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    text: item
  });

  if (listName === "Today") { // this is for the main list
    newItem.save();
    res.redirect("/");
  } else { // these are for custom lists
    List.findOne({name: listName}, function (err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
    });
    res.redirect("/" + listName);
  }
});

app.post("/deleteItem", function (req, res) {
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") { // default list
    Item.deleteOne({_id: checkedId}, function (err) {
      if (err) console.log(err);
      else console.log("Succesfully deleted");
    });
    res.redirect("/");
  } else { // custom list
    List.updateOne({name: listName}, {$pull: {items: {_id: checkedId}}}, function (err, foundList) {
      if (err) console.log(err);
      else {
        res.redirect("/" + listName);
      };
    });
  }
})

app.get("/about", function(req, res){
  res.render("about");
});

// start the app
// make it so that we can both run locally and on Heroku
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started");
});




//
