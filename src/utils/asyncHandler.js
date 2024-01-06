// ****** promise syntax a = () => { return () => {} }

const asyncHandler = (reqHandler) =>{ 
    return (req, res, next) => {
    Promise.resolve(reqHandler(req, res, next)).catch((err) => next(err))// either catch or reject
    }
}

export { asyncHandler }


/*

// ***** this is the try catch syntax   a = (fn) => {(req, res ,next) => {}} ********

const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(err.code || 500).json({
            success : false,
            message : err.message
        })
    }
}

*/