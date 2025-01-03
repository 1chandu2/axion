const getSelfHandleResponse = require("../../api/_common/getSelfResponse");
const StudentCRUD = require("./StudentCRUD");
const ClassCRUD = require("../class/ClassCRUD");
const SchoolCRUD = require("../school/SchoolCRUD");
const UserCRUD = require("../user/UserCRUD");

module.exports = class Student {
  constructor({ utils, cache, managers, validators, mongomodels } = {}) {
    this.validators         = validators;
    this.cache              = cache;
    this.shark              = managers.shark;
    this.mongomodels        = mongomodels;
    this.responseDispatcher = managers.responseDispatcher;
    this._label             = "students";
    this.httpExposed        = [
      "createStudent",
      "get=getStudent",
      "delete=deleteStudent",
      "put=updateStudent",
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

  async #checkPermission({
    userId,
    action,
    nodeId = "board.school.class.student",
  }) {
    const user = await this.#getUser({ userId });
    if (user.error) return user;

    if (!user.role) {
      return { error: "User role not found" };
    }

    const canDoAction = await this.shark.isGranted({
      layer: "board.school.class.student",
      action,
      userId,
      nodeId,
      role: user.role,
    });
    return { error: canDoAction ? undefined : "Permission denied" };
  }

  async createStudent({ name, classId, __token, res }) {
    const { userId } = __token;

    // Permission check
    const canCreateStudent = await this.#checkPermission({
      userId,
      action: "create",
    });

    if (canCreateStudent.error) {
      return this.#handleForbiddenError(res, canCreateStudent.error);
    }

    const student = { name, classId };

    // Data validation
    let result = await this.validators.student.createStudent(student);
    if (result) return result;

    // Get class from db
    try {
        result = await this.ClassCRUD.findClass({ _id: classId });
    } catch(error) {
        console.error("We are getting the server error while retrieving class from database: ", error);
        return this.#handleServerError(res);
    }

    if(result.length == 0) {
        return this.#handleNotFound(res, "class");
    }

    const schoolId = result[0]._doc.schoolId;

    const toCreateStudent = {...student, schoolId: schoolId};

    // save satudent in database
    try {
        result = await this.StudentCRUD.createStudent(toCreateStudent);
        await this.ClassCRUD.addStudentToClass(classId, result._doc._id);
        await this.SchoolCRUD.addStudentToSchool(schoolId, result._doc._id);
    } catch (error) {
        return this.#handleError(error, res);
    }

    // Response
    return result._doc;
  }

  async getStudent({ __token, __query, res }) {
    const { userId } = __token;

    // Permission check
    const canGetStudent = await this.#checkPermission({
      userId,
      action: "read",
    });

    if (canGetStudent.error) {
      return this.#handleForbiddenError(res, canGetStudent.error);
    }

    const { id } = __query;
    // Data validation
    let result = await this.validators.student.getStudent({ id });

    if (result) return result;

    // Get student from db
    try {
        result = await this.StudentCRUD.findStudents({ _id: id });
    } catch(error) {
        console.error("We are getting the server error while retrieving student from database: ", error);
        return this.#handleServerError(res);
    }

    // Handle Not Found
    if (result.length == 0) {
        return this.#handleNotFound(res, "student");
    }
    
    // Response
    return result[0]._doc;
  }

  async updateStudent({ id, name, classId, __token, res }) {
    const { userId } = __token;

    // Permission check
    const canUpdateStudent = await this.#checkPermission({
      userId,
      action: "update",
    });

    if (canUpdateStudent.error) {
      return this.#handleForbiddenError(res, canUpdateStudent.error);
    }

    const student = { name, classId };

    // Data validation
    let result = await this.validators.student.updateStudent({
      ...student,
      id,
    });

    if (result) return result;

    // Get student from db
    try {
        result = await this.StudentCRUD.findStudents({ _id: id });
    } catch(error) {
        console.error("We are getting the server error while retrieving class from database: ", error);
        return this.#handleServerError(res);
    }

    if(result.length == 0) {
        return this.#handleNotFound(res, "student");
    }

    const currentClassId = result[0]._doc.classId;
    const schoolId = result[0]._doc.schoolId;

    // Get class from db
    try {
        result = await this.ClassCRUD.findClass({ _id: classId });
    } catch(error) {
        console.error("We are getting the server error while retrieving class from database: ", error);
        return this.#handleServerError(res);
    }

    if(result.length == 0) {
        return this.#handleNotFound(res, "class");
    }
    const newClassSchoolId = result[0]._doc.schoolId;

    const toUpdateStudent = {...student, schoolId: schoolId}
    // Update student in datbase
    try {
        if(currentClassId.toString() != classId) {
            // Means want to promote to another class
            if(newClassSchoolId.toString() != schoolId.toString()) {
                this.responseDispatcher.dispatch(res, {
                    ok: false,
                    code: 404,
                    message: "The class in which you want to promote the student is not exist in the student's school",
                    });
                return getSelfHandleResponse();
            } else {
                await this.ClassCRUD.deleteStudentFromClass(currentClassId, id);
                await this.ClassCRUD.addStudentToClass(classId, id);
            }
        } 
        result = await this.StudentCRUD.updateStudent({_id : id}, toUpdateStudent);
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

  async deleteStudent({ __token, __query, res }) {
    const { userId } = __token;
    // Permission check
    const canDeleteStudent = await this.#checkPermission({
      userId,
      action: "delete",
    });

    if (canDeleteStudent.error) {
      return this.#handleForbiddenError(res, canDeleteStudent.error);
    }

    // Data validation
    let result = await this.validators.student.getStudent(__query);
    if (result) return result;

    const { id } = __query;
    
    // delete class from db
    try {
        result = await this.StudentCRUD.findStudents({_id: id});

        if(result.length == 0) {
            return this.#handleNotFound(res);
        }

        const { classId, schoolId } = result[0]._doc;
        
        // Remove student from class
        await this.ClassCRUD.deleteStudentFromClass(classId, id);

        // Remove student from school
        await this.SchoolCRUD.deleteStudentFromSchool(schoolId, id);

        // Delete Student
        result = await this.StudentCRUD.deleteStudent({ _id: id })

        if(result.deletedCount == 0) {
            return this.#handleNotFound(res, "student");
        } else {
            return {
                id: id, 
                message: "Requested student is successfully deleted"
            };
        }
    } catch(error) {
        console.error("We are getting the server error while deletion of student from database: ", error);
        return this.#handleServerError(res);
    }
  }

  async #handleError(error, res) {
    // Default error code and message
    let code = 500;
    let message = "Error while saving the student";

    // Duplicate key error
    if (error.code === 11000) {
        const fieldName = Object.keys(error.keyValue)[0];
        const fieldValue = error.keyValue[fieldName];
        code = 409;
        message = `Student with this ${fieldName} (${fieldValue}) already exists in the system.`;
    }

    if(code == 500) {
        console.error("We are getting the server error: {}", error);
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
        message: "Error while retrieving the Student",
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

  async #handleForbiddenError(res, message) {
    this.responseDispatcher.dispatch(res, {
        ok: false,
        code: 403,
        message: message,
        });
    return getSelfHandleResponse();
  }
};
