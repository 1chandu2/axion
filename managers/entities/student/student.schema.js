const studentSchema = [
    {
      path: "name",
      type: "String",
      length: { min: 1, max: 50 },
      required: true,
    },
    {
      path: "classId",
      type: "String",
      required: true,
    }
  ];
  
  const studentIdSchema = [
    {
      type: "String",
      path: "id",
      required: true,
    },
  ];
  
  module.exports = {
    createStudent: studentSchema,
    getStudent: studentIdSchema,
    updateStudent: [...studentSchema, ...studentIdSchema],
    deleteStudent: studentIdSchema,
  };
  