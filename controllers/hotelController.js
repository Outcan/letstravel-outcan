const Hotel = require("../models/Hotel");
const cloudinary = require("cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.diskStorage({});

const upload = multer({ storage });

exports.upload = upload.single("image");

exports.pushToCloudinary = (req, res, next) => {
  if (req.file) {
    cloudinary.uploader
      .upload(req.file.path)
      .then(result => {
        req.body.image = result.public_id;
        next();
      })
      .catch(() => {
        req.flash(
          "error",
          "Sorry, there was a problem uploading your image. Please try again."
        );
        res.redirect("/admin/add");
      });
  } else {
    next();
  }
};

// exports.homePage = (req, res) => {
//   res.render("index", { title: "Let’s Travel" });
// };

exports.listAllHotels = async (req, res, next) => {
  try {
    const allHotels = await Hotel.find({ available: { $eq: true } });
    res.render("all_hotels", {
      title: "All Hotels",
      allHotels
    });
    //res.json(allHotels);
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

exports.listAllCountries = async (req, res, next) => {
  try {
    const allCountries = await Hotel.distinct("country");
    res.render("all_countries", {
      title: "Browse by country",
      allCountries
    });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

exports.homePageFilters = async (req, res, next) => {
  try {
    const hotels = Hotel.aggregate([
      { $match: { available: true } },
      { $sample: { size: 9 } }
    ]);
    const countries = Hotel.aggregate([
      { $group: { _id: "$country" } },
      { $sample: { size: 9 } }
    ]);

    const [filteredCountries, filteredHotels] = await Promise.all([
      countries,
      hotels
    ]);

    res.render("index", {
      title: "Let’s Travel",
      filteredHotels,
      filteredCountries
    });
    //res.json(countries);
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

exports.adminPage = (req, res) => {
  res.render("admin", {
    title: "Admin"
  });
};

exports.createHotelGet = (req, res) => {
  res.render("add_hotel", {
    title: "Add New Hotel"
  });
};

exports.createHotelPost = async (req, res, next) => {
  try {
    const hotel = new Hotel(req.body);
    await hotel.save();
    req.flash("success", `${hotel.hotel_name} created successfully.`);
    res.redirect(`/all/${hotel._id}`);
  } catch (error) {
    next(error);
  }
};

exports.editRemoveGet = (req, res) => {
  res.render("edit_remove", {
    title: "Search for Hotel to edit or remove"
  });
};

exports.editRemovePost = async (req, res, next) => {
  try {
    const hotelId = req.body.hotel_id || null;
    const hotelName = req.body.hotel_name || null;

    const hotelData = await Hotel.find({
      $or: [{ _id: hotelId }, { hotel_name: hotelName }]
    }).collation({
      locale: "en",
      strength: 2
    });
    if (hotelData.length > 0) {
      res.render("hotel_detail", {
        title: `Let's Travel - Edit / Remove ${hotelData.hotel_name}`,
        hotelData
      });
      return;
    } else {
      req.flash("info", "No matches were found...");
      res.redirect("/admin/edit-remove");
    }
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

exports.updateHotelGet = async (req, res, next) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.hotelId });
    res.render("add_hotel", {
      title: `Let's Travel - Update ${hotel.hotel_name}`,
      hotel
    });
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

exports.updateHotelPost = async (req, res, next) => {
  try {
    const hotelId = req.params.hotelId;
    const hotel = await Hotel.findByIdAndUpdate(hotelId, req.body, {
      new: true
    });
    req.flash("success", `${hotel.hotel_name} updated successfully.`);
    res.redirect(`/all/${hotelId}`);
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

exports.deleteHotelGet = async (req, res, next) => {
  try {
    const hotelId = req.params.hotelId;
    const hotel = await Hotel.findOne({ _id: hotelId });
    res.render("add_hotel", { title: `Delete ${hotel.hotel_name}`, hotel });
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

exports.deleteHotelPost = async (req, res, next) => {
  try {
    const hotelId = req.params.hotelId;
    const hotel = await Hotel.findByIdAndRemove({ _id: hotelId });
    req.flash("info", `${hotelId} has been deleted.`);
    res.redirect("/");
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

exports.hotelDetail = async (req, res, next) => {
  try {
    const hotelId = req.params.hotel;
    const hotelData = await Hotel.find({ _id: hotelId });
    res.render("hotel_detail", {
      title: `Let's Travel - ${hotelData.hotel_name}`,
      hotelData
    });
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

exports.hotelsByCountry = async (req, res, next) => {
  try {
    const countryName = req.params.country;
    const countryHotels = await Hotel.find({ country: countryName });
    res.render("hotels_by_country", {
      title: `Browse hotels by country: ${countryName}`,
      countryHotels
    });
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

exports.searchResults = async (req, res, next) => {
  try {
    const searchQuery = req.body;
    const searchData = await Hotel.aggregate([
      { $match: { $text: { $search: `\"${searchQuery.destination}\"` } } },
      {
        $match: {
          available: true,
          star_rating: { $gte: +searchQuery.stars || 1 }
        }
      },
      { $sort: { cost_per_night: +searchQuery.sort || 1 } }
    ]);
    res.render("search_results", {
      title: "Let's Travel - Search Results",
      searchQuery,
      searchData
    });
    // res.json(searchQuery);
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

exports.signUp = (req, res, next) => {
  console.log("sign-up middleware");
  next();
};

exports.logIn = (req, res) => {
  console.log("login middleware");
};
