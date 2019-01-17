module.exports = {
  ensureToken: (req, res, next) => {
    const bearerHeader = req.headers.authorization;
    if (typeof bearerHeader !== 'undefined') {
      const bearer = bearerHeader.split(" ");
      const bearerToken = bearer[1];
      req.token = bearerToken;
      next();
    } else {
      console.log('bearerHeader undefined');
      res.sendStatus(403);
    }
  }
};