
async function to(promise) {
    return await
        promise
            .then(data => {
                return [null, data]
            }).catch(err => {
                return [err]
            });
}

const ReS = (res, data) => {

    res.statusCode = 200;
    return res.json({
        success: true,
        result: data
    })
};

const ReE = (res, data, code) => {

    typeof code !== 'undefined'
        ? res.statusCode = code
        : res.statusCode = 400;

    return res.json({
        success: false,
        result: data
    })
};

const ReF = (res, field) => {

    res.statusCode = 400;
    return res.json({
        success: false,
        message: `${field} is required`
    })
};

module.exports = {
    ReE,
    ReS,
    ReF,
    to
}