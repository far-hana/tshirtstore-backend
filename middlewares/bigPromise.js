// use either: try catch with async await || promise

module.exports = func => (req, res, next) => 
    Promise.resolve(func(req, res, next)).catch(next);
