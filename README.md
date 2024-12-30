## Document



### Users

| endpoint                       | method | Description                                                                                               |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------- |
| /api/user/createUser           | POST   | Creates a user with role(default role: user, school admin role: admin, system admin role: superadmin.     |
| /api/user/loginUser            | POST   | Login a user with email and password.                                                                     |
| /api/user/getUser              | POST   | Get user by Id.                                                                                           |
| /api/user/deleteUser           | DELETE | Delete a user by Id.                                                                                      |

### School

| endpoint                 | method | Description                                                                                    |
| ------------------------ | ------ | ---------------------------------------------------------------------------------------------- |
| /api/school/createSchool | POST   | Create school, mandatory fields: name, address and phone. Only super admin can create schools. |
| /api/school/updateSchool | PUT    | Update school, mandatory fields: id, name, address and phone.                                  |
| /api/school/getSchool    | GET    | Get a school, id is passed as a query params. admin can view only.                             |
| /api/school/getAllSchool | GET    | Get all school, no need to pass anything.                                                      |
| /api/school/deleteSchool | DELETE | Delete a school, id is passed as a query.                                                      |

### Class

| endpoint               | method | Description                                                                      |
| ---------------------- | ------ | -------------------------------------------------------------------------------- |
| /api/class/createClass | POST   | Create class, mandatory fields: name, and schoolId. Only admin can create class. |
| /api/class/updateClass | PUT    | Update class, mandatory fields: id, name, and schoolId.                          |
| /api/class/getClass    | GET    | Get a class, id is passed as a query params.                                     |
| /api/class/deleteClass | DELETE | Delete a class, Id is passed as a query params.                                  |

### Student

| endpoint                   | method | Description                                                                                |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| /api/student/createStudent | POST   | Create student, mandatory fields: name, and classId. Only admin can create student.        |
| /api/student/updateStudent | PUT    | Update student, mandatory fields: id, name, and classId.                                   |
| /api/student/getStudent    | GET    | Get a student, id is passed as a query params.                                             |
| /api/student/deleteStudent | DELETE | Delete a student, id is passed as a query params.                                          |