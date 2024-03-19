//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); // 1.
const _ = require("lodash"); // 10

mongoose.set("strictQuery", false); // 2.

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB"); // 2.1

// 3.
const itemsSchema = new mongoose.Schema({
  name: String,
});

// 3.1
const Item = mongoose.model("Item", itemsSchema);

// 3.2
const item1 = new Item({
  name: "Homework",
});
const item2 = new Item({
  name: "Working out",
});
const item3 = new Item({
  name: "Sleeping",
});

const defaultItems = [item1, item2, item3];

// 8.1
const listSchema = {
  name: String,
  items: [itemsSchema],
};
//8.1.1
const List = mongoose.model("List", listSchema);

// 4. But this adds the same three items to the list each time you restart. Solution to this problem is 5.2
// Item.insertMany(defaultItems, function(err) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log("Succesfully Inserted")
//   }
// });

// 5.
app.get("/", function (req, res) {
  // 5.1
  Item.find({}, function (err, foundItems) {
    // 5.2
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully Inserted");
        }
      });

      // 5.2.1 To display the items on the homepage
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.post("/", function (req, res) {
  // 6.
  const itemName = req.body.newItem;
  const listName = req.body.list;
  // 6.1
  const item = new Item({
    name: itemName,
  });

  // 8.5
  if (listName === "Today") {
    //6.2
    item.save();
    // 6.3
    res.redirect("/");
    // 8.5.1
  } else {
    // If the list wasn't the default "Today" title list
    List.findOne({ name: listName }, function (err, foundList) {
      // then after pressing the button , find the list ,
      foundList.items.push(item); // push the item into the new list (foundList) ,
      foundList.save(); // save the new item ,
      res.redirect("/" + listName); // redirect to the relevant list
    });
  }
});

// 7.1
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  // 9.2
  const listName = req.body.listName;

  // 9.3
  if (listName === "Today") {
    // 7.3
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Succesfully deleted checked item");
        res.redirect("/");
      }
    });
  } else {
    // 9.3.1
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.pull({_id: checkedItemId});
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// 8.
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  // 8.3
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list
        // 8.2
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show an existing list
        // 8.4
        res.render("list", {
          listTitle: foundList.name, // customListName
          newListItems: foundList.items, // items = array/collection of Item
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
