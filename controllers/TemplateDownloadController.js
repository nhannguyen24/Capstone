const path = require('path');
const ExcelJS = require('exceljs');
const db = require("../models");
const STATUS = require("../enums/StatusEnum")
const downloadTourTemplate = async (req, res) => {
    try {
        const fileName = 'Tour create template.xlsx';
        const filePath = path.join(__dirname, `../template/${fileName}`);

        const routes = await db.Route.findAll({
            where: {
                status: STATUS.ACTIVE
            },
            attributes: ["routeName"],
        })

        const ticketTypes = await db.TicketType.findAll({
            where: {
                status: STATUS.ACTIVE
            },
            order: [["createdAt", "DESC"]],
            attributes: ["ticketTypeName"],
        })

        const routeNames = [`"${routes.map(route => route.routeName).join(',')}"`]
        const buffer = await copyAndModifyExcelInMemory(filePath, ticketTypes, routeNames)

        res.setHeader('Content-disposition', `attachment; filename=${fileName}`)
        res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.end(buffer)
    } catch (error) {
        console.log(error)
    }
}

const copyAndModifyExcelInMemory = async (mainFilePath, ticketTypes, routeNames) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(mainFilePath);

        const worksheet = workbook.getWorksheet(1);
        for (let rowNum = 4; rowNum <= 13; rowNum++) {
            const ticketLength = ticketTypes.length
            for (let i = 0; i < ticketLength; i++) {
                const ticketRow = worksheet.getRow(3);
                const ticketCell = ticketRow.getCell(9 + i);
                ticketCell.style = {
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE699' }
                    },
                    font: {
                        name: 'Calibri',
                        size: 13,
                        color: { argb: 'C65911' },
                        bold: true
                    },
                    border: {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    },
                    alignment: {
                        vertical: 'middle',
                        horizontal: 'center'
                    }
                };
                ticketCell.value = ticketTypes[i].ticketTypeName

                const row = worksheet.getRow(rowNum);
                const cell = row.getCell(9 + i);
                cell.style.alignment = {
                    vertical: 'middle',
                    horizontal: 'center'
                }
                const cellValidation = {
                    type: 'list',
                    formulae: ['"true,false"'],
                };
                cell.dataValidation = cellValidation;
            }

            const routeRow = worksheet.getRow(rowNum);
            const routeCell = routeRow.getCell(8);
            const routeValidation = {
                type: 'list',
                allowBlank: true,
                showErrorMessage: true,
                formulae: routeNames,
            };
            routeCell.dataValidation = routeValidation;
        }

        const buffer = await workbook.xlsx.writeBuffer();

        return buffer;
    } catch (error) {
        console.error('Error copying and modifying the Excel file in memory:', error);
        throw error;
    }
};

module.exports = { downloadTourTemplate }