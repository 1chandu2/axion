const getSelfHandleResponse = require("../../api/_common/getSelfResponse");
const ClassCRUD = require("./ClassCRUD");
const SchoolCRUD = require("../school/SchoolCRUD");
const UserCRUD = require("../user/UserCRUD");

module.exports = class Class {
  constructor({ utils, cache, managers, validators, mongomodels } = {}) {
    this.validators         = validators;
    this.cache              = cache;
    this.shark              = managers.shark;
    this.mongomodels        = mongomodels;
    this.responseDispatcher = managers.responseDispatcher;
    this._label             = "classs";
    this.httpExposed        = [
      "createClass",
      "get=getClass",
      "delete=deleteClass",
      "put=updateClass",
    ];
    this.ClassCRUD          = new ClassCRUD(this.mongomodels.Class);
    this.SchoolCRUD         = new SchoolCRUD(this.mongomodels.School);
    this.UserCRUD           = new UserCRUD(this.mongomodels.User);
  }

  async #getUser({ userId }) {
    let result = await this.UserCRUD.findUsers({email: userId});
    if (result.length == 0) {
      return { error: "Invalid Token" };
    }

    return result[0]._doc;
  }

  async #checkPermission({ userId, action, nodeId = "board.school.class" }) {
    const user = await this.#getUser({ userId });
    if (user.error) return user;

    if (!user.role) {
      return {error: "User role not found"};
    }

    const canDoAction = await this.shark.isGranted({
      layer: "board.school.class",
      action,
      userId,
      nodeId,
      role: user.role,
    });
    return {error: canDoAction ? undefined : "Permission denied"};
  }

  async createClass({ name, schoolId, __token, res }) {
    const { userId } = __token;

    // Permission check
    const canCreateClass = await this.#checkPermission({
      userId,
      action: "create",
    });

    if (canCreateClass.error) {
      return canCreateClass;
    }

    const toCreateClass = { name, schoolId };

    // Data validation
    let result = await this.validators.class.createClass(toCreateClass);

    if (result) return result;

    // Get school from db
    try {
        result = await this.SchoolCRUD.findSchools({ _id: schoolId });
    } catch(error) {
        return this.#handleServerError(res);
    }

    if(result.length == 0) {
        return this.#handleNotFound(res, "school");
    }
    
    // save class in database
    try {
        result = await this.ClassCRUD.createClass(toCreateClass);
        await this.SchoolCRUD.addClassToSchool(schoolId,result._doc._id);
    } catch (error) {
       return this.#handleError(error, res);
    }

    // Response
    return result._doc;
  }

  async getClass({ __token, __query, res }) {
    const { userId } = __token;

    // Permission check 
    const canGetClass = await this.#checkPermission({
      userId,
      action: "read",
    });

    if (canGetClass.error) {
      return canGetClass
    }

    const { id } = __query;
    // Data validation
    let result = await this.validators.class.getClass({ id });

    if (result) return result;

    // Get class from db
    try {
        result = await this.ClassCRUD.findClass({ _id: id });
    } catch(error) {
        return this.#handleServerError(res);
    }

    // Handle Not Found
    if (result.length == 0) {
        return this.#handleNotFound(res, "class");
    }
    
    // Response
    return result[0]._doc;
  }

  async updateClass({ id, name, schoolId, __token, res }) {
    const { userId } = __token;

    // Permission check
    const canUpdateClass = await this.#checkPermission({
      userId,
      action: "update",
    });

    if (canUpdateClass.error) {
      return canUpdateClass;
    }

    const toUpdateClass = { name, schoolId };

    // Data validation
    let result = await this.validators.class.updateClass({
      ...toUpdateClass,
      id,
    });

    if (result) return result;

    // Update class in datbase
    try {
        result = await this.ClassCRUD.updateClass({_id : id}, toUpdateClass);
    } catch (error) {
        return this.#handleError(error, res);
    }

    if(result.matchedCount == 0) {
        return this.#handleNotFound(res);
    }

    // Response
    return {
        id: id,
        modifiedCount: modifiedCount,
        upsertedCount: upsertedCount
    };
  }

  async deleteClass({ __token, __query, res }) {
    const { userId } = __token;
    // Permission check
    const canDeleteClass = await this.#checkPermission({
      userId,
      action: "delete",
    });

    if (canDeleteClass.error) {
      return canDeleteClass;
    }

    // Data validation
    let result = await this.validators.class.getClass(__query);
    if (result) return result;

    const { id } = __query;
    
     // delete class from db
     try {
        result = await this.ClassCRUD.deleteClass({ _id: id })
    } catch(error) {
        return this.#handleServerError(res);
    }

    if(result.deletedCount == 0) {
        return this.#handleNotFound(res, "class");
    } else {
        return {
            id: id, 
            message: "Requested class is successfully deleted"
        };
    }
  }


  async #handleError(error, res) {
    // Default error code and message
    let code = 500;
    let message = "Error while saving the class";

    // Duplicate key error
    if (error.code === 11000) {
        const fieldName = Object.keys(error.keyValue)[0];
        const fieldValue = error.keyValue[fieldName];
        code = 409;
        message = `Class with this ${fieldName} (${fieldValue}) already exists in the system.`;
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
        message: "Error while retrieving the Class",
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
};