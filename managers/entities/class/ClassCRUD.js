module.exports = class ClassCRUD {
    constructor(classModel) {
        this.classModel = classModel;
    }

    async createClass(classroom) {
        try {
            const newClassroom = new this.classModel(classroom);
            const savedClassroom = await newClassroom.save();
            return savedClassroom;
        } catch (error) {
            console.error('Error saving class:', error);
            throw error;
        }
    }

    async findClass(query) {
        try {
            const classrooms = await this.classModel.find(query);
            return classrooms;
        } catch (error) {
            console.error('Error finding class:', error);
            throw error;
        }
    }

    async updateClass(query, update) {
        try {
            const result = await this.classModel.updateOne(query, update);
            return result;
        } catch (error) {
            console.error('Error updating class:', error);
            throw error;
        }
    }

    async deleteClass(query) {
        try {
            const result = await this.classModel.deleteOne(query);
            return result;
        } catch (error) {
            console.error('Error deleting class:', error);
            throw error;
        }
    }

    async deleteManyClass(query) {
        try {
            const result = await this.classModel.deleteMany(query);
            return result;
        } catch (error) {
            console.error('Error deleting classes:', error);
            throw error;
        }
    }

    async addStudentToClass(classId, studentId) {
        try {
            const result = await this.classModel.updateOne({ _id: classId }, { $addToSet: { students: studentId } });
            return result;
        } catch (error) {
            console.error('Error adding student to class:', error);
            throw error;
        }
    }

    async deleteStudentFromClass(classId, studentId) {
        try {
            const result = await this.classModel.updateOne({ _id: classId }, { $pull: { students: studentId } });
            return result;
        } catch (error) {
            console.error('Error deleting student from class:', error);
            throw error;
        }
    }
}