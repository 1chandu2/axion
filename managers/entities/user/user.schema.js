

module.exports = {
    createUser: [
        {
            model: "username",
            path: "username",
            required: true,
        },
        {
            model: "email",
            path: "email",
            required: true
        },
        {
            model: "password",
            path: "password",
            required: true
        },
        {
            model: "role",
            path: "role",
            default: "user"
        }
    ],
    getUser: [
        {
          model: "id",
          path: "id",
          required: true,
        },
    ],
    loginUser: [
        {
            model: "email",
            path: "email",
            required: true,
        },
        {
            model: "password",
            path: "password",
            required: true
        },
    ],
    deleteUser: [
        {
            type: "String",
            path: "id",
            required: true,
        },
    ]
}


