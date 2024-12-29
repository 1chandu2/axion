module.exports = ({ meta, config, managers }) =>{
    return ({req, res, next})=>{
        console.log( req.url, req.method);
        next();
    }
}