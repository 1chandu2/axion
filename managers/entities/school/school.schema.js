const schoolSchema = [
    {
      model: "text",
      path: "name",
      required: true,
    },
      {
        model: "longText",
        path: "address",
        required: true,
      },
      {
        model: "phone",
        path: "phone",
        required: true,
      },
  ];
  
  const schoolIdSchema = [
    {
      type: "String",
      path: "id",
      required: true,
    },
  ];
  
  module.exports = {
    createSchool: schoolSchema,
    getSchool: schoolIdSchema,
    updateSchool: [
        ...schoolSchema,
        ...schoolIdSchema,
      ],
    deleteSchool: schoolIdSchema,
  };
  