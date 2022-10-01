const BigPromise = require("../middlewares/bigPromise");

// way 1 - using promise
exports.home = BigPromise(async (req, res) => {
    // const db = await something(); //await
    res.status(200).json({
        success: true,
        greeting: "Hello from API"
    });
});

// way 2 = using try catch 
exports.homeDummy = async (req, res) => {
    try {
        // const db = await something(); //await
        res.status(200).json({
            success: true,
            greeting: "This is another dummy"
        });
    } catch (error) {
        console.log(error);
    }
};