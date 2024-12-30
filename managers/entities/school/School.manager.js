const getSelfHandleResponse = require("../../api/_common/getSelfResponse");
const SchoolCRUD = require("./SchoolCRUD");
const UserCRUD = require("../user/UserCRUD");
const ClassCRUD = require("../class/ClassCRUD");
const StudentCRUD = require("../student/StudentCRUD");

module.exports = class School {
  constructor({ utils, cache, managers, validators, mongomodels } = {}) {
    this.validators         = validators;
    this.cache              = cache;
    this.shark              = managers.shark;
    this.mongomodels         = mongomodels;
    this.responseDispatcher = managers.responseDispatcher;
    this._label             = "schools";
    this.httpExposed        = [
      "createSchool",
      "get=getSchool",
      "delete=deleteSchool",
      "put=updateSchool",
      "get=getAllSchool",
    ];
    this.StudentCRUD        = new StudentCRUD(this.mongomodels.Student);
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

  async #checkPermission({ userId, action, nodeId = "board.school" }) {
    const user = await this.#getUser({ userId });
    if (user.error) return user;

    if (!user.role) {
      return {error: "User role not found"};
    }

    const canDoAction = await this.shark.isGranted({
      layer: "board.school",
      action,
      userId,
      nodeId,
      role: user.role,
    });
    return {error: canDoAction ? undefined : "Permission denied"};
  }

  async createSchool({ name, address, phone, __token, res }) {
    const { userId } = __token;

    // Permission check
    const canCreateSchool = await this.#checkPermission({
      userId,
      action: "create",
    });

    if (canCreateSchool.error) {
      return this.#handleForbiddenError(res, canCreateSchool.error);
    }

    const school = { name, address, phone };

    // Create school request validation
    let result = await this.validators.school.createSchool(school);
    if (result) {
        result;
    }

    // save school in database
    try {
        result = await this.SchoolCRUD.saveSchool(school);
    } catch (error) {
       return this.#handleError(error, res);
    }

    // Response
    return result._doc;
  }

  async getSchool({ __token, __query, res }) {
    
    const { userId } = __token;

    // Permission check 
    const canGetSchool = await this.#checkPermission({
      userId,
      action: "read",
    });

    if (canGetSchool.error) {
      return this.#handleForbiddenError(res, canGetSchool.error);
    }

    const { id } = __query;
    // Get school request validation
    let result = await this.validators.school.getSchool({ id });
    if (result) return result;
    
    // Get school from db
    try {
        result = await this.SchoolCRUD.findSchools({ _id: id });
    } catch(error) {
        console.error("We are getting the server error while retrieving school from database: ", error);
        return this.#handleServerError(res);
    }

    // Handle Not Found
    if (result.length == 0) {
        return this.#handleNotFound(res);
    }

    return result[0]._doc;
  }

  async updateSchool({ id, name, address, phone, __token, res }) {
    
    const { userId } = __token;

    // Permission check
    const canUpdateSchool = await this.#checkPermission({
      userId,
      action: "update",
    });

    if (canUpdateSchool.error) {
      return this.#handleForbiddenError(res, canUpdateSchool.error);
    }

    const school = { name, address, phone, id };

    // Data validation
    let result = await this.validators.school.updateSchool(school);

    if (result) return result;

    // Update school in datbase
    try {
        result = await this.SchoolCRUD.updateSchool({_id : id}, school);
    } catch (error) {
        return this.#handleError(error, res);
    }

    if(result.matchedCount == 0) {
        return this.#handleNotFound(res);
    }

    // Response
    return {
        id: id,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount
    };

  }

  async deleteSchool({ __token, __query, res }) {
    const { userId } = __token;
    // Permission check
    const canDeleteSchool = await this.#checkPermission({
      userId,
      action: "delete",
    });

    if (canDeleteSchool.error) {
      return this.#handleForbiddenError(res, canDeleteSchool.error);
    }

    const { id } = __query;

    // Data validation
    let result = await this.validators.school.deleteSchool({ id });
    if (result) return result;

     // School deletion logic
     try {
        const school = await this.SchoolCRUD.findSchools({_id: id});
        if(school.length == 0) {
            return this.#handleNotFound(res);
        }

        // Delete all related classes
        const classDeleteResult = await this.ClassCRUD.deleteManyClass({ schoolId: id });

        // Delete all students in the school
        const studentDeleteResult = await this.StudentCRUD.deleteManyStudent({ schoolId: id });

        // Delete School from db
        result = await this.SchoolCRUD.deleteSchool({ _id: id })

        if(result.deletedCount == 0) {
            return this.#handleNotFound(res);
        } else {
            return {
                id: id, 
                message: "Requested school is successfully deleted",
                details: {
                    classesDeleted: classDeleteResult.deletedCount,
                    studentsDeleted: studentDeleteResult.deletedCount,
                },
            };
        }

    } catch(error) {
        console.error("We are getting the server error while deletion school from database: ", error);
        return this.#handleServerError(res);
    }
  }

  async getAllSchool({ __token, res }) {
    
    const { userId } = __token;

    // Permission check 
    const canGetSchool = await this.#checkPermission({
      userId,
      action: "read",
    });

    if (canGetSchool.error) {
      return this.#handleForbiddenError(res, canGetSchool.error);
    }

    // Get school from db
    try {
        let result = await this.SchoolCRUD.findSchools({ });
        return result;
    } catch(error) {
        console.error("We are getting the server error while retrieving school from database: ", error);
        return this.#handleServerError(res);
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
        message = `School with this ${fieldName} (${fieldValue}) already exists in the system.`;
    }

    if(code == 500) {
        console.error("We are getting the server error: ", error);
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
        message: "Error while retrieving the school",
    });
    return getSelfHandleResponse();
  }

  async #handleNotFound(res) {
    this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 404,
        message: "Requested school not present in system",
        });
    return getSelfHandleResponse();
  }

  async #handleForbiddenError(res, message) {
    this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 403,
        message: message,
        });
    return getSelfHandleResponse();
  }
};