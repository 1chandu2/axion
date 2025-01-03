const getSelfHandleResponse = require("../../api/_common/getSelfResponse");
const UserCRUD = require("./UserCRUD");

module.exports = class User { 

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.utils               = utils;
        this.hasher              = managers.hasher;
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators; 
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.responseDispatcher  = managers.responseDispatcher;
        this.shark               = managers.shark;
        this.usersCollection     = "users";
        this.httpExposed         = ["createUser", "get=getUser", "loginUser", "delete=deleteUser"];
        this.UserCRUD            = new UserCRUD(this.mongomodels.User);
    }

    async #setPermission({ userId, role }) {
        const addDirectAccess = ({ nodeId, layer, action }) => {
          return this.shark.addDirectAccess({
            userId,
            nodeId,
            layer,
            action,
          });
        };
    
        const lookupTable = {
          admin: async () => {
            const items = [
              {
                nodeId: "board.school",
                layer: "board.school",
                action: "read",
              },
              {
                nodeId: "board.school.class",
                layer: "board.school.class",
                action: "delete",
              },
              {
                nodeId: "board.school.class.student",
                layer: "board.school.class.student",
                action: "update",
              },
            ];
            for (const item of items) {
              await addDirectAccess(item);
            }
          },
          superadmin: async () => {
            const items = [
              {
                nodeId: "board.school",
                layer: "board.school",
                action: "delete",
              },
              {
                nodeId: "board.school.class",
                layer: "board.school.class",
                action: "read",
              },
            ];
            for (const item of items) {
              await addDirectAccess(item);
            }
          },
        };
    
        if (lookupTable[role]) {
          await lookupTable[role]();
        }
    }

    async createUser({ username, email, password, role, res }) {
        const user = { username, email, password };
    
        // User save request validation
        const validationResult = await this.validators.user.createUser(user);

        //Handle validation error
        if (validationResult) {
            return validationResult;
        }

        const hashedPassword = this.hasher.encrypt(password);
        const newUser = new this.mongomodels.User({ ...user, password: hashedPassword, role: role || "user" });
        try {
            await this.UserCRUD.saveUser(newUser);
        } catch (error) {
            return this.#handleError(error, res);
        }

        this.#setPermission({ userId: newUser.email, role: newUser.role });
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

    async getUser({__query, res}) {

        const { id } = __query;
        
        // User get request validation
        let result = await this.validators.user.getUser({ id });
        if (result) return result;
        
        // Get users from db
        try {
            result = await this.UserCRUD.findUsers({ _id: id })
        } catch(error) {
            return this.#handleServerError(res);
        }

        // Handle Not Found
        if (result.length == 0) {
            return this.#handleNotFound(res, "user");
        }

        const { password: _password, ...userWithoutPassword } = result[0]._doc;
      
        // Response
        return {
            user: userWithoutPassword
        };
    }
    
    async loginUser({ email, password, res }) {
        // User login request validation
        let result = await this.validators.user.loginUser({ email, password });
        if (result) return result;

        //Handle validation error
        if (result) {
            return result;
        }

        // Get users from db
        try {
            result = await this.UserCRUD.findUsers({ email: email })
        } catch(error) {
            return this.#handleServerError(res);
        }
          
        // Handle Not Found
        if (result.length == 0) {
            return this.#handleNotFound(res, "user");
        } 
    
        // Compare password with existing user
        const compare = this.hasher.compare(password, result[0].password);
        if (!compare) {
          this.responseDispatcher.dispatch(res, {
            ok: false,
            code: 401,
            message: "provided password is incorrect",
          });
          return getSelfHandleResponse();
        }

        // Generate long token
        let longToken = this.tokenManager.genLongToken({
            userId: result[0].email,
            userKey: result[0].key,
          });
      
        const { password: _password, ...userWithoutPassword } = result[0]._doc;
      
        // Response
        return {
            user: userWithoutPassword,
            longToken,
        };
    }

    async deleteUser({ __query, res }) {

        const { id } = __query;
        
        // User delete request validation
        let result = await this.validators.user.deleteUser({ id });

        //Handle validation error
        if (result) {
            return result;
        }
    
        // delete user from db
        try {
            result = await this.UserCRUD.deleteUser({ _id: id })
        } catch(error) {
            return this.#handleServerError(res);
        }

        if(result.deletedCount == 0) {
            return this.#handleNotFound(res, "user");
        } else {
            return {
                id: id, 
                message: "Requested user is successfully deleted"
            };
        }
    }
    

    async #handleError(error, res) {
        // Default error code and message
        let code = 500;
        let message = "Error while saving the user";
    
        // Duplicate key error
        if (error.code === 11000) {
            const fieldName = Object.keys(error.keyValue)[0];
            const fieldValue = error.keyValue[fieldName];
            code = 409;
            message = `user with this ${fieldName} (${fieldValue}) already exists in the system.`;
        }
    
        // Dispatch the response
        this.responseDispatcher.dispatch(res, {
            ok: false,
            code: code,
            message: message,
        });
    
        return getSelfHandleResponse();
      }
    
      async #handleServerError(res) {
        this.responseDispatcher.dispatch(res, {
            ok: false,
            code: 500,
            message: "Error while retrieving the user",
        });
        return getSelfHandleResponse();
      }
    
      async #handleNotFound(res, entity) {
        this.responseDispatcher.dispatch(res, {
            ok: false,
            code: 404,
            message: `Requested ${entity} not present in system`,
            });
        return getSelfHandleResponse();
      }
    
}