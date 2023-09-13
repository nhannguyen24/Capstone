let date_ob = new Date();

const notFound = (req, res) => res.status(403).json({ msg: "Route not found!", date: date_ob.toISOString().slice(0,19)});

module.exports = notFound
