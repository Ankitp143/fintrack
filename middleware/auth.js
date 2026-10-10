module.exports = function (req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect("/login?error=Session+expired+or+unauthorized.+Please+login.");
  }
  next();
};