module.exports = class UserCRUD {
    constructor(usermodel) {
        this.usermodel = usermodel;
    }

    async saveUser(user) {
        try {
            const newUser = new this.usermodel(user);
            const savedUser = await newUser.save();
            return savedUser;
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }


    }
    async findUsers(query) {
        try { 
          const users = await this.usermodel.find(query);
          return users;
        } catch (error) {
          console.error('Error finding users:', error);
          throw error;
        }
      }
      async updateUser(query, update) {
        try {
          const result = await this.usermodel.updateOne(query, update);
          return result;
        } catch (error) {
          console.error('Error updating user:', error);
          throw error;
        }
      }
      async deleteUser(query) {
        try {
          const result = await this.usermodel.deleteOne(query);
          return result;
        } catch (error) {
          console.error('Error deleting user:', error);
          throw error;
        }
      }
}