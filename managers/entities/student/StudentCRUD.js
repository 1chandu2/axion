module.exports = class StudentCRUD {
    constructor(studentModel) {
        this.studentModel = studentModel;
    }

    async createStudent(student) {
        try {
            const newStudent = new this.studentModel(student);
            const savedStudent = await newStudent.save();
            return savedStudent;
        } catch (error) {
            console.error('Error saving student:', error);
            throw error;
        }
    }

    async findStudents(query) {
        try {
            const students = await this.studentModel.find(query);
            return students;
        } catch (error) {
            console.error('Error finding students:', error);
            throw error;
        }
    }

    async updateStudent(query, update) {
        try {
            //dont forget to put functionality for switching class and school
            const result = await this.studentModel.updateOne(query, update);
            return result;
        } catch (error) {
            console.error('Error updating student:', error);
            throw error;
        }
    }

    async deleteStudent(query) {
        try {
            const result = await this.studentModel.deleteOne(query);
            return result;
        } catch (error) {
            console.error('Error deleting student:', error);
            throw error;
        }
    }

    async deleteManyStudent(query) {
        try {
            const result = await this.studentModel.deleteMany(query);
            return result;
        } catch (error) {
            console.error('Error deleting students:', error);
            throw error;
        }
    }

    async deleteClassFromStudent(studentId) {
        try {
            const result = await this.studentModel.updateOne({ _id: studentId }, { $unset: { class: "" } });
            return result;
        } catch (error) {
            console.error('Error deleting class from student:', error);
            throw error;
        }
    }

    async deleteSchoolFromStudent(studentId) {
        try {
            const result = await this.studentModel.updateOne({ _id: studentId }, { $unset: { school: "" } });
            return result;
        } catch (error) {
            console.error('Error deleting school from student:', error);
            throw error;
        }
    }
}