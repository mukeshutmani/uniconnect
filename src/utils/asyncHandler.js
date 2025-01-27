
const asyncHandler = (requestHanlder) => {
      return (req, res, next) => {
         Promise.resolve(requestHanlder(req, res, next))
         .catch((error) =>  next(error));
       };
};

export {asyncHandler}

// const asyncHandler = () => {}
// const asyncHandler = (fn) => {}
// const asyncHandler = (fn) => {  () => {}}
// const asyncHandler = (fn) => {  async () => {}}


// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//          await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
        
//     }
// }