

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
          model: "username",
          path: "username",
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
            model: "username",
            path: "username",
            required: true,
        },
    ],
}


