const Listing = require("../models/listing.model.js");
const {uploadOnCloudinary,deleteFromCloudinary} = require("../utils/cloudinary.js");
module.exports.index = async (req, res, next) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res, next) => {
  console.log(req.body.listing);
  const image = await uploadOnCloudinary(req.file.path);
  let newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image.url = image.url;
  newListing.image.public_id = image.id;
  await newListing.save();
  req.flash("success", "Listing created successfully!");
  res.redirect("/listings");
};
module.exports.showListing = async (req, res, next) => {
  let id = req.params.id;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner"); //inside reviews we populate auther
  if (!listing) {
    req.flash("error", "Listing not exist");
    res.redirect("/listings");
    return;
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.renderEditForm = async (req, res) => {
  let id = req.params.id;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested does not exist");
    res.redirect("/listings");
    return;
  }
  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res, next) => {
  let { id } = req.params;
  // Get updated fields from the form
  const updatedData = req.body.listing;

  // Find the listing
  const listing = await Listing.findById(id);

  // Update all fields except image
  listing.title = updatedData.title;
  listing.description = updatedData.description;
  listing.location = updatedData.location;
  listing.price = updatedData.price;
  listing.country = updatedData.country;

  // If a new image is uploaded, update it on Cloudinary and set new URL/public_id
  if (req.file) {
    const image = await uploadOnCloudinary(
      req.file.path,
      listing.image.public_id
    );
    listing.image.url = image.url;
    listing.image.public_id = image.id;
  }

  await listing.save();
  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${id}`);
};

module.exports.distroyListing = async (req, res, next) => {
  let { id } = req.params;

  let deletingdata = await Listing.findByIdAndDelete(id); //also delete relate reviews in modelSchema
  await deleteFromCloudinary(deletingdata.image.public_id);
  req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
};
