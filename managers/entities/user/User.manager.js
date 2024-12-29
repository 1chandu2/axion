const getSelfHandleResponse = require("../../api/_common/getSelfResponse");
const UserCRUD = require('./UserCRUD');

module.exports = class User { 

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.utils               = utils;
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators; 
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.responseDispatcher  = managers.responseDispatcher;
        this.usersCollection     = "users";
        this.httpExposed         = ["createUser", "getUser"];
        this.UserCRUD            = new UserCRUD(this.mongomodels.User);
    }

    async createUser({ username, email, password, role, res }) {
        const user = { username, email, password };
    
        // User save request validation
        const validationResult = await this.validators.user.createUser(user);

        //Handle validation error
        if (validationResult) {
            this.responseDispatcher.dispatch(res, {
                ok: false,
                code: 400,
                message: "Validation failed",
                data: validationResult,
            });
            return getSelfHandleResponse();
        }
    
        const newUser = new this.mongomodels.User({ ...user, role: role || "user" });
        try {
            await this.UserCRUD.saveUser(newUser);
        } catch (error) {
    
            // Default error code and message
            let code = 500;
            let message = "Error while saving the user";
        
            // Duplicate key error
            if (error.code === 11000) {
                const fieldName = Object.keys(error.keyValue)[0];
                const fieldValue = error.keyValue[fieldName];
                code = 409;
                message = `User with this ${fieldName} (${fieldValue}) already exists in the system.`;
            }
        
            // Dispatch the response
            this.responseDispatcher.dispatch(res, {
                ok: false,
                code: code,
                message: message,
            });

            return getSelfHandleResponse();
        }

        let longToken = this.tokenManager.genLongToken({
            userId: newUser.email,
            userKey: newUser.key,
          });
      
        const { password: _password, ...userWithoutPassword } = newUser.toObject();
      
        // Response
        return {
            user: userWithoutPassword,
            longToken,
        };
    }

    async getUser({username, res}) {
        
        // User get request validation
        let result = await this.validators.user.getUser({ username });
        if (result) return result;
        
        // Get users from db
        try {
            result = await this.UserCRUD.findUsers({ username })
        } catch(error) {
            this.responseDispatcher.dispatch(res, {
                ok: false,
                code: 500,
                message: "Error while retrieving the user",
              });
              return getSelfHandleResponse();
        }

        // Handle Not Found
        if (result.length == 0) {
          this.responseDispatcher.dispatch(res, {
            ok: false,
            code: 404,
            message: "Request user not present in system",
          });
          return getSelfHandleResponse();
        }

        return result;
    }    
}