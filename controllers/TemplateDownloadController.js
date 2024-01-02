const path = require('path');
const ExcelJS = require('exceljs');
const FirebaseService = require('../middlewares/FirebaseService');

const downloadTourTemplate = async (req, res) => {
    try {
        const fileName = 'Tour route create template.xlsx';
        const filePath = path.join(__dirname, `../template/${fileName}`);

        const buffer = await copyAndModifyExcelInMemory(filePath)
        const file = {
            fieldname: 'file',
            originalname: fileName,
            encoding: '7bit',
            mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            buffer: buffer,
            size: buffer.length,
        };
        req.file = file
        await FirebaseService.uploadFile(req, res)
    } catch (error) {
        console.error(error)
    }
}

const copyAndModifyExcelInMemory = async (mainFilePath) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(mainFilePath);

        const worksheet = workbook.getWorksheet(1);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    } catch (error) {
        console.error('Error copying and modifying the Excel file in memory:', error);
        throw error;
    }
}

module.exports = { downloadTourTemplate }