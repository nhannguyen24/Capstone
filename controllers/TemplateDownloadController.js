const path = require('path');
const ExcelJS = require('exceljs');
const db = require("../models");
const STATUS = require("../enums/StatusEnum");
const FirebaseService = require('../middlewares/FirebaseService');

const downloadTourTemplate = async (req, res) => {
    try {
        const fileName = 'Tour create template.xlsx';
        const filePath = path.join(__dirname, `../template/${fileName}`);

        const routes = await db.Route.findAll({
            raw: true,
            order: [["updatedAt", "DESC"]],
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
            attributes: ["ticketTypeName", "description"],
        })

        const buffer = await copyAndModifyExcelInMemory(filePath, ticketTypes, routes)
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

const copyAndModifyExcelInMemory = async (mainFilePath, ticketTypes, routes) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(mainFilePath);
        const routesLength =  routes.length
        const worksheet = workbook.getWorksheet(1);
        for(let i = 0; i < routesLength; i++){
            const routeNameRow = worksheet.getRow(18 + i)
            const routeNameCell = routeNameRow.getCell(2)

            routeNameCell.style = {
                font: {
                    name: 'Calibri',
                    size: 12,
                    color: { argb: '000000' },
                    bold: true
                },
            }

            routeNameCell.value = `${routes[i].routeName}`
        }
        for (let rowNum = 4; rowNum <= 13; rowNum++) {
            const ticketLength = ticketTypes.length
            for (let i = 0; i < ticketLength; i++) {
                const ticketRow = worksheet.getRow(3)
                const ticketCell = ticketRow.getCell(9 + i)

                const ticketDescriptionRow = worksheet.getRow(18 + i)
                const ticketDescriptionCell = ticketDescriptionRow.getCell(8)
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

                ticketDescriptionCell.style = {
                    font: {
                        name: 'Calibri',
                        size: 12,
                        color: { argb: '000000' },
                        bold: true
                    },
                }

                ticketDescriptionCell.value = `${ticketTypes[i].ticketTypeName}: ${ticketTypes[i].description}`

                const row = worksheet.getRow(rowNum);
                const cell = row.getCell(9 + i);
                cell.style.alignment = {
                    vertical: 'middle',
                    horizontal: 'center'
                }
                const cellValidation = {
                    type: 'list',
                    formulae: ['"x,"'],
                };
                cell.dataValidation = cellValidation;
            }

            const routeFormulaeString = `$B$18:$A$${18+routesLength-1}`
            const routeRow = worksheet.getRow(rowNum);
            const routeCell = routeRow.getCell(8);
            const routeValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [routeFormulaeString],
            }
            routeCell.dataValidation = routeValidation
        }

        const buffer = await workbook.xlsx.writeBuffer();

        return buffer;
    } catch (error) {
        console.error('Error copying and modifying the Excel file in memory:', error);
        throw error;
    }
}

module.exports = { downloadTourTemplate }