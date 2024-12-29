const classNameSchema = {
    path: "name",
    type: "String",
    length: { min: 1, max: 50 },
    required: true,
  };
  
  const classSchema = [
    classNameSchema,
    {
      path: "schoolId",
      type: "String",
      required: true,
    },
  ];
  
  const classIdSchema = [
    {
      type: "String",
      path: "id",
      required: true,
    },
  ];
  
  module.exports = {
    createClass: classSchema,
    getClass: classIdSchema,
    updateClass: [...classSchema, ...classIdSchema],
    deleteClass: classIdSchema,
  };
  